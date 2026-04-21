import { ref, reactive, computed } from "vue";
import { GRID_WIDTH, GRID_HEIGHT } from "../lib/editorConstants";
import {
  getAutotileFamily,
  isMudGrassCapGid,
  computeAutotileMask,
  resolveAutotileGid,
} from "../lib/groundAutotile";
import { getObjectIssue, getUniqueObjectStats } from "../lib/validationUtils";
import { TILE_VARIANT_MAP } from "../lib/tileData";

const activeLayer = ref("ground");
const selectedTool = ref("paintbrush");
const selectedTile = ref(null);
const BOX_GIDS = new Set([41, 42]);
const UNIQUE_OBJECT_RULES = [
  {
    gids: new Set([69]),
    max: 1,
  },
  {
    gids: new Set([116, 117]),
    max: 1,
  },
];

const worldLayer = reactive(new Map());
const objectLayer = reactive(new Map());
// Counter for unique composite tile IDs
let compositeIdCounter = 0;

const selection = reactive({
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null,
});

const previewMode = ref(false);
const showGids = ref(false);
const isDirty = ref(false);

const undoStack = reactive([]);
const redoStack = reactive([]);
const MAX_UNDO_STATES = 50;

const tileValidationIssues = computed(() => {
  const map = new Map();
  const uniqueStats = getUniqueObjectStats(objectLayer);
  for (const [key] of objectLayer) {
    const [x, y] = key.split(",").map(Number);
    const issue = getObjectIssue(worldLayer, objectLayer, x, y, uniqueStats);
    if (issue) {
      map.set(key, issue);
    }
  }
  return map;
});

const highlightedTile = ref(null);

export function useEditorState() {
  function getUniqueRuleByGid(gid) {
    return UNIQUE_OBJECT_RULES.find((rule) => rule.gids.has(gid)) || null;
  }

  function countTilesForRule(layer, rule) {
    let count = 0;
    for (const tile of layer.values()) {
      if (rule.gids.has(tile.gid)) count += 1;
    }
    return count;
  }

  function canPlaceUniqueObjectAt(tile, key) {
    const rule = getUniqueRuleByGid(tile.gid);
    if (!rule) return true;

    const existingCount = countTilesForRule(objectLayer, rule);
    if (existingCount < rule.max) return true;

    const existingAtTarget = objectLayer.get(key);
    return !!(existingAtTarget && rule.gids.has(existingAtTarget.gid));
  }

  function isWithinBounds(x, y) {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
  }

  function getKey(x, y) {
    return `${x},${y}`;
  }

  function getAutoGroundTileAt(x, y) {
    const key = getKey(x, y);
    const tile = worldLayer.get(key);
    if (!tile || !tile.family) return null;
    return tile;
  }

  function recomputeAutoGroundAt(x, y) {
    if (!isWithinBounds(x, y)) return;
    const key = getKey(x, y);
    const tile = worldLayer.get(key);

    if (!tile || !tile.auto) return;

    // Levitating tiles only see other levitating tiles as neighbors
    if (tile.family === "levitating") {
      const hasLevitatingAt = (nx, ny) => {
        const neighbor = getAutoGroundTileAt(nx, ny);
        return neighbor != null && neighbor.family === "levitating";
      };
      const mask = computeAutotileMask(x, y, hasLevitatingAt);
      const gid = resolveAutotileGid("levitating", mask, tile.seedGid);
      worldLayer.set(key, { ...tile, gid });
      return;
    }

    // Mud families: decide mudGrass vs mudBare based on north neighbor.
    const northNeighbor = getAutoGroundTileAt(x, y - 1);
    const northIsGround =
      northNeighbor &&
      (northNeighbor.family === "mudGrass" ||
        northNeighbor.family === "mudBare");
    // Explicitly-seeded mudBare tiles (e.g. forced gid 21) should stay in mud logic.
    const roleFamily =
      tile.family === "mudBare"
        ? "mudBare"
        : northIsGround
          ? "mudBare"
          : "mudGrass";

    const hasMudNeighborAt = (nx, ny) => {
      const neighbor = getAutoGroundTileAt(nx, ny);
      if (neighbor) {
        if (neighbor.family === "levitating") return false;
        return true;
      }

      const worldNeighbor = worldLayer.get(getKey(nx, ny));
      if (!worldNeighbor) return false;
      const worldFamily = getAutotileFamily(worldNeighbor.gid);
      if (worldFamily) return worldFamily !== "levitating";
      return false;
    };

    const mask = computeAutotileMask(x, y, hasMudNeighborAt);
    const gid = resolveAutotileGid(roleFamily, mask, tile.seedGid);
    worldLayer.set(key, { ...tile, gid });
  }

  function recomputeAutoGroundNeighborhood(x, y) {
    const offsets = [
      [0, 0],
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];

    for (const [dx, dy] of offsets) {
      recomputeAutoGroundAt(x + dx, y + dy);
    }
  }

  function removeCompositeParts(layer, compositeId) {
    for (const [k, v] of layer) {
      if (v.compositeId === compositeId) {
        layer.delete(k);
      }
    }
  }

  function getForcedGroundPlacement(x, y, gid) {
    if (gid !== 7) return null;

    const aboveTile = worldLayer.get(getKey(x, y - 1));
    const belowTile = worldLayer.get(getKey(x, y + 1));
    const rightTile = worldLayer.get(getKey(x + 1, y));

    // Above 38/39/59 should default to gid 7 as mud-grass.
    if (
      belowTile?.gid === 38 ||
      belowTile?.gid === 39 ||
      belowTile?.gid === 59
    ) {
      return { mode: "auto", gid: 7, family: "mudGrass" };
    }

    // Below 49/58 should default to gid 28 and remain autotile-managed dirt.
    if (aboveTile?.gid === 49 || aboveTile?.gid === 58) {
      return { mode: "auto", gid: 28, family: "mudBare" };
    }

    // Left of 38 should default to gid 4, but remain autotile-managed.
    if (rightTile?.gid === 38) {
      return { mode: "auto", gid: 4, family: "mudGrass" };
    }

    // Below 38 / left of 49 should become gid 21 and stay autotile-managed.
    if (aboveTile?.gid === 38 || rightTile?.gid === 49) {
      return { mode: "auto", gid: 21, family: "mudBare" };
    }

    return null;
  }

  function resolvePreviewAutoGroundGid(x, y, family, seedGid) {
    if (family === "levitating") {
      const hasLevitatingAt = (nx, ny) => {
        const neighbor = getAutoGroundTileAt(nx, ny);
        return neighbor != null && neighbor.family === "levitating";
      };
      const mask = computeAutotileMask(x, y, hasLevitatingAt);
      return resolveAutotileGid("levitating", mask, seedGid);
    }

    const northNeighbor = getAutoGroundTileAt(x, y - 1);
    const northIsGround =
      northNeighbor &&
      (northNeighbor.family === "mudGrass" ||
        northNeighbor.family === "mudBare");

    const roleFamily =
      family === "mudBare" ? "mudBare" : northIsGround ? "mudBare" : "mudGrass";

    const hasMudNeighborAt = (nx, ny) => {
      const neighbor = getAutoGroundTileAt(nx, ny);
      if (neighbor) {
        if (neighbor.family === "levitating") return false;
        return true;
      }

      const worldNeighbor = worldLayer.get(getKey(nx, ny));
      if (!worldNeighbor) return false;
      const worldFamily = getAutotileFamily(worldNeighbor.gid);
      if (worldFamily) return worldFamily !== "levitating";
      return false;
    };

    const mask = computeAutotileMask(x, y, hasMudNeighborAt);
    return resolveAutotileGid(roleFamily, mask, seedGid);
  }

  function getPreviewPaintTileGid(x, y, tile) {
    if (!tile || typeof tile.gid !== "number") return null;
    if (!isWithinBounds(x, y)) return tile.gid;
    if (activeLayer.value !== "ground") return tile.gid;

    const gid = tile.gid;
    const forcedPlacement = getForcedGroundPlacement(x, y, gid);
    if (forcedPlacement) {
      if (forcedPlacement.mode === "auto") {
        return resolvePreviewAutoGroundGid(
          x,
          y,
          forcedPlacement.family,
          forcedPlacement.gid,
        );
      }
      return forcedPlacement.gid;
    }

    if (isMudGrassCapGid(gid)) return gid;

    const family = getAutotileFamily(gid);
    if (!family) return gid;

    return resolvePreviewAutoGroundGid(x, y, family, gid);
  }

  function paintGroundTile(x, y, tile) {
    const key = getKey(x, y);
    const gid = tile.gid;
    const family = getAutotileFamily(gid);
    const isFixedMudGrassCap = isMudGrassCapGid(gid);

    const forcedPlacement = getForcedGroundPlacement(x, y, gid);
    if (forcedPlacement) {
      if (forcedPlacement.mode === "auto") {
        worldLayer.set(key, {
          gid: forcedPlacement.gid,
          auto: true,
          family: forcedPlacement.family,
          seedGid: forcedPlacement.gid,
        });
      } else {
        worldLayer.set(key, {
          gid: forcedPlacement.gid,
          auto: false,
          family: forcedPlacement.family,
          lockedGid: forcedPlacement.gid,
        });
      }
      recomputeAutoGroundNeighborhood(x, y);
      return;
    }

    if (isFixedMudGrassCap) {
      worldLayer.set(key, {
        gid,
        auto: false,
        family: "mudGrass",
        lockedGid: gid,
      });
      recomputeAutoGroundNeighborhood(x, y);
      return;
    }

    if (family) {
      worldLayer.set(key, { gid, auto: true, family, seedGid: gid });
      recomputeAutoGroundNeighborhood(x, y);
      return;
    }

    // Non-autotile ground or special ground tiles placed directly.
    worldLayer.set(key, { gid, auto: false });
    recomputeAutoGroundNeighborhood(x, y);
  }

  function eraseGroundTile(x, y) {
    const key = getKey(x, y);
    if (!worldLayer.has(key)) return;
    worldLayer.delete(key);
    recomputeAutoGroundNeighborhood(x, y);
  }

  function setActiveLayer(layer) {
    activeLayer.value = layer;
    selectedTile.value = null;
  }

  function toggleLayer() {
    activeLayer.value = activeLayer.value === "ground" ? "object" : "ground";
    selectedTile.value = null;
  }

  function setSelectedTool(tool) {
    selectedTool.value = tool;
  }

  function clearTool() {
    selectedTool.value = "none";
    selectedTile.value = null;
  }

  function setSelectedTile(tile) {
    selectedTile.value = tile;
    selectedTool.value = "paintbrush";
  }

  function paintTile(x, y, tile) {
    if (!isWithinBounds(x, y)) return;
    const key = getKey(x, y);

    if (activeLayer.value === "object" && !canPlaceUniqueObjectAt(tile, key)) {
      return;
    }

    if (tile.composite && tile.tiles) {
      const compositeId = ++compositeIdCounter;
      const layer = activeLayer.value === "ground" ? worldLayer : objectLayer;

      for (const offset of tile.tiles) {
        const tx = x + offset.dx;
        const ty = y + offset.dy;
        if (!isWithinBounds(tx, ty)) continue;
        const key = getKey(tx, ty);
        const existing = layer.get(key);
        if (existing && existing.compositeId) {
          removeCompositeParts(layer, existing.compositeId);
        }
      }

      saveState();
      isDirty.value = true;
      for (const offset of tile.tiles) {
        const tx = x + offset.dx;
        const ty = y + offset.dy;
        if (!isWithinBounds(tx, ty)) continue;
        const key = getKey(tx, ty);
        layer.set(key, { gid: offset.gid, compositeId });
      }
      return;
    }

    saveState();
    isDirty.value = true;
    if (activeLayer.value === "ground") {
      paintGroundTile(x, y, tile);
    } else {
      const existing = objectLayer.get(key);
      if (existing && existing.compositeId) {
        removeCompositeParts(objectLayer, existing.compositeId);
      }

      objectLayer.set(key, { gid: tile.gid });
    }
  }

  function eraseTile(x, y) {
    if (!isWithinBounds(x, y)) return;
    const key = getKey(x, y);
    if (activeLayer.value === "ground") {
      if (!worldLayer.has(key)) return;
      saveState();
      isDirty.value = true;
      eraseGroundTile(x, y);
    } else {
      const existingObj = objectLayer.get(key);
      if (!existingObj) return;
      saveState();
      isDirty.value = true;
      if (existingObj.compositeId) {
        removeCompositeParts(objectLayer, existingObj.compositeId);
        return;
      }

      objectLayer.delete(key);
    }
  }

  function clearWorldLayer() {
    worldLayer.clear();
  }

  function clearObjectLayer() {
    objectLayer.clear();
  }

  function clearLevel() {
    clearWorldLayer();
    clearObjectLayer();
  }

  function loadLevel(level) {
    worldLayer.clear();
    objectLayer.clear();
    undoStack.length = 0;
    redoStack.length = 0;
    isDirty.value = false;

    // the backend only stores the gid for a given tile. 
    // The autotile metadata family, seedGid, auto is hence lost.
    // This breaks the autotiling upon re-editing a saved level.
    // Here we recompute that metadata so it works. Another 
    // solution would be to store the metadata on the backend ofc.
    if (level.worldLayer) {
      for (const [key, value] of Object.entries(level.worldLayer)) {
        const gid = typeof value === "object" ? value.gid : value;
        if (value.auto) {
          worldLayer.set(key, value);
        } else if (gid) {
          const family = getAutotileFamily(gid);
          if (family) {
            worldLayer.set(key, { gid, auto: true, family, seedGid: gid });
          } else {
            worldLayer.set(key, { gid, auto: false });
          }
        }
      }

      // Recompute all autotile masks so tiles resolve to the correct visual GID
      // based on their neighbors (e.g. a seed gid 7 becomes 1, 2, 3, etc.).
      worldLayer.forEach((_, key) => {
        const [x, y] = key.split(",").map(Number);
        recomputeAutoGroundAt(x, y);
      });
    }

    if (level.objectLayer) {
      for (const [key, value] of Object.entries(level.objectLayer)) {
        let tile = value;
        if (tile.content) {
          if (tile.content.type === "some" && tile.content.coinType) {
            tile = { ...tile, content: tile.content.coinType };
          } else {
            const { content: _, ...rest } = tile;
            tile = rest;
          }
        }
        // gid: 116, 117 -> door bottom of door open,closed
        if (tile.gid === 116 || tile.gid === 117) {
          const compositeId = ++compositeIdCounter;
          objectLayer.set(key, { ...tile, compositeId });

          const [x, y] = key.split(",").map(Number);
          const topKey = getKey(x, y - 1);
          // gid: 106, 107 -> door top of door open, closed (only frontend shows and stores this)
          const topGid = tile.gid === 116 ? 106 : 107;
          objectLayer.set(topKey, { gid: topGid, compositeId });
        } else {
          objectLayer.set(key, tile);
        }
      }
    }
  }

  function getTileAt(x, y) {
    const key = `${x},${y}`;
    if (activeLayer.value === "ground") {
      return worldLayer.get(key);
    }
    return objectLayer.get(key);
  }

  let selectionRafId = null;
  let pendingSelectionEnd = null;

  function startSelection(x, y) {
    selection.isSelecting = true;
    selection.selectionStart = { x, y };
    selection.selectionEnd = { x, y };
  }

  function updateSelection(x, y) {
    if (!selection.isSelecting) return;
    pendingSelectionEnd = { x, y };
    if (selectionRafId) return;
    selectionRafId = requestAnimationFrame(() => {
      selectionRafId = null;
      if (pendingSelectionEnd) {
        selection.selectionEnd = pendingSelectionEnd;
        pendingSelectionEnd = null;
      }
    });
  }

  function endSelection() {
    if (selectionRafId) {
      cancelAnimationFrame(selectionRafId);
      selectionRafId = null;
    }
    if (pendingSelectionEnd) {
      selection.selectionEnd = pendingSelectionEnd;
      pendingSelectionEnd = null;
    }
    selection.isSelecting = false;
  }

  function clearSelection() {
    selection.isSelecting = false;
    selection.selectionStart = null;
    selection.selectionEnd = null;
  }

  function saveState() {
    const state = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer),
    };
    undoStack.push(state);
    if (undoStack.length > MAX_UNDO_STATES) {
      undoStack.shift();
    }
    redoStack.length = 0;
  }

  function undo() {
    if (undoStack.length === 0) return;

    const currentState = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer),
    };
    redoStack.push(currentState);
    if (redoStack.length > MAX_UNDO_STATES) {
      redoStack.shift();
    }

    const previousState = undoStack.pop();
    worldLayer.clear();
    objectLayer.clear();

    for (const [key, value] of previousState.worldLayer) {
      worldLayer.set(key, value);
    }
    for (const [key, value] of previousState.objectLayer) {
      objectLayer.set(key, value);
    }
  }

  function redo() {
    if (redoStack.length === 0) return;

    const currentState = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer),
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    worldLayer.clear();
    objectLayer.clear();

    for (const [key, value] of nextState.worldLayer) {
      worldLayer.set(key, value);
    }
    for (const [key, value] of nextState.objectLayer) {
      objectLayer.set(key, value);
    }
  }

  function canUndo() {
    return undoStack.length > 0;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function togglePreviewMode() {
    if (!previewMode.value) {
      selection.isSelecting = false;
    }
    previewMode.value = !previewMode.value;
  }

  function toggleShowGids() {
    showGids.value = !showGids.value;
  }
  // highlights a tile for 5 seconds (used when showing validation errors)
  function highlightTile(x, y) {
    highlightedTile.value = { x, y };
    setTimeout(() => {
      if (highlightedTile.value?.x === x && highlightedTile.value?.y === y) {
        highlightedTile.value = null;
      }
    }, 5000);
  }

  function setBoxContent(x, y, content) {
    const key = getKey(x, y);
    const tile = objectLayer.get(key);
    if (!tile || !BOX_GIDS.has(tile.gid)) return;

    saveState();
    isDirty.value = true;

    if (content) {
      objectLayer.set(key, { ...tile, content });
      return;
    }

    const { content: _, ...rest } = tile;
    objectLayer.set(key, rest);
  }

  function isBoxTile(gid) {
    return BOX_GIDS.has(gid);
  }
  function swapTileVariant(x, y) {
    const key = getKey(x, y);
    const tile = worldLayer.get(key);
    if (!tile) return;
    const variantGid = TILE_VARIANT_MAP[tile.gid];
    if (variantGid === undefined) return;
    saveState();
    isDirty.value = true;
    worldLayer.set(key, { ...tile, gid: variantGid });
  }

  return {
    activeLayer,
    selectedTool,
    selectedTile,
    worldLayer,
    objectLayer,
    previewMode,
    showGids,
    setActiveLayer,
    toggleLayer,
    setSelectedTool,
    clearTool,
    setSelectedTile,
    paintTile,
    eraseTile,
    clearLevel,
    loadLevel,
    clearWorldLayer,
    clearObjectLayer,
    getTileAt,
    selection,
    startSelection,
    updateSelection,
    endSelection,
    togglePreviewMode,
    toggleShowGids,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    togglePreviewMode,
    isDirty,
    tileValidationIssues,
    highlightedTile,
    highlightTile,
    setBoxContent,
    isBoxTile,
    getPreviewPaintTileGid,
    swapTileVariant,
  };
}
