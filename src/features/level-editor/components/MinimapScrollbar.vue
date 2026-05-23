<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorState } from '../composables/useEditorState'
import { GRID_WIDTH, GRID_HEIGHT } from '../lib/editorConstants'

const props = defineProps({
  totalWidth: { type: Number, required: true },
  viewportWidth: { type: Number, required: true },
  scrollPosition: { type: Number, default: 0 }
})

const emit = defineEmits(['scroll-to'])

const { worldLayer, objectLayer } = useEditorState()

const minimapRef = ref(null)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartScroll = ref(0)

const minimapWidth = ref(0)

const totalTiles = GRID_WIDTH * GRID_HEIGHT

onMounted(() => {
  updateMinimapWidth()
  window.addEventListener('resize', updateMinimapWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMinimapWidth)
})

function updateMinimapWidth() {
  if (minimapRef.value) {
    minimapWidth.value = minimapRef.value.clientWidth
  }
}

const minimapScale = computed(() => {
  if (minimapWidth.value === 0 || props.totalWidth === 0) return 1
  return minimapWidth.value / props.totalWidth
})

const viewportIndicatorWidth = computed(() => {
  const width = props.viewportWidth * minimapScale.value
  return Math.max(20, Math.min(width, minimapWidth.value))
})

const viewportIndicatorLeft = computed(() => {
  return props.scrollPosition * minimapScale.value
})

const dimRightLeft = computed(() => {
  return viewportIndicatorLeft.value + viewportIndicatorWidth.value
})

function getPos(index) {
  return {
    x: index % GRID_WIDTH,
    y: Math.floor(index / GRID_WIDTH)
  }
}

function getTileClass(index) {
  const { x, y } = getPos(index)
  const worldTile = worldLayer.get(`${x},${y}`)
  const objectTile = objectLayer.get(`${x},${y}`)

  if (objectTile) return 'tile-object'
  if (worldTile) return 'tile-ground'
  return ''
}

function handleMinimapClick(e) {
  if (isDragging.value) return

  const rect = minimapRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const targetScroll = (clickX - viewportIndicatorWidth.value / 2) / minimapScale.value
  const clampedScroll = Math.max(0, Math.min(targetScroll, props.totalWidth - props.viewportWidth))
  emit('scroll-to', clampedScroll)
}

function handleDragStart(e) {
  e.preventDefault()
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartScroll.value = props.scrollPosition

  window.addEventListener('mousemove', handleDragMove)
  window.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(e) {
  if (!isDragging.value) return

  const deltaX = e.clientX - dragStartX.value
  const deltaScroll = deltaX / minimapScale.value
  const targetScroll = dragStartScroll.value + deltaScroll
  const clampedScroll = Math.max(0, Math.min(targetScroll, props.totalWidth - props.viewportWidth))
  emit('scroll-to', clampedScroll)
}

function handleDragEnd() {
  isDragging.value = false
  window.removeEventListener('mousemove', handleDragMove)
  window.removeEventListener('mouseup', handleDragEnd)
}
</script>

<template>
  <div class="w-full h-12 flex items-center px-3 py-1.5 shrink-0 bg-editor-bg-light border-t border-editor-border">
    <div
      ref="minimapRef"
      class="minimap-track flex-1 h-7 rounded-sm relative cursor-pointer"
      @click="handleMinimapClick"
    >
      <div class="minimap-content absolute inset-0 overflow-hidden rounded-sm">
        <div
          class="grid"
          :style="{
            gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`,
            width: '100%',
            height: '100%'
          }"
        >
          <div
            v-for="index in totalTiles"
            :key="index"
            :class="getTileClass(index - 1)"
            class="minimap-tile"
          />
        </div>

        <div
          v-if="viewportIndicatorLeft > 0"
          class="absolute top-0 bottom-0 left-0 dim-overlay pointer-events-none"
          :style="{ width: `${viewportIndicatorLeft}px` }"
        />
        <div
          v-if="dimRightLeft < minimapWidth"
          class="absolute top-0 bottom-0 right-0 dim-overlay pointer-events-none"
          :style="{ left: `${dimRightLeft}px` }"
        />
      </div>

      <div
        class="viewport-indicator absolute rounded cursor-grab active:cursor-grabbing"
        :style="{
          width: `${viewportIndicatorWidth}px`,
          left: `${viewportIndicatorLeft}px`,
          top: '-3px',
          bottom: '-3px'
        }"
        @mousedown="handleDragStart"
        @click.stop
      >
        <div class="viewport-glass" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.minimap-track {
  background: rgba(90, 126, 75, 0.35);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.minimap-tile {
  min-width: 0;
  min-height: 0;
}

.tile-ground {
  background: #8fd67b;
}

.tile-object {
  background: #ffd966;
  box-shadow: inset 0 0 0 0.5px rgba(255, 200, 0, 0.5);
}

.dim-overlay {
  background: rgba(0, 0, 0, 0.25);
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.viewport-indicator {
  position: absolute;
  background: rgba(143, 214, 123, 0.10);
  backdrop-filter: brightness(0.85) contrast(1.3) saturate(0.8);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.15),
    0 0 10px rgba(143, 214, 123, 0.2),
    0 1px 4px rgba(0, 0, 0, 0.2);
}

.viewport-glass {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.04) 40%,
    transparent 100%
  );
  pointer-events: none;
}
</style>