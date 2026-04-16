import { ref } from 'vue'
import { getCachedCsrfToken } from '@/shared/lib/csrf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const PUBLISH_ATTEMPT = { method: 'PUT', pathBuilder: (levelId) => `/levels/${levelId}/publish` }

async function requestPublish(levelId) {
    const { headerName, token } = await getCachedCsrfToken()
    let lastStatus = null

    const response = await fetch(`${API_BASE_URL}${PUBLISH_ATTEMPT.pathBuilder(levelId)}`, {
        method: PUBLISH_ATTEMPT.method,
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
        401: 'You need to log in before publishing a level.',
        403: 'You can only publish one of your own levels. To publish a level you must complete it at least once.',
        404: 'Level or User was not found.',
        405: 'Publish endpoint found but HTTP method is not accepted.'
    }

    throw new Error(messages[lastStatus] || `Failed to publish level (${lastStatus || 'unknown'}).`)
}

export function usePublishLevel(onPublished) {
    const levelId = ref('')
    const isSubmitting = ref(false)
    const submitError = ref('')

    async function handlePublish() {
        submitError.value = ''
        const trimmedLevelId = levelId.value.trim()

        if (!trimmedLevelId) {
            submitError.value = 'A level id is required.'
            return
        }

        isSubmitting.value = true

        try {
            await requestPublish(trimmedLevelId)

            onPublished()
            levelId.value = ''
        } catch (error) {
            submitError.value =
                error instanceof Error ? error.message : 'Failed to publish level. Please try again.'
        } finally {
            isSubmitting.value = false
        }
    }

    return {
        levelId,
        isSubmitting,
        submitError,
        handlePublish,
    }
}