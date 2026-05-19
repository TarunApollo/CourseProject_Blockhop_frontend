import { ref } from 'vue'
import { submitLevelRequest } from '@/features/level-creation/lib/submitLevelRequest'
import { buildClearConditionPayload, CLEAR_CONDITION_TYPES } from '@/features/profile/lib/clearConditionContract'

const ALLOWED_CONDITION_TYPES = new Set(CLEAR_CONDITION_TYPES.map((option) => option.value))

export function useCreateLevelForm(onCreated) {
  const title = ref('')
  const description = ref('')
  const conditionType = ref('none')
  const targetAmount = ref(0)
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

    const amountNumber = Number(targetAmount.value)

    if (conditionType.value !== 'none') {
      if (!Number.isFinite(amountNumber)) {
        submitError.value = 'Target amount is required.'
        return
      }

      if (!Number.isInteger(amountNumber) || amountNumber < 1) {
        submitError.value = 'Target amount must be a natural number (1 or greater).'
        return
      }

      if (amountNumber > 100) {
        submitError.value = 'Maximum target amount is 100.'
        return
      }
    }

    isSubmitting.value = true

    try {
      const createdLevel = await submitLevelRequest({
        path: '/levels',
        body: {
          title: trimmedTitle,
          description: trimmedDescription,
          clearCondition: buildClearConditionPayload(conditionType.value, amountNumber),
        },
        messages: {
          401: 'You need to log in before creating a level.',
          default: (status) => `Failed to create level (${status}).`,
        },
      })
      onCreated(createdLevel)

      title.value = ''
      description.value = ''
      conditionType.value = 'none'
      targetAmount.value = 0
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
    conditionType,
    targetAmount,
    isSubmitting,
    submitError,
    handleSubmit,
  }
}
