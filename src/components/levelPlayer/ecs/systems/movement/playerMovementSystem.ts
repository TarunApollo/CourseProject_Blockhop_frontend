import Phaser from "phaser";
import { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import * as Comp from "../../components";
import {
  WALK_SPEED,
  RUN_SPEED,
  H_DECEL,
  JUMP_VY,
  JUMP_HOLD_FORCE,
  JUMP_HOLD_MAX_FRAMES,
  FALL_BOOST,
  MAX_FALL_VY,
} from "../../../mechanics/constants";

export type PlayerOperation = {
  left : boolean;
  right : boolean;
  jump: boolean;
  run : boolean;
};

/**
 * Handles player movement, jumping, and state synchronization.
 */
export function playerMovementSystem(
  registry: Registry,
  operation:PlayerOperation,
  globalState: any,
) {
  registry.forEach(
    [CT.Player, CT.Physics, CT.Sprite, CT.Animator],
    (id, _controlRaw, _physicsRaw, spriteRaw, animatorRaw) => {
      const control = _controlRaw as Comp.PlayerControl;
      const sprite = spriteRaw as Comp.Sprite;
      const animator = animatorRaw as Comp.Animator;
      const player = sprite.gameObject as Phaser.Physics.Matter.Sprite;

      // Sync death and level completion states
      if (globalState.isDying) control.lifeState = Comp.LifeState.DYING;
      control.isLevelComplete = globalState.isLevelComplete;

      if (
        !player ||
        !player.body ||
        control.lifeState === Comp.LifeState.DYING ||
        control.isLevelComplete
      )
        return;

      const vx = player.body.velocity.x;
      const vy = player.body.velocity.y;
      const speed = operation.run ? RUN_SPEED : WALK_SPEED;

      // Determine movement state based on physics and input
      if (globalState.knockbackFrames > 0) {
        control.moveState = Comp.MoveState.KNOCKBACK;
        control.knockbackFrames = globalState.knockbackFrames;
      } else if (!globalState.isOnGround) {
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
          player.setVelocityX(vx * H_DECEL);
          animator.currentAnim = "idle";
          break;

        case Comp.MoveState.WALKING:
          if (operation.left) {
            player.setVelocityX(-speed);
            animator.flipX = true;
          } else {
            player.setVelocityX(speed);
            animator.flipX = false;
          }
          animator.currentAnim = "walk";
          break;

        case Comp.MoveState.IDLE:
          player.setVelocityX(vx * H_DECEL);
          animator.currentAnim = "idle";
          break;

        case Comp.MoveState.JUMPING:
        case Comp.MoveState.FALLING:
          // Handle air movement
          if (operation.left) {
            player.setVelocityX(-speed);
            animator.flipX = true;
          } else if (operation.right) {
            player.setVelocityX(speed);
            animator.flipX = false;
          } else {
            player.setVelocityX(vx * H_DECEL);
          }
          animator.currentAnim = "idle";
          break;
      }

      // Manage variable jump height
      const jumpJustPressed = operation.jump && !control.jumpKeyWasDown;
      control.jumpKeyWasDown = operation.jump;

      if (jumpJustPressed && globalState.isOnGround) {
        player.setVelocityY(JUMP_VY);
        control.jumpHoldFrames = 0;
      } else if (
        operation.jump &&
        vy < 0 &&
        control.jumpHoldFrames < JUMP_HOLD_MAX_FRAMES
      ) {
        player.setVelocityY(vy + JUMP_HOLD_FORCE);
        control.jumpHoldFrames++;
      } else if (!operation.jump) {
        control.jumpHoldFrames = JUMP_HOLD_MAX_FRAMES;
      }

      // Increase gravity during descent
      if (control.moveState === Comp.MoveState.FALLING) {
        player.setVelocityY(Math.min(vy + FALL_BOOST, MAX_FALL_VY));
      }

      // Lock player rotation
      player.setAngularVelocity(0);
      player.setAngle(0);

      // Export state changes to global tracker
      globalState.jumpHoldFrames = control.jumpHoldFrames;
      globalState.jumpKeyWasDown = control.jumpKeyWasDown;
      globalState.knockbackFrames = control.knockbackFrames;
    },
  );
}
