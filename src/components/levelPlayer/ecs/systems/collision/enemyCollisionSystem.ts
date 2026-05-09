import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  requestHorizontalWalkerReverse,
  requestPlayerBounce,
} from "./collisionEvents";
import {
  isSideContact,
  crushEnemy,
  isPlayerStomp,
} from "./collisionUtils";
import {
  getPhysicsBody,
} from "../../phaserBridge";

/**
 * enemy -> enemy
 * check collision dir and reverse both
 */
export function handleEnemyEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (isSideContact(collision.pair)) {
    requestHorizontalWalkerReverse(collision.subject);
    requestHorizontalWalkerReverse(collision.target);
  }
}

/**
 * handler for shell -> enemy
 * if the shell is active
 * crush the target enemy
 * and reverse the shell
 */
export function handleShellEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const shellWalker = context.registry.getComponent<Comp.HorizontalWalker>(
    collision.subject,
    CT.HorizontalWalker,
  );
  if (shellWalker.active) {
    crushEnemy(context, collision.target);
    requestHorizontalWalkerReverse(collision.subject);
  }
}

/**
 * handler for player -> enemy
 * if player is dropping and touch the enemy it will kill enemy
 * and play animation
 * otherwise request damageSystem to lose hp for player
 */
export function handlePlayerEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const playerBody = getPhysicsBody(context.registry, collision.subject);
  if (isPlayerStomp(playerBody,collision.pair)) {
    crushEnemy(context, collision.target);
    requestPlayerBounce(collision.subject);
  }
}



