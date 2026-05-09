import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import { emitLevelCompletedRequested } from "./collisionEvents";

/**
 * handler for player -> door
 */
export function handlePlayerDoor(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const door = context.registry.getComponent<Comp.Door>(
    collision.target,
    CT.Door,
  );

  if (door?.isOpen) {
    // TODO: create a level-state system to handle level completion.
    emitLevelCompletedRequested();
  }
}
