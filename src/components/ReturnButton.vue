<script setup>

import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/home')
}

</script>

<template>
    <div class="return-button">
        <button class="menu-button" type="button" @click="goBack">&#8592;</button>
    </div>
</template>

<style scoped>


.return-button{
  position: absolute;
  top: 28px;
  left: 28px;
  z-index: 100;
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
