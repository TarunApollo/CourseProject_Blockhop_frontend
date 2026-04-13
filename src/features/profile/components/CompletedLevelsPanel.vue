<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

defineProps({
  levelsCompleted: {
    type: Number,
    required: true,
  },
})

const profileTokens = gameVisualTokens
</script>

<template>
  <section :class="[profileTokens.backgrounds.secondaryPanel, 'w-full p-5']">
    <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
      Levels Completed
    </p>

    <p :class="[profileTokens.text.primary, 'mt-3 text-5xl leading-none']">
      {{ levelsCompleted }}
    </p>

    <div :class="[profileTokens.backgrounds.progressBar, 'mt-4 h-3 w-full']"></div>
  </section>
</template>
