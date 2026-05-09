import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import {
  emitCoinCollected,
  requestBurstForGameObject,
} from "./collisionUtils";

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


/**
 * handler for player -> door
 */
export function handlePlayerDoor(
  context: CollisionHandlerContext,
  collision: MatchedCollision
): void {
  const door = context.registry.getComponent<Comp.Door>(
    collision.target,
    CT.Door,
  );
  if (door.isOpen) {

    //TODO:create a new system to manage the levelstate
    //end send the request to this system to handle the complete of 
    //the level
    emitLevelCompletedRequested();
  }
}
