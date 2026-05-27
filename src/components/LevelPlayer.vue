<script setup>
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import StartGame, { resizeLevelGame } from "./levelPlayer/main";

const props = defineProps({
  width: { type: Number, default: 1536 },
  height: { type: Number, default: 768 },
  map: { type: [String, Object] },
  playerSkin: { type: String, default: "green" },
  // Recorded input log of the level's ghost (world-record) attempt.
  // null disables the ghost for this run. Forwarded into StartGame.
  ghostInputLog: { type: Array, default: null },
  // Whether ghost sprites are visible on the first frame.
  ghostVisible: { type: Boolean, default: true },
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
let controls = null;
let resizeObserver = null;
const containerRef = ref(null);

function getContainerSize() {
  const rect = containerRef.value?.getBoundingClientRect();
  return {
    width: Math.max(1, Math.floor(rect?.width ?? props.width)),
    height: Math.max(1, Math.floor(rect?.height ?? props.height)),
  };
}

function resizeGameToContainer() {
  if (!game) return;
  const { width, height } = getContainerSize();
  resizeLevelGame(game, width, height);
}

onMounted(async () => {
  await nextTick();
  const { width, height } = getContainerSize();

  game = StartGame(containerRef.value, width, height, props.map, {
    onSceneReady: (scene) => emit("current-active-scene", scene),
    onRunStarted: () => emit("run-started"),
    onCoinCollected: (coinType) => emit("coin-collected", coinType),
    onEnemyKilled: (enemyType) => emit("enemy-killed", enemyType),
    onBoxDestroyed: (content) => emit("box-destroyed", content),
    onLevelCompleted: (payload) => emit("level-completed", payload),
    onAttemptFailed: (payload) => emit("attempt-failed", payload),
  }, props.playerSkin,
    props.ghostInputLog,
    props.ghostVisible,
);

  game = result.game;
  controls = result.controls;
  resizeObserver = new ResizeObserver(resizeGameToContainer);
  resizeObserver.observe(containerRef.value);
  window.addEventListener("resize", resizeGameToContainer);
  window.visualViewport?.addEventListener("resize", resizeGameToContainer);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener("resize", resizeGameToContainer);
  window.visualViewport?.removeEventListener("resize", resizeGameToContainer);

  if (game) {
    game.destroy(true);
    game = null;
    controls = null;
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

function setGhostVisible(visible) {
  controls?.setGhostVisible(visible);
}

defineExpose({
  pause,
  resume,
  restart,
  setGhostVisible,
});
</script>

<template>
  <div ref="containerRef" class="h-full w-full overflow-hidden"></div>
</template>
