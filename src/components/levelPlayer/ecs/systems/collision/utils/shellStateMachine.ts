import { CT } from "../../../core/ComponentTypes";
import {
  destroyPhysicsEntity,
  getPhysicsBody,
} from "../../../adapter/matterAdapter";
import { spawnHeadlessEntity } from "../../../entities/spawnEntity";
import type { CollisionHandlerContext } from "../collisionRouterSystem";

const SHELL_RESPAWN_DELAY_MS = 7000;

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
  if (!body) return;
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
  const shell = context.registry.getComponent(shellEntity, CT.Shell);
  if (!shell) return;
  shell.respawnTimer?.remove?.();
  shell.respawnTimer = context.scheduler.schedule(SHELL_RESPAWN_DELAY_MS, () => {
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
  const shell = context.registry.getComponent(shellEntity, CT.Shell);
  if (!shell) return;
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
  const shellWalker = context.registry.getComponent(
    shellEntity,
    CT.HorizontalWalker,
  );
  const body = getPhysicsBody(context.registry, shellEntity);
  if (!body) return;
  const snailEntity = createEntityAtCoordinate(
    context,
    "Enemy_Snail",
    body.position.x,
    body.position.y,
  );
  const snailWalker = context.registry.getComponent(
    snailEntity,
    CT.HorizontalWalker,
  );
  if (snailWalker) {
    snailWalker.direction =
      shellWalker && shellWalker.direction !== 0
        ? shellWalker.direction
        : -1;
  }
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
