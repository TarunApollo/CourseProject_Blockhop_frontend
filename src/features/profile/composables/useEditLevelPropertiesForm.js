import { ref } from 'vue'
import { submitLevelRequest } from '@/features/level-creation/lib/submitLevelRequest'
import { buildClearConditionPayload } from '@/features/profile/lib/clearConditionContract'

export function useEditLevelPropertiesForm(level, onSaved) {
  const title = ref(level.title ?? '')
  const description = ref(level.description ?? '')
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleSubmit() {
    if (isSubmitting.value) {
      return
    }

    submitError.value = ''

    const trimmedTitle = title.value.trim()
    const trimmedDescription = description.value.trim()

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
      const updatedLevel = await submitLevelRequest({
        path: `/levels/${level.id}/properties`,
        method: 'PUT',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          clearCondition: level.clearCondition ?? buildClearConditionPayload('none', 0),
        },
        messages: {
          401: 'You need to log in to edit a level.',
          403: 'You can only edit your own unpublished levels.',
          404: 'Level not found.',
          default: (status) => `Failed to save changes (${status}).`,
        },
      })
      onSaved(updatedLevel)
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Failed to save changes. Please try again.'
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
