<script setup>
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { logout } from '@/stores/auth'

const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <main class="home-view">
    <h1 class="home-title">Blockhop</h1>
    <p class="home-subtitle">You are logged in and ready to play.</p>
    
    <div class="menu-grid">
      <RouterLink to="/level-list" class="menu-button">
        <span class="button-label">Play Levels</span>
      </RouterLink>
      
      <RouterLink to="/play" class="menu-button">
        <span class="button-label">Play Level</span>
      </RouterLink>
      
      <RouterLink to="/about" class="menu-button">
        <span class="button-label">About</span>
      </RouterLink>
      
      <button @click="handleLogout" class="menu-button logout-btn">
        <span class="button-label">Logout</span>
      </button>
    </div>
  </main>
</template>

<style scoped>
.home-view {
  min-height: calc(100vh - 120px);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #63c88a;
}

.home-view::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-color: var(--vt-c-white);
}

.home-title {
  color: inherit;
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
}

.home-subtitle {
  color: inherit;
  font-size: 1.2rem;
  margin-top: 0.75rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 3rem;
  width: 100%;
  max-width: 600px;
  padding: 0 2rem;
}

.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #2b9d5ce6;
  color: white;
  text-decoration: none;
  border: 2px solid #1a5f3a;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.1rem;
  min-height: 120px;
  cursor: pointer;
}

.menu-button:hover {
  background-color: #1a5f3a;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.menu-button:active {
  transform: scale(0.98);
}

.logout-btn {
  border: none;
  background-color: #c85c5c;
}

.logout-btn:hover {
  background-color: #a03f3f;
}

.button-label {
  display: block;
}
</style>
