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
import { levelStateSystem } from "../systems/levelStateSystem";
import { doorStateSystem } from "../systems/doorStateSystem";
import {
  horizontalMovementEventSystem,
  horizontalMovementSystem,
} from "../systems/movement/horizontalMovementSystem";
import {
  playerMovementEventSystem,
  playerMovementSystem,
  type PlayerOperation,
} from "../systems/movement/playerMovementSystem";
import { worldBoundsSystem } from "../systems/worldBoundsSystem";
import { getMovementBlockingBodies } from "../systems/matterQuerySystem";
import { collisionDynamicFilterSystem } from "../systems/collision/collisionDynamicFilterSystem";

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

/**
 * encapsulated for runTimeEvents
 */
export function processRuntimeEvents(
  runtime: LevelRuntime,
  events: GameEvent[],
): void {
  horizontalMovementEventSystem(runtime.registry, events);
  playerMovementEventSystem(runtime.registry, events);
  levelStateSystem(runtime.levelState, events);
  doorStateSystem(runtime.registry, runtime.levelState);
}



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

  return runtime.events.drain();
}
