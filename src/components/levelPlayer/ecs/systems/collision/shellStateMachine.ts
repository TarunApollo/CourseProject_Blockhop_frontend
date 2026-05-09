import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import { spawnEntity } from "../../EntityFactory";
import {
  destroyPhysicsEntity,
  getGameObject,
} from "../../phaserBridge";
import { requireTileFrameByType } from "../../resources/tileMetadata";
import type { CollisionHandlerContext } from "./collisionUtils";

/**
 * create a shell,destory snail and set countdown
 */
export function spawnShellFromEnemy(
  context: CollisionHandlerContext,
  enemyEntity: number,
): void {
  const registry = context.registry;
  const gameObject = getGameObject(registry, enemyEntity);
  const shellEntity = createEntityAtCoordinate(context, "Item_Shell", gameObject.x, gameObject.y);
  const shell = registry.getComponent<Comp.Shell>(shellEntity, CT.Shell);
  scheduleShellRespawn(context, shellEntity);
  destroyPhysicsEntity(registry, enemyEntity);
}

/**
 * set countdown for shell 
 */
function scheduleShellRespawn(
  context: CollisionHandlerContext,
  shellEntity: number,
): void {
  const shell = context.registry.getComponent<Comp.Shell>(
    shellEntity,
    CT.Shell,
  );
  shell.respawnTimer?.remove?.();
  shell.respawnTimer = context.scene.time.delayedCall(5000, () => {
    transformShellToSnail(context, shellEntity);
  });
}

/**
 * destory shell and create snail
 */
function transformShellToSnail(
  context: CollisionHandlerContext,
  shellEntity: number,
): void {
  const gameObject = getGameObject(context.registry, shellEntity);
  createEntityAtCoordinate(context, "Enemy_Snail", gameObject.x, gameObject.y);
  destroyPhysicsEntity(context.registry, shellEntity);
}

/**
 * helper for create entity
 */
function createEntityAtCoordinate(
  context: CollisionHandlerContext,
  entityType: string,
  x: number,
  y: number): number {
  const frame =
    entityType === "Item_Shell"
      ? requireTileFrameByType(context.tileMetadata, "Item_Shell")
      : undefined;
  const entity = spawnEntity(
    context.scene,
    context.registry,
    entityType,
    x,
    y,
    frame,
  );
  return entity;
}
