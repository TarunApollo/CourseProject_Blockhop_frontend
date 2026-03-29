<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'

defineProps({
  createdLevels: {
    type: Array,
    required: true,
  },
})

const profileTokens = gameVisualTokens
</script>

<template>
  <section :class="[profileTokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <div class="mb-4">
      <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
        Workshop
      </p>
      <h2 :class="[profileTokens.text.primary, 'mt-2 text-3xl']">My Created Levels</h2>
    </div>

    <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <CreatedLevelCard
          v-for="level in createdLevels"
          :key="level.id"
          :level="level"
      />
    </div>

    <div
        v-else
        :class="[profileTokens.backgrounds.emptyPanel, 'min-h-[220px] w-full']"
    ></div>
  </section>
</template>
