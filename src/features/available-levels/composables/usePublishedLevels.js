import { ref } from 'vue'
import { fetchPublishedLevels } from '@/features/available-levels/lib/fetchPublishedLevels.js'
import {PUBLISHED_LEVEL_SORT_OPTIONS,PUBLISHED_LEVEL_PERIOD_OPTIONS} from '@/features/available-levels/lib/publishedLevelsContract.js'

export function usePublishedLevels() {
  const levels = ref([])
  const isLoading = ref(false)
  const loadError = ref('')
  const sortBy = ref(PUBLISHED_LEVEL_SORT_OPTIONS[0])
  const period = ref(PUBLISHED_LEVEL_PERIOD_OPTIONS[0])

  async function loadLevels() {
    isLoading.value = true
    loadError.value = ''

    try {
      levels.value = await fetchPublishedLevels({
        sortBy: sortBy.value,
        period: period.value,
      })
    } catch (error) {
      loadError.value =
        error instanceof Error ? error.message : 'Failed to load levels.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    levels,
    isLoading,
    loadError,
    sortBy,
    period,
    loadLevels,
  }
}
