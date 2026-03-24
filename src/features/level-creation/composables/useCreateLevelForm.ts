import { ref } from 'vue'
import type { LevelResponse } from '@/features/level-creation/lib/types'

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL

export function useCreateLevelForm(onCreated: (createdLevel: LevelResponse) => void) {
  const title = ref<string>('')
  const description = ref<string>('')
  const isSubmitting = ref<boolean>(false)
  const submitError = ref<string>('')

  async function handleSubmit(): Promise<void> {
    submitError.value = ''
    const trimmedTitle = title.value.trim()
    const trimmedDescription = description.value.trim()

    //validate
    if (!trimmedTitle || !trimmedDescription) {
      submitError.value = 'Title and description are required.'
      return
    }

    isSubmitting.value = true

    try {
      const response = await fetch(`${API_BASE_URL}/levels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You need to log in before creating a level.')
        }

        throw new Error(`Failed to create level (${response.status}).`)
      }

      const createdLevel = (await response.json()) as LevelResponse
      onCreated(createdLevel)

      title.value = ''
      description.value = ''
    } catch (error: unknown) {
      submitError.value =
        error instanceof Error ? error.message : 'Failed to create level. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    title,
    description,
    isSubmitting,
    submitError,
    handleSubmit,
  }
}
