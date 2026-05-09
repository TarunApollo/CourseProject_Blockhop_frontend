import { EventBus } from "../../../EventBus";

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

export function emitLevelCompletedRequested(): void {
  EventBus.emit("LevelCompletedRequested");
}

export function requestPlayerBounce(entity: number): void {
  EventBus.emit("PlayerBounceRequested", { entity });
}
