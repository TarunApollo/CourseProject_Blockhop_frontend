import * as Matter from "matter-js";
import {
  applyCollisionMask,
  destroyPhysicsEntity,
  getPhysicsBody,
} from "../../matter/matterAdapter";
import { LifeState } from "../../components/ComponentEnum";
import { CT } from "../../core/ComponentTypes";
import { Registry } from "../../core/Registry";
import type { EventSink, GameEvent } from "../../eventQueue";
import type { LevelStateResource } from "../../resources/levelState";
import { getMovementBlockingBodies } from "../../matter/matterUtils";
import {
  CATEGORY_PLAYER,
  CATEGORY_ENEMY,
  CATEGORY_SHELL,
} from "../../resources/physicsConfig";
import { restartShellRespawn } from "../collision/utils/shellStateMachine";
import { requestBurstForEntity } from "../collision/utils/collisionEvents";
import type { RuntimeEventContext } from "../runtimeEvents";
import { getEnemyType } from "../collision/utils/collisionUtils";

const HELD_SHELL_EXPOSED_FRACTION = 0.5;
const SHELL_PLAYER_REARM_DELAY_MS = 150;
const SHELL_THROW_SPEED = 18;
const SHELL_RELEASE_CLEARANCE = 0.5;

export function playerCarryEventSystem(
  context: RuntimeEventContext,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "ShellEquipRequested":
        equipShell(context, event.playerEntity, event.shellEntity);
        break;
      case "ShellThrowRequested":
        throwShell(context, event.playerEntity);
        break;
      case "ShellShieldHit":
        handleShieldHit(
          context,
          event.carrierEntity,
          event.shellEntity,
          event.targetEntity,
        );
        break;
    }
  }
}

export type PlayerCarrySystemContext = {
  registry: Registry;
  levelState: LevelStateResource;
  world: Matter.World;
  events: EventSink;
};

export function playerCarrySystem(
  context: PlayerCarrySystemContext,
): void {
  const { registry, levelState } = context;
  for (const entity of registry.view([
    CT.Carrier,
    CT.Physics,
    CT.Player,
    CT.PlayerLife,
  ])) {
    const carrier = registry.getComponent(entity, CT.Carrier);
    const physics = registry.getComponent(entity, CT.Physics);
    const life = registry.getComponent(entity, CT.PlayerLife);
    const animator = registry.getComponent(entity, CT.Animator);
    if (!carrier || !physics || !life) continue;

    if (carrier.heldEntity == null) continue;
    if (
      life.lifeState !== LifeState.ALIVE ||
      levelState.isComplete ||
      levelState.gameOver
    ) {
      detachShell(registry, carrier.heldEntity);
      carrier.heldEntity = null;
      continue;
    }

    const playerBody = physics.body;
    const shellBody = getPhysicsBody(registry, carrier.heldEntity);
    if (!playerBody || !shellBody) {
      detachShell(registry, carrier.heldEntity);
      carrier.heldEntity = null;
      continue;
    }

    const facing = animator?.flipX ? -1 : 1;
    positionHeldShellNearPlayer(
      playerBody,
      shellBody,
      facing,
      playerBody.position.y + carrier.offsetY,
    );
    Matter.Body.setVelocity(shellBody, playerBody.velocity);
  }
}

function positionHeldShellNearPlayer(
  playerBody: Matter.Body,
  shellBody: Matter.Body,
  facing: number,
  targetY: number,
): void {
  const playerWidth = playerBody.bounds.max.x - playerBody.bounds.min.x;
  const shellWidth = shellBody.bounds.max.x - shellBody.bounds.min.x;
  const distanceFromPlayer =
    (playerWidth + shellWidth * HELD_SHELL_EXPOSED_FRACTION) * 0.5;
  const target = {
    x: playerBody.position.x + facing * distanceFromPlayer,
    y: targetY,
  };

  Matter.Body.setPosition(shellBody, target);
}

/**
 * handle collisions between a shell(held) and an enemy or another shell.
 */
function handleShieldHit(
  context: RuntimeEventContext,
  carrierEntity: number,
  shellEntity: number,
  targetEntity: number,
): void {
  if (context.registry.hasComponent(targetEntity, CT.Enemy)) {
    const enemyType = getEnemyType(context.registry, targetEntity);
    context.events.emit({ type: "EnemyKilled", enemyType });
  } else if (context.registry.hasComponent(targetEntity, CT.Shell)) {
    context.events.emit({ type: "EnemyKilled", enemyType: "Enemy_Snail" });
  }
  context.events.emit({ type: "EnemyKilled", enemyType: "Enemy_Snail" });

  requestBurstForEntity(context, targetEntity);
  requestBurstForEntity(context, shellEntity);
  destroyPhysicsEntity(context.world, context.registry, targetEntity);
  destroyPhysicsEntity(context.world, context.registry, shellEntity);

  const carrier = context.registry.getComponent(carrierEntity, CT.Carrier);
  if (carrier) {
    carrier.heldEntity = null;
  }
}

function detachShell(registry: Registry, shellEntity: number) {
  if (shellEntity == null) return;
  const shellBody = getPhysicsBody(registry, shellEntity);
  const shellPhysics = registry.getComponent(shellEntity, CT.Physics);
  if (!shellBody || !shellPhysics) return;

  const restoreMask = shellPhysics.collidesWith.reduce(
    (m: number, c: number) => m | c,
    0,
  );
  applyCollisionMask(shellBody, restoreMask);
  Matter.Body.set(shellBody, { isSensor: shellPhysics.isSensor });
  Matter.Sleeping.set(shellBody, false);
  Matter.Body.setVelocity(shellBody, { x: 0, y: 0 });
}

function equipShell(
  context: RuntimeEventContext,
  playerEntity: number,
  shellEntity: number,
): void {
  const carrier = context.registry.getComponent(playerEntity, CT.Carrier);
  if (!carrier || carrier.heldEntity != null) return;

  const shell = context.registry.getComponent(shellEntity, CT.Shell);
  const shellWalker = context.registry.getComponent(
    shellEntity,
    CT.HorizontalWalker,
  );
  const shellMotion = context.registry.getComponent(
    shellEntity,
    CT.HorizontalMotion,
  );
  const hazard = context.registry.getComponent(shellEntity, CT.Hazard);
  const shellBody = getPhysicsBody(context.registry, shellEntity);
  if (!shell || !shellWalker || !shellMotion || !hazard || !shellBody) return;

  carrier.heldEntity = shellEntity;

  hazard.active = false;
  hazard.targetPlayer = false;
  hazard.targetEnemy = false;

  shellMotion.active = false;
  shellMotion.direction = 0;
  shellWalker.skipVelCheck = false;

  // while the shell is carried by the player the ground is not active on the collision mask
  // the shell as shield mechanic is implemented by setting a mask on the shell
  // so that it should only interact with enemies
  applyCollisionMask(shellBody, CATEGORY_ENEMY | CATEGORY_SHELL);
  Matter.Body.set(shellBody, { isSensor: true });

  shell.respawnTimer?.remove?.();
  shell.respawnTimer = null;
  shell.ignorePlayerUntilContactEnd = false;
}

function throwShell(context: RuntimeEventContext, playerEntity: number): void {
  const carrier = context.registry.getComponent(playerEntity, CT.Carrier);
  const playerPhysics = context.registry.getComponent(playerEntity, CT.Physics);
  const playerAnimator = context.registry.getComponent(
    playerEntity,
    CT.Animator,
  );
  const shellEntity = carrier?.heldEntity ?? null;
  if (!carrier || shellEntity == null || !playerPhysics?.body) return;

  const shellWalker = context.registry.getComponent(
    shellEntity,
    CT.HorizontalWalker,
  );
  const shellMotion = context.registry.getComponent(
    shellEntity,
    CT.HorizontalMotion,
  );
  const shell = context.registry.getComponent(shellEntity, CT.Shell);
  const hazard = context.registry.getComponent(shellEntity, CT.Hazard);
  const shellBody = getPhysicsBody(context.registry, shellEntity);
  if (!shellWalker || !shellMotion || !shell || !hazard || !shellBody) return;

  const facing = playerAnimator?.flipX ? -1 : 1;
  const launchVx = facing * SHELL_THROW_SPEED;

  detachShell(context.registry, shellEntity);
  setShellPlayerCollision(context.registry, shellEntity, false);
  resolveShellReleaseOverlap(context.world, shellBody, facing);
  carrier.heldEntity = null;

  shellMotion.direction = facing;
  shellMotion.active = true;
  shellMotion.speed = SHELL_THROW_SPEED;
  shellWalker.skipVelCheck = true;

  hazard.active = true;
  hazard.targetEnemy = true;
  hazard.targetPlayer = false;
  shell.ignorePlayerUntilContactEnd = true;

  Matter.Body.setVelocity(shellBody, { x: launchVx, y: 0 });

  armShellAgainstPlayerAfterRelease(context, shellEntity);
  restartShellRespawn(context, shellEntity);
}

function resolveShellReleaseOverlap(
  world: Matter.World,
  shellBody: Matter.Body,
  facing: number,
): void {
  const blockingBodies = getMovementBlockingBodies(world);
  let correction = 0;

  for (const blockingBody of blockingBodies) {
    if (!Matter.Bounds.overlaps(shellBody.bounds, blockingBody.bounds))
      continue;

    const overlap =
      facing > 0
        ? shellBody.bounds.max.x - blockingBody.bounds.min.x
        : blockingBody.bounds.max.x - shellBody.bounds.min.x;

    if (overlap > 0) {
      correction = Math.max(correction, overlap + SHELL_RELEASE_CLEARANCE);
    }
  }

  if (correction <= 0) return;

  Matter.Body.setPosition(shellBody, {
    x: shellBody.position.x - facing * correction,
    y: shellBody.position.y,
  });
}

function armShellAgainstPlayerAfterRelease(
  context: RuntimeEventContext,
  shellEntity: number,
): void {
  context.scheduler.schedule(SHELL_PLAYER_REARM_DELAY_MS, () => {
    const shell = context.registry.getComponent(shellEntity, CT.Shell);
    const shellWalker = context.registry.getComponent(
      shellEntity,
      CT.HorizontalWalker,
    );
    const shellMotion = context.registry.getComponent(
      shellEntity,
      CT.HorizontalMotion,
    );
    const hazard = context.registry.getComponent(shellEntity, CT.Hazard);

    if (!shell || !shellWalker || !shellMotion || !hazard) return;
    if (!shell.ignorePlayerUntilContactEnd) return;

    shell.ignorePlayerUntilContactEnd = false;
    setShellPlayerCollision(context.registry, shellEntity, true);
    if (shellMotion.active) {
      hazard.active = true;
      hazard.targetPlayer = true;
    }
  });
}

function setShellPlayerCollision(
  registry: Registry,
  shellEntity: number,
  enabled: boolean,
): void {
  const shellBody = getPhysicsBody(registry, shellEntity);
  const shellPhysics = registry.getComponent(shellEntity, CT.Physics);
  if (!shellBody || !shellPhysics) return;

  const mask = shellPhysics.collidesWith.reduce((result, category) => {
    if (!enabled && category === CATEGORY_PLAYER) return result;
    return result | category;
  }, 0);
  applyCollisionMask(shellBody, mask);
}
