<script setup>
import ReturnButton from "@/shared/components/ReturnButton.vue"
import MainLogo from "@/shared/components/MainLogo.vue"
</script>

<template>
  <ReturnButton/>

  <div class="overlay">
  <MainLogo/>
    
    <div class="about-content">
      <h1 class="about-title">About information</h1>
      <p class="about-description">Here you can view information about the game and its development.</p>
      <!-- Add about content here -->
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

.about-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #1a4a0a;
}

.about-title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(1.5rem, 8vw, 6rem);
  margin-bottom: 20px;
}

.about-description {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(1rem, 4vw, 2rem);
}
</style>
