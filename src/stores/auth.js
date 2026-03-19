import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    // null = not logged in
    // { id: "...", name: "..." } = logged in
    const isAuthenticated = computed(() => user.value !== null)
    function loginWithSwitch() {
        // TODO: will redirect to backend later
        // window.location.href = '/api/auth/login'
        console.log('login clicked - BE not ready yet')
    }
    function logout() {
        user.value = null
    }
    return { user, isAuthenticated, loginWithSwitch, logout }
}
)