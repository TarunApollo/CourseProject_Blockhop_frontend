<script setup>
import GameBackground from '@/components/GameBackground.vue'
import MainLogo from '@/components/MainLogo.vue';
</script>

<template>
  <div class="home">
    <GameBackground/>

    <div class="overlay">
      <MainLogo/>

      <div class="menu-grid">
        <RouterLink to="/my-stats" class="menu-button">My Stats</RouterLink>
        <RouterLink to="/last-played" class="menu-button">Resume Last Played</RouterLink>
        <RouterLink to="/level-list" class="menu-button">Levels</RouterLink>
        <RouterLink to="/play-demo" class="menu-button">Play Demo</RouterLink>
        <RouterLink to="/about" class="menu-button">About</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

.home {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.menu-grid {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(450px, 90vw);
  margin: auto;
  display: grid;
  grid-template-columns: repeat(1, minmax(100px, 1fr));
  gap: 2px;
  pointer-events: all;
  margin-top: 25vh;
  margin-bottom: 5vh;
}


@media (max-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(2, minmax(130px, 1fr));
  }
}

@media (max-width: 480px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
}



</style>