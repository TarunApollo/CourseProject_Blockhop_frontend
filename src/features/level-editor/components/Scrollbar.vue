<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  totalWidth: { type: Number, required: true },
  viewportWidth: { type: Number, required: true },
  scrollPosition: { type: Number, default: 0 }
})

const emit = defineEmits(['scroll-to'])

const trackRef = ref(null)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartScroll = ref(0)

const indicatorWidth = computed(() => {
  if (!trackRef.value || props.totalWidth === 0) return 20
  const trackWidth = trackRef.value.clientWidth
  const ratio = props.viewportWidth / props.totalWidth
  return Math.max(20, Math.min(trackWidth * ratio, trackWidth))
})

const indicatorLeft = computed(() => {
  if (!trackRef.value || props.totalWidth === 0) return 0
  const trackWidth = trackRef.value.clientWidth
  const ratio = props.scrollPosition / props.totalWidth
  return ratio * trackWidth
})

function handleClick(e) {
  if (isDragging.value) return
  const rect = trackRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const targetScroll = (clickX - indicatorWidth.value / 2) / (trackRef.value.clientWidth / props.totalWidth)
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
  const scale = props.totalWidth / trackRef.value.clientWidth
  const deltaScroll = deltaX * scale
  const targetScroll = dragStartScroll.value + deltaScroll
  const clampedScroll = Math.max(0, Math.min(targetScroll, props.totalWidth - props.viewportWidth))
  emit('scroll-to', clampedScroll)
}

function handleDragEnd() {
  isDragging.value = false
  window.removeEventListener('mousemove', handleDragMove)
  window.removeEventListener('mouseup', handleDragEnd)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', handleDragMove)
  window.removeEventListener('mouseup', handleDragEnd)
})
</script>

<template>
  <div class="scrollbar-bar w-full h-12 bg-editor-bg-light border-t-2 border-editor-border flex items-center px-3 shrink-0">
    <div
      ref="trackRef"
      class="track flex-1 h-8 relative cursor-pointer bg-editor-canvas overflow-hidden"
      @click="handleClick"
    >
      <div
        class="indicator absolute top-0 bottom-0 bg-editor-border rounded cursor-grab"
        :style="{
          width: `${indicatorWidth}px`,
          left: `${indicatorLeft}px`
        }"
        @mousedown="handleDragStart"
        @click.stop
      />
    </div>
  </div>
</template>
