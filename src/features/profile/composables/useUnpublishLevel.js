import { ref } from 'vue'
import { getCachedCsrfToken } from '@/shared/lib/csrf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const UNPUBLISH_ATTEMPT = { method: 'PUT', pathBuilder: (levelId) => `/levels/${levelId}/unpublish` }

async function requestUnpublish(levelId) {
  const { headerName, token } = await getCachedCsrfToken()
  let lastStatus = null

  const response = await fetch(`${API_BASE_URL}${UNPUBLISH_ATTEMPT.pathBuilder(levelId)}`, {
    method: UNPUBLISH_ATTEMPT.method,
    headers: {
        'Content-Type': 'application/json',
        [headerName]: token,
    },
    credentials: 'include',
    body: JSON.stringify({}),
  })

  if (response.ok) {
    return
  }

  lastStatus = response.status

  const messages = {
    401: 'You need to log in before unpublishing a level.',
    403: 'You can only unpublish one of your own levels.',
    404: 'Unable to find the unpublish endpoint. Please confirm the backend route.',
    405: 'Unpublish endpoint found but HTTP method is not accepted.'
  }

  throw new Error(messages[lastStatus] || `Failed to unpublish level (${lastStatus || 'unknown'}).`)
}

export function useUnpublishLevel(onUnpublished) {
  const levelId = ref('')
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleUnpublish() {
    if (isSubmitting.value) {
      return
    }

    submitError.value = ''
    const trimmedLevelId = levelId.value.trim()

    if (!trimmedLevelId) {
      submitError.value = 'A level id is required.'
      return
    }

    isSubmitting.value = true

    try {
      await requestUnpublish(trimmedLevelId)

      onUnpublished()
      levelId.value = ''
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Failed to unpublish level. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    levelId,
    isSubmitting,
    submitError,
    handleUnpublish,
  }
}