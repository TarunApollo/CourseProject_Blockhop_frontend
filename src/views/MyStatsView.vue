<script setup>
import ReturnButton from "@/shared/components/ReturnButton.vue"
import MainLogo from "@/shared/components/MainLogo.vue";

</script>

<template>

  <ReturnButton style="z-index: 100"/>
  <MainLogo/>
  <div class="overlay">
    

    <div class="stats-content">
      <h1 class="stats-title">My Stats</h1>
      <p class="stats-description">Here you can view your game statistics and achievements.</p>
      <!-- Add more stats content here -->
    </div>
  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.stats-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #1a4a0a;
}

.stats-title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(1.5rem, 8vw, 6rem);
  margin-bottom: 20px;
}

.stats-description {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(1rem, 4vw, 2rem);
}
</style>