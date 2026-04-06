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
  eraseTile,
  selection,
  startSelection,
  updateSelection,
  endSelection
} = useEditorState()

const containerRef = ref(null)
const scrollContainerRef = ref(null)
const tileSize = ref(32)
const isPainting = ref(false)

const cursorX = ref(-1)
const cursorY = ref(-1)

const ORIGINAL_TILE_SIZE = 128
const TILESET_WIDTH = 1280
const TILESET_HEIGHT = 2560

const emit = defineEmits(['scroll'])

function updateTileSize() {
  if (!containerRef.value) return

  const container = containerRef.value
  const availableHeight = container.clientHeight - 16

  const tileByHeight = Math.floor(availableHeight / GRID_HEIGHT)
  tileSize.value = Math.max(16, Math.min(tileByHeight, 64))

  if (scrollContainerRef.value) {
    emit('scroll', {
      scrollX: scrollContainerRef.value.scrollLeft,
      viewportWidth: scrollContainerRef.value.clientWidth,
      totalWidth: GRID_WIDTH * tileSize.value
    })
  }
}

function handleScroll() {
  if (scrollContainerRef.value) {
    emit('scroll', {
      scrollX: scrollContainerRef.value.scrollLeft,
      viewportWidth: scrollContainerRef.value.clientWidth,
      totalWidth: GRID_WIDTH * tileSize.value
    })
  }
}

function scrollToPosition(position) {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollLeft = position
  }
}

defineExpose({
  scrollToPosition,
  totalWidth: computed(() => GRID_WIDTH * tileSize.value),
  viewportWidth: computed(() => scrollContainerRef.value?.clientWidth ?? 0),
  scrollX: computed(() => scrollContainerRef.value?.scrollLeft ?? 0)
})

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
  
  if (selectedTool.value === 'select') {
    startSelection(x, y)
  } else {
    isPainting.value = true
    applyTool(x, y)
  }
}

function handleMouseMove(x, y) {
  cursorX.value = x
  cursorY.value = y
  
  if (selectedTool.value === 'select') {
    if (selection.isSelecting) {
      updateSelection(x, y)
    }
  } else if (isPainting.value) {
    applyTool(x, y)
  }
}

function handleMouseLeave() {
  isPainting.value = false
  cursorX.value = -1
  cursorY.value = -1
  
  if (selection.isSelecting) {
    endSelection()
  }
}

function handleMouseUp() {
  isPainting.value = false
  
  if (selection.isSelecting) {
    endSelection()
  }
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

const selectionRectStyle = computed(() => {
  if (!selection.isSelecting || !selection.selectionStart || !selection.selectionEnd) return {}
  
  const startX = Math.min(selection.selectionStart.x, selection.selectionEnd.x)
  const startY = Math.min(selection.selectionStart.y, selection.selectionEnd.y)
  const endX = Math.max(selection.selectionStart.x, selection.selectionEnd.x)
  const endY = Math.max(selection.selectionStart.y, selection.selectionEnd.y)
  
  return {
    left: `${startX * tileSize.value}px`,
    top: `${startY * tileSize.value}px`,
    width: `${(endX - startX + 1) * tileSize.value}px`,
    height: `${(endY - startY + 1) * tileSize.value}px`
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-container flex-1 relative"
  >
    <div
      ref="scrollContainerRef"
      class="canvas-scroll h-full overflow-x-auto overflow-y-hidden"
      @scroll="handleScroll"
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
        
        <template v-if="selectedTool === 'paintbrush' && selectedTile">
          <div
            v-if="selectedTile.composite && selectedTile.tiles"
            v-for="offset in selectedTile.tiles"
            :key="offset.gid"
            v-show="getPosition(index - 1).x === cursorX + offset.dx && getPosition(index - 1).y === cursorY + offset.dy"
            class="absolute inset-0 pointer-events-none z-20"
            :style="[getTileStyle(offset.gid), { opacity: 0.6 }]"
          />
          <div
            v-else-if="!selectedTile.composite && getPosition(index - 1).x === cursorX && getPosition(index - 1).y === cursorY"
            class="absolute inset-0 pointer-events-none z-20"
            :style="[getTileStyle(selectedTile.gid), { opacity: 0.6 }]"
          />
        </template>
        </div>
      
      <div
        v-if="selection.isSelecting"
        class="selection-rect absolute pointer-events-none z-30"
        :style="selectionRectStyle"
      />
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  background: transparent;
}

.canvas-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.canvas-scroll::-webkit-scrollbar {
  display: none;
}

.selection-rect {
  background: rgba(90, 126, 75, 0.2);
  border: 2px dashed rgba(90, 126, 75, 0.8);
}
</style>
