import Matter from "matter-js";
import { getPhysicsBody } from "../adapter/matterAdapter";
import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import type { EventQueue } from "../eventQueue";
import type { LevelStateResource } from "../resources/levelState";
import { isBodyBelowY } from "./matterQuerySystem";

export type PlayerTrackingContext = {
  registry: Registry;
  events: EventQueue;
  levelState: LevelStateResource;
  playerEntity: number;
  map: {
    heightInPixels: number;
  };
};

export type PlayerSnapshot = {
  entity: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isOnGround: boolean;
};

export function playerTrackingSystem(
  context: PlayerTrackingContext,
): PlayerSnapshot | undefined {
  emitGameOverIfPlayerBelowLevel(context);
  return getPlayerSnapshot(context);
}

function getPlayerSnapshot(
  context: PlayerTrackingContext,
): PlayerSnapshot | undefined {
  const body = getPhysicsBody(
    context.registry,
    context.playerEntity,
  ) as Matter.Body | undefined;
  if (!body) return undefined;

  const control = context.registry.getComponent<Comp.PlayerControl>(
    context.playerEntity,
    CT.Player,
  );

  return {
    entity: context.playerEntity,
    x: body.position.x,
    y: body.position.y,
    vx: body.velocity.x,
    vy: body.velocity.y,
    isOnGround: control?.isOnGround ?? false,
  };
}

/**
 * if player below the bottom of the map emit gameOver 
 * to levelState system
 */
function emitGameOverIfPlayerBelowLevel(context: PlayerTrackingContext): void {
  if (context.levelState.gameOver) return;

  const body = getPhysicsBody(
    context.registry,
    context.playerEntity,
  ) as Matter.Body | undefined;
  if (!body) return;

  if (isBodyBelowY(body, context.map.heightInPixels)) {
    context.events.emit({ type: "GameOver" });
  }
}
