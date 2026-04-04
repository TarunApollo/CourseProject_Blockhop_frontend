import { ref } from 'vue'

const activeLayer = ref('ground')

export function useEditorState() {
  function setActiveLayer(layer) {
    activeLayer.value = layer
  }

  return {
    activeLayer,
    setActiveLayer
  }
}
