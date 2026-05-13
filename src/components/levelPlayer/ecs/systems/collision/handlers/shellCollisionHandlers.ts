import * as Comp from "../../../components";
import { ComponentTypes as CT } from "../../../core/ComponentTypes";
import { getPhysicsBody } from "../../../adapter/matterAdapter";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "../collisionRouterSystem";
import { requestHorizontalWalkerReverse } from "../utils/collisionEvents";
import { breakDestructibleBox, crushEnemy } from "../utils/collisionUtils";

/**
 * shell -> box
 * destroy box and reverse direction of shell
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
