import { ref } from 'vue'
import { getCachedCsrfToken } from '@/shared/lib/csrf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function requestDelete(levelId) {
  const { headerName, token } = await getCachedCsrfToken()

  const response = await fetch(`${API_BASE_URL}/levels/${levelId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      [headerName]: token,
    },
    credentials: 'include',
  })

  if (response.ok) {
    return
  }

  const messages = {
    401: 'You need to log in before deleting a level.',
    403: 'You can only delete your own levels.',
    404: 'Unable to find the level. It may have already been deleted.',
  }

  throw new Error(messages[response.status] || `Failed to delete level (${response.status || 'unknown'}).`)
}

export function useDeleteLevel(onDeleted) {
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleDelete(id) {
    if (isSubmitting.value) {
      return
    }

    submitError.value = ''
    const trimmedId = id.trim()

    if (!trimmedId) {
      submitError.value = 'A level id is required.'
      return
    }

    isSubmitting.value = true

    try {
      await requestDelete(trimmedId)
      onDeleted(trimmedId)
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Failed to delete level. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    submitError,
    handleDelete,
  }
}
