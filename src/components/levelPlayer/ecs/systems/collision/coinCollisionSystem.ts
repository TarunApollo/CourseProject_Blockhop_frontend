import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  emitCoinCollected,
  requestBurstForEntity,
} from "./collisionEvents";
import {
  destroyPhysicsEntity
} from "../../adapter/matterAdapter";

/**
 * handler for player -> coin
 */
export function handlePlayerCoin(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const coinEntity = collision.target;
  const coin = registry.getComponent<Comp.Coin>(
    coinEntity,CT.Coin);
  requestBurstForEntity(context, coinEntity);
  emitCoinCollected(context, coin.coinType);
  destroyPhysicsEntity(context.world, registry, coinEntity);
}
