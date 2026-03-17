import { defineStore } from 'pinia'

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: [],
      }),
    actions: {
        async fetchUsers() {
            const res = await fetch('http://localhost:8080/users')
            this.users = await res.json()
        },
        async postUser(user) {
            await fetch(
                'http://localhost:8080/users', {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(user)
                })
        }
    }
})