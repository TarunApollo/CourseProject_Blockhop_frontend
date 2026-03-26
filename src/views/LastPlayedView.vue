<script setup>
import MainLogo from "@/components/MainLogo.vue";
import GameBackground from "../components/GameBackground.vue"
import ReturnButton from "@/components/ReturnButton.vue";
</script>

<template>
  <GameBackground />
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

.top-title {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
}

.return-button {
  pointer-events: auto;
}

.home-title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(1.5rem, 12vw, 10rem);
  line-height: 1;
  color: #fff;
  animation: title-wobble 6s ease-in-out infinite alternate;
  transform-style: preserve-3d;
  display: inline-block;
  text-shadow: 3px 3px 0 #1a4a0a, 5px 5px 0 rgba(0,0,0,0.25);
}

.home-hop {
  color: #4ade80;
  text-shadow: 3px 3px 0 #166534, 5px 5px 0 rgba(0,0,0,0.25);
}

@keyframes splash-pulse {
  from { transform: rotate(18deg) scale(1); }
  to   { transform: rotate(18deg) scale(1.08); }
}
@keyframes title-wobble {
  from { transform: perspective(400px) rotateY(-4deg) scale(1); }
  to   { transform: perspective(400px) rotateY(4deg)  scale(1.04); }
}
@keyframes spin { to { transform: rotate(360deg); } }

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