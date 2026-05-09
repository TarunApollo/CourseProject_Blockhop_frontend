import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  emitCoinCollected,
  requestBurstForGameObject,
} from "./collisionEvents";

import {
  destroyPhysicsEntity,
  getGameObject,
} from "../../phaserBridge";

/**
 * handler for player -> coin
 */
export function handlePlayerCoin(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const coin = registry.getComponent<Comp.Coin>(collision.target, CT.Coin);
  const gameObject = getGameObject(registry, collision.target);

  requestBurstForGameObject(gameObject);
  emitCoinCollected(coin.coinType);
  destroyPhysicsEntity(registry, collision.target);
}
