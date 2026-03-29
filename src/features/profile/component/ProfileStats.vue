<script setup>
import { profileVisualTokens } from '@/features/profile/lib/visualizationTokens'

defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
})

const profileTokens = profileVisualTokens
</script>

<template>
  <article :class="[profileTokens.backgrounds.secondaryPanel, 'p-5']">
    <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
      {{ label }}
    </p>

    <p :class="[profileTokens.text.primary, 'mt-3 text-5xl leading-none']">
      {{ value }}
    </p>

    <div :class="[profileTokens.backgrounds.progressBar, 'mt-4 h-3 w-full']"></div>
  </article>
</template>
