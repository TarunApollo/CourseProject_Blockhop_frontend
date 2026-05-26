import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchPublishedLevels, fetchRandomPublishedLevel } from '@/features/available-levels/lib/fetchPublishedLevels.js'
import { PUBLISHED_LEVEL_SORT_OPTIONS, PUBLISHED_LEVEL_PERIOD_OPTIONS } from '@/features/available-levels/lib/publishedLevelsContract.js'

export function usePublishedLevels() {
  const router = useRouter()

  const levels = ref([])
  const isLoading = ref(false)
  const loadError = ref('')
  const sortBy = ref(PUBLISHED_LEVEL_SORT_OPTIONS[0])
  const period = ref(PUBLISHED_LEVEL_PERIOD_OPTIONS[0])
  const minClearRate = ref('')
  const maxClearRate = ref('')
  const minAttempts = ref('')
  const maxAttempts = ref('')
  const minLikes = ref('')
  const maxLikes = ref('')
  const minDislikes = ref('')
  const maxDislikes = ref('')
  const description = ref('')

  const isRandomLoading = ref(false)
  const randomError = ref('')

  function filterArgs() {
    return {
      sortBy: sortBy.value,
      period: period.value,
      minClearRate: minClearRate.value,
      maxClearRate: maxClearRate.value,
      minAttempts: minAttempts.value,
      maxAttempts: maxAttempts.value,
      minLikes: minLikes.value,
      maxLikes: maxLikes.value,
      minDislikes: minDislikes.value,
      maxDislikes: maxDislikes.value,
      description: description.value,
    }
  }

  async function loadLevels() {
    isLoading.value = true
    loadError.value = ''

    try {
      levels.value = await fetchPublishedLevels(filterArgs())
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Failed to load levels.'
    } finally {
      isLoading.value = false
    }
  }

  async function playRandom() {
    isRandomLoading.value = true
    randomError.value = ''

    try {
      const level = await fetchRandomPublishedLevel(filterArgs())
      if (!level) {
        randomError.value = 'No levels match your filters.'
        return
      }
      router.push({ name: 'Play Level', params: { levelId: level.id } })
    } catch (error) {
      randomError.value = error instanceof Error ? error.message : 'Failed to fetch random level.'
    } finally {
      isRandomLoading.value = false
    }
  }

  function clearAdvancedFilters() {
    minClearRate.value = ''
    maxClearRate.value = ''
    minAttempts.value = ''
    maxAttempts.value = ''
    minLikes.value = ''
    maxLikes.value = ''
    minDislikes.value = ''
    maxDislikes.value = ''
  }

  return {
    levels,
    isLoading,
    loadError,
    sortBy,
    period,
    minClearRate,
    maxClearRate,
    minAttempts,
    maxAttempts,
    minLikes,
    maxLikes,
    minDislikes,
    maxDislikes,
    description,
    isRandomLoading,
    randomError,
    loadLevels,
    playRandom,
    clearAdvancedFilters,
  }
}
