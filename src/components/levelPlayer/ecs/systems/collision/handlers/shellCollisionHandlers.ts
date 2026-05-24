import { CT } from "../../../core/ComponentTypes";
import { getPhysicsBody } from "../../../matter/matterAdapter";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "../collisionRouterSystem";
import { setVelocityX } from "../../aiMovement/movementUtils";
import {
  requestHorizontalMotionReverse,
  requestShellShieldHit,
} from "../utils/collisionEvents";
import {
  breakDestructibleBox,
  crushEnemy,
  isObstacleBlockingHorizontalMovement,
  isSideContact,
} from "../utils/collisionUtils";
import { Carrier } from "../../../components";

/**
 * shell -> box
 * destroy box and reverse direction of shell
 */
export function handleShellDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const shellMotion = registry.getComponent(
    collision.subject,
    CT.HorizontalMotion,
  );
  const shellBody = getPhysicsBody(registry, collision.subject);
  const boxBody = getPhysicsBody(registry, collision.target);
  if (!shellMotion?.active || !shellBody || !boxBody) return;

  if (
    isSideContact(collision.pair) &&
    isObstacleBlockingHorizontalMovement(
      shellBody,
      shellMotion.direction,
      boxBody,
    )
  ) {
    breakDestructibleBox(context, collision.target, boxBody.bounds);
    requestHorizontalMotionReverse(context, collision.subject);
  }
}

function getCarrier(context: CollisionHandlerContext): {
  carrier: Carrier | undefined;
  playerEntity: number;
} {
  const playerEntity = context.registry.view([CT.Player])[0]!;
  const carrier = context.registry.getComponent(playerEntity, CT.Carrier);
  return { carrier, playerEntity };
}

/**
 * handler for shell -> enemy
 * if the shell is held, emit ShellShieldHit for playerCarrySystem to handle.
 * if the shell is active (thrown/kicked), crush the enemy directly.
 */
export function handleShellEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const { carrier, playerEntity } = getCarrier(context);
  if (carrier?.heldEntity === collision.subject) {
    requestShellShieldHit(
      context,
      playerEntity,
      collision.subject,
      collision.target,
    );
    return;
  }

  const shellMotion = context.registry.getComponent(
    collision.subject,
    CT.HorizontalMotion,
  );
  if (shellMotion?.active) {
    crushEnemy(context, collision.target, { transformSnailToShell: false });
    requestHorizontalMotionReverse(context, collision.subject);
  }
}

/**
 * shell -> shell
 * if either shell is held, emit ShellShieldHit for playerCarrySystem to handle.
 * active shells bounce back.
 */
export function handleShellShell(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const { carrier, playerEntity } = getCarrier(context);
  const heldEntity = carrier?.heldEntity;

  if (heldEntity === collision.subject) {
    requestShellShieldHit(
      context,
      playerEntity,
      collision.subject,
      collision.target,
    );
    return;
  }
  if (heldEntity === collision.target) {
    requestShellShieldHit(
      context,
      playerEntity,
      collision.target,
      collision.subject,
    );
    return;
  }
  if (!isSideContact(collision.pair)) return;

  resolveShellCollision(context, collision.subject);
  resolveShellCollision(context, collision.target);
}

function resolveShellCollision(
  context: CollisionHandlerContext,
  entity: number,
): void {
  const shellMotion = context.registry.getComponent(
    entity,
    CT.HorizontalMotion,
  );
  if (!shellMotion) return;

  if (shellMotion.active) {
    requestHorizontalMotionReverse(context, entity);
  } else {
    const shellBody = getPhysicsBody(context.registry, entity);
    if (shellBody) setVelocityX(shellBody, 0);
  }
}
