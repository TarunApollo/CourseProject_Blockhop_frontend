import type { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { TileMetadataResource } from "../../resources/tileMetadata";
import type { EventSink } from "../../eventQueue";
import { spawnShellFromEnemy } from "./shellStateMachine";
import {
  destroyPhysicsEntity,
} from "../../adapter/matterAdapter";
import {
  emitEnemyKilled,
  requestBurstForEntity
} from "./collisionEvents";

export type SpawnEntityFn = (
  type: string,
  x: number,
  y: number,
  frame?: number,
) => number;

export type ScheduledTask = {
  remove: () => void;
};

export type ScheduleDelayFn = (
  delayMs: number,
  callback: () => void,
) => ScheduledTask;


export type CollisionHandlerContext = {
  registry: Registry;
  tileMetadata: TileMetadataResource;
  spawnEntity : SpawnEntityFn;
  scheduleDelay : ScheduleDelayFn;
  events: EventSink;
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

export function isPlayerStomp(playerBody: any, pair: any): boolean {
  return playerBody.velocity.y > 0 && isVerticalContact(pair);
}

export function isPlayerJumpHitting(playerBody:any,pair:any):boolean{
  return playerBody.velocity.y <0 && isVerticalContact(pair);
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
  const isSnail = registry.hasComponent(enemyEntity,CT.Snail);
  if(isSnail)
  {
    // snail trans to shell is not an enemy kill
    // spawnShellFromEnemy can destroy the old snail entity
    spawnShellFromEnemy(context,enemyEntity);
    return ;
  }
  requestBurstForEntity(context, enemyEntity);
  emitEnemyKilled(context, getEnemyType(registry, enemyEntity));
  destroyPhysicsEntity(registry, enemyEntity);
}
