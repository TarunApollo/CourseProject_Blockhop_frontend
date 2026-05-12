import type { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { TileMetadataResource } from "../../resources/tileMetadata";
import type { EventSink } from "../../eventQueue";
import type { Scheduler } from "../../resources/scheduler";
import { spawnShellFromEnemy } from "./shellStateMachine";
import { destroyPhysicsEntity } from "../../adapter/matterAdapter";
import { emitEnemyKilled, requestBurstForEntity } from "./collisionEvents";

export type CollisionPair = {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  collision: {
    normal: {
      x: number;
      y: number;
    };
  };
};

export type CollisionHandlerContext = {
  registry: Registry;
  world: Matter.World;
  tileMetadata: TileMetadataResource;
  scheduler: Scheduler;
  events: EventSink;
};

/**
 * the number is Ecs entity id
 */
export type MatchedCollision = {
  subject: number;
  target: number;
  pair: CollisionPair;
};

export function isSideContact(pair: CollisionPair): boolean {
  return Math.abs(pair.collision.normal.x) > 0.5;
}

export function isVerticalContact(pair: CollisionPair): boolean {
  return Math.abs(pair.collision.normal.x) <= 0.5;
}

export function isPlayerStomp(
  playerBody: Matter.Body,
  pair: CollisionPair,
): boolean {
  return playerBody.velocity.y > 0 && isVerticalContact(pair);
}

export function isPlayerJumpHitting(
  playerBody: Matter.Body,
  pair: CollisionPair,
): boolean {
  return playerBody.velocity.y < 0 && isVerticalContact(pair);
}

export function getEnemyType(registry: Registry, entity: number): string {
  if (registry.hasComponent(entity, CT.Snail)) return "Enemy_Snail";
  if (registry.hasComponent(entity, CT.Slime)) return "Enemy_Slime_Normal";
  return "Enemy";
}

/**
 * helper for destory the finded enemy
 */
export function crushEnemy(
  context: CollisionHandlerContext,
  enemyEntity: number,
): void {
  const registry = context.registry;
  const isSnail = registry.hasComponent(enemyEntity, CT.Snail);
  if (isSnail) {
    // snail trans to shell is not an enemy kill
    // spawnShellFromEnemy can destroy the old snail entity
    spawnShellFromEnemy(context, enemyEntity);
    return;
  }
  requestBurstForEntity(context, enemyEntity);
  emitEnemyKilled(context, getEnemyType(registry, enemyEntity));
  destroyPhysicsEntity(context.world, registry, enemyEntity);
}
