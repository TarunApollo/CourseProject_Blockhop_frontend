<!-- Temporary login page -->
<script setup>
import { useRouter } from 'vue-router'
import { login } from '../stores/auth'

const router = useRouter()

function handleLogin() {
    login()
    router.push('/home')
}
</script>

<template>
  <button @click="handleLogin" class="login-button absolute left-1/2 top-1/2">
    Login
  </button>
</template>