import { defineStore } from 'pinia'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: [],
      }),
    actions: {
        async fetchUsers() {
            const res = await fetch(`${API_BASE_URL}/users`)
            this.users = await res.json()
        },
        async postUser(user) {
            await fetch(
                `${API_BASE_URL}/users`, {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(user)
                })
        }
    }
})
