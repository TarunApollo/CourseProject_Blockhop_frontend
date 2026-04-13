import { ref, reactive, computed } from 'vue'
import { GRID_WIDTH, GRID_HEIGHT } from '../lib/editorConstants'
import { getObjectIssue } from '../lib/validationUtils'

const activeLayer = ref('ground')
const selectedTool = ref('paintbrush')
const selectedTile = ref(null)

const worldLayer = reactive(new Map())
const objectLayer = reactive(new Map())

const selection = reactive({
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null
})

const previewMode = ref(false)

const undoStack = reactive([])
const redoStack = reactive([])
const MAX_UNDO_STATES = 50

const tileValidationIssues = computed(() => {
  const map = new Map()
  for (const [key] of objectLayer) {
    const [x, y] = key.split(',').map(Number)
    const issue = getObjectIssue(worldLayer, objectLayer, x, y)
    if (issue) {
      map.set(key, issue)
    }
  }
  return map
})

const highlightedTile = ref(null)

export function useEditorState() {
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
  }

  function paintTile(x, y, tile) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return
    const key = `${x},${y}`
    const layer = activeLayer.value === 'ground' ? worldLayer : objectLayer
    const existing = layer.get(key)
    if (existing && existing.gid === tile.gid) return
    saveState()
    layer.set(key, { gid: tile.gid })
  }

  function eraseTile(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return
    const key = `${x},${y}`
    const layer = activeLayer.value === 'ground' ? worldLayer : objectLayer
    if (!layer.has(key)) return
    saveState()
    layer.delete(key)
  }

  function clearLevel() {
    worldLayer.clear()
    objectLayer.clear()
  }

  function loadLevel(level) {
    worldLayer.clear()
    objectLayer.clear()
    undoStack.length = 0
    redoStack.length = 0

    if (level.worldLayer) {
      for (const [key, value] of Object.entries(level.worldLayer)) {
        worldLayer.set(key, value)
      }
    }

    if (level.objectLayer) {
      for (const [key, value] of Object.entries(level.objectLayer)) {
        objectLayer.set(key, value)
      }
    }
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

  function clearSelection() {
    selection.isSelecting = false
    selection.selectionStart = null
    selection.selectionEnd = null
  }

  function saveState() {
    const state = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer)
    }
    undoStack.push(state)
    if (undoStack.length > MAX_UNDO_STATES) {
      undoStack.shift()
    }
    redoStack.length = 0
  }

  function undo() {
    if (undoStack.length === 0) return

    const currentState = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer)
    }
    redoStack.push(currentState)
    if (redoStack.length > MAX_UNDO_STATES) {
      redoStack.shift()
    }

    const previousState = undoStack.pop()
    worldLayer.clear()
    objectLayer.clear()

    for (const [key, value] of previousState.worldLayer) {
      worldLayer.set(key, value)
    }
    for (const [key, value] of previousState.objectLayer) {
      objectLayer.set(key, value)
    }
    
  }

  function redo() {
    if (redoStack.length === 0) return

    const currentState = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer)
    }
    undoStack.push(currentState)

    const nextState = redoStack.pop()
    worldLayer.clear()
    objectLayer.clear()

    for (const [key, value] of nextState.worldLayer) {
      worldLayer.set(key, value)
    }
    for (const [key, value] of nextState.objectLayer) {
      objectLayer.set(key, value)
    }

  }

  function canUndo() {
    return undoStack.length > 0
  }

  function canRedo() {
    return redoStack.length > 0
  }

  function togglePreviewMode() {
    if (!previewMode.value) {
      selection.isSelecting = false
    }
    previewMode.value = !previewMode.value
  }

  // highlights a tile for 5 seconds (used when showing validation errors)
  function highlightTile(x, y) {
    highlightedTile.value = { x, y }
    setTimeout(() => {
      if (highlightedTile.value?.x === x && highlightedTile.value?.y === y) {
        highlightedTile.value = null
      }
    }, 5000)
  }

  return {
    activeLayer,
    selectedTool,
    selectedTile,
    worldLayer,
    objectLayer,
    previewMode,
    setActiveLayer,
    toggleLayer,
    setSelectedTool,
    clearTool,
    setSelectedTile,
    paintTile,
    eraseTile,
    clearLevel,
    loadLevel,
    getTileAt,
    selection,
    startSelection,
    updateSelection,
    endSelection,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    togglePreviewMode,
    tileValidationIssues,
    highlightedTile,
    highlightTile
  }
}
