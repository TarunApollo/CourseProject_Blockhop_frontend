import Matter from "matter-js";
import { EventBus } from "../../EventBus";
import {
  animationEventSystem,
  animationSystem,
} from "../../phaser/animationSystem";
import { renderSystem } from "../adapter/phaserAdapter";
import { syncTransformsFromMatter } from "../adapter/matterAdapter";
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

  if (runtime.state.isLevelComplete) {
    lockPlayerBodyRotation(runtime);
    return;
  }

  if (runtime.state.isDying) {
    lockPlayerBodyRotation(runtime);
    setPlayerAnimation(runtime, "idle");
    return;
  }

  playerMovementSystem(runtime.registry, playerOperationFromCursors(runtime), groundBodies);
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
