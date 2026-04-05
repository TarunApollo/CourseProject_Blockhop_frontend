<script setup>
import BackButton from '@/components/BackButton.vue'
import EditorToolbar from '@/features/level-editor/components/EditorToolbar.vue'
import EditorCanvas from '@/features/level-editor/components/EditorCanvas.vue'
import TileSidebar from '@/features/level-editor/components/TileSidebar.vue'
</script>

<template>
  <div class="level-editor h-screen w-screen flex flex-col overflow-hidden">
    <header class="flex items-center px-4 py-2 bg-editor-bg border-b-2 border-editor-border shrink-0">
      <BackButton />
      <h1 class="ml-4 text-xl font-bold text-editor-text" style="padding-left: 15px;">Level Editor</h1>
    </header>

    <EditorToolbar />

    <main class="flex-1 flex overflow-hidden min-h-0">
      <EditorCanvas class="flex-1 min-w-0" />
      <TileSidebar class="shrink-0" />
    </main>
  </div>
</template>
