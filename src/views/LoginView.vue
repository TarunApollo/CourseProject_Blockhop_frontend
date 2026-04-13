<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth.js";
import { useRouter } from "vue-router";
import Phaser from "phaser";
import { LoginScene } from "@/features/login-page/lib/LoginScene.js";
import LoginTitle from "@/features/login-page/components/LoginTitle.vue";
import Button from "@/shared/components/Button.vue";

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
      class="[&_canvas]:block [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:w-full! [&_canvas]:h-full!"
    />
    <div class="absolute inset-0">
      <div
        class="absolute top-[21%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[7vmin]"
      >
        <LoginTitle />

        <Button :disabled="isLoading" size="sm" @click="handleLogin">
          <span class="grid place-items-center">
            <span
              :class="{ invisible: isLoading }"
              class="col-start-1 row-start-1"
              >Sign in with SWITCH edu-ID</span
            >
            <span
              :class="{ invisible: !isLoading }"
              class="col-start-1 row-start-1"
              >Loading...
            </span>
          </span>
        </Button>
        <p
          v-if="auth.error"
          class="text-[0.8rem] text-red-500 bg-black/40 px-3 py-1.25"
          role="alert"
        >
          Login failed — please try again
        </p>
      </div>
    </div>
  </div>
</template>
