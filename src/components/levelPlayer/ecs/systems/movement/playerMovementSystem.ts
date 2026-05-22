import type * as Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { CT } from "../../core/ComponentTypes";
import type { Physics } from "../../components/ComponentClasses";
import { LifeState, MoveState } from "../../components/ComponentEnum";
import type { PlayerOperation } from "../inputSystem";
import {
  H_DECEL,
  JUMP_VY,
  JUMP_GRAVITY_CUT,
  FALL_BOOST,
  MAX_FALL_VY,
} from "../../resources/physicsConfig";
import type { EventSink, GameEvent } from "../../eventQueue";
import { hasBodyAtPoint } from "../../adapter/matterQueryUtils";
import { getPhysicsBody } from "../../adapter/matterAdapter";
import { lockRotation, setVelocityX, setVelocityY } from "./movementUtils";

const SHELL_PICKUP_RANGE_X = 24;
const SHELL_PICKUP_RANGE_Y = 24;

export function playerMovementEventSystem(
  registry: Registry,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "PlayerBounceRequested":
        bouncePlayerForEntity(registry, event.entity);
        break;
    }
  }
}

/**
 * Handles player movement, jumping, and state synchronization.
 */
export function playerMovementSystem(
  registry: Registry,
  operation: PlayerOperation,
  groundBodies: Matter.Body[],
  eventSink: EventSink,
) {
  const entities = registry.view([CT.Player, CT.Physics, CT.Animator]);

  for (const entity of entities) {
    const control = registry.getComponent(entity, CT.Player);
    const physics = registry.getComponent(entity, CT.Physics);
    const animator = registry.getComponent(entity, CT.Animator);
    const body = physics?.body;
    if (!control || !physics || !animator || !body) continue;
    if (control.lifeState === LifeState.DYING) continue;

    const throwJustPressed = operation.throw && !control.throwKeyWasDown;
    const throwJustReleased = !operation.throw && control.throwKeyWasDown;
    control.throwKeyWasDown = operation.throw;

    // Pickup: resting shells equip on any frame Z is held; active (dangerous)
    // shells require a fresh press-edge while in proximity 
    // this is a sort of a frame perfect catch
    // ignorePlayerUntilContactEnd here suppresses the damage event that the
    // collision handler would otherwise emit on the same tick.
    if (operation.throw) {
      const carrier = registry.getComponent(entity, CT.Carrier);
      if (carrier?.heldEntity == null) {
        const shellEntity = findNearbyShellEntity(
          registry,
          entity,
          body,
          throwJustPressed,
        );
        if (shellEntity != null) {
          const shellWalker = registry.getComponent(
            shellEntity,
            CT.HorizontalWalker,
          );
          const shell = registry.getComponent(shellEntity, CT.Shell);
          if (shellWalker?.active && shell) {
            shell.ignorePlayerUntilContactEnd = true;
          }
          eventSink.emit({
            type: "ShellEquipRequested",
            playerEntity: entity,
            shellEntity,
          });
        }
      }
    }

    control.isOnGround =
      control.forceGroundState ??
      isPlayerOnGround(registry, entity, body, physics, groundBodies);

    if (throwJustReleased) {
      const carrier = registry.getComponent(entity, CT.Carrier);
      if (carrier?.heldEntity != null) {
        const releaseSpeedAbs = Math.abs(body.velocity.x);
        eventSink.emit({
          type: "ShellThrowRequested",
          playerEntity: entity,
          releaseVx: body.velocity.x,
          isRunning: operation.run && releaseSpeedAbs > 0.5,
        });
      }
    }

    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = operation.run ? control.runSpeed : control.walkSpeed;

    if (control.knockbackFrames > 0) {
      control.moveState = MoveState.KNOCKBACK;
    } else if (!control.isOnGround) {
      control.moveState =
        vy > 0 ? MoveState.FALLING : MoveState.JUMPING;
    } else if (operation.left || operation.right) {
      control.moveState = MoveState.WALKING;
    } else {
      control.moveState = MoveState.IDLE;
    }

    switch (control.moveState) {
      case MoveState.KNOCKBACK:
        control.knockbackFrames--;
        setVelocityX(body, vx * H_DECEL);
        animator.currentAnim = "idle";
        break;
      case MoveState.WALKING:
        if (operation.left) {
          setVelocityX(body, -speed);
          animator.flipX = true;
        } else {
          setVelocityX(body, speed);
          animator.flipX = false;
        }
        animator.currentAnim = "walk";
        break;
      case MoveState.IDLE:
        setVelocityX(body, vx * H_DECEL);
        animator.currentAnim = "idle";
        break;
      case MoveState.JUMPING:
      case MoveState.FALLING:
        if (operation.left) {
          setVelocityX(body, -speed);
          animator.flipX = true;
        } else if (operation.right) {
          setVelocityX(body, speed);
          animator.flipX = false;
        } else {
          setVelocityX(body, vx * H_DECEL);
        }
        animator.currentAnim = "idle";
        break;
    }

    // SMB3 references:
    // https://datacrystal.tcrf.net/wiki/Super_Mario_Bros._3/Notes
    // https://github.com/velipso/smb3-physics/blob/main/index.html
    //
    // SMB3 owns vertical velocity directly: launch from a table, then each frame
    // add either a small or a large downward increment depending on jump hold and
    // current upward speed.
    //
    // Our version is the same at a high level but simpler:
    // - launch once with fixed `JUMP_VY`
    // - let Matter apply the normal per frame downward step while held
    // - add `JUMP_GRAVITY_CUT` only after early release while rising
    // - add `FALL_BOOST` once descending
    //
    // That keeps the same player-facing behavior, but avoids modeling SMB3's
    // speed-based launch table and explicit upward-speed cutoff.
    const jumpJustPressed = operation.jump && !control.jumpKeyWasDown;
    control.jumpKeyWasDown = operation.jump;

    if (jumpJustPressed && control.isOnGround) {
      setVelocityY(body, JUMP_VY);
    }

    if (!control.isOnGround) {
      const vyNow = body.velocity.y;
      if (vyNow < 0 && !operation.jump) {
        setVelocityY(body, vyNow + JUMP_GRAVITY_CUT);
      } else if (vyNow > 0) {
        setVelocityY(body, Math.min(vyNow + FALL_BOOST, MAX_FALL_VY));
      }
    }

    lockRotation(body);
  }
}

function bouncePlayerForEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent(entity, CT.Physics);
  const control = registry.getComponent(entity, CT.Player);
  const body = physics?.body as Matter.Body | undefined;
  if (!body) return;

  setVelocityY(body, JUMP_VY * 0.6);
}

function isPlayerOnGround(
  registry: Registry,
  playerEntity: number,
  body: Matter.Body,
  _physics: Physics,
  groundBodies: Matter.Body[],
): boolean {
  const feetY = body.bounds.max.y + 8;
  const supportBodies = [
    ...groundBodies,
    ...getRestingShellSupportBodies(registry, playerEntity),
  ];

  return hasBodyAtPoint(supportBodies, {
    x: body.position.x,
    y: feetY,
  });
}

function getRestingShellSupportBodies(
  registry: Registry,
  playerEntity: number,
): Matter.Body[] {
  const bodies: Matter.Body[] = [];

  for (const shellEntity of registry.view([
    CT.Shell,
    CT.Physics,
    CT.HorizontalWalker,
  ])) {
    if (shellEntity === playerEntity) continue;

    const shellWalker = registry.getComponent(shellEntity, CT.HorizontalWalker);
    const shellBody = getPhysicsBody(registry, shellEntity);
    if (!shellWalker || !shellBody || shellBody.isSensor) continue;

    if (!shellWalker.active) {
      bodies.push(shellBody);
    }
  }

  return bodies;
}

function findNearbyShellEntity(
  registry: Registry,
  playerEntity: number,
  playerBody: Matter.Body,
  isFreshPress: boolean,
): number | null {
  let nearestShell: { entity: number; distanceSquared: number } | null = null;

  for (const shellEntity of registry.view([
    CT.Shell,
    CT.Physics,
    CT.HorizontalWalker,
  ])) {
    if (shellEntity === playerEntity) continue;

    const shellWalker = registry.getComponent(shellEntity, CT.HorizontalWalker);
    const shellPhysics = registry.getComponent(shellEntity, CT.Physics);
    const shell = registry.getComponent(shellEntity, CT.Shell);
    const shellBody = shellPhysics?.body as Matter.Body | undefined;
    if (
      !shellWalker ||
      !shellBody ||
      shellBody.isSensor ||
      shell?.ignorePlayerUntilContactEnd
    ) {
      continue;
    }
    // Active (dangerous) shells are catchable only on a fresh Z press.
    // Resting shells equip on hold or press.
    if (shellWalker.active && !isFreshPress) continue;

    const maxDx =
      getBodyHalfWidth(playerBody) +
      getBodyHalfWidth(shellBody) +
      SHELL_PICKUP_RANGE_X;
    const maxDy =
      getBodyHalfHeight(playerBody) +
      getBodyHalfHeight(shellBody) +
      SHELL_PICKUP_RANGE_Y;
    const dx = shellBody.position.x - playerBody.position.x;
    const dy = shellBody.position.y - playerBody.position.y;

    if (Math.abs(dx) > maxDx || Math.abs(dy) > maxDy) continue;

    const distanceSquared = dx * dx + dy * dy;
    if (
      nearestShell == null ||
      distanceSquared < nearestShell.distanceSquared
    ) {
      nearestShell = { entity: shellEntity, distanceSquared };
    }
  }

  return nearestShell?.entity ?? null;
}

function getBodyHalfWidth(body: Matter.Body): number {
  return (body.bounds.max.x - body.bounds.min.x) / 2;
}

function getBodyHalfHeight(body: Matter.Body): number {
  return (body.bounds.max.y - body.bounds.min.y) / 2;
}
