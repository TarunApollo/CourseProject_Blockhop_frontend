import * as Matter from "matter-js";
import { syncTransformsFromMatter } from "../adapter/matterAdapter";
import type { Registry } from "../core/Registry";
import type { EventQueue, GameEvent } from "../eventQueue";
import type { LevelStateResource } from "../resources/levelState";
import type { Scheduler } from "../resources/scheduler";
import {
  playerOperationFromInput,
  type PlayerInputState,
} from "../systems/inputSystem";
import { horizontalMovementSystem } from "../systems/movement/horizontalMovementSystem";
import {
  playerMovementSystem,
  type PlayerOperation,
} from "../systems/movement/playerMovementSystem";
import { worldBoundsSystem } from "../systems/worldBoundsSystem";
import { getMovementBlockingBodies } from "../adapter/matterQueryUtils";
import { collisionDynamicFilterSystem } from "../systems/collision/collisionDynamicFilterSystem";
import { playerDamageEventSystem } from "../systems/playerDamageSystem";
import { processRuntimeEvents } from "../systems/runtimeEvents";

// Runtime is the game state without Phaser.
// ECS + Matter + events + scheduler and level state.
export type LevelRuntime = {
  engine: Matter.Engine;
  world: Matter.World;
  registry: Registry;
  events: EventQueue;
  scheduler: Scheduler;
  levelState: LevelStateResource;
  playerEntity: number;
  mapSize: {
    height: number;
  };
};

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

export function updateHeadlessLevel(
  runtime: LevelRuntime,
  options: HeadlessUpdateOptions = {},
): HeadlessUpdateResult {
  const events = updateRuntime(runtime, {
    input: playerOperationFromInput(options.input),
    deltaMs: options.deltaMs ?? DEFAULT_DELTA_MS,
    skipPlayerInput:
      runtime.levelState.isComplete || runtime.levelState.gameOver,
  });

  processRuntimeEvents(runtime, events);
  syncTransformsFromMatter(runtime.registry);

  return {
    events,
    doorOpen: runtime.levelState.doorOpen,
    isComplete: runtime.levelState.isComplete,
    gameOver: runtime.levelState.gameOver,
  };
}

// Move the runtime forward by one tick.
export function updateRuntime(
  runtime: LevelRuntime,
  options: {
    input: PlayerOperation;
    deltaMs: number;
    skipPlayerInput: boolean;
  },
): GameEvent[] {
  const groundBodies = getMovementBlockingBodies(runtime.world);

  horizontalMovementSystem(runtime.registry, groundBodies);

  if (!options.skipPlayerInput) {
    playerMovementSystem(runtime.registry, options.input, groundBodies);
  }

  collisionDynamicFilterSystem({
    registry: runtime.registry,
    playerEntity: runtime.playerEntity,
  });
  Matter.Engine.update(runtime.engine, options.deltaMs);
  runtime.scheduler.update(options.deltaMs);
  worldBoundsSystem({
    world: runtime.world,
    registry: runtime.registry,
    events: runtime.events,
    levelState: runtime.levelState,
    playerEntity: runtime.playerEntity,
    levelBottom: runtime.mapSize.height,
  });

  const physicsEvents = runtime.events.drain();
  playerDamageEventSystem(
    runtime.registry,
    physicsEvents,
    runtime.scheduler,
    runtime.events,
  );

  return [...physicsEvents, ...runtime.events.drain()];
}
