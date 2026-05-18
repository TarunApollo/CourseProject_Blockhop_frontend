import type * as Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { CT } from "../../core/ComponentTypes";
import * as Comp from "../../components";
import { LifeState, MoveState } from "../../components/ComponentEnum";
import type { PlayerOperation } from "../inputSystem";
import {
  H_DECEL,
  JUMP_HOLD_FORCE,
  JUMP_HOLD_MAX_FRAMES,
  FALL_BOOST,
  MAX_FALL_VY,
} from "../../resources/physicsConfig";
import type { EventSink, GameEvent } from "../../eventQueue";
import { hasBodyAtPoint } from "../../adapter/matterQueryUtils";
import { lockRotation, setVelocityX, setVelocityY } from "./movementUtils";
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
    control.throwKeyWasDown = operation.throw;
    if (throwJustPressed) {
      const carrier = registry.getComponent(entity, CT.Carrier);
      if (carrier?.heldEntity != null) {
        eventSink.emit({
          type: "ShellThrowRequested",
          playerEntity: entity,
        });
      }
    }

    control.isOnGround = isPlayerOnGround(body, physics, groundBodies);

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

    if (control.moveState === MoveState.FALLING) {
      setVelocityY(body, Math.min(vy + FALL_BOOST, MAX_FALL_VY));
    }

    lockRotation(body);
  }
}

function bouncePlayerForEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent(entity, CT.Physics);
  const control = registry.getComponent(entity, CT.Player);
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
