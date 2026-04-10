<script setup>
import { useRouter } from 'vue-router'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'

defineProps({
  createdLevels: {
    type: Array,
    required: true,
  },
})

const profileTokens = gameVisualTokens
const router = useRouter()
</script>

<template>
  <section :class="[profileTokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <div class="mb-4">
      <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
        Workshop
      </p>
      <h2 :class="[profileTokens.text.primary, 'mt-2 text-3xl']">My Created Levels</h2>
    </div>

    <button
      type="button"
      :class="[profileTokens.backgrounds.emptyPanel, 'mb-4 w-full flex items-center justify-center gap-3 px-4 py-5 cursor-pointer transition-colors hover:bg-[#A8E892]']"
      @click="router.push({ name: 'create-level' })"
    >
      <span :class="[profileTokens.text.primary, 'text-2xl font-bold leading-none']">+</span>
      <span :class="[profileTokens.text.primary, 'text-base font-bold uppercase tracking-[0.15em]']">New Level</span>
    </button>

    <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <CreatedLevelCard
          v-for="level in createdLevels"
          :key="level.id"
          :level="level"
      />
    </div>
    <div
      v-else
      :class="[profileTokens.backgrounds.emptyPanel, 'min-h-[220px] w-full flex items-center justify-center px-4']"
    >
      <p :class="[profileTokens.text.secondary, 'text-center text-base']">
        No created levels yet.
      </p>
    </div>
  </section>
</template>
