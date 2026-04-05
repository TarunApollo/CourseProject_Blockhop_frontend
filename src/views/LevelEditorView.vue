<script setup>
import BackButton from '@/components/BackButton.vue'
import EditorToolbar from '@/features/level-editor/components/EditorToolbar.vue'
import EditorCanvas from '@/features/level-editor/components/EditorCanvas.vue'
import TileSidebar from '@/features/level-editor/components/TileSidebar.vue'
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
      <EditorCanvas class="flex-1 min-w-0" />
      <TileSidebar class="shrink-0" />
    </main>
  </div>
</template>
