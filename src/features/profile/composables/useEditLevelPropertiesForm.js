import { ref } from 'vue'
import { submitLevelRequest } from '@/features/level-creation/lib/submitLevelRequest'
import { parseClearCondition, buildClearConditionPayload } from '@/features/profile/lib/clearConditionContract'

export function useEditLevelPropertiesForm(level, onSaved) {
  const prefilled = parseClearCondition(level.clearCondition)

  const title = ref(level.title ?? '')
  const description = ref(level.description ?? '')
  const conditionType = ref(prefilled.type)
  const targetAmount = ref(prefilled.amount)
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleSubmit() {
    submitError.value = ''

    const trimmedTitle = title.value.trim()
    const trimmedDescription = description.value.trim()

    if (!trimmedTitle) {
      submitError.value = 'Title is required.'
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

    if (conditionType.value !== 'none' && (!targetAmount.value || targetAmount.value < 1)) {
      submitError.value = 'Target amount must be at least 1.'
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
          clearCondition: buildClearConditionPayload(conditionType.value, targetAmount.value),
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
    conditionType,
    targetAmount,
    isSubmitting,
    submitError,
    handleSubmit,
  }
}
