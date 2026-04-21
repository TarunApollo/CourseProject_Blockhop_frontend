<script setup>
import { onMounted, onUnmounted } from "vue";
import { EventBus } from "./levelPlayer/EventBus";
import StartGame from "./levelPlayer/main";

const props = defineProps({
  width: { type: Number, default: 1536 },
  height: { type: Number, default: 768 },
  map: { type: [String, Object] },
});

const emit = defineEmits(["current-active-scene"]);

let game = null;

onMounted(() => {
  game = StartGame("game-container", props.width, props.height, props.map);

  // Forward game events up to the parent as Vue emits.
  // Add more EventBus.on() calls here as new events are introduced.
  EventBus.on("current-scene-ready", (scene) =>
    emit("current-active-scene", scene),
  );

  EventBus.on("PauseGame", () => {
    if (game) game.scene.pause("main");
  });
  EventBus.on("ResumeGame", () => {
    if (game) game.scene.resume("main");
  });
  EventBus.on("RestartGame", () => {
    if (game) {
      game.loop.resume();
      game.scene.start("main");
    }
  });
});

onUnmounted(() => {
  EventBus.removeAllListeners();
  if (game) {
    game.destroy(true);
    game = null;
  }
});
</script>

<template>
  <div id="game-container"></div>
</template>
