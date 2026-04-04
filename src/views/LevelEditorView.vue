<script setup>
import BackButton from '@/components/BackButton.vue'
import EditorToolbar from '@/features/level-editor/components/EditorToolbar.vue'
import TileSidebar from '@/features/level-editor/components/TileSidebar.vue'
</script>

<template>
  <div class="level-editor h-screen flex flex-col bg-sky-200">
    <header class="flex items-center p-4 gap-4 bg-editor-bg border-b-2 border-editor-border">
      <BackButton />
      <h1 class="text-2xl font-bold text-editor-text">Level Editor</h1>
    </header>

    <EditorToolbar />

    <main class="flex-1 flex overflow-hidden">
      <div class="flex-1 bg-sky-300"></div>
      <TileSidebar />
    </main>
  </div>
</template>
