<script setup>
// Keep the layout task independent from real fetching and final sorting logic.
</script>
<template>
  <div class="list-elem flex h-80 w-80 cursor-pointer flex-col overflow-auto border-2 border-solid border-(--color-ink-strong) bg-(--color-game-primary) p-[1em] text-[clamp(0.2rem,1.5vw,1rem)] font-bold text-(--color-game-primary-ink) shadow-(--shadow-game-raised) transition-transform duration-75 hover:-translate-y-0.5 hover:bg-(--color-game-primary-hover) [font-family:var(--font-game)]">
    <div class="preview visible flex min-h-[50%] h-3/6 w-4/5 self-center items-center justify-center bg-(--color-overlay-violet-soft)">
      LEVEL PREVIEW
    </div>
  </div>
</template>