<script setup>
import { onMounted, ref, watch, computed, nextTick } from "vue";
import { useGameBackgroundStore } from "@/stores/gameBackground";
import { useRoute } from "vue-router";

const gameContainer = ref(null);
const backgroundStore = useGameBackgroundStore();
const route = useRoute();

const validRoutes = [
  "login",
  "home",
  "create-level",
  "Profile",
  "about",
  "level-list",
];
const needsBackground = computed(() => validRoutes.includes(route.name));

function update() {
  if (needsBackground.value && !backgroundStore.game) {
    backgroundStore.init(gameContainer.value);
  }
  if (!backgroundStore.game) return;
  if (route.name === "login") {
    backgroundStore.showScene("LoginScene");
  } else if (needsBackground.value) {
    backgroundStore.showScene("BackgroundScene");
  } else {
    backgroundStore.stopAll();
  }
}

watch(() => route.name, update);
</script>

<template>
  <div
    ref="gameContainer"
    class="game-background fixed inset-0 w-[100vw] h-full z-0 pointer-events-none"
  ></div>
</template>

<style scoped>
.game-background :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
