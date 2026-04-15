<script setup>
import { onMounted, watch } from 'vue'
import { usePublishedLevels } from '@/features/available-levels/composables/usePublishedLevels.js'
import AvailableLevelsCard from '@/features/available-levels/component/AvailableLevelsCard.vue'
import AvailableLevelsPeriodControl from '@/features/available-levels/component/AvailableLevelsPeriodControl.vue'
import AvailableLevelsSortControl from '@/features/available-levels/component/AvailableLevelsSortControl.vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens' 


const { levels, isLoading, loadError, sortBy, period, loadLevels } = usePublishedLevels()

const profileTokens = gameVisualTokens;

// TODO:
// This should not be a container
// the level-list container is in MR #5 when it merge to dev
onMounted(loadLevels)

watch([sortBy, period], () => {
  loadLevels()
})
</script>

<template>
  <section

  >
    <div
    :class="[profileTokens.backgrounds.emptyPanel, 'mb-4 w-full flex items-center justify-center gap-3 px-4 py-5 cursor-pointer transition-colors hover:bg-[#A8E892]']"
    > <!-- Sorting controls div -->
    <availableLevelsSortControl v-model="sortBy"/>
    <!-- Period only applies when sorting by popularity -->
    <availableLevelsPeriodControl
      v-if="sortBy === 'POPULARITY'"
      v-model="period"
    />
    </div>

    <p v-if="isLoading">Loading levels...</p>
    <p v-else-if="loadError">{{ loadError }}</p>
    <p v-else-if="levels.length === 0">No levels available.</p>

    <div v-else
    
    
    class="flex flex-wrap gap-8"
    > <!-- Grid can be altered to flex (was copied from profile page)-->
      <AvailableLevelsCard
        v-for="item in levels"
        :key="item.id"
        :level="item"
      />
    </div>
  </section>
</template>
