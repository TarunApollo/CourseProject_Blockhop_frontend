import { ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export function useProfile() {
    const username = ref('')
    const levelsPlayed = ref(0)
    const levelsCompleted = ref(0)
    const createdLevels = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchProfile() {
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                credentials: 'include'
            })
            if (!res.ok) {
                throw new Error('Failed to fetch profile')
            }
            const data = await res.json()

            username.value = data.name
            levelsPlayed.value = data.playedLevelsCount
            levelsCompleted.value = data.completedLevelsCount
            createdLevels.value = data.createdLevels
        } catch (err) {
            error.value = 'Failed to load profile data.'
            console.error(err)
        } finally {
            loading.value = false
        }
    }

    function updateLevelInCache(updatedLevel) {
        const idx = createdLevels.value.findIndex((l) => l.id === updatedLevel.id)

        if (idx !== -1) {
            const existingLevel = createdLevels.value[idx]
            createdLevels.value.splice(idx, 1, {
                ...existingLevel,
                ...updatedLevel,
                playCount: updatedLevel.playCount ?? existingLevel.playCount ?? 0,
                completeCount: updatedLevel.completeCount ?? existingLevel.completeCount ?? 0,
            })
        }
    }

    return {
        username,
        levelsPlayed,
        levelsCompleted,
        createdLevels,
        loading,
        error,
        fetchProfile,
        updateLevelInCache,
    }
}