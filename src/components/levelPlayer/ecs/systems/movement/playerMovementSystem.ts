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
import type { GameEvent } from "../../eventQueue";
import { bodiesAtPoint, isSemisolidBody } from "../../adapter/matterQueryUtils";
import { getPhysicsBody } from "../../adapter/matterAdapter";
import { lockRotation, setVelocityX, setVelocityY } from "./movementUtils";
import { isPlayerSupportedBySemisolid } from "./playerSemisolidSystem";

const PLAYER_WALL_TOUCH_PROBE_DISTANCE = 2;
type WallDirection = -1 | 1;

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
) {
  const entities = registry.view([CT.Player, CT.Physics, CT.Animator]);

  for (const entity of entities) {
    const control = registry.getComponent(entity, CT.Player);
    const physics = registry.getComponent(entity, CT.Physics);
    const animator = registry.getComponent(entity, CT.Animator);
    const body = physics?.body;
    if (!control || !physics || !animator || !body) continue;
    if (control.lifeState === LifeState.DYING) continue;

    control.isOnGround =
      control.forceGroundState ??
      isPlayerOnGround(registry, entity, body, physics, groundBodies);

    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = operation.run ? control.runSpeed : control.walkSpeed;
    const wallDirection = control.isOnGround
      ? null
      : getPlayerTouchingWallDirection(body, groundBodies);
    const horizontalInputDirection = getHorizontalInputDirection(operation);
    const pressingIntoWall =
      wallDirection !== null && horizontalInputDirection === wallDirection;

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
        if (pressingIntoWall) {
          setVelocityX(body, 0);
        } else if (operation.left) {
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
    if (control.isOnGround) {
      control.wallJumpLockDirection = 0;
    }
    const canWallJump =
      wallDirection !== null &&
      control.wallJumpLockDirection !== wallDirection;

    if (jumpJustPressed && (control.isOnGround || canWallJump)) {
      setVelocityY(body, JUMP_VY);
      if (wallDirection !== null) {
        setVelocityX(body, -wallDirection * control.runSpeed);
        control.wallJumpLockDirection = wallDirection;
      }
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
  const hasSolidGround = bodiesAtPoint(supportBodies, {
    x: body.position.x,
    y: feetY,
  }).some((groundBody) => !isSemisolidBody(groundBody));

  return hasSolidGround || isPlayerSupportedBySemisolid(body, groundBodies);
}

function getHorizontalInputDirection(operation: PlayerOperation): WallDirection | 0 {
  if (operation.left === operation.right) return 0;
  return operation.left ? -1 : 1;
}

function getPlayerTouchingWallDirection(
  body: Matter.Body,
  groundBodies: Matter.Body[],
): WallDirection | null {
  const probeY = body.position.y;
  const hasWallAt = (x: number) =>
    bodiesAtPoint(groundBodies, { x, y: probeY }).some(
      (groundBody) => !isSemisolidBody(groundBody),
    );

  if (hasWallAt(body.bounds.min.x - PLAYER_WALL_TOUCH_PROBE_DISTANCE)) {
    return -1;
  }
  if (hasWallAt(body.bounds.max.x + PLAYER_WALL_TOUCH_PROBE_DISTANCE)) {
    return 1;
  }
  return null;
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
