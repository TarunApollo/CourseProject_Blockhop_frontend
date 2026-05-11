import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  requestHorizontalWalkerReverse,
  requestPlayerDamageContactEnd,
  requestPlayerDamageContactStart,
  requestPlayerBounce,
} from "./collisionEvents";
import {
  isSideContact,
  crushEnemy,
  isPlayerStomp,
} from "./collisionUtils";
import {
  getPhysicsBody,
} from "../../adapter/matterAdapter";

/**
 * enemy -> enemy
 * check collision dir and reverse both
 */
export function handleEnemyEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (isSideContact(collision.pair)) {
    requestHorizontalWalkerReverse(context, collision.subject);
    requestHorizontalWalkerReverse(context, collision.target);
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
    requestHorizontalWalkerReverse(context, collision.subject);
  }
}

/**
 * handler for player -> enemy
 * if player is dropping and touch the enemy it will kill enemy
 * and play animation
 * otherwise request damageSystem to hurt player
 */
export function handlePlayerEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const playerBody = getPhysicsBody(context.registry, collision.subject);
  if (isPlayerStomp(playerBody,collision.pair)) {
    crushEnemy(context, collision.target);
    requestPlayerBounce(context, collision.subject);
  }
  else {
    requestPlayerDamageContactStart(context, collision.subject, collision.target);
  }
}

/**
 * handler for player -> enemy end
 * end the damage on player
 */
export function handlePlayerEnemyEnd(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  requestPlayerDamageContactEnd(context, collision.subject, collision.target);
}
