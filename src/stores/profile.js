import { defineStore } from 'pinia'

export const useProfileStore = defineStore('profile', {
    state: () => ({
        username: '',
        levelsPlayed: 0,
        levelsCompleted: 0,
        createdLevels: [],
        loading: false,
        error: null,
    }),
    actions: {
        async fetchProfile() {
            this.loading = true
            this.error = null
            try {
                const res = await fetch('http://localhost:8080/users/profile')
                if (!res.ok) {
                    throw new Error('Failed to fetch profile')
                }
                const data = await res.json()

                this.username = data.name
                this.levelsPlayed = data.playedLevelsCount
                this.levelsCompleted = data.completedLevelsCount
                this.createdLevels = data.createdLevels
            } catch (err) {
                this.error = 'Failed to load profile data.'
                console.error(err)
            } finally {
                this.loading = false
            }
        }
    }
})
