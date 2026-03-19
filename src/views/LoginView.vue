<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

function handleLogin() {
  auth.loginWithSwitch()
}
</script>
<template>
  <button @click="handleLogin"> Login </button>
</template>

<style scoped>


</style>