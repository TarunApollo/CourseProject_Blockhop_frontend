<script setup>
import { onMounted, onBeforeUnmount, ref, computed, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth.js";
import { useRouter } from "vue-router";
import Phaser from "phaser";
import { LoginScene } from "@/features/login-page/lib/LoginScene.js";
import LoginTitle from "@/features/login-page/components/LoginTitle.vue";

const auth = useAuthStore();
const router = useRouter();
const isLoading = ref(false);

if (auth.isAuthenticated) {
  router.replace({ name: "/home" });
}

const gameContainer = ref(null);
let game = null;

function handleLogin() {
  isLoading.value = true;
  auth.loginWithSwitch();
}

onMounted(async () => {
  await nextTick();
  setTimeout(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: gameContainer.value,
      backgroundColor: "#87ceeb",
      scene: [LoginScene],
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 600 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  }, 280);
});

onBeforeUnmount(() => {
  if (game) {
    game.destroy(true);
    game = null;
  }
});
</script>

<template>
  <div class="fixed inset-0 w-screen h-screen overflow-hidden">
    <div
      ref="gameContainer"
      class="[&_canvas]:block [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:!w-full [&_canvas]:!h-full"
    />
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-[27%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[40px] pointer-events-auto"
      >
        <LoginTitle />
        <button
          class="px-[55px] py-[25px] bg-green-400 text-green-950 border-2 border-[#181818] font-['Pixelify_Sans',monospace] text-[1.1rem] font-bold cursor-pointer whitespace-nowrap shadow-[0_5px_0_#166534,_0_8px_18px_rgba(0,0,0,0.25)] transition-[transform,box-shadow] duration-[70ms] hover:bg-[#86efac] hover:-translate-y-[3px] hover:shadow-[0_8px_0_#166534,_0_12px_24px_rgba(0,0,0,0.28)] active:translate-y-[4px] active:shadow-[0_1px_0_#166534] disabled:opacity-55 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="handleLogin"
        >
          <span v-if="!isLoading">Sign in with SWITCH edu-ID</span>
          <span v-else class="flex items-center gap-[9px]">
            <span
              class="w-[13px] h-[13px] border-2 border-green-950/20 border-t-green-950 rounded-full animate-spin"
            />
            Redirecting…
          </span>
        </button>

        <p
          v-if="auth.error"
          class="text-[0.8rem] text-red-500 bg-black/40 px-3 py-[5px]"
          role="alert"
        >
          Login failed — please try again
        </p>
      </div>
    </div>
  </div>
</template>

