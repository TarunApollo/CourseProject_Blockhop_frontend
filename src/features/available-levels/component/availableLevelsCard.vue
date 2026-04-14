<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens';
const profileTokens = gameVisualTokens;
defineProps({
  level: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article
    :class="[profileTokens.backgrounds.secondaryPanel, 'relative p-4 h-90 w-70']">
    <img
      :src="level.thumbnailUrl"
      :alt="`${level.title || 'Untitled level'} thumbnail`"
      :class="[profileTokens.backgrounds.previewPanel, profileTokens.text.accent, 'mb-4 px-4 py-8 text-center']"
      />
    <h3 class="flex items-start justify-between gap-3">{{ level.title || 'Untitled level' }}</h3>
    <p
      :class="[profileTokens.text.secondary, 'mt-2 min-h-12 max-h-45 max-w-60 text-base scroll overflow-scroll']"
    >{{ level.description || 'No description provided.' }}</p>
  </article>
</template>

