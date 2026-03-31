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

    return {
        username,
        levelsPlayed,
        levelsCompleted,
        createdLevels,
        loading,
        error,
        fetchProfile,
    }
}