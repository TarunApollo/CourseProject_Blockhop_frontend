<script setup>
import { useGameBackground } from '@/shared/composables/useGameBackground'

const { gameContainer } = useGameBackground()
</script>

<template>
  <div class="bg-container">
    <div ref="gameContainer" class="game-canvas" />
  </div>
</template>

<style scoped>
.bg-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.game-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.game-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>