import Matter from "matter-js";
import {
  CATEGORY_COIN,
  CATEGORY_DEFAULT,
  CATEGORY_DOOR,
  CATEGORY_ENEMY,
  CATEGORY_SEMISOLID,
} from "../../../mechanics/constants";
import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

export type CollisionFilterContext = {
  registry: Registry;
  playerEntity: number;
};


/**
 * static filter -> bitmask in constant.js to filter 
 * the non-collision pair before generating collision pair
 * dynamic filter -> update with the player's velocity with
 * semisolid
 */
export function collisionFilterSystem(context: CollisionFilterContext): void {
  updatePlayerCollisionMask(context);
}

/**
 * static filter from old constant.js
 */
export function applyStaticCollisionFilter(
  body: Matter.Body,
  physics: Comp.Physics,
): void {
  applyCollisionFilter(
    body,
    physics.category,
    physics.collidesWith.reduce((mask, category) => mask | category, 0),
  );
}

export function applyTileCollisionFilter(
  body: Matter.Body,
  label: string,
): void {
  applyCollisionFilter(
    body,
    label === "Semisolid" ? CATEGORY_SEMISOLID : CATEGORY_DEFAULT,
    0xffff,
  );
}

/**
 * player can jump on semisolid withoutCollision
 * but when it on the semisolid it will trigger collision(semisolid
 * will become a ground)
 */
function updatePlayerCollisionMask(context: CollisionFilterContext): void {
  const physics = context.registry.getComponent<Comp.Physics>(
    context.playerEntity,
    CT.Physics,
  );
  const body = physics?.body as Matter.Body | undefined;
  if (!body) return;

  const control = context.registry.getComponent<Comp.PlayerControl>(
    context.playerEntity,
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

  applyCollisionMask(body, mask);
}

function applyCollisionFilter(
  body: Matter.Body,
  category: number,
  mask: number,
): void {
  body.collisionFilter.category = category;
  applyCollisionMask(body, mask);
}

function applyCollisionMask(body: Matter.Body, mask: number): void {
  const parts = body.parts.length > 0 ? body.parts : [body];
  for (const part of parts) {
    part.collisionFilter.mask = mask;
  }
}
