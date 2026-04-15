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
    :class="['relative p-4 h-50 w-70']">
    <img
      :src="level.thumbnailUrl"
      :alt="`${level.title || 'Untitled level'} thumbnail`"
      :class="[profileTokens.text.accent, 'mb-4 px-4 py-8 text-center w-90 h-35 border']"
      />
    <h3 :class="[profileTokens.text.primary,'text-center']">{{ level.title || 'Untitled level' }}</h3>
    <p
      class="hidden"
    >{{ level.description || 'No description provided.' }}</p>
  </article>
</template>

