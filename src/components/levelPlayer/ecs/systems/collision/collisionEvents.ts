import * as Comp from "../../components";
import { getPhysicsBody } from "../../adapter/matterAdapter";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { EventSink } from "../../eventQueue";

export type BurstRequest = {
  x: number;
  y: number;
  texture: string;
  frame: string | number;
};

type CollisionEventContext = {
  registry: Registry;
  events: EventSink;
};

export function requestBurst(
  context: CollisionEventContext,
  request: BurstRequest,
): void {
  context.events.emit({ type: "BurstRequested", ...request });
}

export function requestBurstForEntity(
  context: CollisionEventContext,
  entity: number,
): void {
  const registry = context.registry;
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  const body = getPhysicsBody(registry, entity);
  if (!sprite || !body) return;

  requestBurst(context, {
    x: body.position.x,
    y: body.position.y,
    texture: sprite.key,
    frame: sprite.frame,
  });
}


export function requestCoinPop(
  context: CollisionEventContext,
  x: number,
  y: number,
  coinType: string,
): void {
  context.events.emit({ type: "CoinPopRequested", x, y, coinType });
}

export function requestHorizontalWalkerReverse(
  context: CollisionEventContext,
  entity: number,
): void {
  context.events.emit({ type: "HorizontalWalkerReverseRequested", entity });
}

export function emitBoxDestroyed(
  context: CollisionEventContext,
  content?: string,
): void {
  context.events.emit({ type: "BoxDestroyed", content });
}

export function emitCoinCollected(
  context: CollisionEventContext,
  coinType: string,
): void {
  context.events.emit({ type: "CoinCollected", coinType });
}

export function emitEnemyKilled(
  context: CollisionEventContext,
  enemyType: string,
): void {
  context.events.emit({ type: "EnemyKilled", enemyType });
}

export function emitLevelCompletedRequested(context: CollisionEventContext): void {
  context.events.emit({ type: "LevelCompletedRequested" });
}

export function requestPlayerBounce(
  context: CollisionEventContext,
  entity: number,
): void {
  context.events.emit({ type: "PlayerBounceRequested", entity });
}
