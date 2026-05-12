import Matter from "matter-js";
import {
  syncTransformsFromMatter,
} from "../adapter/matterAdapter";
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
import { worldBoundsSystem } from "../systems/worldBoundsSystem";
import { getMovementBlockingBodies } from "../systems/matterQuerySystem";
import { collisionFilterSystem } from "../systems/collision/collisionFilterSystem";
import type { HeadlessCreateResult } from "./create";

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
  runtime: HeadlessCreateResult,
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
