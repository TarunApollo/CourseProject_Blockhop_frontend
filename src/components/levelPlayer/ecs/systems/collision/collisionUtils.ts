import Phaser from "phaser";
import type { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { TileMetadataResource } from "../../resources/tileMetadata";
import { EventBus } from "../../../EventBus";

export type CollisionHandlerContext = {
  scene: Phaser.Scene;
  registry: Registry;
  tileMetadata: TileMetadataResource;
};

/**
 * the number is Ecs entity id
 */
export type MatchedCollision = {
  subject: number;
  target: number;
  pair: any;
};

export function isSideContact(pair: any): boolean {
  return Math.abs(pair.collision.normal.x) > 0.5;
}

export function isVerticalContact(pair: any): boolean {
  return Math.abs(pair.collision.normal.x) <= 0.5;
}

export function getEnemyType(registry: Registry, entity: number): string {
  if (registry.hasComponent(entity, CT.Snail)) return "Enemy_Snail";
  if (registry.hasComponent(entity, CT.Slime)) return "Enemy_Slime_Normal";
  return "Enemy";
}

export function requestBurstForGameObject(gameObject: any): void {
  EventBus.emit("BurstRequested", {
    x: gameObject.x,
    y: gameObject.y,
    texture: gameObject.texture.key,
    frame: gameObject.frame.name,
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
