import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import { emitPlayerEnteredDoor } from "./collisionEvents";

/**
 * handler for player -> door
 */
export function handlePlayerDoor(
  context: CollisionHandlerContext,
  _collision: MatchedCollision,
): void {
  emitPlayerEnteredDoor(context);
}
