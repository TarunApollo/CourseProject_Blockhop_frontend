import { ref } from 'vue'

const activeLayer = ref('ground')
const selectedTile = ref(null)

export function useEditorState() {
  function setActiveLayer(layer) {
    activeLayer.value = layer
  }

  function setSelectedTile(tile) {
    selectedTile.value = tile
  }

  return {
    activeLayer,
    selectedTile,
    setActiveLayer,
    setSelectedTile
  }
}
