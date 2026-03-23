<script setup>
import Login from './LoginView.vue'
</script>

<template>
  <main class="landing-page">
    <Login />
  </main>
</template>

<style scoped>
.landing-page {
  position: relative;
  isolation: isolate;
  min-height: calc(100vh - 120px);
}

.landing-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/assets/landingpic1.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
</style>