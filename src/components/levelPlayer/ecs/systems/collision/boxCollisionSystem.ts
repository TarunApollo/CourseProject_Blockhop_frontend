import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";

import {
  destroyPhysicsEntity,
  getGameObject,
  getPhysicsBody,
} from "../../phaserBridge";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  emitBoxDestroyed,
  emitEnemyKilled,
  getEnemyType,
  isSideContact,
  isVerticalContact,
  requestBurstForGameObject,
  requestCoinPop,
  requestHorizontalWalkerReverse,
} from "./collisionUtils";
import { spawnShellFromEnemy } from "./shellStateMachine";


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
  const isJumpUp = playerBody.velocity.y < 0;
  if (isJumpUp && isVerticalContact(collision.pair)) {
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
    requestHorizontalWalkerReverse(collision.subject);
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
    requestHorizontalWalkerReverse(collision.subject);
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
  const gameObject = sprite?.gameObject;

  requestBurstForGameObject(gameObject);

  if (box.content) {
    requestCoinPop(gameObject.x, gameObject.y, box.content);
  }

  emitBoxDestroyed(box.content);
  destroyPhysicsEntity(registry, boxEntity);
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
  const enemyEntities = registry.view([CT.Enemy, CT.Sprite]);

  for (let i = enemyEntities.length - 1; i >= 0; i--) {
    const enemyEntity = enemyEntities[i];
    const gameObject = getGameObject(registry, enemyEntity);
    if (!gameObject) continue;

    const feetY = gameObject.y + gameObject.displayHeight / 2;
    const isStandingOnBox =
      gameObject.x >= boxMin.x - 8 &&
      gameObject.x <= boxMax.x + 8 &&
      Math.abs(feetY - boxMin.y) <= 20;

    if (isStandingOnBox) crushEnemy(context, enemyEntity);
  }
}

/**
 * helper for destory the finded enemy
 */
export function crushEnemy(
  context: CollisionHandlerContext,
  enemyEntity: number,
): void {
  const registry = context.registry;
  const gameObject = getGameObject(registry, enemyEntity);
  const isSnail = registry.hasComponent(enemyEntity,CT.Snail);
  if(isSnail)
  {
    // snail trans to shell is not an enemy kill
    // spawnShellFromEnemy can destroy the old snail entity
    spawnShellFromEnemy(context,enemyEntity);
    return ;
  }
  requestBurstForGameObject(gameObject);
  emitEnemyKilled(getEnemyType(registry, enemyEntity));
  destroyPhysicsEntity(registry, enemyEntity);
}
