import { computed, watch } from "vue";
import {
  activeLayer,
  selectedTool,
  selectedTile,
  worldLayer,
  objectLayer,
  compositeIdState,
  selection,
  previewMode,
  showGids,
  isDirty,
  levelTitle,
  levelDescription,
  clearConditionType,
  clearConditionTargetAmount,
  levelTheme,
  highlightedTile,
} from "./editorStore";
import { useEditorHistory } from "./useEditorHistory";
import { useEditorSelection } from "./useEditorSelection";
import {
  isWithinBounds,
  getKey,
  getAutoGroundTileAt,
  recomputeAutoGroundAt,
  recomputeAutoGroundNeighborhood,
  getForcedGroundPlacementTileId,
  getPreviewPaintTileId,
} from "./editorAutotileUtils";

import {
  getAutotileFamilyByTileId,
  isMudGrassCapTileId,
  parseTileId,
} from "../lib/groundAutotile";
import { getObjectIssue, getUniqueObjectStats } from "../lib/validationUtils";
import { setPaletteTheme } from "../lib/tileData";
import { BOX_TILE_IDS, UNIQUE_OBJECT_RULES } from "../lib/editorTilePolicy";
import { parseClearCondition } from "@/features/profile/lib/clearConditionContract";

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

export function useEditorState() {
  const history = useEditorHistory();
  const selectHook = useEditorSelection();

  watch(levelTheme, (newTheme) => {
    setPaletteTheme(newTheme);
  });

  function getUniqueRuleByTileId(tileId) {
    return UNIQUE_OBJECT_RULES.find((rule) => rule.tileIds.has(tileId)) || null;
  }

  function countTilesForRule(layer, rule) {
    let count = 0;
    for (const tile of layer.values()) {
      if (rule.tileIds.has(tile.tileId)) count += 1;
    }
    return count;
  }

  function canPlaceUniqueObjectAt(tile, key) {
    const rule = getUniqueRuleByTileId(tile.tileId);
    if (!rule) return true;

    const existingCount = countTilesForRule(objectLayer, rule);
    if (existingCount < 1) return true;

    const existingAtTarget = objectLayer.get(key);
    return !!(existingAtTarget && rule.tileIds.has(existingAtTarget.tileId));
  }

  function removeCompositeParts(layer, compositeId) {
    for (const [k, v] of layer) {
      if (v.compositeId === compositeId) {
        layer.delete(k);
      }
    }
  }

  function setLevelTheme(newTheme) {
    if (levelTheme.value === newTheme) return;
    history.saveState();
    isDirty.value = true;

    levelTheme.value = newTheme;

    for (const [key, tile] of worldLayer.entries()) {
      if (tile.tileId && tile.tileId.startsWith("terrain.")) {
        const parts = tile.tileId.split(".");
        if (parts.length >= 3) {
          const newTileId = `terrain.${newTheme}.${parts.slice(2).join(".")}`;
          worldLayer.set(key, {
            ...tile,
            tileId: newTileId,
            seedTileId: tile.seedTileId ? `terrain.${newTheme}.${parseTileId(tile.seedTileId).role}` : undefined,
          });
        }
      }
    }

    worldLayer.forEach((_, key) => {
      const [x, y] = key.split(",").map(Number);
      recomputeAutoGroundAt(x, y);
    });
  }

  function paintGroundTile(x, y, tile) {
    const key = getKey(x, y);
    const tileId = tile.tileId;
    const family = getAutotileFamilyByTileId(tileId);
    const isFixedMudGrassCap = isMudGrassCapTileId(tileId);

    const forcedPlacementId = getForcedGroundPlacementTileId(x, y, tileId);
    if (forcedPlacementId) {
      worldLayer.set(key, {
        tileId: forcedPlacementId,
        auto: true,
        family: family || "mudGrass",
        seedTileId: tileId,
      });
      recomputeAutoGroundNeighborhood(x, y);
      return;
    }

    if (isFixedMudGrassCap) {
      worldLayer.set(key, {
        tileId,
        auto: false,
        family: "mudGrass",
        lockedTileId: tileId,
      });
      recomputeAutoGroundNeighborhood(x, y);
      return;
    }

    if (family) {
      worldLayer.set(key, {
        tileId,
        auto: true,
        family,
        seedTileId: tileId,
      });
      recomputeAutoGroundNeighborhood(x, y);
      return;
    }

    // Non-autotile ground or special ground tiles placed directly.
    worldLayer.set(key, {
      tileId,
      auto: false,
    });
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

    // active theme to paintbrush before placing
    let tileToPaint = { ...tile };
    if (activeLayer.value === "ground" && tileToPaint.tileId && tileToPaint.tileId.startsWith("terrain.")) {
      const parts = tileToPaint.tileId.split(".");
      if (parts.length >= 3) {
        const themedTileId = `terrain.${levelTheme.value}.${parts.slice(2).join(".")}`;
        tileToPaint.tileId = themedTileId;
        if (tileToPaint.tiles) {
          tileToPaint.tiles = tileToPaint.tiles.map((subTile) => {
            const subParts = subTile.tileId.split(".");
            const themedSubId = `terrain.${levelTheme.value}.${subParts.slice(2).join(".")}`;
            return {
              ...subTile,
              tileId: themedSubId,
            };
          });
        }
      }
    }

    if (tileToPaint.composite && tileToPaint.tiles) {
      const compositeId = ++compositeIdState.counter;
      const layer = activeLayer.value === "ground" ? worldLayer : objectLayer;

      for (const offset of tileToPaint.tiles) {
        const tx = x + offset.dx;
        const ty = y + offset.dy;
        if (!isWithinBounds(tx, ty)) continue;
        const key = getKey(tx, ty);
        const existing = layer.get(key);
        if (existing && existing.compositeId) {
          removeCompositeParts(layer, existing.compositeId);
        }
      }

      history.saveState();
      isDirty.value = true;
      for (const offset of tileToPaint.tiles) {
        const tx = x + offset.dx;
        const ty = y + offset.dy;
        if (!isWithinBounds(tx, ty)) continue;
        const key = getKey(tx, ty);
        layer.set(key, {
          tileId: offset.tileId,
          compositeId,
        });
      }
      return;
    }

    history.saveState();
    isDirty.value = true;
    if (activeLayer.value === "ground") {
      paintGroundTile(x, y, tileToPaint);
    } else {
      const existing = objectLayer.get(key);
      if (existing && existing.compositeId) {
        removeCompositeParts(objectLayer, existing.compositeId);
      }

      objectLayer.set(key, {
        tileId: tileToPaint.tileId,
      });
    }
  }

  function eraseTile(x, y) {
    if (!isWithinBounds(x, y)) return;
    const key = getKey(x, y);
    if (activeLayer.value === "ground") {
      if (!worldLayer.has(key)) return;
      history.saveState();
      isDirty.value = true;
      eraseGroundTile(x, y);
    } else {
      const existingObj = objectLayer.get(key);
      if (!existingObj) return;
      history.saveState();
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

  function setClearConditionType(type) {
    if (clearConditionType.value === type) return;
    clearConditionType.value = type;
    if (type === "none") {
      clearConditionTargetAmount.value = 0;
    } else if (!Number.isInteger(Number(clearConditionTargetAmount.value)) || Number(clearConditionTargetAmount.value) < 1) {
      clearConditionTargetAmount.value = 1;
    }
    isDirty.value = true;
  }

  function setClearConditionTargetAmount(amount) {
    if (clearConditionTargetAmount.value === amount) return;
    clearConditionTargetAmount.value = amount;
    isDirty.value = true;
  }

  function loadLevel(level) {
    worldLayer.clear();
    objectLayer.clear();
    history.markSaved();
    levelTitle.value = level.title ?? "";
    levelDescription.value = level.description ?? "";

    const parsedClearCondition = parseClearCondition(level.clearCondition);
    clearConditionType.value = parsedClearCondition.type;
    clearConditionTargetAmount.value = parsedClearCondition.amount;

    if (level.worldLayer) {
      // find the theme by scanning tileIds
      let resolvedTheme = "grass";
      for (const [, value] of Object.entries(level.worldLayer)) {
        const tileId = value?.tileId;
        if (tileId?.startsWith("terrain.")) {
          resolvedTheme = tileId.split(".")[1] || "grass";
          break;
        }
      }
      levelTheme.value = resolvedTheme;

      for (const [key, value] of Object.entries(level.worldLayer)) {
        const tileId = typeof value === "object" ? value.tileId : null;
        if (!tileId) continue;

        if (value.auto) {
          worldLayer.set(key, { ...value, tileId });
        } else if (tileId) {
          if (isMudGrassCapTileId(tileId)) {
            worldLayer.set(key, { tileId, auto: false, family: "mudGrass", lockedTileId: tileId });
          } else {
            const family = getAutotileFamilyByTileId(tileId);
            if (family) {
              worldLayer.set(key, { tileId, auto: true, family, seedTileId: tileId });
            } else {
              worldLayer.set(key, { tileId, auto: false });
            }
          }
        }
      }

      // Recompute all autotile masks so tiles resolve to the correct visual tileId
      worldLayer.forEach((_, key) => {
        const [x, y] = key.split(",").map(Number);
        recomputeAutoGroundAt(x, y);
      });
    }

    if (level.objectLayer) {
      for (const [key, value] of Object.entries(level.objectLayer)) {
        if (!value?.tileId) continue;
        let tile = value;
        if (tile.content) {
          if (tile.content.type === "some" && tile.content.coinType) {
            tile = { ...tile, content: tile.content.coinType };
          } else {
            const { content: _, ...rest } = tile;
            tile = rest;
          }
        }
        // door.closed.bottom / door.open.bottom → composite with top piece
        if (tile.tileId === 'door.closed.bottom' || tile.tileId === 'door.open.bottom') {
          const compositeId = ++compositeIdState.counter;
          objectLayer.set(key, { ...tile, compositeId });

          const [x, y] = key.split(",").map(Number);
          const topKey = getKey(x, y - 1);
          const topTileId = tile.tileId === 'door.closed.bottom' ? 'door.closed.top' : 'door.open.top';
          objectLayer.set(topKey, { tileId: topTileId, compositeId });
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

  function deleteSelection() {
    if (selection.tiles.length === 0) return;

    history.saveState();
    isDirty.value = true;

    const deletedCompositeIds = new Set();

    for (const tile of selection.tiles) {
      if (tile.layer === "ground") {
        eraseGroundTile(tile.x, tile.y);
      } else {
        const existing = objectLayer.get(`${tile.x},${tile.y}`);
        if (!existing) continue;
        if (existing.compositeId) {
          if (!deletedCompositeIds.has(existing.compositeId)) {
            deletedCompositeIds.add(existing.compositeId);
            removeCompositeParts(objectLayer, existing.compositeId);
          }
        } else {
          objectLayer.delete(`${tile.x},${tile.y}`);
        }
      }
    }

    selectHook.clearSelection();
  }

  function copySelection() {
    const bounds = selectHook.getSelectionBounds();
    if (!bounds) return;
    selection.clipboard = selection.tiles.map((selected) => ({
      dx: selected.x - bounds.minX,
      dy: selected.y - bounds.minY,
      layer: selected.layer,
      tile: { ...selected.tile },
      tileId: selected.tileId,
      compositeId: selected.compositeId,
    }));
  }

  function pasteSelection(x, y) {
    if (selection.clipboard.length === 0) return;
    history.saveState();
    isDirty.value = true;
    selectHook.clearSelection();

    const compositeIds = new Map();
    const pastedTiles = [];

    for (const copied of selection.clipboard) {
      const tx = x + copied.dx;
      const ty = y + copied.dy;
      if (!isWithinBounds(tx, ty)) continue;

      const layer = copied.layer === "ground" ? worldLayer : objectLayer;
      const key = getKey(tx, ty);
      const tile = { ...copied.tile };

      if (copied.compositeId) {
        if (!compositeIds.has(copied.compositeId)) {
          compositeIds.set(copied.compositeId, ++compositeIdState.counter);
        }
        tile.compositeId = compositeIds.get(copied.compositeId);
      }

      const existing = layer.get(key);
      if (existing?.compositeId) {
        removeCompositeParts(layer, existing.compositeId);
      }

      layer.set(key, tile);
      if (copied.layer === "ground") {
        recomputeAutoGroundNeighborhood(tx, ty);
      }
      pastedTiles.push({
        x: tx,
        y: ty,
        layer: copied.layer,
        tile: { ...tile },
        tileId: tile.tileId,
        compositeId: tile.compositeId,
      });
    }

    selection.tiles = pastedTiles;
  }

  function moveSelection(dx, dy) {
    if (selection.tiles.length === 0 || (dx === 0 && dy === 0)) return;
    if (
      selection.tiles.some(
        (tile) => !isWithinBounds(tile.x + dx, tile.y + dy),
      )
    ) {
      return;
    }

    history.saveState();
    isDirty.value = true;

    const moving = selection.tiles.map((selected) => ({
      ...selected,
      tile: { ...selected.tile },
    }));

    for (const selected of moving) {
      if (selected.layer === "ground") {
        eraseGroundTile(selected.x, selected.y);
      } else {
        objectLayer.delete(getKey(selected.x, selected.y));
      }
    }

    const movedTiles = [];
    for (const selected of moving) {
      const tx = selected.x + dx;
      const ty = selected.y + dy;
      const layer = selected.layer === "ground" ? worldLayer : objectLayer;
      const key = getKey(tx, ty);
      const existing = layer.get(key);
      if (existing?.compositeId && existing.compositeId !== selected.compositeId) {
        removeCompositeParts(layer, existing.compositeId);
      }
      layer.set(key, selected.tile);
      if (selected.layer === "ground") {
        recomputeAutoGroundNeighborhood(tx, ty);
      }
      movedTiles.push({
        ...selected,
        x: tx,
        y: ty,
      });
    }

    selection.tiles = movedTiles;
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
    if (!tile || !BOX_TILE_IDS.has(tile.tileId)) return;

    history.saveState();
    isDirty.value = true;

    if (content) {
      objectLayer.set(key, { ...tile, content });
      return;
    }

    const { content: _, ...rest } = tile;
    objectLayer.set(key, rest);
  }

  function isBoxTile(tileId) {
    return BOX_TILE_IDS.has(tileId);
  }

  return {
    activeLayer,
    selectedTool,
    selectedTile,
    worldLayer,
    objectLayer,
    previewMode,
    showGids,
    levelTitle,
    levelDescription,
    clearConditionType,
    clearConditionTargetAmount,
    levelTheme,
    setLevelTheme,
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
    startSelection: selectHook.startSelection,
    updateSelection: selectHook.updateSelection,
    endSelection: selectHook.endSelection,
    clearSelection: selectHook.clearSelection,
    isTileSelected: selectHook.isTileSelected,
    getSelectionBounds: selectHook.getSelectionBounds,
    deleteSelection,
    copySelection,
    pasteSelection,
    moveSelection,
    togglePreviewMode,
    toggleShowGids,
    saveState: history.saveState,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    isDirty,
    markSaved: history.markSaved,
    tileValidationIssues,
    highlightedTile,
    highlightTile,
    setBoxContent,
    isBoxTile,
    getPreviewPaintTileId,
    setClearConditionType,
    setClearConditionTargetAmount,
  };
}
