import { ref } from 'vue'
import { submitLevelRequest } from '@/features/level-creation/lib/submitLevelRequest'
import { parseClearCondition, buildClearConditionPayload, CLEAR_CONDITION_TYPES } from '@/features/profile/lib/clearConditionContract'

const ALLOWED_CONDITION_TYPES = new Set(CLEAR_CONDITION_TYPES.map((option) => option.value))

export function useEditLevelPropertiesForm(level, onSaved) {
  const prefilled = parseClearCondition(level.clearCondition)

  const title = ref(level.title ?? '')
  const description = ref(level.description ?? '')
  const conditionType = ref(prefilled.type)
  const targetAmount = ref(prefilled.amount)
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

    if (!ALLOWED_CONDITION_TYPES.has(conditionType.value)) {
      submitError.value = 'Clear condition is invalid.'
      return
    }

    const amountNumber = Number(targetAmount.value);

    if (conditionType.value !== 'none') {
      if (!Number.isFinite(amountNumber)) {
        submitError.value = 'Target amount is required.';
        return;
      }

      if (!Number.isInteger(amountNumber) || amountNumber < 1) {
        submitError.value = "Target amount must be a natural number (1 or greater).";
        return;
      }

      if (amountNumber > 1000) {
        submitError.value = "Maximum target amount is 1000.";
        return;
      }
    }

    isSubmitting.value = true

    try {
      const updatedLevel = await submitLevelRequest({
        path: `/levels/${level.id}/properties`,
        method: 'PUT',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          clearCondition: buildClearConditionPayload(conditionType.value, amountNumber),
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
