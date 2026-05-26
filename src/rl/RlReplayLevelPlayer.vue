<script setup>
import Phaser from "phaser";
import { onMounted, onUnmounted, ref } from "vue";
import { getPhysicsBody } from "../components/levelPlayer/ecs/matter/matterAdapter";
import { createLevelDataFromTiledJson } from "../components/levelPlayer/ecs/headlessRuntime/createLevelDataFromTiledJson";
import { playerOperationFromInput } from "../components/levelPlayer/ecs/systems/input/playerControlInputSystem";
import { processRuntimeEvents } from "../components/levelPlayer/ecs/systems/runtimeEvents";
import { animationEventSystem, animationSystem } from "../components/levelPlayer/phaser/animationSystem";
import { TARGET_RENDER_FPS } from "../components/levelPlayer/phaser/phaserConstants";
import { createPhaserLevelRuntime } from "../components/levelPlayer/phaser/createPhaserLevelRuntime";
import { preloadLevelAssets } from "../components/levelPlayer/phaser/preload";
import { renderSystem } from "../components/levelPlayer/phaser/renderSystem";
import {
  configureOldPhysicsRuntime,
  syncOldPhysicsRuntime,
  updateOldPhysicsRuntime,
} from "./oldPhysicsRuntime";

const FIXED_REPLAY_DELTA_MS = 1000 / 60;
const MAX_REPLAY_TICKS_PER_FRAME = 20;
const MAX_REPEAT_SKIP_TICKS = 240;
const REPEAT_SKIP_WINDOW = 30;
const REPEAT_SKIP_MIN_FRAME = 70;
const REPEAT_SKIP_X_RANGE = 40;
const REPEAT_SKIP_Y_RANGE = 80;
const REPEAT_SKIP_PROGRESS = 8;
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
  "replay-ended",
]);

const containerRef = ref(null);

let game = null;
let runtime = null;
let pendingReplay = null;
let replay = null;

const RENDER_SCALE = 2;

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
  const inputs = resolveDemoInputs(demo, successIndex);
  if (!inputs.length) return;

  pendingReplay = {
    inputs,
    actionRepeat: options.actionRepeat ?? demo.actionRepeat ?? 1,
    playbackRate: options.playbackRate ?? 1,
    slowMotionWindow: options.slowMotionWindow ?? null,
    skipRepeatedLocalMotion: options.skipRepeatedLocalMotion ?? false,
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

function replayStepToInput(step) {
  if (typeof step === "number") {
    return replayActionIndexToInput(step);
  }
  if (typeof step?.action === "number") {
    return replayActionIndexToInput(step.action);
  }
  if (step?.input && typeof step.input === "object") {
    return normalizeReplayInput(step.input);
  }
  if (step && typeof step === "object") {
    return normalizeReplayInput(step);
  }
  return {};
}

function normalizeReplayInput(input) {
  return {
    left: Boolean(input.left),
    right: Boolean(input.right),
    jump: Boolean(input.jump),
    run: Boolean(input.run),
    pickupAndThrow: Boolean(input.pickupAndThrow ?? input.throw),
  };
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
      configureOldPhysicsRuntime(runtime);

      if (pendingReplay) {
        replay = {
          ...pendingReplay,
          actionIndex: 0,
          repeatedTicks: 0,
          accumulatorMs: 0,
          motionSamples: [],
          maxObservedX: Number.NEGATIVE_INFINITY,
          finished: false,
          endEmitted: false,
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
    width: Math.round(props.width * RENDER_SCALE),
    height: Math.round(props.height * RENDER_SCALE),
    zoom: 1 / RENDER_SCALE,
    fps: {
      target: TARGET_RENDER_FPS,
      forceSetTimeOut: true,
    },
    parent: containerRef.value,
    scene: ReplayScene,
  });
}

function updateReplayLevel(scene, delta) {
  replay.accumulatorMs += delta * getCurrentPlaybackRate();
  let ticks = 0;

  while (
    replay.accumulatorMs >= FIXED_REPLAY_DELTA_MS &&
    ticks < MAX_REPLAY_TICKS_PER_FRAME &&
    !replay.finished
  ) {
    replay.accumulatorMs -= FIXED_REPLAY_DELTA_MS;
    ticks++;

    const input = consumeReplayInput();
    if (!input) break;

    const events = updateOldPhysicsRuntime(runtime, {
      input: playerOperationFromInput(input),
      deltaMs: FIXED_REPLAY_DELTA_MS,
      skipPlayerInput: runtime.state.isDying || runtime.state.isLevelComplete,
    });
    processReplayEvents(scene, events);
    recordReplayMotion();

    if (runtime.state.isDying || runtime.state.isLevelComplete) {
      replay.finished = true;
    } else if (shouldSkipRepeatedLocalMotion()) {
      skipRepeatedLocalMotion(scene);
    }
  }

  if (replay.finished) {
    emitReplayEnded();
  }

  syncOldPhysicsRuntime(runtime);
  renderSystem(runtime.renderContext, runtime.registry);
  animationSystem(runtime.renderContext, runtime.registry);
}

function recordReplayMotion() {
  const playerBody = getPhysicsBody(runtime.registry, runtime.playerEntity);
  if (!playerBody) return;

  replay.motionSamples.push({
    x: playerBody.position.x,
    y: playerBody.position.y,
  });
  if (replay.motionSamples.length > REPEAT_SKIP_WINDOW) {
    replay.motionSamples.shift();
  }
  if (playerBody.position.x > replay.maxObservedX) {
    replay.maxObservedX = playerBody.position.x;
  }
}

function shouldSkipRepeatedLocalMotion() {
  if (!replay.skipRepeatedLocalMotion) return false;
  if (replay.actionIndex < REPEAT_SKIP_MIN_FRAME) return false;
  if (replay.motionSamples.length < REPEAT_SKIP_WINDOW) return false;

  const xs = replay.motionSamples.map((sample) => sample.x);
  const ys = replay.motionSamples.map((sample) => sample.y);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  return xRange < REPEAT_SKIP_X_RANGE && yRange > REPEAT_SKIP_Y_RANGE;
}

function skipRepeatedLocalMotion(scene) {
  const targetX = replay.maxObservedX + REPEAT_SKIP_PROGRESS;
  let skippedTicks = 0;

  while (
    skippedTicks < MAX_REPEAT_SKIP_TICKS &&
    !replay.finished
  ) {
    const playerBody = getPhysicsBody(runtime.registry, runtime.playerEntity);
    if (playerBody && playerBody.position.x >= targetX) return;

    const input = consumeReplayInput();
    if (!input) return;

    const events = updateOldPhysicsRuntime(runtime, {
      input: playerOperationFromInput(input),
      deltaMs: FIXED_REPLAY_DELTA_MS,
      skipPlayerInput: runtime.state.isDying || runtime.state.isLevelComplete,
    });
    processReplayEvents(scene, events);
    recordReplayMotion();
    skippedTicks++;

    if (runtime.state.isDying || runtime.state.isLevelComplete) {
      replay.finished = true;
    }
  }
}

function getCurrentPlaybackRate() {
  const window = replay.slowMotionWindow;
  if (!window) return replay.playbackRate;

  const playerBody = getPhysicsBody(runtime.registry, runtime.playerEntity);
  const playerX = playerBody?.position.x;
  if (typeof playerX !== "number") return replay.playbackRate;

  if (playerX >= window.minX && playerX <= window.maxX) {
    return window.playbackRate;
  }
  return replay.playbackRate;
}

function consumeReplayInput() {
  const input = replay.inputs[replay.actionIndex];
  if (!input) {
    replay.finished = true;
    return null;
  }

  replay.repeatedTicks++;
  if (replay.repeatedTicks >= replay.actionRepeat) {
    replay.repeatedTicks = 0;
    replay.actionIndex++;
  }
  return input;
}

function emitReplayEnded() {
  if (!replay || replay.endEmitted) return;
  replay.endEmitted = true;
  const debugState = getReplayDebugState();
  window.setTimeout(() => {
    emit("replay-ended", debugState);
  }, 0);
}

function processReplayEvents(scene, events) {
  const wasComplete = runtime.levelState.isComplete;
  processRuntimeEvents(runtime, events);

  if (!wasComplete && runtime.levelState.isComplete) {
    runtime.completeLevel();
  }

  animationEventSystem(runtime.renderContext, events, {
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

function resolveDemoInputs(demo, successIndex) {
  const trajectory = resolveDemoTrajectory(demo, successIndex);
  return trajectory.map((step) => replayStepToInput(step));
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
