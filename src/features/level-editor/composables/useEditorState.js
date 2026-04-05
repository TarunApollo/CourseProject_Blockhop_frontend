import { ref, reactive } from 'vue'
import { GRID_WIDTH, GRID_HEIGHT } from '../lib/editorConstants'

const activeLayer = ref('ground')
const selectedTool = ref('paintbrush')
const selectedTile = ref(null)

const worldLayer = reactive(new Map())
const objectLayer = reactive(new Map())

export function useEditorState() {
  function setActiveLayer(layer) {
    activeLayer.value = layer
    selectedTile.value = null
  }

  function setSelectedTool(tool) {
    selectedTool.value = tool
  }

  function setSelectedTile(tile) {
    selectedTile.value = tile
  }

  function paintTile(x, y, tile) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return
    const key = `${x},${y}`
    if (activeLayer.value === 'ground') {
      worldLayer.set(key, { gid: tile.gid })
    } else {
      objectLayer.set(key, { gid: tile.gid })
    }
  }

  function eraseTile(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return
    const key = `${x},${y}`
    if (activeLayer.value === 'ground') {
      worldLayer.delete(key)
    } else {
      objectLayer.delete(key)
    }
  }

  function clearLevel() {
    worldLayer.clear()
    objectLayer.clear()
  }

  function getTileAt(x, y) {
    const key = `${x},${y}`
    if (activeLayer.value === 'ground') {
      return worldLayer.get(key)
    }
    return objectLayer.get(key)
  }

  return {
    activeLayer,
    selectedTool,
    selectedTile,
    worldLayer,
    objectLayer,
    setActiveLayer,
    setSelectedTool,
    setSelectedTile,
    paintTile,
    eraseTile,
    clearLevel,
    getTileAt
  }
}
