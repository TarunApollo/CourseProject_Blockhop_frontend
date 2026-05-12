import Matter from "matter-js";
import { EventBus } from "../../EventBus";
import {
  animationSystem,
  animationEventSystem,
} from "../../phaser/animationSystem";
import {
  getPhysicsBody,
  syncTransformsFromMatter,
} from "../adapter/matterAdapter";
import { renderSystem } from "../adapter/phaserAdapter";
import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { GameEvent } from "../eventQueue";
import {
  playerOperationFromInput,
  type PlayerInputState,
} from "../systems/inputSystem";
import { levelStateSystem } from "../systems/levelStateSystem";
import {
  horizontalMovementEventSystem,
  horizontalMovementSystem,
} from "../systems/movement/horizontalMovementSystem";
import {
  playerMovementEventSystem,
  playerMovementSystem,
} from "../systems/movement/playerMovementSystem";
import { lockRotation } from "../systems/movement/movementUtils";
import { worldBoundsSystem } from "../systems/worldBoundsSystem";
import { getMovementBlockingBodies } from "../systems/matterQuerySystem";
import { collisionFilterSystem } from "../systems/collision/collisionFilterSystem";

type LevelRuntime = any;

export type HeadlessUpdateOptions = {
  input?: PlayerInputState;
  deltaMs?: number;
};

export type HeadlessUpdateResult = {
  events: GameEvent[];
  doorOpen: boolean;
  isComplete: boolean;
  gameOver: boolean;
};

const DEFAULT_DELTA_MS = 1000 / 60;

export function updatePhaserLevel(
  runtime: LevelRuntime,
  scene: any,
  _time: number,
  delta: number,
): void {
  const groundBodies = getMovementBlockingBodies(runtime.world);

  horizontalMovementSystem(runtime.registry, groundBodies);

  if (runtime.completionSequenceStarted || runtime.levelState.isComplete) {
    lockPlayerBodyRotation(runtime);
    return;
  }

  if (runtime.levelState.gameOver) {
    lockPlayerBodyRotation(runtime);
    return;
  }

  if (isPlayerDying(runtime)) {
    lockPlayerBodyRotation(runtime);
    setPlayerAnimation(runtime, "idle");
    return;
  }

  playerMovementSystem(
    runtime.registry,
    playerOperationFromCursors(runtime),
    groundBodies,
  );
  collisionFilterSystem(runtime);
  Matter.Engine.update(runtime.engine, delta);
  worldBoundsSystem(runtime);

  const events = runtime.events.drain();
  processPhaserGameEvents(runtime, scene, events);
  syncTransformsFromMatter(runtime.registry);
  renderSystem(runtime.renderContext, runtime.registry);
  animationSystem(runtime.renderContext, runtime.registry);
}

export function updateHeadlessLevel(
  runtime: LevelRuntime,
  options: HeadlessUpdateOptions = {},
): HeadlessUpdateResult {
  const input = playerOperationFromInput(options.input);
  const deltaMs = options.deltaMs ?? DEFAULT_DELTA_MS;

  levelStateSystem(runtime.levelState, []);

  if (!runtime.levelState.isComplete) {
    const groundBodies = getMovementBlockingBodies(runtime.world);
    horizontalMovementSystem(runtime.registry, groundBodies);
    playerMovementSystem(runtime.registry, input, groundBodies);
  }

  collisionFilterSystem(runtime);
  Matter.Engine.update(runtime.engine, deltaMs);
  worldBoundsSystem(runtime);

  const events = runtime.events.drain();
  horizontalMovementEventSystem(runtime.registry, events);
  playerMovementEventSystem(runtime.registry, events);
  levelStateSystem(runtime.levelState, events);
  syncTransformsFromMatter(runtime.registry);

  return {
    events,
    doorOpen: runtime.levelState.doorOpen,
    isComplete: runtime.levelState.isComplete,
    gameOver: runtime.levelState.gameOver,
  };
}

function playerOperationFromCursors(runtime: LevelRuntime) {
  const cursors = runtime.cursors;

  return {
    left: Boolean(cursors?.left?.isDown),
    right: Boolean(cursors?.right?.isDown),
    jump: Boolean(cursors?.up?.isDown),
    run: Boolean(cursors?.shift?.isDown),
  };
}

function isPlayerDying(runtime: LevelRuntime): boolean {
  const control = runtime.registry.getComponent<Comp.PlayerControl>(
    runtime.playerEntity,
    CT.Player,
  );
  return control?.lifeState === Comp.LifeState.DYING;
}

function lockPlayerBodyRotation(runtime: LevelRuntime): void {
  const body = getPhysicsBody(runtime.registry, runtime.playerEntity);
  if (!body) return;
  lockRotation(body);
}

function setPlayerAnimation(runtime: LevelRuntime, animationKey: string): void {
  const animator = runtime.registry.getComponent<Comp.Animator>(
    runtime.playerEntity,
    CT.Animator,
  );
  if (animator) animator.currentAnim = animationKey;
}

function processPhaserGameEvents(
  runtime: LevelRuntime,
  _scene: any,
  events: GameEvent[],
): void {
  horizontalMovementEventSystem(runtime.registry, events);
  playerMovementEventSystem(runtime.registry, events);
  animationEventSystem(runtime.renderContext, runtime.tileMetadata, events);
  levelStateSystem(runtime.levelState, events);

  if (runtime.lastDoorOpen !== runtime.levelState.doorOpen) {
    runtime.lastDoorOpen = runtime.levelState.doorOpen;
    runtime.setDoorVisualState?.(runtime.levelState.doorOpen);
    if (runtime.levelState.doorOpen) {
      EventBus.emit("ClearConditionCompleted");
    }
  }

  for (const event of events) {
    switch (event.type) {
      case "CoinCollected":
        EventBus.emit("CoinCollected", event.coinType);
        break;
      case "EnemyKilled":
        EventBus.emit("EnemyKilled", event.enemyType);
        break;
      case "BoxDestroyed":
        EventBus.emit("BoxDestroyed", event.content);
        break;
    }
  }

  if (runtime.levelState.gameOver && !runtime.attemptFailedEmitted) {
    runtime.attemptFailedEmitted = true;
    EventBus.emit("AttemptFailed");
  }

  if (runtime.levelState.isComplete) {
    runtime.completeLevel?.();
  }
}
