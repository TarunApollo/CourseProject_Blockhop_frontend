<script setup>
import BackButton from '@/components/BackButton.vue'
import EditorToolbar from '@/features/level-editor/components/EditorToolbar.vue'
</script>

<template>
  <div class="level-editor h-screen flex flex-col bg-sky-200">
    <header class="flex items-center p-4 gap-4 bg-editor-bg border-b-2 border-editor-border">
      <BackButton />
      <h1 class="text-2xl font-bold text-editor-text">Level Editor</h1>
    </header>

    <EditorToolbar />
  </div>
</template>
