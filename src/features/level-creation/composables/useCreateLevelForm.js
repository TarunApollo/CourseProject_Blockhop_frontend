import { ref } from 'vue'
import { submitLevelRequest } from '@/features/level-creation/lib/submitLevelRequest'

export function useCreateLevelForm(onCreated) {
  const title = ref('')
  const description = ref('')
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleSubmit() {
    if (isSubmitting.value) {
      return
    }

    submitError.value = ''
    const trimmedTitle = title.value.trim()
    const trimmedDescription = description.value.trim()

    //validate
    if (!trimmedTitle || !trimmedDescription) {
      submitError.value = 'Title and description are required.'
      return
    }

    if (trimmedTitle.length > 60) {
      submitError.value = 'Title must be 60 characters or fewer.'
      return
    }

    if (trimmedDescription.length > 300) {
      submitError.value = 'Description must be 300 characters or fewer.'
      return
    }

    isSubmitting.value = true

    try {
      const createdLevel = await submitLevelRequest({
        path: '/levels',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
        },
        messages: {
          401: 'You need to log in before creating a level.',
          default: (status) => `Failed to create level (${status}).`,
        },
      })
      onCreated(createdLevel)

      title.value = ''
      description.value = ''
    } catch (error) {
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
