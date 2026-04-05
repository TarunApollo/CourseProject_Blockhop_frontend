<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorState } from '../composables/useEditorState'
import { GRID_WIDTH, GRID_HEIGHT } from '../lib/editorConstants'

const {
  worldLayer,
  objectLayer,
  activeLayer,
  selectedTile,
  selectedTool,
  paintTile,
  eraseTile
} = useEditorState()

const containerRef = ref(null)
const tileSize = ref(32)
const isPainting = ref(false)

const ORIGINAL_TILE_SIZE = 128
const TILESET_WIDTH = 1280
const TILESET_HEIGHT = 2560

function updateTileSize() {
  if (!containerRef.value) return

  const container = containerRef.value
  const availableHeight = container.clientHeight - 16

  const tileByHeight = Math.floor(availableHeight / GRID_HEIGHT)
  tileSize.value = Math.max(16, Math.min(tileByHeight, 64))
}

onMounted(() => {
  updateTileSize()
  window.addEventListener('resize', updateTileSize)
  setTimeout(updateTileSize, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTileSize)
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${GRID_WIDTH}, ${tileSize.value}px)`,
  gridTemplateRows: `repeat(${GRID_HEIGHT}, ${tileSize.value}px)`,
  width: `${GRID_WIDTH * tileSize.value}px`,
  height: `${GRID_HEIGHT * tileSize.value}px`
}))

const backgroundSize = computed(() => {
  const scale = tileSize.value / ORIGINAL_TILE_SIZE
  return `${TILESET_WIDTH * scale}px ${TILESET_HEIGHT * scale}px`
})

function getTileStyle(gid) {
  if (!gid) return {}
  const id = gid - 1
  const col = id % 10
  const row = Math.floor(id / 10)
  const scale = tileSize.value / ORIGINAL_TILE_SIZE
  return {
    backgroundImage: 'url(/assets/tiles.png)',
    backgroundSize: backgroundSize.value,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `-${col * ORIGINAL_TILE_SIZE * scale}px -${row * ORIGINAL_TILE_SIZE * scale}px`
  }
}

function handleMouseDown(e, x, y) {
  e.preventDefault()
  isPainting.value = true
  applyTool(x, y)
}

function handleMouseMove(x, y) {
  if (isPainting.value) {
    applyTool(x, y)
  }
}

function handleMouseUp() {
  isPainting.value = false
}

function handleMouseLeave() {
  isPainting.value = false
}

function applyTool(x, y) {
  if (selectedTool.value === 'paintbrush' && selectedTile.value) {
    paintTile(x, y, selectedTile.value)
  } else if (selectedTool.value === 'eraser') {
    eraseTile(x, y)
  }
}

const totalTiles = GRID_WIDTH * GRID_HEIGHT

function getPosition(index) {
  const x = index % GRID_WIDTH
  const y = Math.floor(index / GRID_WIDTH)
  return { x, y }
}
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-container flex-1 relative overflow-auto"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="grid relative select-none"
      :style="gridStyle"
    >
      <div
        v-for="index in totalTiles"
        :key="index"
        class="tile-cell relative"
        :style="{ width: `${tileSize}px`, height: `${tileSize}px` }"
        :class="[
          activeLayer === 'ground' ? 'outline outline-1 outline-white/50' : 'outline outline-1 outline-white/50'
        ]"
        @mousedown="handleMouseDown($event, getPosition(index - 1).x, getPosition(index - 1).y)"
        @mousemove="handleMouseMove(getPosition(index - 1).x, getPosition(index - 1).y)"
      >
        <div
          v-if="worldLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`)"
          class="absolute inset-0"
          :style="[
            getTileStyle(worldLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`).gid),
            { opacity: activeLayer === 'object' ? 0.25 : 1 }
          ]"
        />
        <div
          v-if="objectLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`)"
          class="absolute inset-0"
          :style="[
            getTileStyle(objectLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`).gid),
            { opacity: activeLayer === 'ground' ? 0.25 : 1 }
          ]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  background: transparent;
}
</style>
