// This is a temporary file, remove, once real auth is implemented
import { ref } from 'vue'

export const isLoggedIn = ref(false)

export function login() {
  // optionally store user info
  isLoggedIn.value = true
}

export function logout() {
  isLoggedIn.value = false
}

export function toggleLogin() {
  isLoggedIn.value = !isLoggedIn.value
}

// This file is used in Login and App views, to render pre-login and post-login visuals.