<script setup>
import Button from '@/shared/components/Button.vue';
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

    <div id="background blur"
        class="fixed inset-0 bg-black/60 backdrop-blur-md z-100">
    </div>

    <div
    class="mt-30 flex justify-center bottom-0 items-center z-200"
    >
    <article
        :class="[profileTokens.backgrounds.primaryPanel,'flex flex-col gap-5 items-center justify-center w-210 h-190 z-160']">
        <h3 :class="[profileTokens.text.title,'text-center mt-5 mb-5 text-[25pt]']"
        >{{ level.title || 'Untitled level' }}</h3>
        <img
            :src="level.thumbnailUrl"
            :alt="`${level.title || 'Untitled level'} thumbnail`"
            :class="[profileTokens.text.accent, profileTokens.backgrounds.previewPanel, 'py-10 text-center w-200 h-90']"
        />
        <div
            :class="[profileTokens.backgrounds.secondaryPanel, 'w-200 h-30 p-2 overflow-y-scroll']"
        >{{ level.description || 'No description provided.' }}</div>
        <Button to="/play">Play</Button>
    </article>

    </div>
</template>

