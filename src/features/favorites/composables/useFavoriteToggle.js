import { computed, ref } from 'vue'
import { getCachedCsrfToken } from '@/shared/lib/csrf'
import { useFavoritesStore } from '@/stores/favorites'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function requestAddFavorite(levelId) {
    const { headerName, token } = await getCachedCsrfToken()

    const response = await fetch(`${API_BASE_URL}/levels/${levelId}/favorite`, {
        method: 'PUT',
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

    const messages = {
        401: 'You need to log in before favoriting a level.',
        404: 'Unable to find the level. It may have been removed.',
    }

    throw new Error(messages[response.status] || `Failed to add favorite (${response.status || 'unknown'}).`)
}

async function requestRemoveFavorite(levelId) {
    const { headerName, token } = await getCachedCsrfToken()

    const response = await fetch(`${API_BASE_URL}/levels/${levelId}/favorite`, {
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
        401: 'You need to log in before removing a favorite.',
    }

    throw new Error(messages[response.status] || `Failed to remove favorite (${response.status || 'unknown'}).`)
}

export function useFavoriteToggle(level) {
    const store = useFavoritesStore()
    const isSubmitting = ref(false)
    const submitError = ref('')

    const isFavorite = computed(() => store.isFavorite(level.id))

    async function handleToggle() {
        if (isSubmitting.value) {
            return
        }

        submitError.value = ''
        isSubmitting.value = true

        try {
            if (isFavorite.value) {
                await requestRemoveFavorite(level.id)
                store.unmarkFavorited(level.id)
            } else {
                await requestAddFavorite(level.id)
                store.markFavorited(level)
            }
        } catch (error) {
            submitError.value =
                error instanceof Error ? error.message : 'Failed to update favorite.'
        } finally {
            isSubmitting.value = false
        }
    }

    return { isFavorite, isSubmitting, submitError, handleToggle }
}