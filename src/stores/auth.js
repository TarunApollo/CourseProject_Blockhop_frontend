import { ref, computed } from "vue";
import { defineStore } from "pinia";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isHydrated = ref(false);
  // null = not logged in
  // { id: "...", name: "..." } = logged in
  const isAuthenticated = computed(() => user.value !== null);
  function loginWithSwitch() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/switch-edu-id`;
  }
  function logout() {
    user.value = null;
  }
  async function hydrateFromSession() {
    if (isHydrated.value) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        user.value = { id: data.id, name: data.name };
      } else {
        user.value = null;
      }
    } catch (e) {
      user.value = null;
    } finally {
      isHydrated.value = true;
    }
  }
  return { user, isAuthenticated, isHydrated, loginWithSwitch, hydrateFromSession, logout };
});
