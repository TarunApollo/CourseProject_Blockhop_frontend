<script setup>
import { RouterLink, RouterView } from 'vue-router'

// For presentation purpouses :begin
import { isLoggedIn } from './stores/auth';
// For presentation purpouses :end
</script>

<template>
  <header>
    <!-- <img alt="Vue logo" class="logo" src="@/../public/assets/head.jpg" width="125" height="125" /> -->

    <div class="wrapper">
    <!-- <HelloWorld msg="The best prof of all time...Emacs say" /> -->

      <nav>
        <RouterLink to="/">Landing Page (Login page)</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/level-list" v-if="isLoggedIn">Play</RouterLink>
        <RouterLink to="/play" v-if="isLoggedIn">Play Level</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  background-color: rgba(32, 32, 32, 0.1);
  min-height: 5vh;

}

.logo {
  /* Unless logo present, redundant */
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 256px) {
  header {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .logo {
    margin: 0 auto 2rem;
    margin-top: 15rem;
  }

  nav {
    text-align: center;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
