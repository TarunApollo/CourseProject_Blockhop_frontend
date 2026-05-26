import Matter from "matter-js";
import { destroyPhysicsEntity } from "../levelPlayer/ecs/matter/matterAdapter.js";
import { CT } from "../levelPlayer/ecs/core/ComponentTypes.js";
import { isClearConditionSatisfied } from "../levelPlayer/ecs/resources/levelState.js";
import { processRuntimeEvents } from "../levelPlayer/ecs/systems/runtimeEvents.js";
import { setDebugBodiesVisible } from "../levelPlayer/phaser/renderSystem.js";

let runtime;
let scene;
let scriptingCheatEnabled = false;
let scriptingCheatJitterEnabled = false;
let scriptingCheatCachedFrame = -1;
let scriptingCheatCachedInput = {};
let scriptingCheatSequenceFrame = 0;
let scriptingCheatMode = "state";
let scriptingCheatEventTimer;
let scriptingCheatEventHeldInput = {};
let scriptingCheatJitterHardOptions = {};
let scriptingCheatJitterHardState = {
  kind: "right",
};
let scriptingCheatJitterHardRightFrames = 0;
let scriptingCheatJitterHardProtectedRightFrames = 0;
let scriptingCheatKeyOverrides = [];

const SCRIPTING_CHEAT_EVENT_INTERVAL_MS = 1000 / 60;
const SCRIPTING_CHEAT_EVENT_JITTER_MS = 8;
const SCRIPTING_CHEAT_JITTER_HARD_TRIGGER_CHANCE = 0.01;
const SCRIPTING_CHEAT_JITTER_HARD_FRAMES_BEFORE_JUMP = 200;
const SCRIPTING_CHEAT_JITTER_HARD_PROTECTED_FRAMES_AFTER_JUMP = 60;
const SCRIPTING_CHEAT_KEYS = [
  { inputKey: "left", key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  { inputKey: "right", key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  { inputKey: "jump", key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  {
    inputKey: "run",
    key: "Shift",
    code: "ShiftLeft",
    keyCode: 16,
    location: 1,
  },
];

export function installScriptingCheats(nextRuntime, nextScene = nextRuntime.renderContext?.scene) {
  runtime = nextRuntime;
  scene = nextScene;
  installWindowCheats();
  installWindowDev();
}

function stopScriptingCheat() {
  stopScriptingCheatEvents();

  for (const override of scriptingCheatKeyOverrides) {
    if (override.descriptor) {
      Object.defineProperty(override.key, "isDown", override.descriptor);
    } else {
      Object.defineProperty(override.key, "isDown", {
        configurable: true,
        writable: true,
        value: override.value,
      });
    }
  }
  scriptingCheatKeyOverrides = [];
}

function resetScriptingCheatState() {
  scriptingCheatCachedFrame = -1;
  scriptingCheatCachedInput = {};
  scriptingCheatSequenceFrame = 0;
}

function runScriptingCheat() {
  stopScriptingCheat();
  resetScriptingCheatState();
  if (!runtime) return;

  overrideKeyState(runtime.cursors.left, () => scriptingCheatInput().left ?? false);
  overrideKeyState(runtime.cursors.right, () => scriptingCheatInput().right ?? false);
  overrideKeyState(runtime.cursors.up, () => scriptingCheatInput().jump ?? false);
  overrideKeyState(runtime.cursors.shift, () => scriptingCheatInput().run ?? false);
}

function runScriptingCheatEvent() {
  stopScriptingCheat();
  resetScriptingCheatState();
  if (!runtime) return;

  scriptingCheatEventHeldInput = {};
  scheduleScriptingCheatEventTick(0);
}

function runScriptingCheatJitterHard(options = {}) {
  stopScriptingCheat();
  resetScriptingCheatState();
  scriptingCheatJitterHardOptions = normalizeScriptingCheatJitterHardOptions(options);
  scriptingCheatJitterHardState = { kind: "right" };
  scriptingCheatJitterHardRightFrames = 0;
  scriptingCheatJitterHardProtectedRightFrames = 0;
  if (!runtime) return;

  overrideKeyState(
    runtime.cursors.left,
    () => scriptingCheatJitterHardInput().left ?? false,
  );
  overrideKeyState(
    runtime.cursors.right,
    () => scriptingCheatJitterHardInput().right ?? false,
  );
  overrideKeyState(
    runtime.cursors.up,
    () => scriptingCheatJitterHardInput().jump ?? false,
  );
  overrideKeyState(
    runtime.cursors.shift,
    () => scriptingCheatJitterHardInput().run ?? false,
  );
}

function installWindowCheats() {
  window.__cheats = {
    ...(window.__cheats ?? {}),
    ...(import.meta.env.DEV && scene ? createDevCheats() : {}),
    scriptingCheat: () => {
      scriptingCheatEnabled = true;
      scriptingCheatJitterEnabled = false;
      scriptingCheatMode = "state";
      runScriptingCheat();
    },
    scriptingCheatJitter: () => {
      scriptingCheatEnabled = true;
      scriptingCheatJitterEnabled = true;
      scriptingCheatMode = "state";
      runScriptingCheat();
    },
    scriptingCheatEvent: () => {
      scriptingCheatEnabled = true;
      scriptingCheatJitterEnabled = false;
      scriptingCheatMode = "event";
      runScriptingCheatEvent();
    },
    scriptingCheatJitterHard: (options = {}) => {
      scriptingCheatEnabled = true;
      scriptingCheatJitterEnabled = false;
      scriptingCheatMode = "jitterHard";
      runScriptingCheatJitterHard(options);
    },
  };

  if (scriptingCheatEnabled) {
    if (scriptingCheatMode === "event") {
      runScriptingCheatEvent();
    } else if (scriptingCheatMode === "jitterHard") {
      runScriptingCheatJitterHard(scriptingCheatJitterHardOptions);
    } else {
      runScriptingCheat();
    }
  }
}

function installWindowDev() {
  if (!import.meta.env.DEV || !scene) return;

  const existingDev = window.__dev ?? {};

  function showBoundingBoxes() {
    setDebugBodiesVisible(true);
  }

  function hideBoundingBoxes() {
    setDebugBodiesVisible(false);
    runtime?.renderContext?.debugGraphics?.clear();
  }

  window.__dev = {
    ...existingDev,
    showBoundingBoxes,
    hideBoundingBoxes,
  };
}

function createDevCheats() {
  primeDoorStartPositions();

  return {
    setGravity: (y = 2.5) => {
      const nextY = Number(y);
      if (!Number.isFinite(nextY)) return;
      runtime.engine.world.gravity.x = 0;
      runtime.engine.world.gravity.y = nextY;
    },
    setVelocityX: (v = 0) => {
      const body = getPlayerBody();
      const next = Number(v);
      if (!body || !Number.isFinite(next)) return;
      Matter.Body.setVelocity(body, { x: next, y: body.velocity.y });
    },
    setVelocityY: (v = 0) => {
      const body = getPlayerBody();
      const next = Number(v);
      if (!body || !Number.isFinite(next)) return;
      Matter.Body.setVelocity(body, { x: body.velocity.x, y: next });
    },
    teleport: (x = 0, y = 0) => {
      const body = getPlayerBody();
      const nextX = Number(x);
      const nextY = Number(y);
      if (!body || !Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
      Matter.Body.setPosition(body, { x: nextX, y: nextY });
    },
    noclip: () => {
      const control = getPlayerControl();
      if (!control) return;
      control.noclipActive = !control.noclipActive;
    },
    fly: (y = getPlayerBody()?.position.y) => {
      const nextY = Number(y);
      if (!Number.isFinite(nextY)) return;
      const control = getPlayerControl();
      if (control) control.noclipActive = false;
      runtime.state.sineFly = null;
      runtime.state.forcedFlyY = nextY;
    },
    sinFly: (
      amplitude = 96,
      periodMs = 1000,
      centerY = getPlayerBody()?.position.y,
    ) => {
      const nextAmplitude = Number(amplitude);
      const nextPeriodMs = Number(periodMs);
      const nextCenterY = Number(centerY);
      if (
        !Number.isFinite(nextAmplitude) ||
        !Number.isFinite(nextPeriodMs) ||
        nextPeriodMs <= 0 ||
        !Number.isFinite(nextCenterY)
      ) return;

      const control = getPlayerControl();
      if (control) control.noclipActive = false;
      runtime.state.forcedFlyY = null;
      runtime.state.sineFly = {
        amplitude: nextAmplitude,
        periodMs: nextPeriodMs,
        centerY: nextCenterY,
        startTime: scene.time.now,
      };
    },
    stopFly: () => {
      runtime.state.forcedFlyY = null;
      runtime.state.sineFly = null;
    },
    setFps: (fps = 60) => {
      const nextFps = Number(fps);
      if (!Number.isFinite(nextFps) || nextFps <= 0) return;

      const loop = scene.game.loop;
      const frameDelay = 1000 / nextFps;
      loop.targetFps = nextFps;
      Object.assign(loop, { actualFps: nextFps });
      loop._target = frameDelay;
      loop.raf.delay = frameDelay;
      loop.deltaHistory.fill(frameDelay);
      loop.resetDelta();
      runtime.engine.timing.timeScale = nextFps / 60;
    },
    fakeClearCondition: (type = "coin", amount = 1) => {
      const count = Math.max(1, Math.floor(Number(amount) || 1));
      for (let i = 0; i < count; i++) {
        emitCheatClearCondition(type);
      }
    },
    spoofClearConditionAt: (type = "coin", _x = 0, _y = 0, repeats = 1) => {
      const count = Math.max(1, Math.floor(Number(repeats) || 1));
      for (let i = 0; i < count; i++) {
        emitCheatClearCondition(type);
      }
    },
    forceDoorOpen: () => {
      runtime.levelState.doorOpen = true;
      syncDoorOpen(true);
    },
    moveDoorToPlayer: (offsetX = 0, offsetY = 0) => {
      const body = getPlayerBody();
      const doorEntity = nearestDoorEntity();
      const dx = Number(offsetX) || 0;
      const dy = Number(offsetY) || 0;
      if (!body || doorEntity === undefined) return;
      moveDoor(doorEntity, body.position.x + dx, body.position.y + 64 + dy);
    },
    moveNearestDoor: (dx = 0, dy = 0) => {
      const doorEntity = nearestDoorEntity();
      if (doorEntity === undefined) return;
      const transform = runtime.registry.getComponent(doorEntity, CT.Transform);
      if (!transform) return;
      moveDoor(
        doorEntity,
        transform.x + (Number(dx) || 0),
        transform.y + (Number(dy) || 0),
      );
    },
    resetDoors: () => {
      for (const [entity, start] of runtime.state.doorStartPositions.entries()) {
        moveDoor(entity, start.x, start.y);
      }
    },
    fakeGround: (v = true) => {
      const control = getPlayerControl();
      if (!control) return;
      control.forceGroundState = Boolean(v);
    },
    turnOffEnemyDamage: () => {
      const enemies = runtime.registry.view([CT.Enemy, CT.Hazard]);
      for (const entity of enemies) {
        const hazard = runtime.registry.getComponent(entity, CT.Hazard);
        if (hazard) {
          hazard.active = false;
          hazard.targetPlayer = false;
        }
      }
    },
    freezeEnemies: () => {
      const enemies = runtime.registry.view([CT.Enemy, CT.HorizontalWalker, CT.Physics]);
      for (const entity of enemies) {
        const walker = runtime.registry.getComponent(entity, CT.HorizontalWalker);
        if (walker) {
          walker.active = false;
        }
        const physics = runtime.registry.getComponent(entity, CT.Physics);
        if (physics?.body) {
          Matter.Body.setVelocity(physics.body, { x: 0, y: 0 });
        }
      }
    },
    removeAllEnemies: () => {
      const enemies = [...runtime.registry.view([CT.Enemy])];
      for (const entity of enemies) {
        destroyPhysicsEntity(runtime.world, runtime.registry, entity);
      }
    },
    disconnect: () => {
      console.warn("[anticheat] no websocket in replay mode");
    },
  };
}

function getPlayerControl() {
  return runtime.registry.getComponent(runtime.playerEntity, CT.Player);
}

function primeDoorStartPositions() {
  runtime.state.doorStartPositions.clear();
  for (const entity of runtime.registry.view([CT.Door, CT.Transform])) {
    const transform = runtime.registry.getComponent(entity, CT.Transform);
    if (!transform) continue;
    runtime.state.doorStartPositions.set(entity, { x: transform.x, y: transform.y });
  }
}

function nearestDoorEntity() {
  const body = getPlayerBody();
  const doors = runtime.registry.view([CT.Door, CT.Transform]);
  if (!body || doors.length === 0) return undefined;
  const firstDoor = doors[0];
  if (firstDoor === undefined) return undefined;
  return doors.reduce((best, entity) => {
    const bestTransform = runtime.registry.getComponent(best, CT.Transform);
    const nextTransform = runtime.registry.getComponent(entity, CT.Transform);
    if (!bestTransform) return entity;
    if (!nextTransform) return best;
    const bestDx = Math.abs(body.position.x - bestTransform.x);
    const nextDx = Math.abs(body.position.x - nextTransform.x);
    return nextDx < bestDx ? entity : best;
  }, firstDoor);
}

function moveDoor(entity, x, y) {
  const transform = runtime.registry.getComponent(entity, CT.Transform);
  const physics = runtime.registry.getComponent(entity, CT.Physics);
  if (!transform) return;
  transform.x = x;
  transform.y = y;
  if (physics?.body) {
    Matter.Body.setPosition(physics.body, { x, y: y - 64 });
  }
}

function emitCheatClearCondition(type) {
  const normalized = String(type ?? "coin").toLowerCase();
  const event = normalized.includes("coin")
    ? { type: "CoinCollected", coinType: "Item_Coin_Gold" }
    : normalized.includes("box")
      ? { type: "BoxDestroyed" }
      : normalized.includes("snail")
        ? { type: "EnemyKilled", enemyType: "Enemy_Snail" }
        : { type: "EnemyKilled", enemyType: "Enemy_Slime_Normal" };

  processRuntimeEvents(runtime, [event]);

  if (event.type === "CoinCollected") {
    runtime.callbacks.onCoinCollected?.(event.coinType);
  } else if (event.type === "BoxDestroyed") {
    runtime.callbacks.onBoxDestroyed?.(event.content);
  } else {
    runtime.callbacks.onEnemyKilled?.(event.enemyType);
  }

  if (isClearConditionSatisfied(runtime.levelState)) {
    runtime.levelState.doorOpen = true;
    syncDoorOpen(true);
  }
}

function syncDoorOpen(isOpen) {
  for (const entity of runtime.registry.view([CT.Door])) {
    const door = runtime.registry.getComponent(entity, CT.Door);
    if (!door) continue;
    door.isOpen = isOpen;
  }
}

function getPlayerBody() {
  return runtime.registry.getComponent(runtime.playerEntity, CT.Physics)?.body;
}

function overrideKeyState(key, isDown) {
  if (!key) return;

  scriptingCheatKeyOverrides.push({
    key,
    descriptor: Object.getOwnPropertyDescriptor(key, "isDown"),
    value: key.isDown,
  });

  Object.defineProperty(key, "isDown", {
    configurable: true,
    get: isDown,
  });
}

function scriptingCheatInput() {
  const frame = runtime?.inputRecorder.frame ?? 0;
  if (frame === scriptingCheatCachedFrame) {
    return scriptingCheatCachedInput;
  }

  scriptingCheatCachedFrame = frame;
  if (scriptingCheatJitterEnabled && shouldWaitThisFrame()) {
    scriptingCheatCachedInput = {};
    return scriptingCheatCachedInput;
  }

  const scriptFrame = scriptingCheatJitterEnabled
    ? scriptingCheatSequenceFrame++
    : frame;
  scriptingCheatCachedInput = scriptInputAtFrame(scriptFrame);
  return scriptingCheatCachedInput;
}

function scriptingCheatJitterHardInput() {
  const frame = runtime?.inputRecorder.frame ?? 0;
  if (frame === scriptingCheatCachedFrame) {
    return scriptingCheatCachedInput;
  }

  scriptingCheatCachedFrame = frame;
  scriptingCheatSequenceFrame++;
  scriptingCheatCachedInput = scriptJitterHardInput();
  return scriptingCheatCachedInput;
}

function scriptJitterHardInput() {
  if (scriptingCheatJitterHardState.kind === "right") {
    if (
      scriptingCheatJitterHardRightFrames >=
      SCRIPTING_CHEAT_JITTER_HARD_FRAMES_BEFORE_JUMP
    ) {
      scriptingCheatJitterHardRightFrames = 0;
      scriptingCheatJitterHardProtectedRightFrames =
        SCRIPTING_CHEAT_JITTER_HARD_PROTECTED_FRAMES_AFTER_JUMP;
      return {
        left: false,
        right: true,
        jump: true,
        run: false,
      };
    }

    if (scriptingCheatJitterHardProtectedRightFrames <= 0) {
      startRandomJitterHardInterruption();
    }
  }

  const state = scriptingCheatJitterHardState;
  if (state.kind === "leftRight") {
    const input = leftRightCancellationInputAtFrame(
      state.frame,
      state.startsLeft,
    );
    state.frame++;
    if (state.frame >= 40) {
      scriptingCheatJitterHardState = { kind: "right" };
    }
    return input;
  }

  if (state.kind === "fakeJump") {
    const input = {
      left: false,
      right: false,
      jump: state.frame < 10,
      run: false,
    };
    state.frame++;
    if (state.frame >= 120) {
      scriptingCheatJitterHardState = { kind: "right" };
    }
    return input;
  }

  if (state.kind === "wait") {
    const input = {
      left: false,
      right: false,
      jump: false,
      run: false,
    };
    state.frame++;
    if (state.frame >= state.duration) {
      scriptingCheatJitterHardState = { kind: "right" };
    }
    return input;
  }

  if (scriptingCheatJitterHardProtectedRightFrames > 0) {
    scriptingCheatJitterHardProtectedRightFrames--;
  }
  scriptingCheatJitterHardRightFrames++;

  return {
    left: false,
    right: true,
    jump: false,
    run: false,
  };
}

function leftRightCancellationInputAtFrame(frame, startsLeft) {
  const moveLeft = (Math.floor(frame / 2) % 2 === 0) === startsLeft;
  return {
    left: moveLeft,
    right: !moveLeft,
    jump: false,
    run: false,
  };
}

function startRandomJitterHardInterruption() {
  if (
    scriptingCheatJitterHardOptions.leftRight &&
    shouldTriggerJitterHardRule()
  ) {
    scriptingCheatJitterHardState = {
      kind: "leftRight",
      frame: 0,
      startsLeft: Math.random() < 0.5,
    };
    return;
  }

  if (
    scriptingCheatJitterHardOptions.fakeJump &&
    shouldTriggerJitterHardRule()
  ) {
    scriptingCheatJitterHardState = { kind: "fakeJump", frame: 0 };
    return;
  }

  if (
    scriptingCheatJitterHardOptions.waitRandom &&
    shouldTriggerJitterHardRule()
  ) {
    scriptingCheatJitterHardState = {
      kind: "wait",
      frame: 0,
      duration: 60,
    };
  }
}

function shouldTriggerJitterHardRule() {
  return Math.random() < SCRIPTING_CHEAT_JITTER_HARD_TRIGGER_CHANCE;
}

function normalizeScriptingCheatJitterHardOptions(options) {
  return {
    leftRight: options.leftRight === true,
    fakeJump: options.fakeJump === true,
    waitRandom: options.waitRandom === true,
  };
}

function scriptInputAtFrame(frame) {
  if (frame < 100) {
    const moveRight = frame % 2 === 0;
    return {
      left: !moveRight,
      right: moveRight,
      jump: false,
      run: false,
    };
  }

  return {
    left: false,
    right: true,
    jump: false,
    run: false,
  };
}

function shouldWaitThisFrame() {
  return Math.random() < 0.5;
}

function scheduleScriptingCheatEventTick(delayMs) {
  const delay =
    delayMs ??
    SCRIPTING_CHEAT_EVENT_INTERVAL_MS +
      (Math.random() - 0.5) * SCRIPTING_CHEAT_EVENT_JITTER_MS;

  scriptingCheatEventTimer = window.setTimeout(() => {
    scriptingCheatEventTimer = undefined;
    runScriptingCheatEventTick();
  }, delay);
}

function runScriptingCheatEventTick() {
  if (!runtime) return;

  dispatchScriptingCheatInput(scriptInputAtFrame(scriptingCheatSequenceFrame++));
  scheduleScriptingCheatEventTick();
}

function stopScriptingCheatEvents() {
  if (scriptingCheatEventTimer !== undefined) {
    window.clearTimeout(scriptingCheatEventTimer);
    scriptingCheatEventTimer = undefined;
  }

  dispatchScriptingCheatInput({});
  scriptingCheatEventHeldInput = {};
}

function dispatchScriptingCheatInput(input) {
  const releasedKeys = SCRIPTING_CHEAT_KEYS.filter(
    (scriptedKey) =>
      (scriptingCheatEventHeldInput[scriptedKey.inputKey] ?? false) &&
      !(input[scriptedKey.inputKey] ?? false),
  );
  const pressedKeys = SCRIPTING_CHEAT_KEYS.filter(
    (scriptedKey) =>
      !(scriptingCheatEventHeldInput[scriptedKey.inputKey] ?? false) &&
      (input[scriptedKey.inputKey] ?? false),
  );

  for (const scriptedKey of releasedKeys) {
    dispatchScriptingCheatKeyEvent("keyup", scriptedKey);
    scriptingCheatEventHeldInput[scriptedKey.inputKey] = false;
  }

  for (const scriptedKey of pressedKeys) {
    dispatchScriptingCheatKeyEvent("keydown", scriptedKey);
    scriptingCheatEventHeldInput[scriptedKey.inputKey] = true;
  }
}

function dispatchScriptingCheatKeyEvent(type, scriptedKey) {
  const target = getKeyboardEventTarget();
  if (!target) return;

  const event = new KeyboardEvent(type, {
    key: scriptedKey.key,
    code: scriptedKey.code,
    location: scriptedKey.location ?? 0,
    bubbles: true,
    cancelable: true,
    shiftKey:
      scriptedKey.inputKey === "run"
        ? type === "keydown"
        : scriptingCheatEventHeldInput.run ?? false,
  });

  Object.defineProperty(event, "keyCode", { value: scriptedKey.keyCode });
  Object.defineProperty(event, "which", { value: scriptedKey.keyCode });
  target.dispatchEvent(event);
}

function getKeyboardEventTarget() {
  return runtime?.cursors.left.plugin.manager.target ?? window;
}
