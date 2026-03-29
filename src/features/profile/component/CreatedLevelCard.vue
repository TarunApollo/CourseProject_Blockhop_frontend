<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

defineProps({
  level: {
    type: Object,
    required: true,
  },
})

const profileTokens = gameVisualTokens
</script>

<template>
  <article :class="[profileTokens.backgrounds.secondaryPanel, 'p-4']">
    <div
        :class="[profileTokens.backgrounds.previewPanel, profileTokens.text.accent, 'mb-4 px-4 py-8 text-center']"
    >
      LEVEL PREVIEW
    </div>

    <div class="flex items-start justify-between gap-3">
      <h3 :class="[profileTokens.text.primary, 'min-w-0 truncate text-2xl']">
        {{ level.title || 'Untitled Level' }}
      </h3>

      <span
          :class="[
          level.published
            ? profileTokens.backgrounds.publishedBadge
            : profileTokens.backgrounds.draftBadge,
          'shrink-0 border-2 px-3 py-1 text-sm',
        ]"
      >
        {{ level.published ? 'Published' : 'Draft' }}
      </span>
    </div>

    <p :class="[profileTokens.text.secondary, 'mt-3 text-base']">
      Times played: 0 - Completes: 0
    </p>

    <p :class="[profileTokens.text.secondary, 'mt-2 min-h-12 text-base']">
      {{ level.description || 'No description yet for this level.' }}
    </p>

    <div :class="[profileTokens.backgrounds.progressBar, 'mt-4 h-3 w-full']"></div>

    <p :class="[profileTokens.text.accent, 'mt-3 text-sm']">
      {{ level.published ? 'Visible to players' : 'Hidden from players' }}
    </p>
  </article>
</template>