import * as Matter from "matter-js";
import { applyCollisionMask, getPhysicsBody } from "../adapter/matterAdapter";
import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { GameEvent } from "../eventQueue";
import type { LevelStateResource } from "../resources/levelState";
import { restartShellRespawn } from "./collision/utils/shellStateMachine";
import type { RuntimeEventContext } from "./runtimeEvents";

export function carryEventSystem(
  context: RuntimeEventContext,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "ShellEquipRequested":
        equipShell(context, event.playerEntity, event.shellEntity);
        break;
      case "ShellDropRequested":
        dropShell(context, event.playerEntity);
        break;
    }
  }

  detachAllCarriedShells(context.registry, context.levelState);
}

export function carrySystem(
  registry: RuntimeEventContext["registry"],
  levelState: LevelStateResource,
): void {
  registry.forEach(
    [CT.Carrier, CT.Physics, CT.Player],
    (_entity, carrierRaw, physicsRaw, playerRaw) => {
      const carrier = carrierRaw as Comp.Carrier;
      const physics = physicsRaw as Comp.Physics;
      const player = playerRaw as Comp.PlayerControl;

      if (carrier.heldEntity == null) return;
      if (
        player.lifeState !== Comp.LifeState.ALIVE ||
        levelState.isComplete ||
        levelState.gameOver
      ) {
        detachShell(registry, carrier.heldEntity);
        carrier.heldEntity = null;
        return;
      }

      const playerBody = physics.body as Matter.Body | undefined;
      const shellBody = getPhysicsBody(registry, carrier.heldEntity);
      if (!playerBody || !shellBody) {
        detachShell(registry, carrier.heldEntity);
        carrier.heldEntity = null;
        return;
      }

      Matter.Body.setPosition(shellBody, {
        x: playerBody.position.x,
        y: playerBody.position.y + carrier.offsetY,
      });
      Matter.Body.setVelocity(shellBody, { x: 0, y: 0 });
    },
  );
}

function detachShell(registry, shellEntity) {
  if (shellEntity == null) return;
  const shellBody = getPhysicsBody(registry, shellEntity);
  const shellPhysics = registry.getComponent<Comp.Physics>(shellEntity, CT.Physics);
  if (!shellBody || !shellPhysics) return;

  const restoreMask = shellPhysics.collidesWith.reduce((m, c) => m | c, 0);
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
  const carrier = context.registry.getComponent<Comp.Carrier>(
    playerEntity,
    CT.Carrier,
  );
  if (!carrier || carrier.heldEntity != null) return;

  const shell = context.registry.getComponent<Comp.Shell>(shellEntity, CT.Shell);
  const shellWalker = context.registry.getComponent<Comp.HorizontalWalker>(
    shellEntity,
    CT.HorizontalWalker,
  );
  const hazard = context.registry.getComponent<Comp.Hazard>(shellEntity, CT.Hazard);
  const shellBody = getPhysicsBody(context.registry, shellEntity);
  if (!shell || !shellWalker || !hazard || !shellBody) return;

  carrier.heldEntity = shellEntity;

  hazard.active = false;
  hazard.targetPlayer = false;
  hazard.targetEnemy = false;

  shellWalker.active = false;
  shellWalker.direction = 0;
  shellWalker.skipVelCheck = false;

  // carried shells are inert so they do not collide during active ticks.
  applyCollisionMask(shellBody, 0);
  Matter.Body.set(shellBody, { isSensor: true });

  shell.respawnTimer?.remove?.();
  shell.respawnTimer = null;
  shell.ignorePlayerUntilContactEnd = false;
}

function dropShell(
  context: RuntimeEventContext,
  playerEntity: number,
): void {
  const carrier = context.registry.getComponent<Comp.Carrier>(
    playerEntity,
    CT.Carrier,
  );
  const playerPhysics = context.registry.getComponent<Comp.Physics>(
    playerEntity,
    CT.Physics,
  );
  const playerAnimator = context.registry.getComponent<Comp.Animator>(
    playerEntity,
    CT.Animator,
  );
  const shellEntity = carrier?.heldEntity ?? null;
  if (!carrier || shellEntity == null || !playerPhysics?.body) return;

  const shellWalker = context.registry.getComponent<Comp.HorizontalWalker>(
    shellEntity,
    CT.HorizontalWalker,
  );
  const shell = context.registry.getComponent<Comp.Shell>(shellEntity, CT.Shell);
  const hazard = context.registry.getComponent<Comp.Hazard>(shellEntity, CT.Hazard);
  const shellPhysics = context.registry.getComponent<Comp.Physics>(shellEntity, CT.Physics);
  const shellBody = getPhysicsBody(context.registry, shellEntity);
  if (!shellWalker || !shell || !hazard || !shellPhysics || !shellBody) return;

  const facing = playerAnimator?.flipX ? -1 : 1;
  detachShell(context.registry, shellEntity);
  carrier.heldEntity = null;

  shellWalker.active = false;
  shellWalker.direction = 0;
  shellWalker.skipVelCheck = false;

  hazard.active = false;
  hazard.targetPlayer = false;
  hazard.targetEnemy = false;
  shell.ignorePlayerUntilContactEnd = true;

  Matter.Body.setPosition(shellBody, {
    x: playerPhysics.body.position.x + facing * 56,
    y: playerPhysics.body.position.y + 16,
  });
  Matter.Body.setVelocity(shellBody, { x: 0, y: 0 });

  restartShellRespawn(context, shellEntity);
}

function detachAllCarriedShells(
  registry: RuntimeEventContext["registry"],
  levelState: LevelStateResource,
): void {
  registry.forEach(
    [CT.Carrier, CT.Player],
    (_entity, carrierRaw, playerRaw) => {
      const carrier = carrierRaw as Comp.Carrier;
      const player = playerRaw as Comp.PlayerControl;
      if (carrier.heldEntity == null) return;
      if (
        player.lifeState === Comp.LifeState.ALIVE &&
        !levelState.isComplete &&
        !levelState.gameOver
      ) {
        return;
      }

      detachShell(registry, carrier.heldEntity);
      carrier.heldEntity = null;
    },
  );
}
