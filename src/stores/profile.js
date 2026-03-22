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
                // MOCK DATA
                await new Promise(resolve => setTimeout(resolve, 400))  // simulate network delay

                this.username = 'placeholder'
                this.levelsPlayed = 12
                this.levelsCompleted = 7
                this.createdLevels = []
            } catch (err) {
                this.error = 'Failed to load profile data.'
                console.error(err)
            } finally {
                this.loading = false
            }
        }
    }
})
