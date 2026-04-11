<script setup>
import BackButton from '@/components/BackButton.vue'
import EditorToolbar from '@/features/level-editor/components/EditorToolbar.vue'
import EditorCanvas from '@/features/level-editor/components/EditorCanvas.vue'
import Scrollbar from '@/features/level-editor/components/Scrollbar.vue'
import TileSidebar from '@/features/level-editor/components/TileSidebar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorState } from '@/features/level-editor/composables/useEditorState'

const { setSelectedTool, toggleLayer, clearTool, selection, undo, redo } = useEditorState()

const canvasRef = ref(null)
const scrollX = ref(0)
const viewportWidth = ref(0)
const totalWidth = ref(0)

function handleScroll(data) {
  scrollX.value = data.scrollX
  viewportWidth.value = data.viewportWidth
  totalWidth.value = data.totalWidth
}

function scrollToPosition(position) {
  if (canvasRef.value) {
    canvasRef.value.scrollToPosition(position)
  }
}

function handleKeyDown(e) {
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (e.key === 'Escape') {
    clearTool()
    e.preventDefault()
  } else if (e.key === 'Tab') {
    toggleLayer()
    e.preventDefault()
  } else if (e.key === '1') {
    setSelectedTool('select')
  } else if (e.key === '2') {
    setSelectedTool('paintbrush')
  } else if (e.key === '3') {
    setSelectedTool('eraser')
  } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
    setSelectedTool('select')
  } else if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
    setSelectedTool('paintbrush')
  } else if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
    setSelectedTool('eraser')
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    undo()
    e.preventDefault()
  } else if ((e.ctrlKey && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
    redo()
    e.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  setTimeout(() => {
    if (canvasRef.value) {
      totalWidth.value = canvasRef.value.totalWidth
      viewportWidth.value = canvasRef.value.viewportWidth
      scrollX.value = canvasRef.value.scrollX
    }
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="level-editor h-screen w-screen flex flex-col overflow-hidden relative">
    <div class="phaser-background fixed inset-0 pointer-events-none flex flex-col" aria-hidden="true">
      <div
        class="flex-1 bg-repeat-x bg-top"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_solid_sky.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-center"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_clouds.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-center"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_fade_trees.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-bottom"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_solid_sky.png)',
          backgroundSize: 'auto 100%',
        }"
      />
    </div>

    <header class="flex items-center px-4 py-2 bg-editor-bg border-b-2 border-editor-border shrink-0 relative z-20">
      <BackButton />
      <h1 class="ml-4 text-xl font-bold text-editor-text" style="padding-left: 15px;">Level Editor</h1>
    </header>

    <EditorToolbar />

    <main class="flex-1 flex overflow-hidden min-h-0 relative z-20">
      <div class="flex-1 flex flex-col min-w-0">
        <EditorCanvas
          ref="canvasRef"
          class="flex-1 min-w-0"
          @scroll="handleScroll"
        />
        <Scrollbar
          v-if="totalWidth > 0"
          :total-width="totalWidth"
          :viewport-width="viewportWidth"
          :scroll-position="scrollX"
          @scroll-to="scrollToPosition"
        />
      </div>
      <TileSidebar class="shrink-0" />
    </main>
  </div>
</template>
