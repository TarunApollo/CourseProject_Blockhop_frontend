import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    // null = not logged in
    // { id: "...", name: "..." } = logged in
    const isAuthenticated = computed(() => user.value !== null)
    function loginWithSwitch() {
        window.location.href = 'http://localhost:8080/oauth2/authorization/switch-edu-id'
    }
    function logout() {
        user.value = null
    }
    async function hydrateFromSession() {
        try {
            const res = await fetch('http://localhost:8080/users/me', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                user.value = { id: data.id, name: data.name }
            }
        } catch (e) {
            user.value = null
        }
    }
    return { user, isAuthenticated, loginWithSwitch, hydrateFromSession, logout }
}
)