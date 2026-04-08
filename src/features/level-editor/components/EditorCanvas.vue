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
  previewMode,
  showGids,
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
const isPanning = ref(false)
const panStartClientX = ref(0)
const panStartScrollX = ref(0)

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
  window.addEventListener('mousemove', handleGlobalPanMouseMove)
  setTimeout(updateTileSize, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTileSize)
  window.removeEventListener('mousemove', handleGlobalPanMouseMove)
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

function handleCanvasMouseDown(e) {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') {
    document.activeElement.blur()
  }
}

function handleMouseDown(e, x, y) {
  e.preventDefault()
  
  if (previewMode.value) {
    isPanning.value = true
    panStartClientX.value = e.clientX
    panStartScrollX.value = scrollContainerRef.value.scrollLeft
    return
  }
  
  if (selectedTool.value === 'select') {
    startSelection(x, y)
  } else {
    isPainting.value = true
    applyTool(x, y)
  }
}

function handleScrollContainerMouseDown(e) {
  if (previewMode.value) {
    e.preventDefault()
    isPanning.value = true
    panStartClientX.value = e.clientX
    panStartScrollX.value = scrollContainerRef.value.scrollLeft
  }
}

function handleGlobalPanMouseMove(e) {
  if (!isPanning.value) return
  const dx = e.clientX - panStartClientX.value
  scrollContainerRef.value.scrollLeft = panStartScrollX.value - dx
}

function handleMouseMove(x, y) {
  cursorX.value = x
  cursorY.value = y
  
  if (isPainting.value) {
    applyTool(x, y)
  }
}

function handleMouseUp() {
  isPainting.value = false
  isPanning.value = false
  
  if (selection.isSelecting) {
    endSelection()
  }
}

function handleMouseLeave() {
  isPainting.value = false
  isPanning.value = false
  cursorX.value = -1
  cursorY.value = -1
  
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

const gridCursorClass = computed(() => {
  if (previewMode.value) return 'cursor-pan'
  if (selectedTool.value === 'paintbrush') return 'cursor-paintbrush'
  if (selectedTool.value === 'eraser' && isPainting.value) return 'cursor-eraser-active'
  if (selectedTool.value === 'eraser') return 'cursor-eraser'
  if (selectedTool.value === 'select') {
    if (selection.isSelecting) return 'cursor-select-active'
    return 'cursor-select'
  }
  if (selectedTool.value === 'none') return 'cursor-pan'
  return ''
})
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-container flex-1 relative"
    tabindex="0"
    @contextmenu.prevent
    @mousedown="handleCanvasMouseDown"
  >
    <div
      ref="scrollContainerRef"
      class="canvas-scroll h-full overflow-x-auto overflow-y-hidden"
      :class="previewMode ? 'cursor-grab active:cursor-grabbing' : ''"
      @scroll="handleScroll"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @mousedown="handleScrollContainerMouseDown"
    >
      <div
        class="grid relative select-none"
        :style="gridStyle"
        :class="gridCursorClass"
      >
      <div
        v-for="index in totalTiles"
        :key="index"
        class="tile-cell relative"
        :style="{ width: `${tileSize}px`, height: `${tileSize}px` }"
        :class="[
          previewMode ? '' : 'outline outline-1 outline-white/50'
        ]"
        @mousedown="handleMouseDown($event, getPosition(index - 1).x, getPosition(index - 1).y)"
        @mousemove="handleMouseMove(getPosition(index - 1).x, getPosition(index - 1).y)"
      >
        <div
          v-if="worldLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`)"
          class="absolute inset-0"
          :style="[
            getTileStyle(worldLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`).gid),
            { opacity: previewMode ? 1 : (activeLayer === 'object' ? 0.25 : 1) }
          ]"
        >
          <div
            v-if="showGids"
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white font-mono text-[8px] font-bold px-1 rounded pointer-events-none whitespace-nowrap"
          >
            {{ worldLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`).gid }}
          </div>
        </div>
        <div
          v-if="objectLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`)"
          class="absolute inset-0"
          :style="[
            getTileStyle(objectLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`).gid),
            { opacity: previewMode ? 1 : (activeLayer === 'ground' ? 0.25 : 1) }
          ]"
        >
          <div
            v-if="showGids"
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white font-mono text-[8px] font-bold px-1 rounded pointer-events-none whitespace-nowrap"
          >
            {{ objectLayer.get(`${getPosition(index - 1).x},${getPosition(index - 1).y}`).gid }}
          </div>
        </div>
        
        <template v-if="!previewMode && selectedTool === 'paintbrush' && selectedTile">
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

/* TODO for kvn1351: change AI slopped SVG to homemade icons made in Illustrator */
.cursor-paintbrush,
.cursor-paintbrush * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cline x1='12' y1='3' x2='12' y2='8.5' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='12' y1='15.5' x2='12' y2='21' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='3' y1='12' x2='8.5' y2='12' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='15.5' y1='12' x2='21' y2='12' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='12' y1='3' x2='12' y2='8.5' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='12' y1='15.5' x2='12' y2='21' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='3' y1='12' x2='8.5' y2='12' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='15.5' y1='12' x2='21' y2='12' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") 12 12, crosshair !important;
}

.cursor-eraser,
.cursor-eraser * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect x='3' y='6' width='18' height='11' rx='2' fill='white' stroke='%23222' stroke-width='1.2'/%3E%3Crect x='3' y='15' width='18' height='4' rx='1' fill='%23e0e0e0' stroke='%23222' stroke-width='1.2'/%3E%3Cline x1='7' y1='15' x2='7' y2='19' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='11' y1='15' x2='11' y2='19' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='15' y1='15' x2='15' y2='19' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3C/svg%3E") 4 4, auto !important;
}

.cursor-eraser-active,
.cursor-eraser-active * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect x='3' y='8' width='18' height='9' rx='2' fill='white' stroke='%23222' stroke-width='1.2'/%3E%3Crect x='3' y='14.5' width='18' height='3.5' rx='1' fill='%23e0e0e0' stroke='%23222' stroke-width='1.2'/%3E%3Cline x1='7' y1='14.5' x2='7' y2='18' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='11' y1='14.5' x2='11' y2='18' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='15' y1='14.5' x2='15' y2='18' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3C/svg%3E") 4 4, auto !important;
}

.cursor-select,
.cursor-select * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 8V5a1 1 0 0 1 1-1h3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M16 4h3a1 1 0 0 1 1 1v3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M20 16v3a1 1 0 0 1-1 1h-3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M8 20H5a1 1 0 0 1-1-1v-3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M4 8V5a1 1 0 0 1 1-1h3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M16 4h3a1 1 0 0 1 1 1v3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M20 16v3a1 1 0 0 1-1 1h-3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M8 20H5a1 1 0 0 1-1-1v-3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") 4 4, auto !important;
}

.cursor-select-active,
.cursor-select-active * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M5 9V6a1 1 0 0 1 1-1h2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M15 5h2a1 1 0 0 1 1 1v2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M18 16v2a1 1 0 0 1-1 1h-2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M9 19H6a1 1 0 0 1-1-1v-2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M5 9V6a1 1 0 0 1 1-1h2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M15 5h2a1 1 0 0 1 1 1v2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M18 16v2a1 1 0 0 1-1 1h-2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M9 19H6a1 1 0 0 1-1-1v-2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") 4 4, auto !important;
}

.cursor-native-grab,
.cursor-native-grab * {
  cursor: grab !important;
}

.cursor-native-grabbing,
.cursor-native-grabbing * {
  cursor: grabbing !important;
}

.cursor-pan,
.cursor-pan * {
  cursor: grab !important;
}

.cursor-pan:active,
.cursor-pan *:active {
  cursor: grabbing !important;
}
</style>
