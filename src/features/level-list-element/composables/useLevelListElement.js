import { computed, toRef } from 'vue'
import { normalizeText } from '@/features/level-list-element/lib/levelListElement'

/**
 * Composable for managing the state and logic of a level list element component.
 * @param {Object} props - The props object containing the level data.
 * @returns {Object} An object containing computed properties for name, description, times played, and times completed.
 * @requires normalizeText
 */
export function useLevelListElement(props) {
  const level = toRef(props, 'level')

  const name = computed(() => normalizeText(level.value?.name, 'Unnamed level'))
  const description = computed(() => normalizeText(level.value?.description, 'No description available.'))
  const timesPlayed = computed(() => Number(level.value?.timesPlayed ?? 0))
  const timesCompleted = computed(() => Number(level.value?.timesCompleted ?? 0))

  return {
    name,
    description,
    timesPlayed,
    timesCompleted,
  }
}