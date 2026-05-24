import type * as Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { CT } from "../../core/ComponentTypes";
import { LifeState, MoveState } from "../../components/ComponentEnum";
import {
  HORIZONTAL_DIRECTION,
  type ActiveHorizontalDirection,
  type HorizontalDirection,
} from "../../components/ComponentEnum";
import type { PlayerOperation } from "../input/playerControlInputSystem";
import {
  H_DECEL,
  JUMP_VY,
  JUMP_GRAVITY_CUT,
  FALL_BOOST,
  MAX_FALL_VY,
} from "../../resources/physicsConfig";
import {
  lockRotation,
  setVelocityX,
  setVelocityY,
} from "../../matter/matterUtils";
import {
  Physics,
  PlayerControl,
} from "../../components/ComponentClasses";
import { getPhysicsBody } from "../../matter/matterAdapter";
import {
  bodiesAtPoint,
  isSemisolidBody,
} from "../../matter/matterUtils";
import { isPlayerSupportedBySemisolid } from "../contact/playerSemisolidSystem";

//para for automatic frmae for wall jump
const WALL_JUMP_KICK_FRAMES = 10;
const WALL_JUMP_KICK_SPEED = 18;

/**
 * Handles player movement, jumping, and state synchronization.
 */
export function playerMovementSystem(
  registry: Registry,
  operation: PlayerOperation,
) {
  const entities = registry.view([
    CT.Player,
    CT.PlayerContact,
    CT.PlayerLife,
    CT.PlayerClimb,
    CT.Physics,
    CT.Animator,
  ]);

  for (const entity of entities) {
    const control = registry.getComponent(entity, CT.Player);
    const contact = registry.getComponent(entity, CT.PlayerContact);
    const life = registry.getComponent(entity, CT.PlayerLife);
    const climb = registry.getComponent(entity, CT.PlayerClimb);
    const physics = registry.getComponent(entity, CT.Physics);
    const animator = registry.getComponent(entity, CT.Animator);
    const body = physics?.body;
    if (!control || !contact || !life || !climb || !physics || !animator || !body) continue;
    if (life.lifeState === LifeState.DYING) continue;
    if (climb.isClimbing) continue;

    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = operation.run ? control.runSpeed : control.walkSpeed;
    const wallDirection = contact.isOnGround
      ? null
      : getWallContactDirection(contact.wallContactDirection);
    const horizontalInputDirection = getHorizontalInputDirection(operation);
    const pressingIntoWall =
      wallDirection !== null && horizontalInputDirection === wallDirection;
    const wallKickActive =
      control.wallJumpKickFrames > 0 &&
      control.wallJumpKickDirection !== HORIZONTAL_DIRECTION.NONE;

    if (life.knockbackFrames > 0) {
      control.moveState = MoveState.KNOCKBACK;
    } else if (!contact.isOnGround) {
      control.moveState =
        vy > 0 ? MoveState.FALLING : MoveState.JUMPING;
    } else if (operation.left || operation.right) {
      control.moveState = MoveState.WALKING;
    } else {
      control.moveState = MoveState.IDLE;
    }

    switch (control.moveState) {
      case MoveState.KNOCKBACK:
        life.knockbackFrames--;
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
        if (wallKickActive) {
          updateWallKick(body, control, animator);
        } else {
          applyAirHorizontalControl(body, operation, speed, vx, animator);
        }
        animator.currentAnim = "jump";
        break;
      case MoveState.FALLING:
        if (wallKickActive) {
          updateWallKick(body, control, animator);
        } else if (pressingIntoWall) {
          setVelocityX(body, 0);
        } else {
          applyAirHorizontalControl(body, operation, speed, vx, animator);
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
    if (contact.isOnGround) {
      control.wallJumpLockDirection = HORIZONTAL_DIRECTION.NONE;
      control.wallJumpKickDirection = HORIZONTAL_DIRECTION.NONE;
      control.wallJumpKickFrames = 0;
    }
    const canWallJump =
      wallDirection !== null && control.wallJumpLockDirection !== wallDirection;

    if (jumpJustPressed && (contact.isOnGround || canWallJump)) {
      setVelocityY(body, JUMP_VY);
      if (wallDirection !== null) {
        const kickDirection = getOppositeHorizontalDirection(wallDirection);
        setVelocityX(
          body,
          getHorizontalDirectionSign(kickDirection) * WALL_JUMP_KICK_SPEED,
        );
        control.wallJumpLockDirection = wallDirection;
        control.wallJumpKickDirection = kickDirection;
        control.wallJumpKickFrames = WALL_JUMP_KICK_FRAMES;
      }
    }

    if (!contact.isOnGround) {
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

function applyAirHorizontalControl(
  body: Matter.Body,
  operation: PlayerOperation,
  speed: number,
  currentVx: number,
  animator: { flipX: boolean },
): void {
  if (operation.left) {
    setVelocityX(body, -speed);
    animator.flipX = true;
  } else if (operation.right) {
    setVelocityX(body, speed);
    animator.flipX = false;
  } else {
    setVelocityX(body, currentVx * H_DECEL);
  }
}

function updateWallKick(
  body: Matter.Body,
  control: PlayerControl,
  animator: { flipX: boolean },
): void {
  const kickDirection = control.wallJumpKickDirection;
  if (kickDirection !== HORIZONTAL_DIRECTION.NONE) {
    setVelocityX(
      body,
      getHorizontalDirectionSign(kickDirection) * WALL_JUMP_KICK_SPEED,
    );
    control.wallJumpKickFrames--;
    animator.flipX = kickDirection === HORIZONTAL_DIRECTION.LEFT;
    if (control.wallJumpKickFrames <= 0) {
      control.wallJumpKickDirection = HORIZONTAL_DIRECTION.NONE;
    }
  }
}

function bouncePlayerForEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent(entity, CT.Physics);
  const control = registry.getComponent(entity, CT.Player);
  const body = physics?.body;
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
  const inset = 8;
  const footProbeXs = [
    body.bounds.min.x + inset,
    body.position.x,
    body.bounds.max.x - inset,
  ];
  const hasSolidGround = footProbeXs.some((x) =>
    bodiesAtPoint(supportBodies, { x, y: feetY }).some(
      (groundBody) => !isSemisolidBody(groundBody),
    ),
  );

  return hasSolidGround || isPlayerSupportedBySemisolid(body, groundBodies);
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
    const shellMotion = registry.getComponent(shellEntity, CT.HorizontalMotion);
    const shellBody = getPhysicsBody(registry, shellEntity);
    if (!shellWalker || !shellMotion || !shellBody || shellBody.isSensor)
      continue;

    if (!shellMotion.active) {
      bodies.push(shellBody);
    }
  }

  return bodies;
}

function getHorizontalInputDirection(
  operation: PlayerOperation,
): HorizontalDirection {
  if (operation.left === operation.right) return HORIZONTAL_DIRECTION.NONE;
  return operation.left
    ? HORIZONTAL_DIRECTION.LEFT
    : HORIZONTAL_DIRECTION.RIGHT;
}

function getWallContactDirection(
  direction: HorizontalDirection,
): ActiveHorizontalDirection | null {
  return direction === HORIZONTAL_DIRECTION.NONE ? null : direction;
}

function getOppositeHorizontalDirection(
  direction: ActiveHorizontalDirection,
): ActiveHorizontalDirection {
  return direction === HORIZONTAL_DIRECTION.LEFT
    ? HORIZONTAL_DIRECTION.RIGHT
    : HORIZONTAL_DIRECTION.LEFT;
}

function getHorizontalDirectionSign(
  direction: ActiveHorizontalDirection,
): number {
  return direction === HORIZONTAL_DIRECTION.LEFT ? -1 : 1;
}
