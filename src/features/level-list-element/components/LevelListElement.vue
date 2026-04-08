<script setup>
// Keep the layout task independent from real fetching and final sorting logic.
</script>
<template>
  <div class="list-elem level-ui-card flex h-80 w-80 flex-col overflow-auto p-[1em] text-[clamp(0.2rem,1.5vw,1rem)]">
    <div class="preview visible flex h-3/6 min-h-[50%] w-4/5 self-center items-center justify-center">
      LEVEL PREVIEW
    </div>
  </div>
</template>

<style scoped>
.preview {
  background-color: var(--color-overlay-violet-soft);
}
</style>