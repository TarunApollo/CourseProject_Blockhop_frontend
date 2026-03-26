<script setup>
import MainLogo from "@/shared/components/MainLogo.vue";
import ReturnButton from "@/shared/components/ReturnButton.vue";
</script>

<template>
  <ReturnButton />
  <div class="overlay">
    <MainLogo/>
    
    <div class="last-played-content">
      <h1 class="last-played-title">Resume your last played level</h1>
      <!-- Fetch the last played level from the backend and display it here -->
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

.last-played-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #1a4a0a;
}

.last-played-title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(1.5rem, 5vw, 6rem);
  margin-bottom: 20px;
}
</style>