import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";

import {
  destroyPhysicsEntity,
  getPhysicsBody,
} from "../../phaserBridge";
import { EventBus } from "../../../EventBus";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import { crushEnemiesOnBox } from "./enemyCollisionSystem";


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
  if (playerBoxCondChecker(playerBody, collision.pair)) {
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
    EventBus.emit("HorizontalWalkerReverseRequested", {
      entity: collision.subject,
    });
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
  if (enemyBoxCondChecker(collision.pair)) {
    EventBus.emit("HorizontalWalkerReverseRequested", {
      entity: collision.subject,
    });
  }
}

/**
 * helper for detecting player -> box condition
 */
function playerBoxCondChecker(playerBody: any, pair: any): boolean {
  const isJumpUp = playerBody.velocity.y < 0;
  const isVerticalContact = Math.abs(pair.collision.normal.x) <= 0.5;

  return isJumpUp && isVerticalContact;
}

/**
 * helper for detecting enemy -> box condition
 */
function enemyBoxCondChecker(pair: any): boolean {
  return Math.abs(pair.collision.normal.x) > 0.5;
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

  //request burst animation
  EventBus.emit("BurstRequested", {
    x: gameObject.x,
    y: gameObject.y,
    texture: gameObject.texture.key,
    frame: gameObject.frame.name,
  });

  if (box.content) {
    EventBus.emit("CoinPopRequested", {
      x: gameObject.x,
      y: gameObject.y,
      coinType: box.content,
    })
  }

  //request boxdestory animation
  EventBus.emit("BoxDestroyed", box.content);
  destroyPhysicsEntity(registry, boxEntity);
  crushEnemiesOnBox(context, boxBounds.min, boxBounds.max);
}

