<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import Button from "@/shared/components/Button.vue";
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'
import { LoginScene } from '../lib/LoginScene.js'
import BlockhopTitle from "@/shared/components/BlockhopTitle.vue";

const loginText = "Sign in with SWITCH edu-ID"
const textAfterClick = "Redirecting"
const auth = useAuthStore()
const router = useRouter()
const isLoading = ref(false)

if (auth.isAuthenticated) {
  router.replace({ name: 'home' })
}

const gameContainer = ref(null)
let game = null

function handleLogin() {
  isLoading.value = true
  auth.loginWithSwitch()
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer.value,
      backgroundColor: '#87ceeb',
      scene: [LoginScene],
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 600 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        width:  window.innerWidth,
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
    <div ref="gameContainer" class="[&_canvas]:block [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:w-full! [&_canvas]:h-full!" />
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-[27%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-10 pointer-events-auto">

        <div class="select-none text-center relative inline-block">
          <BlockhopTitle/>
          <span class="text-[clamp(1.2rem,1.5vw,1.2rem)] absolute -bottom-10 -right-21.25 rotate-330 animate-splash font-pixelify
            text-retro-yellow [text-shadow:2px_2px_0_#7a5a00,0_0_12px_#FFE03Acc] whitespace-nowrap pointer-events-none origin-left">
            Stay home and play games!
          </span>
        </div>
        <Button :is-loading="isLoading" :text="loginText" :text-after-click="textAfterClick" @click="handleLogin"/>
        <p v-if="auth.error" class="text-[0.8rem] text-red-500 bg-black/40 px-3 py-1.25">
          Login failed — please try again
        </p>

      </div>
    </div>
  </div>
</template>

