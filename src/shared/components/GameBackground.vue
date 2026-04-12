<script setup>
import { useGameBackground } from '@/shared/composables/useGameBackground'

const { gameContainer } = useGameBackground()
</script>

<template>
  <div class="shared-game-background">
    <div class="bg-container fixed inset-0 overflow-hidden">
      <div ref="gameContainer" class="game-canvas absolute inset-0 z-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
    </div>
  </div>
</template>