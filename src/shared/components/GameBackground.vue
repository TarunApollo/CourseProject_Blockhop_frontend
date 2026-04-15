<script setup>
import { onMounted, ref, watch, nextTick } from "vue";
import { useGameBackgroundStore } from "@/stores/gameBackground";
import { useRoute } from "vue-router";

const gameContainer = ref(null);
const backgroundStore = useGameBackgroundStore();
const route = useRoute();

function update() {
  if (!backgroundStore.game) return;

  if (route.name === "login") {
    backgroundStore.showScene("LoginScene");
  } else if (
    ["home", "create-level", "Profile", "about", "level-list"].includes(
      route.name,
    )
  ) {
    backgroundStore.showScene("BackgroundScene");
  }
}

onMounted(async () => {
  await nextTick();
  backgroundStore.init(gameContainer.value);
  update();
});

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
