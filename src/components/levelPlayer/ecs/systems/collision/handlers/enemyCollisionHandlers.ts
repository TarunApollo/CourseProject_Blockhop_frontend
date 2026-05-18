import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "../collisionRouterSystem";
import { requestHorizontalWalkerReverse } from "../utils/collisionEvents";
import { isSideContact } from "../utils/collisionUtils";

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
 * if enemy -> box collision in correct angle
 * request reverse from movementsystem
 */
export function handleEnemyDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (isSideContact(collision.pair)) {
    requestHorizontalWalkerReverse(context, collision.subject);
  }
}
