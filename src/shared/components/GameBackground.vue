<script setup>
import '@/shared/style/GameBackground.css'
import { useGameBackground } from '@/shared/composables/useGameBackground'

const { gameContainer } = useGameBackground()
</script>

<template>
  <div class="bg-container">
    <div ref="gameContainer" class="game-canvas" />
  </div>
</template>