import { ref } from 'vue'
import { submitLevelRequest } from '@/features/level-creation/lib/submitLevelRequest'

export function useCloneLevelForm(onCloned) {
  const sourceLevelId = ref('')

  //check repeating submit
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleClone() {
    submitError.value = ''
    const trimmedSourceLevelId = sourceLevelId.value.trim()

    if (!trimmedSourceLevelId) {
      submitError.value = 'A source level id is required.'
      return
    }

    isSubmitting.value = true

    try {
      const clonedLevel = await submitLevelRequest({
        path: '/levels/clone',
        body: {
          sourceLevelId: trimmedSourceLevelId,
        },
        messages: {
          401: 'You need to log in before cloning a level.',
          403: 'You can only clone one of your own existing levels.',
          default: (status) => `Failed to clone level (${status}).`,
        },
      })
      onCloned(clonedLevel)
      sourceLevelId.value = ''
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Failed to clone level. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    sourceLevelId,
    isSubmitting,
    submitError,
    handleClone,
  }
}
