import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "../collisionRouterSystem";
import { requestHorizontalWalkerReverse, requestHorizontalFlyerReverse } from "../utils/collisionEvents";
import { isSideContact } from "../utils/collisionUtils";
import { CT } from "../../../core/ComponentTypes";

/**
 * enemy -> enemy
 * check collision dir and reverse both
 */
export function handleEnemyEnemy(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (isSideContact(collision.pair)) {
    reverseEnemyMovement(context, collision.subject);
    reverseEnemyMovement(context, collision.target);
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
    reverseEnemyMovement(context, collision.subject);
  }
}

function reverseEnemyMovement(
  context: CollisionHandlerContext,
  entity: number,
): void {
  const hasWalker = context.registry.getComponent(entity, CT.HorizontalWalker);
  const hasFlyer = context.registry.getComponent(entity, CT.HorizontalFlyer);

  if (hasWalker) {
    requestHorizontalWalkerReverse(context, entity);
  } else if (hasFlyer) {
    requestHorizontalFlyerReverse(context, entity);
  }
}
