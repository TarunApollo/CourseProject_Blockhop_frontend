<script setup>
import { onMounted, onUnmounted } from "vue";
import StartGame from "./levelPlayer/main";

const props = defineProps({
  width: { type: Number, default: 1536 },
  height: { type: Number, default: 768 },
  map: { type: [String, Object] },
  playerSkin: { type: String, default: "green" },
});

const emit = defineEmits([
  "current-active-scene",
  "run-started",
  "coin-collected",
  "enemy-killed",
  "box-destroyed",
  "level-completed",
  "attempt-failed",
]);

let game = null;

onMounted(() => {
  game = StartGame("game-container", props.width, props.height, props.map, {
    onSceneReady: (scene) => emit("current-active-scene", scene),
    onRunStarted: () => emit("run-started"),
    onCoinCollected: (coinType) => emit("coin-collected", coinType),
    onEnemyKilled: (enemyType) => emit("enemy-killed", enemyType),
    onBoxDestroyed: (content) => emit("box-destroyed", content),
    onLevelCompleted: (payload) => emit("level-completed", payload),
    onAttemptFailed: (payload) => emit("attempt-failed", payload),
  }, props.playerSkin);
});

onUnmounted(() => {
  if (game) {
    game.destroy(true);
    game = null;
  }
});

function pause() {
  game?.scene.pause("main");
}

function resume() {
  game?.scene.resume("main");
}

function restart() {
  if (!game) return;

  game.loop.resume();
  game.scene.start("main");
}

defineExpose({
  pause,
  resume,
  restart,
});
</script>

<template>
  <div id="game-container"></div>
</template>
