import { ref, reactive } from 'vue'
import { GRID_WIDTH, GRID_HEIGHT } from '../lib/editorConstants'
import {
  getAutotileFamily,
  isMudGrassCapGid,
  computeAutotileMask,
  resolveAutotileGid
} from '../lib/groundAutotile'

const activeLayer = ref('ground')
const selectedTool = ref('paintbrush')
const selectedTile = ref(null)

const worldLayer = reactive(new Map())
const objectLayer = reactive(new Map())
const autoGroundTiles = reactive(new Map())
const fixedGroundTiles = reactive(new Map())

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

  function recomputeAutoGroundAt(x, y) {
    if (!isWithinBounds(x, y)) return
    const key = getKey(x, y)
    const tile = autoGroundTiles.get(key)

    if (!tile) return

    // Levitating tiles are their own isolated family —
    // they only see other levitating tiles as neighbors
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

    // Mud families: decide mudGrass vs mudBare based on north neighbor
    const northNeighbor = getAutoGroundTileAt(x, y - 1)
    const northIsGround = northNeighbor &&
      (northNeighbor.family === 'mudGrass' || northNeighbor.family === 'mudBare')
    const roleFamily = northIsGround ? 'mudBare' : 'mudGrass'

    // Only count mud-family tiles as neighbors (not levitating)
    const hasMudNeighborAt = (nx, ny) => {
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

  function paintGroundTile(x, y, tile) {
    const key = getKey(x, y)
    const gid = tile.gid
    const family = getAutotileFamily(gid)
    const isFixedMudGrassCap = isMudGrassCapGid(gid)

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

    const wasAutoTile = autoGroundTiles.delete(key)
    const wasFixedTile = fixedGroundTiles.delete(key)
    worldLayer.set(key, { gid, auto: false })

    if (wasAutoTile || wasFixedTile) {
      recomputeAutoGroundNeighborhood(x, y)
    }
  }

  function eraseGroundTile(x, y) {
    const key = getKey(x, y)
    const wasAutoTile = autoGroundTiles.delete(key)
    const wasFixedTile = fixedGroundTiles.delete(key)
    worldLayer.delete(key)

    if (wasAutoTile || wasFixedTile) {
      recomputeAutoGroundNeighborhood(x, y)
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
    const key = getKey(x, y)
    if (activeLayer.value === 'ground') {
      paintGroundTile(x, y, tile)
    } else {
      objectLayer.set(key, { gid: tile.gid })
    }
  }

  function eraseTile(x, y) {
    if (!isWithinBounds(x, y)) return
    const key = getKey(x, y)
    if (activeLayer.value === 'ground') {
      eraseGroundTile(x, y)
    } else {
      objectLayer.delete(key)
    }
  }

  function clearWorldLayer() {
    worldLayer.clear()
    autoGroundTiles.clear()
    fixedGroundTiles.clear()
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