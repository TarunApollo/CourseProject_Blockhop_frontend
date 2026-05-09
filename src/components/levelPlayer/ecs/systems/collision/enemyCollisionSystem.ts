import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {

  isSideContact,
  requestHorizontalWalkerReverse,
} from "./collisionUtils";

/**
 * enemy -> enemy
 * check collision condition and reverse both
 */
export function handleEnemyEnemy(
  _context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (isSideContact(collision.pair)) {
    requestHorizontalWalkerReverse(collision.subject);
    requestHorizontalWalkerReverse(collision.target);
  }
}


