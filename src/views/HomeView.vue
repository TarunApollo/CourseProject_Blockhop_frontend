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
    <img src="/assets/background/overworld/loginpic.png" class="layer" alt="Background Image"/>
    <h1 class="home-title">Blockhop</h1>
    <!-- <p class="home-subtitle">bla bla bla</p> -->
    
    <div class="menu-grid">
      <RouterLink to="/my-stats" class="menu-button">
        <span class="button-label">My Stats</span>
      </RouterLink>

      <RouterLink to="/last-played" class="menu-button">
        <span class="button-label">Resume Last Played Level</span>
      </RouterLink>

      <RouterLink to="/level-list" class="menu-button">
        <span class="button-label">Levels</span>
      </RouterLink>
      
      <RouterLink to="/play-demo" class="menu-button">
        <span class="button-label">Play Demo</span>
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
  width: 100%;
  height: 97vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.layer {
  position: absolute;
  width: 100%;
  height: auto;
  left: 0;
  z-index: 0;
}

.home-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 70px;
  color: #906520;
  text-shadow: 4px 4px 0 #b51b42;
  margin: 0;
  position: relative;
  z-index: 1;
  margin-top: 2rem;
}

/* .home-subtitle {
  color: inherit;
  font-size: 1.2rem;
  margin-top: 0.75rem;
  position: relative;
  z-index: 1;
} */

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 2fr);
  gap: 1.5rem;
  margin-top: 5rem;
  width: 100%;
  max-width: 600px;
  padding: 0 18rem;
  position: relative;
  z-index: 1;
}

.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 4rem;
  background-color: #906520;
  box-shadow: 8px 8px 0 #b51b42;
  color: white;
  font-family: 'Fredoka', sans-serif;
  text-decoration: none;
  border: 2px solid #1a5f3a;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.5rem;
  min-height: 50px;
  cursor: pointer;
}

.menu-button:hover {
  background-color: #ce680e;
  transform: scale(1.2);
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
