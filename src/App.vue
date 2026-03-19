<script setup>
import { RouterLink, RouterView } from 'vue-router'

// For presentation purpouses :begin
import { isLoggedIn } from './stores/auth';
// For presentation purpouses :end
</script>

<template>
  <header>
    <!-- <img alt="Vue logo" class="logo" src="@/../public/assets/head.jpg" width="125" height="125" /> -->

    <div class="title">Blockhop</div>
    <div class="wrapper">
    <!-- <HelloWorld msg="The best prof of all time...Emacs say" /> -->

      <nav>
        <RouterLink to="/">Landing</RouterLink>
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
  background-color: #2b9d5ce6;
  min-height: 5vh;
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  white-space: nowrap;
}

.wrapper {
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
}

.logo {
  /* Unless logo present, redundant */
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: auto;
  font-size: 12px;
  text-align: right;
  margin-top: 0;
}

nav a.router-link-exact-active {
  color: white;
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
  color: white;
  font-weight: 600;
}

nav a:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

nav a:first-of-type {
  border: 0;
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
