import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import {
  destroyPhysicsEntity,
  getPhysicsBody,
} from "../../adapter/matterAdapter";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  emitBoxDestroyed,
  requestBurstForEntity,
  requestCoinPop,
  requestHorizontalWalkerReverse,
} from "./collisionEvents";
import {
  isSideContact,
  isPlayerJumpHitting,
  crushEnemy,
} from "./collisionUtils";



/**
 * player -> box
 * check the collision should condition
 * destroy the box
 */
export function handlePlayerDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const playerBody = getPhysicsBody(registry, collision.subject);
  const boxBody = getPhysicsBody(registry, collision.target);
  if (isPlayerJumpHitting(playerBody, collision.pair)) {
    breakDestructibleBox(context, collision.target, boxBody.bounds);
  }
}

/**
 * shell -> box
 * destory box and reverse direction of shell
 */
export function handleShellDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const shellWalker = registry.getComponent<Comp.HorizontalWalker>(
    collision.subject,
    CT.HorizontalWalker,
  );
  const boxBody = getPhysicsBody(registry, collision.target);

  if (shellWalker?.active) {
    breakDestructibleBox(context, collision.target, boxBody.bounds);
    requestHorizontalWalkerReverse(context, collision.subject);
  }
}

/**
 * if enemy -> box collision in correct angle
 * request reverse from movementsystem
 * 
 */
export function handleEnemyDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (isSideContact(collision.pair)) {
    requestHorizontalWalkerReverse(context, collision.subject);
  }
}


/**
 * main process of player->box
 * 1.request burn effect to animationsystem
 * 2.pop coin in the box if box has coin
 * 3.destory box
 * 4.kill enemy on box
 */
export function breakDestructibleBox(
  context: CollisionHandlerContext,
  boxEntity: number,
  boxBounds: any,
): void {
  const registry = context.registry;
  const box = registry.getComponent<Comp.DestructibleBox>(
    boxEntity,
    CT.DestructibleBox,
  );
  const sprite = registry.getComponent<Comp.Sprite>(
    boxEntity,
    CT.Sprite,
  );

  const body = getPhysicsBody(registry,boxEntity);
  if(sprite && body)
  {
    requestBurstForEntity(context, boxEntity);
  }

  if (box.content) {
    requestCoinPop(context, body.position.x, body.position.y, box.content);
  }

  emitBoxDestroyed(context, box.content);
  destroyPhysicsEntity(context.world, registry, boxEntity);
  findEnemiesOnBoxAndKill(context, boxBounds.min, boxBounds.max);
}


/**
 * helper for find enemy standing on box and crush it
 */
export function findEnemiesOnBoxAndKill(
  context: CollisionHandlerContext,
  boxMin: { x: number; y: number },
  boxMax: { x: number; y: number },
): void {
  const registry = context.registry;
  const enemyEntities = registry.view([CT.Enemy, CT.Physics]);

  for (let i = enemyEntities.length - 1; i >= 0; i--) {
    const enemyEntity = enemyEntities[i];
    const enemyBody = getPhysicsBody(registry,enemyEntity);
    if (!enemyBody) continue;

    const enemyX = enemyBody.position.x;
    const feetY = enemyBody.bounds.max.y;

    const isStandingOnBox =
      enemyX >= boxMin.x - 8 &&
      enemyX <= boxMax.x + 8 &&
      Math.abs(feetY - boxMin.y) <= 20;

    if (isStandingOnBox) crushEnemy(context, enemyEntity);
  }
}
