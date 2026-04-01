<script setup>
import { useGameBackground } from '@/shared/composables/useGameBackground'

const { gameContainer } = useGameBackground()
</script>

<template>
  <div class="shared-game-background">
    <div class="bg-container">
      <div ref="gameContainer" class="game-canvas" />
    </div>
  </div>
</template>