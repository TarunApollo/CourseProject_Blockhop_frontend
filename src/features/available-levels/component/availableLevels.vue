<script setup>
import { onMounted, watch } from 'vue'
import { usePublishedLevels } from '@/features/available-levels/composables/usePublishedLevels.js'
import availableLevelsCard from '@/features/available-levels/component/availableLevelsCard.vue'
import availableLevelsPeriodControl from '@/features/available-levels/component/availableLevelsPeriodControl.vue'
import availableLevelsSortControl from '@/features/available-levels/component/availableLevelsSortControl.vue'

const { levels, isLoading, loadError, sortBy, period, loadLevels } = usePublishedLevels()

// TODO: 
// This should not be a container
// the level-list container is in MR #5 when it merge to dev
onMounted(loadLevels)

watch([sortBy, period], () => {
  loadLevels()
})
</script>

<template>
  <section>
    <availableLevelsSortControl v-model="sortBy" />
    <!-- Period only applies when sorting by popularity -->
    <availableLevelsPeriodControl
      v-if="sortBy === 'POPULARITY'"
      v-model="period"
    />

    <p v-if="isLoading">Loading levels...</p>
    <p v-else-if="loadError">{{ loadError }}</p>
    <p v-else-if="levels.length === 0">No levels available.</p>

    <div v-else>
      <availableLevelsCard
        v-for="item in levels"
        :key="item.id"
        :level="item"
      />
    </div>
  </section>
</template>
