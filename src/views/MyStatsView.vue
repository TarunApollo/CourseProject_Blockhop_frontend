<script setup>
import GameBackground from "../components/GameBackground.vue"
import ReturnButton from "@/components/ReturnButton.vue"
import MainLogo from "@/components/MainLogo.vue";

</script>

<template>

  <ReturnButton style="z-index: 100"/>
  <GameBackground/>
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

.return-button{
  position: absolute;
  top: 28px;
  left: 28px;
}

.back-button {
  padding: clamp(8px, 2vw, 8px) clamp(15px, 5vw, 15px);
  background: #4ade80;
  color: #052e16;
  border: #181818 2px solid;
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(0.2rem, 3.4vw, 4rem);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 5px 0 #166534, 0 8px 18px rgba(0,0,0,0.25);
  transition: transform 0.07s, box-shadow 0.07s;
  text-align: center;
}

.back-button:hover {
  transform: translateY(-2px);
  background: #86efac;
}

.back-button:active {
  transform: translateY(0);
}
</style>