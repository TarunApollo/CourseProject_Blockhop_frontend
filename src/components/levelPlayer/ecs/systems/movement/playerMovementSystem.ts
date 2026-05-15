import { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import * as Comp from "../../components";
import {
  H_DECEL,
  JUMP_HOLD_FORCE,
  JUMP_HOLD_MAX_FRAMES,
  FALL_BOOST,
  MAX_FALL_VY,
} from "../../resources/physicsConfig";
import type { GameEvent } from "../../eventQueue";
import { hasBodyAtPoint } from "../../adapter/matterQueryUtils";
import { lockRotation, setVelocityX, setVelocityY } from "./movementUtils";

export type PlayerOperation = {
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  throw: boolean;
};

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
  registry.forEach(
    [CT.Player, CT.Physics, CT.Animator],
    (_id, _controlRaw, physicsRaw, animatorRaw) => {
      const control = _controlRaw as Comp.PlayerControl;
      const physics = physicsRaw as Comp.Physics;
      const animator = animatorRaw as Comp.Animator;
      const body = physics.body as Matter.Body | undefined;

      if (!body || control.lifeState === Comp.LifeState.DYING) return;

      control.isOnGround = isPlayerOnGround(body, physics, groundBodies);

      const vx = body.velocity.x;
      const vy = body.velocity.y;
      const speed = operation.run ? control.runSpeed : control.walkSpeed;

      // Determine movement state based on physics and input
      if (control.knockbackFrames > 0) {
        control.moveState = Comp.MoveState.KNOCKBACK;
      } else if (!control.isOnGround) {
        control.moveState =
          vy > 0 ? Comp.MoveState.FALLING : Comp.MoveState.JUMPING;
      } else if (operation.left || operation.right) {
        control.moveState = Comp.MoveState.WALKING;
      } else {
        control.moveState = Comp.MoveState.IDLE;
      }

      // Apply logic based on current movement state
      switch (control.moveState) {
        case Comp.MoveState.KNOCKBACK:
          control.knockbackFrames--;
          setVelocityX(body, vx * H_DECEL);
          animator.currentAnim = "idle";
          break;

        case Comp.MoveState.WALKING:
          if (operation.left) {
            setVelocityX(body, -speed);
            animator.flipX = true;
          } else {
            setVelocityX(body, speed);
            animator.flipX = false;
          }
          animator.currentAnim = "walk";
          break;

        case Comp.MoveState.IDLE:
          setVelocityX(body, vx * H_DECEL);
          animator.currentAnim = "idle";
          break;

        case Comp.MoveState.JUMPING:
        case Comp.MoveState.FALLING:
          // Handle air movement
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

      // Manage variable jump height
      const jumpJustPressed = operation.jump && !control.jumpKeyWasDown;
      control.jumpKeyWasDown = operation.jump;

      if (jumpJustPressed && control.isOnGround) {
        setVelocityY(body, control.jumpForce);
        control.jumpHoldFrames = 0;
      } else if (
        operation.jump &&
        vy < 0 &&
        control.jumpHoldFrames < JUMP_HOLD_MAX_FRAMES
      ) {
        setVelocityY(body, vy + JUMP_HOLD_FORCE);
        control.jumpHoldFrames++;
      } else if (!operation.jump) {
        control.jumpHoldFrames = JUMP_HOLD_MAX_FRAMES;
      }

      // Increase gravity during descent
      if (control.moveState === Comp.MoveState.FALLING) {
        setVelocityY(body, Math.min(vy + FALL_BOOST, MAX_FALL_VY));
      }

      // Lock player rotation
      lockRotation(body);
    },
  );
}

function bouncePlayerForEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  const control = registry.getComponent<Comp.PlayerControl>(entity, CT.Player);
  const body = physics?.body as Matter.Body | undefined;
  if (!body) return;

  setVelocityY(body, (control?.jumpForce ?? -22) * 0.6);
}

function isPlayerOnGround(
  body: Matter.Body,
  _physics: Comp.Physics,
  groundBodies: Matter.Body[],
): boolean {
  const feetY = body.bounds.max.y + 8;
  return hasBodyAtPoint(groundBodies, {
    x: body.position.x,
    y: feetY,
  });
}
