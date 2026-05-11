import Matter from "matter-js";
import {
  CATEGORY_COIN,
  CATEGORY_DEFAULT,
  CATEGORY_DOOR,
  CATEGORY_ENEMY,
  CATEGORY_SEMISOLID,
} from "../../mechanics/constants";
import {
  getPhysicsBody,
  syncTransformsFromMatter,
} from "../adapter/matterAdapter";
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

  updatePlayerCollisionMask(runtime);
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

function updatePlayerCollisionMask(runtime: HeadlessCreateResult): void {
  const body = getPhysicsBody(
    runtime.registry,
    runtime.playerEntity,
  ) as Matter.Body | undefined;
  if (!body) return;

  const control = runtime.registry.getComponent<Comp.PlayerControl>(
    runtime.playerEntity,
    CT.Player,
  );
  const isDying = control?.lifeState === Comp.LifeState.DYING;
  const solidMask =
    body.velocity.y < 0
      ? CATEGORY_DEFAULT
      : CATEGORY_DEFAULT | CATEGORY_SEMISOLID;
  const mask = isDying
    ? 0
    : solidMask | CATEGORY_ENEMY | CATEGORY_COIN | CATEGORY_DOOR;

  for (const part of body.parts) {
    part.collisionFilter.mask = mask;
  }
}

//TODO(leon):if your phaser doesnt need the snapShot you can delete these code
//it make no sense to me
// export type PlayerSnapshot = {
//   entity: number;
//   x: number;
//   y: number;
//   vx: number;
//   vy: number;
//   isOnGround: boolean;
// };



// function getPlayerSnapshot(
//   context: PlayerTrackingContext,
// ): PlayerSnapshot | undefined {
//   const body = getPhysicsBody(
//     context.registry,
//     context.playerEntity,
//   ) as Matter.Body | undefined;
//   if (!body) return undefined;

//   const control = context.registry.getComponent<Comp.PlayerControl>(
//     context.playerEntity,
//     CT.Player,
//   );

//   return {
//     entity: context.playerEntity,
//     x: body.position.x,
//     y: body.position.y,
//     vx: body.velocity.x,
//     vy: body.velocity.y,
//     isOnGround: control?.isOnGround ?? false,
//   };
// }
