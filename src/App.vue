<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from 'vue-router'

// For presentation purpouses :begin
import { isLoggedIn, logout } from './stores/auth';
// For presentation purpouses :end

const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <RouterView />
</template>

<style scoped>

.logout-button:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

@media (min-width: 256px) {
  header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  .logo {
    margin: 0 auto 2rem;
    margin-top: 15rem;
  }

  nav {
    text-align: right;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 0;
  }
}
</style>
