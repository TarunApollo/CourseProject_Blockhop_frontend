<script setup>
import Phaser from "phaser";
import { onMounted, onUnmounted, ref } from "vue";
import { getPhysicsBody } from "../components/levelPlayer/ecs/adapter/matterAdapter";
import { syncTransformsFromMatter } from "../components/levelPlayer/ecs/adapter/matterAdapter";
import { updateRuntime } from "../components/levelPlayer/ecs/headlessRuntime/update";
import { createLevelDataFromTiledJson } from "../components/levelPlayer/ecs/levelData/createLevelDataFromTiledJson";
import { playerOperationFromInput } from "../components/levelPlayer/ecs/systems/inputSystem";
import { processRuntimeEvents } from "../components/levelPlayer/ecs/systems/runtimeEvents";
import { animationEventSystem, animationSystem } from "../components/levelPlayer/phaser/animationSystem";
import { createPhaserLevelRuntime } from "../components/levelPlayer/phaser/createPhaserLevelRuntime";
import { preloadLevelAssets } from "../components/levelPlayer/phaser/preload";
import { renderSystem } from "../components/levelPlayer/phaser/renderSystem";

const FIXED_REPLAY_DELTA_MS = 1000 / 60;
const MAX_REPLAY_TICKS_PER_FRAME = 20;
const REPLAY_ACTION_INPUTS = [
  {},
  { right: true },
  { jump: true },
  { right: true, jump: true },
  { right: true, run: true },
  { right: true, run: true, jump: true },
];

const props = defineProps({
  width: { type: Number, default: 1536 },
  height: { type: Number, default: 768 },
  map: { type: Object, required: true },
});

const emit = defineEmits([
  "run-started",
  "coin-collected",
  "enemy-killed",
  "box-destroyed",
  "level-completed",
  "attempt-failed",
]);

const containerRef = ref(null);

let game = null;
let runtime = null;
let pendingReplay = null;
let replay = null;

onMounted(() => {
  createGame();
});

onUnmounted(() => {
  if (game) {
    game.destroy(true);
    game = null;
  }
});

function playDemoReplay(demo, successIndex = 0, options = {}) {
  const trajectory = resolveDemoTrajectory(demo, successIndex);
  const actions = trajectory.map((step) => Number(step.action));
  if (!actions.length) return;

  pendingReplay = {
    inputs: actions.map((action) => replayActionIndexToInput(action)),
    actionRepeat: options.actionRepeat ?? demo.actionRepeat ?? 4,
    playbackRate: options.playbackRate ?? 1,
  };
  replay = null;
  runtime = null;
  game?.scene.start("rl-replay");
}

function replayActionIndexToInput(actionIndex) {
  const integerIndex = Number.isFinite(actionIndex) ? Math.trunc(actionIndex) : 0;
  const index = Math.max(
    0,
    Math.min(REPLAY_ACTION_INPUTS.length - 1, integerIndex),
  );
  return { ...REPLAY_ACTION_INPUTS[index] };
}

function getReplayDebugState() {
  if (!runtime) return null;
  const playerBody = getPhysicsBody(runtime.registry, runtime.playerEntity);
  return {
    x: playerBody?.position.x ?? null,
    y: playerBody?.position.y ?? null,
    isComplete: runtime.levelState.isComplete,
    gameOver: runtime.levelState.gameOver,
    replay: replay
      ? {
          actionIndex: replay.actionIndex,
          repeatedTicks: replay.repeatedTicks,
          finished: replay.finished,
        }
      : null,
  };
}

function createGame() {
  class ReplayScene extends Phaser.Scene {
    constructor() {
      super("rl-replay");
    }

    preload() {
      preloadLevelAssets(this, props.map);
    }

    create() {
      runtime = createPhaserLevelRuntime(this, {
        levelData: createLevelDataFromTiledJson(props.map),
        callbacks: {
          onRunStarted: () => emit("run-started"),
          onCoinCollected: (coinType) => emit("coin-collected", coinType),
          onEnemyKilled: (enemyType) => emit("enemy-killed", enemyType),
          onBoxDestroyed: (content) => emit("box-destroyed", content),
          onLevelCompleted: (payload) => emit("level-completed", payload),
          onAttemptFailed: (payload) => emit("attempt-failed", payload),
        },
      });

      if (pendingReplay) {
        replay = {
          ...pendingReplay,
          actionIndex: 0,
          repeatedTicks: 0,
          accumulatorMs: 0,
          finished: false,
        };
        pendingReplay = null;
      }
    }

    update(_time, delta) {
      if (!runtime || !replay || replay.finished) return;
      updateReplayLevel(this, delta);
    }
  }

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: props.width,
    height: props.height,
    parent: containerRef.value,
    scene: ReplayScene,
  });
}

function updateReplayLevel(scene, delta) {
  replay.accumulatorMs += delta * replay.playbackRate;
  let ticks = 0;

  while (
    replay.accumulatorMs >= FIXED_REPLAY_DELTA_MS &&
    ticks < MAX_REPLAY_TICKS_PER_FRAME &&
    !replay.finished
  ) {
    replay.accumulatorMs -= FIXED_REPLAY_DELTA_MS;
    ticks++;

    const input = consumeReplayInput();
    const events = updateRuntime(runtime, {
      input: playerOperationFromInput(input),
      deltaMs: FIXED_REPLAY_DELTA_MS,
      skipPlayerInput: runtime.state.isDying || runtime.state.isLevelComplete,
    });
    processReplayEvents(scene, events);

    if (runtime.state.isDying || runtime.state.isLevelComplete) {
      replay.finished = true;
    }
  }

  syncTransformsFromMatter(runtime.registry);
  renderSystem(runtime.renderContext, runtime.registry, runtime.tileMetadata);
  animationSystem(runtime.renderContext, runtime.registry);
}

function consumeReplayInput() {
  const input = replay.inputs[replay.actionIndex];
  if (!input) {
    replay.finished = true;
    return {};
  }

  replay.repeatedTicks++;
  if (replay.repeatedTicks >= replay.actionRepeat) {
    replay.repeatedTicks = 0;
    replay.actionIndex++;
  }
  return input;
}

function processReplayEvents(scene, events) {
  const wasComplete = runtime.levelState.isComplete;
  processRuntimeEvents(runtime, events);

  if (!wasComplete && runtime.levelState.isComplete) {
    runtime.completeLevel();
  }

  animationEventSystem(runtime.renderContext, runtime.tileMetadata, events, {
    onCoinPopComplete: runtime.callbacks.onCoinCollected,
  });

  for (const event of events) {
    switch (event.type) {
      case "CoinCollected":
        if (!event.animated) runtime.callbacks.onCoinCollected?.(event.coinType);
        break;
      case "EnemyKilled":
        runtime.callbacks.onEnemyKilled?.(event.enemyType);
        break;
      case "BoxDestroyed":
        runtime.callbacks.onBoxDestroyed?.(event.content);
        break;
      case "PlayerDied":
        runtime.state.isDying = true;
        runtime.callbacks.onAttemptFailed?.({ reason: "damage" });
        break;
      case "GameOver":
        runtime.state.isDying = true;
        runtime.callbacks.onAttemptFailed?.({ reason: "fall" });
        break;
    }
  }
}

function resolveDemoTrajectory(demo, successIndex) {
  if (Array.isArray(demo)) {
    return demo;
  }
  if (Array.isArray(demo?.successes)) {
    return demo.successes[successIndex]?.trajectory ?? [];
  }
  if (Array.isArray(demo?.results)) {
    return demo.results[successIndex]?.trajectory ?? [];
  }
  return demo?.trajectory ?? [];
}

defineExpose({
  playDemoReplay,
  getReplayDebugState,
});
</script>

<template>
  <div ref="containerRef"></div>
</template>
