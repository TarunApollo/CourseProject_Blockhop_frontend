<!-- Temporary login page -->
<script setup>
import { useRouter } from 'vue-router'
import { login } from '../stores/auth'
import MainLogo from '@/shared/components/MainLogo.vue'

const router = useRouter()

function handleLogin() {
    login()
    router.push('/home')
}
</script>

<template>
  <MainLogo />
  <section class="login-content">
    <div class="login-container">
      <button @click="handleLogin" class="login-button">Login</button>
    </div>
  </section>
</template>

<style scoped>
.login-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.login-container {
    text-align: center;
    max-width: 700px;
}

.login-button {
  padding: clamp(8px, 2vw, 8px) clamp(15px, 5vw, 15px);
  background: var(--color-game-primary);
  color: var(--color-game-primary-ink);
  border: 2px solid var(--color-ink-strong);
  font-family: var(--font-game);
  font-size: clamp(0.2rem, 2.3vw, 4rem);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: var(--shadow-game-raised);
  transition: transform 0.07s, box-shadow 0.07s;
  text-align: center;
  width: clamp(100px, 60vw, 200px);
  height: clamp(40px, 30vw, 100px);
}

.login-button:hover {
  transform: translateY(-2px);
  background: var(--color-game-primary-hover);
}

.login-button:active {
  transform: translateY(0);
}
</style>