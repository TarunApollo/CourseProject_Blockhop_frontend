import { ref } from 'vue'
import { getCachedCsrfToken } from '@/shared/lib/csrf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function requestRename(levelId, title) {
  const { headerName, token } = await getCachedCsrfToken()

  const response = await fetch(`${API_BASE_URL}/levels/${levelId}/properties`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      [headerName]: token,
    },
    credentials: 'include',
    body: JSON.stringify({ title }),
  })

  if (response.ok) {
    return await response.json()
  }

  const messages = {
    401: 'You need to log in before renaming a level.',
    403: 'You can only rename your own levels.',
    404: 'Unable to find the level. It may have been deleted.',
    405: 'Rename endpoint found but HTTP method is not accepted.',
  }

  throw new Error(messages[response.status] || `Failed to rename level (${response.status || 'unknown'}).`)
}

export function useRenameLevel(onRenamed) {
  const isSubmitting = ref(false)
  const submitError = ref('')

  async function handleRename(id, title) {
    if (isSubmitting.value) {
      return
    }

    submitError.value = ''
    const trimmedId = id.trim()
    const trimmedTitle = title.trim()

    if (!trimmedId) {
      submitError.value = 'A level id is required.'
      return
    }

    if (!trimmedTitle) {
      submitError.value = 'Level name cannot be empty.'
      return
    }

    isSubmitting.value = true

    try {
      const updatedLevel = await requestRename(trimmedId, trimmedTitle)
      onRenamed(updatedLevel)
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Failed to rename level. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    submitError,
    handleRename,
  }
}
