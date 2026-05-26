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
  PlayerControl,
  Animator,
} from "../../components/ComponentClasses";

// wall kick forces movement away from the wall for a short time
const WALL_JUMP_KICK_FRAMES = 12;
const WALL_JUMP_KICK_SPEED = 22;

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
    CT.PlayerCrouch,
    CT.Physics,
    CT.Animator,
  ]);

  for (const entity of entities) {
    const control = registry.getComponent(entity, CT.Player);
    const contact = registry.getComponent(entity, CT.PlayerContact);
    const life = registry.getComponent(entity, CT.PlayerLife);
    const climb = registry.getComponent(entity, CT.PlayerClimb);
    const crouch = registry.getComponent(entity, CT.PlayerCrouch);
    const physics = registry.getComponent(entity, CT.Physics);
    const animator = registry.getComponent(entity, CT.Animator);
    const body = physics?.body;
    
    if (!control || !contact || !life || !climb || !physics || !animator || !body || !crouch) continue;
    if (life.lifeState === LifeState.DYING) continue;
    if (climb.isClimbing) continue;

    animator.isPaused = false;

    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const baseSpeed = operation.run ? control.runSpeed : control.walkSpeed;
    const speed = crouch.isCrouching ? baseSpeed * 0.5 : baseSpeed;
    const contactWallDirection = getWallContactDirection(
      contact.wallContactDirection,
    );
    const wallDirection = contact.isOnGround
      ? null
      : contactWallDirection;
    const horizontalInputDirection = getHorizontalInputDirection(operation);
    const pressingIntoContactWall =
      contactWallDirection !== null &&
      horizontalInputDirection === contactWallDirection;
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
        if (!crouch.isCrouching) animator.currentAnim = "walk";
        break;
      case MoveState.IDLE:
        setVelocityX(body, vx * H_DECEL);
        if (!crouch.isCrouching) animator.currentAnim = "idle";
        break;
      case MoveState.JUMPING:
        if (wallKickActive) {
          updateWallKick(body, control, animator);
        } else if (pressingIntoWall) {
          setVelocityX(body, 0);
        } else {
          applyAirHorizontalControl(body, operation, speed, vx, animator);
        }
        if (!crouch.isCrouching) animator.currentAnim = "jump";
        break;
      case MoveState.FALLING:
        if (wallKickActive) {
          updateWallKick(body, control, animator);
        } else if (pressingIntoWall) {
          setVelocityX(body, 0);
        } else {
          applyAirHorizontalControl(body, operation, speed, vx, animator);
        }
        if (!crouch.isCrouching) animator.currentAnim = "idle";
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
    const groundedWallJumpDirection =
      contact.isOnGround && pressingIntoContactWall ? contactWallDirection : null;
    const jumpWallDirection = wallDirection ?? groundedWallJumpDirection;
    const canWallJump =
      jumpWallDirection !== null &&
      control.wallJumpLockDirection !== jumpWallDirection;

    // if the player jumps while pushing into a wall use a wall kick instead
    if (jumpJustPressed && (contact.isOnGround || canWallJump)) {
      setVelocityY(body, JUMP_VY);
      if (jumpWallDirection !== null) {
        const kickDirection = getOppositeHorizontalDirection(jumpWallDirection);
        setVelocityX(
          body,
          getHorizontalDirectionSign(kickDirection) * WALL_JUMP_KICK_SPEED,
        );
        control.wallJumpLockDirection = jumpWallDirection;
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
  animator: Animator,
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
  animator: Animator,
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
