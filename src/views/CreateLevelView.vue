<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'
import { BackgroundScene } from '@/shared/lib/BackgroundScene.js'
import CreateLevelForm from '@/features/level-creation/components/CreateLevelForm.vue'
import BackButton from '@/shared/components/BackButton.vue'

const router = useRouter()
const gameContainer = ref(null)
let game = null

function onLevelCreated() {
  router.push({ name: 'Profile' })
}

onMounted(() => {
  setTimeout(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer.value,
      backgroundColor: '#87ceeb',
      scene: [BackgroundScene],
      scale: {
        mode: Phaser.Scale.FIT,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    })
  }, 280)
})

onBeforeUnmount(() => {
  if (game) { game.destroy(true); game = null }
})
</script>

<template>
  <div class="fixed inset-0 w-screen h-screen overflow-hidden">
    <div
      ref="gameContainer"
      class="[&_canvas]:block [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:!w-full [&_canvas]:!h-full"
    />

    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute left-4 top-4 z-20 pointer-events-auto sm:left-6 sm:top-5">
        <BackButton />
      </div>

      <div class="flex h-full items-center justify-center px-4 pointer-events-auto">
        <CreateLevelForm @created="onLevelCreated" />
      </div>
    </div>
  </div>
</template>
