import { ref } from 'vue'

import type { LevelResponse } from '@/features/level-creation/lib/types'

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL

export function useCloneLevelForm(onCloned: (clonedLevel: LevelResponse) => void) {
  const sourceLevelId = ref<string>('')

  //check repeating submit
  const isSubmitting = ref<boolean>(false)
  const submitError = ref<string>('')

  //TODO:refactor handle clone and handle subumit to lib
  //TODO:the router name should be level/levelID/clone?
  //TODO:There is a known bug/issue in backend:
  //if mongoDB has dirty data it will return 500
  async function handleClone(): Promise<void> {
    submitError.value = ''
    const trimmedSourceLevelId = sourceLevelId.value.trim()

    if (!trimmedSourceLevelId) {
      submitError.value = 'A source level id is required.'
      return
    }

    isSubmitting.value = true

    try {
      const response = await fetch(`${API_BASE_URL}/levels/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sourceLevelId: trimmedSourceLevelId,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You need to log in before cloning a level.')
        }

        if (response.status === 403) {
          throw new Error('You can only clone one of your own existing levels.')
        }

        throw new Error(`Failed to clone level (${response.status}).`)
      }

      const clonedLevel = (await response.json()) as LevelResponse
      onCloned(clonedLevel)
      sourceLevelId.value = ''
    } catch (error: unknown) {
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
