import { EventBus } from "../../../EventBus";
import * as Comp from "../../components";
import { getPhysicsBody } from "../../adapter/matterAdapter";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

export type BurstRequest = {
  x: number;
  y: number;
  texture: string;
  frame: string | number;
};

export function requestBurst(request: BurstRequest): void {
  EventBus.emit("BurstRequested", request);
}

export function requestBurstForEntity(
  registry: Registry,
  entity: number,
): void {
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  const body = getPhysicsBody(registry, entity);
  if (!sprite || !body) return;

  requestBurst({
    x: body.position.x,
    y: body.position.y,
    texture: sprite.key,
    frame: sprite.frame,
  });
}


export function requestCoinPop(
  x: number,
  y: number,
  coinType: string,
): void {
  EventBus.emit("CoinPopRequested", { x, y, coinType });
}

export function requestHorizontalWalkerReverse(entity: number): void {
  EventBus.emit("HorizontalWalkerReverseRequested", { entity });
}

export function emitBoxDestroyed(content?: string): void {
  EventBus.emit("BoxDestroyed", content);
}

export function emitCoinCollected(coinType: string): void {
  EventBus.emit("CoinCollected", coinType);
}

export function emitEnemyKilled(enemyType: string): void {
  EventBus.emit("EnemyKilled", enemyType);
}

export function emitLevelCompletedRequested(): void {
  EventBus.emit("LevelCompletedRequested");
}

export function requestPlayerBounce(entity: number): void {
  EventBus.emit("PlayerBounceRequested", { entity });
}
