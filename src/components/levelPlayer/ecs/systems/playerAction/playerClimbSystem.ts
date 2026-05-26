import Matter from "matter-js";
import { getPhysicsBody } from "../../matter/matterAdapter";
import {
  LifeState,
  MoveState,
} from "../../components/ComponentEnum";
import type {
    Animator,
  Physics,
  PlayerClimb,
  PlayerControl,
} from "../../components/ComponentClasses";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { PlayerOperation } from "../input/playerControlInputSystem";
import { lockRotation } from "../../matter/matterUtils";

type ClimbDirection = -1 | 0 | 1;

const CLIMB_DIRECTION: {
  UP: ClimbDirection;
  NONE: ClimbDirection;
  DOWN: ClimbDirection;
} = {
  UP: -1,
  NONE: 0,
  DOWN: 1,
};

/**
 * applies player movement while attached to a climbable sensor
 */
export function playerClimbSystem(
  registry: Registry,
  operation: PlayerOperation,
): void {
  const entities = registry.view([
    CT.Player,
    CT.PlayerClimb,
    CT.PlayerContact,
    CT.PlayerLife,
    CT.Physics,
    CT.Animator,
  ]);

  for (const entity of entities) {
    const control = registry.getComponent(entity, CT.Player);
    const climb = registry.getComponent(entity, CT.PlayerClimb);
    const contact = registry.getComponent(entity, CT.PlayerContact);
    const life = registry.getComponent(entity, CT.PlayerLife);
    const physics = registry.getComponent(entity, CT.Physics);
    const animator = registry.getComponent(entity, CT.Animator);
    const body = physics?.body;
    if (
      !control ||
      !climb ||
      !contact ||
      !life ||
      !physics ||
      !animator ||
      !body
    ) {
      continue;
    }

    const climbBody =
      contact.climbContactEntity === null
        ? undefined
        : getPhysicsBody(registry, contact.climbContactEntity);

    // if player died
    if (life.lifeState === LifeState.DYING || !climbBody) {
      exitClimb(physics, climb);
      continue;
    }


    const climbDirection = getClimbInputDirection(operation);
    const isClimbing = climb.isClimbing;
    const isGrounded = contact.isOnGround;
    const wantsUp = climbDirection === CLIMB_DIRECTION.UP;
    const wantsDown = climbDirection === CLIMB_DIRECTION.DOWN;
    const hasClimbInput = climbDirection !== CLIMB_DIRECTION.NONE;

    // bool state machine
    const shouldExitByClimbExit = isClimbing && operation.climbExit;
    const shouldExitAtBottom = isClimbing && isGrounded && !wantsUp;
    const shouldEnterClimb =
      !isClimbing && hasClimbInput && !(isGrounded && wantsDown);

    // exit key on the ladder should drop down instead of jump up
    if (shouldExitByClimbExit) {
      dropFromClimbByExitInput(body, physics, climb, control);
      continue;
    }

    // click down to the ground can exit the ladder
    if (shouldExitAtBottom) {
      dropFromClimb(body, physics, climb);
      continue;
    }

    // guard for escape being assimilate by the ladder
    if (!isClimbing && !shouldEnterClimb) {
      continue;
    }

    applyClimbMovement(
      body,
      climbBody,
      physics,
      climb,
      control,
      animator,
      climbDirection,
    );
  }
}

/**
 * helper for drop from climb exit input
 */
function dropFromClimbByExitInput(
  body: Matter.Body,
  physics: Physics,
  climb: PlayerClimb,
  control: PlayerControl,
): void {
  dropFromClimb(body, physics, climb);
  control.jumpKeyWasDown = true;
}

/**
 * helper for drop from climb down
 */
function dropFromClimb(
  body: Matter.Body,
  physics: Physics,
  climb: PlayerClimb,
): void {
  exitClimb(physics, climb);
  Matter.Body.setVelocity(body, { x: body.velocity.x, y: 0 });
}

/**
 * encapsulated climbing in one frame
 */
function applyClimbMovement(
  playerBody: Matter.Body,
  climbBody: Matter.Body,
  physics: Physics,
  climb: PlayerClimb,
  control: PlayerControl,
  animator: Animator,
  climbDirection: ClimbDirection,
): void {
  enterClimb(physics, climb);
  movePlayerOnClimbable(playerBody, climbBody, climb, climbDirection);
  syncClimbRenderState(control, animator, climbDirection);
  lockRotation(playerBody);
}


function syncClimbRenderState(
  control: PlayerControl,
  animator: Animator,
  climbDirection: ClimbDirection,
): void {
  control.moveState =
    climbDirection === CLIMB_DIRECTION.NONE
      ? MoveState.IDLE
      : MoveState.WALKING;
  animator.currentAnim = "climb";
  animator.isPaused = climbDirection === CLIMB_DIRECTION.NONE;
}


/**
 * set gravity -> 0
 */
function enterClimb(physics: Physics, climb: PlayerClimb): void {
  climb.isClimbing = true;
  physics.gravityScale = 0;
}


/**
 * recover gravity
 */
function exitClimb(physics: Physics, climb: PlayerClimb): void {
  if (!climb.isClimbing) return;

  climb.isClimbing = false;
  physics.gravityScale = 1;
}

/**
 * align the player center with ladder and lock Vx
 */
function movePlayerOnClimbable(
  playerBody: Matter.Body,
  climbBody: Matter.Body,
  climb: PlayerClimb,
  climbDirection: ClimbDirection,
): void {
  Matter.Body.setPosition(playerBody, {
    x: climbBody.position.x,
    y: playerBody.position.y,
  });

  Matter.Body.setVelocity(playerBody, {
    x: 0,
    y: climbDirection * climb.speed,
  });
}

function getClimbInputDirection(operation: PlayerOperation): ClimbDirection {
  if (operation.climbUp === operation.climbDown) {
    return CLIMB_DIRECTION.NONE;
  }
  return operation.climbUp ? CLIMB_DIRECTION.UP : CLIMB_DIRECTION.DOWN;
}
