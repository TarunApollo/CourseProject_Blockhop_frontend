<script setup>
import { onMounted, onBeforeUnmount, ref, computed, nextTick } from 'vue'
import Button from "@/shared/components/Button.vue";
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'
import { LoginScene } from '../lib/LoginScene.js'

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
          <h1 class="text-[clamp(5rem,10vw,10rem)] inline-block animate-[title-wobble_6s_ease-in-out_infinite_alternate] font-['Pixelify_Sans',monospace] leading-none text-white
            [text-shadow:3px_3px_0_#1a4a0a,5px_5px_0_rgba(0,0,0,0.25)]">
            Block<span class="text-[#4ade80] [text-shadow:3px_3px_0_#166534,5px_5px_0_rgba(0,0,0,0.25)]">hop</span>
          </h1>
          <span class="text-[clamp(1.2rem,1.5vw,1.2rem)] absolute -bottom-10 -right-21.25 rotate-330 animate-[splash-pulse_1.2s_ease-in-out_infinite_alternate] font-['Pixelify_Sans',monospace]
            text-[#FFE03A] [text-shadow:2px_2px_0_#7a5a00,0_0_12px_#FFE03Acc] whitespace-nowrap pointer-events-none origin-left">
            Stay home and play games!
          </span>
        </div>
        <Button :is-loading="isLoading" :text="loginText" :text-after-click="textAfterClick" @click="handleLogin"/>
        <p v-if="auth.error" class="text-[0.8rem] text-red-500 bg-black/40 px-3 py-[5px]">
          Login failed — please try again
        </p>

      </div>
    </div>
  </div>
</template>

