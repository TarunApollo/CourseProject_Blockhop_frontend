import * as Comp from "../../../components";
import { ComponentTypes as CT } from "../../../core/ComponentTypes";
import {
  destroyPhysicsEntity,
  getPhysicsBody,
} from "../../../adapter/matterAdapter";
import { spawnHeadlessEntity } from "../../../entities/spawnEntity";
import type { CollisionHandlerContext } from "../collisionRouterSystem";

type ShellStateContext = Pick<
  CollisionHandlerContext,
  "registry" | "world" | "scheduler"
>;

/**
 * create a shell,destory snail and set countdown
 */
export function spawnShellFromEnemy(
  context: CollisionHandlerContext,
  enemyEntity: number,
): void {
  const registry = context.registry;
  const body = getPhysicsBody(registry, enemyEntity);
  const shellEntity = createEntityAtCoordinate(
    context,
    "Item_Shell",
    body.position.x,
    body.position.y,
  );
  restartShellRespawn(context, shellEntity);
  destroyPhysicsEntity(context.world, registry, enemyEntity);
}

/**
 * set countdown for shell
 */
export function restartShellRespawn(
  context: ShellStateContext,
  shellEntity: number,
): void {
  const shell = context.registry.getComponent<Comp.Shell>(
    shellEntity,
    CT.Shell,
  );
  shell.respawnTimer?.remove?.();
  shell.respawnTimer = context.scheduler.schedule(5000, () => {
    transformShellToSnail(context, shellEntity);
  });
}

/**
 * remove the countdown for shell
 */
export function pauseShellRespawn(
  context: ShellStateContext,
  shellEntity: number,
): void {
  const shell = context.registry.getComponent<Comp.Shell>(
    shellEntity,
    CT.Shell,
  );
  shell.respawnTimer?.remove?.();
  shell.respawnTimer = null;
}

/**
 * destory shell and create snail
 */
function transformShellToSnail(
  context: ShellStateContext,
  shellEntity: number,
): void {
  const body = getPhysicsBody(context.registry, shellEntity);
  createEntityAtCoordinate(
    context,
    "Enemy_Snail",
    body.position.x,
    body.position.y,
  );
  destroyPhysicsEntity(context.world, context.registry, shellEntity);
}

/**
 * helper for create entity
 */
function createEntityAtCoordinate(
  context: ShellStateContext,
  entityType: string,
  x: number,
  y: number,
): number {
  const entity = spawnHeadlessEntity(
    context.registry,
    context.world,
    entityType,
    x,
    y,
  );
  return entity;
}
