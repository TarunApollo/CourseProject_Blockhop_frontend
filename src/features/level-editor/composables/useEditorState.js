import { ref, reactive } from 'vue'
import { GRID_WIDTH, GRID_HEIGHT, GROUND_COVERING_GIDS } from '../lib/editorConstants'
import {
  getAutotileFamily,
  isMudGrassCapGid,
  computeAutotileMask,
  resolveAutotileGid
} from '../lib/groundAutotile'

// GIDs that sit on top of ground and force the tile below to mudBare.
const GROUND_COVERING_GIDS = new Set([62])

const activeLayer = ref('ground')
const selectedTool = ref('paintbrush')
const selectedTile = ref(null)

const worldLayer = reactive(new Map())
const objectLayer = reactive(new Map())
const autoGroundTiles = reactive(new Map())
const fixedGroundTiles = reactive(new Map())

// Tracks dirt tiles that were auto-spawned below a spike.
// If the user manually paints over one, it gets removed from this set
// so it's no longer tied to the spike above.
const synthesizedSupportTiles = reactive(new Set())

// Counter for unique composite tile IDs
let compositeIdCounter = 0

const selection = reactive({
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null
})

const previewMode = ref(false)
const showGids = ref(false)

export function useEditorState() {
  function isWithinBounds(x, y) {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT
  }

  function getKey(x, y) {
    return `${x},${y}`
  }

  function getAutoGroundTileAt(x, y) {
    const key = getKey(x, y)
    return autoGroundTiles.get(key) || fixedGroundTiles.get(key)
  }

  function isCoveringAt(x, y) {
    const key = getKey(x, y)
    const obj = objectLayer.get(key)
    if (obj != null && GROUND_COVERING_GIDS.has(obj.gid)) return true
    const tile = worldLayer.get(key)
    if (tile != null && GROUND_COVERING_GIDS.has(tile.gid)) return true
    return false
  }

  function recomputeAutoGroundAt(x, y) {
    if (!isWithinBounds(x, y)) return
    const key = getKey(x, y)
    const tile = autoGroundTiles.get(key)

    if (!tile) return

    // Levitating tiles only see other levitating tiles as neighbors
    if (tile.family === 'levitating') {
      const hasLevitatingAt = (nx, ny) => {
        const neighbor = getAutoGroundTileAt(nx, ny)
        return neighbor != null && neighbor.family === 'levitating'
      }
      const mask = computeAutotileMask(x, y, hasLevitatingAt)
      const gid = resolveAutotileGid('levitating', mask, tile.seedGid)
      worldLayer.set(key, { gid, auto: true })
      return
    }

    // Mud families: decide mudGrass vs mudBare based on north neighbor.
    // A covering tile (e.g. spike) directly above also forces mudBare.
    const northNeighbor = getAutoGroundTileAt(x, y - 1)
    const northIsGround = northNeighbor &&
      (northNeighbor.family === 'mudGrass' || northNeighbor.family === 'mudBare')
    const northIsCovering = isCoveringAt(x, y - 1)
    const roleFamily = (northIsGround || northIsCovering) ? 'mudBare' : 'mudGrass'

    const hasMudNeighborAt = (nx, ny) => {
      if (northIsCovering && nx === x && ny === y - 1) return true
      const neighbor = getAutoGroundTileAt(nx, ny)
      if (!neighbor) return false
      if (neighbor.family === 'levitating') return false
      return true
    }

    const mask = computeAutotileMask(x, y, hasMudNeighborAt)
    const gid = resolveAutotileGid(roleFamily, mask, tile.seedGid)
    worldLayer.set(key, { gid, auto: true })
  }

  function recomputeAutoGroundNeighborhood(x, y) {
    const offsets = [
      [0, 0],
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ]

    for (const [dx, dy] of offsets) {
      recomputeAutoGroundAt(x + dx, y + dy)
    }
  }

  // spike and dirt relationships

  function spawnSupportBelow(x, y) {
    const belowY = y + 1
    if (!isWithinBounds(x, belowY)) return
    const belowKey = getKey(x, belowY)

    
    if (worldLayer.has(belowKey)) return

    // Spawn as a mudGrass autotile — recompute will flip it to mudBare
    // because it sees the spike above
    autoGroundTiles.set(belowKey, { family: 'mudGrass', seedGid: 7 })
    synthesizedSupportTiles.add(belowKey)
    recomputeAutoGroundNeighborhood(x, belowY)
  }

  function removeSynthesizedSupport(x, y) {
    const belowY = y + 1
    if (!isWithinBounds(x, belowY)) return
    const belowKey = getKey(x, belowY)

    if (!synthesizedSupportTiles.has(belowKey)) return

    synthesizedSupportTiles.delete(belowKey)
    autoGroundTiles.delete(belowKey)
    fixedGroundTiles.delete(belowKey)
    worldLayer.delete(belowKey)
    recomputeAutoGroundNeighborhood(x, belowY)
  }

  function removeSpikeAbove(x, y) {
    const aboveY = y - 1
    if (!isWithinBounds(x, aboveY)) return

    // Check ground layer for spike above
    const aboveKey = getKey(x, aboveY)
    const aboveTile = worldLayer.get(aboveKey)
    if (aboveTile && GROUND_COVERING_GIDS.has(aboveTile.gid)) {
      worldLayer.delete(aboveKey)
      autoGroundTiles.delete(aboveKey)
      fixedGroundTiles.delete(aboveKey)
      recomputeAutoGroundNeighborhood(x, aboveY)
      return
    }

    // Check object layer for spike above
    const aboveObj = objectLayer.get(aboveKey)
    if (aboveObj && GROUND_COVERING_GIDS.has(aboveObj.gid)) {
      objectLayer.delete(aboveKey)
      return
    }
  }

  function removeCompositeParts(layer, compositeId) {
    for (const [k, v] of layer) {
      if (v.compositeId === compositeId) {
        layer.delete(k)
      }
    }
  }

  function paintGroundTile(x, y, tile) {
    const key = getKey(x, y)
    const gid = tile.gid
    const family = getAutotileFamily(gid)
    const isFixedMudGrassCap = isMudGrassCapGid(gid)
    const isCovering = GROUND_COVERING_GIDS.has(gid)

    // If the user manually paints over a synthesized support tile,
    // it's no longer auto-generated — break the coupling
    synthesizedSupportTiles.delete(key)

    if (isFixedMudGrassCap) {
      const wasAutoTile = autoGroundTiles.delete(key)
      fixedGroundTiles.set(key, { family: 'mudGrass', lockedGid: gid })
      worldLayer.set(key, { gid, auto: false })

      if (wasAutoTile) {
        recomputeAutoGroundNeighborhood(x, y)
      }
      return
    }

    if (family) {
      const wasFixedTile = fixedGroundTiles.delete(key)
      autoGroundTiles.set(key, { family, seedGid: gid })
      recomputeAutoGroundNeighborhood(x, y)
      if (wasFixedTile) {
        recomputeAutoGroundNeighborhood(x, y)
      }
      return
    }

    // Non-autotile ground (includes spikes on the ground layer)
    const wasAutoTile = autoGroundTiles.delete(key)
    const wasFixedTile = fixedGroundTiles.delete(key)
    worldLayer.set(key, { gid, auto: false })

    if (wasAutoTile || wasFixedTile) {
      recomputeAutoGroundNeighborhood(x, y)
    }

    // Replacing the support tile under a spike should also clear the spike.
    removeSpikeAbove(x, y)

    // Spike placed on ground layer → spawn dirt below
    if (isCovering) {
      spawnSupportBelow(x, y)
      recomputeAutoGroundAt(x, y + 1)
    }
  }

  function eraseGroundTile(x, y) {
    const key = getKey(x, y)
    const existingTile = worldLayer.get(key)
    if (!existingTile) return

    const wasCovering = GROUND_COVERING_GIDS.has(existingTile.gid)
    const wasSynthesized = synthesizedSupportTiles.has(key)

    autoGroundTiles.delete(key)
    fixedGroundTiles.delete(key)
    synthesizedSupportTiles.delete(key)
    worldLayer.delete(key)

    recomputeAutoGroundNeighborhood(x, y)

    // Erasing a spike → remove its synthesized dirt below
    if (wasCovering) {
      removeSynthesizedSupport(x, y)
    }

    // Erasing dirt that had a spike above → remove the spike
    if (!wasCovering) {
      removeSpikeAbove(x, y)
    }
  }

  function setActiveLayer(layer) {
    activeLayer.value = layer
    selectedTile.value = null
  }

  function toggleLayer() {
    activeLayer.value = activeLayer.value === 'ground' ? 'object' : 'ground'
    selectedTile.value = null
  }

  function setSelectedTool(tool) {
    selectedTool.value = tool
  }

  function clearTool() {
    selectedTool.value = 'none'
    selectedTile.value = null
  }

  function setSelectedTile(tile) {
    selectedTile.value = tile
    selectedTool.value = 'paintbrush'
  }

  function paintTile(x, y, tile) {
    if (!isWithinBounds(x, y)) return

    if (tile.composite && tile.tiles) {
      const compositeId = ++compositeIdCounter
      const layer = activeLayer.value === 'ground' ? worldLayer : objectLayer

      for (const offset of tile.tiles) {
        const tx = x + offset.dx
        const ty = y + offset.dy
        if (!isWithinBounds(tx, ty)) continue
        const key = getKey(tx, ty)
        const existing = layer.get(key)
        if (existing && existing.compositeId) {
          removeCompositeParts(layer, existing.compositeId)
        }
      }

      for (const offset of tile.tiles) {
        const tx = x + offset.dx
        const ty = y + offset.dy
        if (!isWithinBounds(tx, ty)) continue
        const key = getKey(tx, ty)
        layer.set(key, { gid: offset.gid, compositeId })
      }
      return
    }

    const key = getKey(x, y)
    if (activeLayer.value === 'ground') {
      paintGroundTile(x, y, tile)
    } else {
      const existing = objectLayer.get(key)
      if (existing && existing.compositeId) {
        removeCompositeParts(objectLayer, existing.compositeId)
      }

      objectLayer.set(key, { gid: tile.gid })
      if (GROUND_COVERING_GIDS.has(tile.gid)) {
        spawnSupportBelow(x, y)
        recomputeAutoGroundAt(x, y + 1)
      }
    }
  }

  function eraseTile(x, y) {
    if (!isWithinBounds(x, y)) return
    const key = getKey(x, y)
    if (activeLayer.value === 'ground') {
      eraseGroundTile(x, y)
    } else {
      const existingObj = objectLayer.get(key)
      if (!existingObj) return

      if (existingObj.compositeId) {
        removeCompositeParts(objectLayer, existingObj.compositeId)
        return
      }

      const wasCovering = GROUND_COVERING_GIDS.has(existingObj.gid)
      objectLayer.delete(key)
      if (wasCovering) {
        removeSynthesizedSupport(x, y)
        recomputeAutoGroundAt(x, y + 1)
      }
    }
  }

  function clearWorldLayer() {
    worldLayer.clear()
    autoGroundTiles.clear()
    fixedGroundTiles.clear()
    synthesizedSupportTiles.clear()
  }

  function clearObjectLayer() {
    objectLayer.clear()
  }

  function clearLevel() {
    clearWorldLayer()
    clearObjectLayer()
  }

  function getTileAt(x, y) {
    const key = `${x},${y}`
    if (activeLayer.value === 'ground') {
      return worldLayer.get(key)
    }
    return objectLayer.get(key)
  }

  function startSelection(x, y) {
    selection.isSelecting = true
    selection.selectionStart = { x, y }
    selection.selectionEnd = { x, y }
  }

  function updateSelection(x, y) {
    if (!selection.isSelecting) return
    selection.selectionEnd = { x, y }
  }

  function endSelection() {
    selection.isSelecting = false
  }

  function togglePreviewMode() {
    if (!previewMode.value) {
      selection.isSelecting = false
    }
    previewMode.value = !previewMode.value
  }

  function toggleShowGids() {
    showGids.value = !showGids.value
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
    clearWorldLayer,
    clearObjectLayer,
    getTileAt,
    selection,
    startSelection,
    updateSelection,
    endSelection,
    togglePreviewMode,
    toggleShowGids
  }
}

