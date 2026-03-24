<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="my-stats-view">
    <img src="/assets/background/overworld/loginpic.png" class="layer" alt="Background Image"/>
    <h1 class="my-stats-title">Blockhop</h1>
    <p class="my-stats-subtitle">My Stats</p>
    
  </main>
</template>

<style scoped>
.my-stats-view {
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

.my-stats-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 70px;
  color: #906520;
  text-shadow: 4px 4px 0 #b51b42;
  margin: 0;
  position: relative;
  z-index: 1;
  margin-top: 2rem;
  margin-left: -24px;
}

.my-stats-subtitle {
  color: inherit;
  font-size: 1.2rem;
  margin-top: 0.75rem;
  position: relative;
  z-index: 1;
}
</style>