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
      case "ShellThrowRequested":
        throwShell(context, event.playerEntity);
        break;
    }
  }

  detachAllCarriedShells(context.registry, context.levelState);
}

export function carrySystem(
  registry: RuntimeEventContext["registry"],
  levelState: LevelStateResource,
): void {
  for (const entity of registry.view([CT.Carrier, CT.Physics, CT.Player])) {
    const carrier = registry.getComponent<Comp.Carrier>(entity, CT.Carrier);
    const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
    const player = registry.getComponent<Comp.PlayerControl>(entity, CT.Player);
    const animator = registry.getComponent<Comp.Animator>(entity, CT.Animator);
    if (!carrier || !physics || !player) continue;

    if (carrier.heldEntity == null) continue;
    if (
      player.lifeState !== Comp.LifeState.ALIVE ||
      levelState.isComplete ||
      levelState.gameOver
    ) {
      detachShell(registry, carrier.heldEntity);
      carrier.heldEntity = null;
      continue;
    }

    const playerBody = physics.body as Matter.Body | undefined;
    const shellBody = getPhysicsBody(registry, carrier.heldEntity);
    if (!playerBody || !shellBody) {
      detachShell(registry, carrier.heldEntity);
      carrier.heldEntity = null;
      continue;
    }

    const facing = animator?.flipX ? -1 : 1;
    Matter.Body.setPosition(shellBody, {
      x: playerBody.position.x + facing * carrier.offsetX,
      y: playerBody.position.y + carrier.offsetY,
    });
    Matter.Body.setVelocity(shellBody, { x: 0, y: 0 });
  }
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
  launchShell(context, playerEntity, { speed: 0, active: false });
}

function throwShell(
  context: RuntimeEventContext,
  playerEntity: number,
): void {
  launchShell(context, playerEntity, { speed: 15, active: true });
}

function launchShell(
  context: RuntimeEventContext,
  playerEntity: number,
  options: { speed: number; active: boolean },
): void {
  const carrier = context.registry.getComponent<Comp.Carrier>(playerEntity, CT.Carrier);
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
  const shellBody = getPhysicsBody(context.registry, shellEntity);
  if (!shellWalker || !shell || !hazard || !shellBody) return;

  const facing = playerAnimator?.flipX ? -1 : 1;
  detachShell(context.registry, shellEntity);
  carrier.heldEntity = null;

  shellWalker.direction = options.active ? facing : 0;
  shellWalker.active = options.active;
  shellWalker.skipVelCheck = options.active;

  hazard.active = options.active;
  hazard.targetEnemy = options.active;
  hazard.targetPlayer = false;
  shell.ignorePlayerUntilContactEnd = true;

  Matter.Body.setPosition(shellBody, {
    x: playerPhysics.body.position.x + facing * 56,
    y: playerPhysics.body.position.y + 16,
  });
  Matter.Body.setVelocity(shellBody, {
    x: facing * options.speed,
    y: 0,
  });

  restartShellRespawn(context, shellEntity);
}

function detachAllCarriedShells(
  registry: RuntimeEventContext["registry"],
  levelState: LevelStateResource,
): void {
  for (const entity of registry.view([CT.Carrier, CT.Player])) {
    const carrier = registry.getComponent<Comp.Carrier>(entity, CT.Carrier);
    const player = registry.getComponent<Comp.PlayerControl>(entity, CT.Player);
    if (!carrier || !player || carrier.heldEntity == null) continue;
    if (
      player.lifeState === Comp.LifeState.ALIVE &&
      !levelState.isComplete &&
      !levelState.gameOver
    ) {
      continue;
    }

    detachShell(registry, carrier.heldEntity);
    carrier.heldEntity = null;
  }
}
