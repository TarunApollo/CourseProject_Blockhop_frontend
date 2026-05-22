import Matter from "matter-js";
import { syncTransformsFromMatter } from "../components/levelPlayer/ecs/adapter/matterAdapter";
import { getMovementBlockingBodies, hasBodyAtPoint } from "../components/levelPlayer/ecs/adapter/matterQueryUtils";
import type { Physics } from "../components/levelPlayer/ecs/components";
import { LifeState, MoveState } from "../components/levelPlayer/ecs/components/ComponentEnum";
import { CT } from "../components/levelPlayer/ecs/core/ComponentTypes";
import type { LevelRuntime } from "../components/levelPlayer/ecs/headlessRuntime/update";
import { playerOperationFromInput, type PlayerInputState, type PlayerOperation } from "../components/levelPlayer/ecs/systems/input/playerControlInputSystem";
import { collisionDynamicFilterSystem } from "../components/levelPlayer/ecs/systems/collision/collisionDynamicFilterSystem";
import { horizontalFlyerSystem } from "../components/levelPlayer/ecs/systems/movement/horizontalFlyerSystem";
import { horizontalMovementSystem } from "../components/levelPlayer/ecs/systems/movement/horizontalMovementSystem";
import { lockRotation, setVelocityX, setVelocityY } from "../components/levelPlayer/ecs/systems/movement/movementUtils";
import { playerDamageEventSystem } from "../components/levelPlayer/ecs/systems/lifecycle/playerDamageSystem";
import { processRuntimeEvents } from "../components/levelPlayer/ecs/systems/runtimeEvents";
import { worldBoundsSystem } from "../components/levelPlayer/ecs/systems/worldBoundsSystem";

const DEFAULT_DELTA_MS = 1000 / 60;

const OLD_GRAVITY = 2.5;
const OLD_GRAVITY_SCALE = 0.001;
const OLD_JUMP_FORCE = -22;
const OLD_JUMP_HOLD_FORCE = -0.8;
const OLD_JUMP_HOLD_MAX_FRAMES = 18;
const OLD_FALL_BOOST = 0.8;
const OLD_MAX_FALL_VY = 18;
const OLD_H_DECEL = 0.8;
const OLD_WALK_SPEED = 8;
const OLD_RUN_SPEED = 10;

export function configureOldPhysicsRuntime(runtime: LevelRuntime): void {
  runtime.engine.gravity.x = 0;
  runtime.engine.gravity.y = 0;
}

export function updateOldPhysicsHeadlessLevel(
  runtime: LevelRuntime,
  options: {
    input?: PlayerInputState;
    deltaMs?: number;
  } = {},
) {
  const events = updateOldPhysicsRuntime(runtime, {
    input: playerOperationFromInput(options.input),
    deltaMs: options.deltaMs ?? DEFAULT_DELTA_MS,
    skipPlayerInput:
      runtime.levelState.isComplete || runtime.levelState.gameOver,
  });

  processRuntimeEvents(runtime, events);
  syncOldPhysicsRuntime(runtime);

  return {
    events,
    doorOpen: runtime.levelState.doorOpen,
    isComplete: runtime.levelState.isComplete,
    gameOver: runtime.levelState.gameOver,
  };
}

export function updateOldPhysicsRuntime(
  runtime: LevelRuntime,
  options: {
    input: PlayerOperation;
    deltaMs: number;
    skipPlayerInput: boolean;
  },
) {
  configureOldPhysicsRuntime(runtime);

  const groundBodies = getMovementBlockingBodies(runtime.world);

  horizontalMovementSystem(runtime.registry, groundBodies);
  horizontalFlyerSystem(runtime.registry, groundBodies);

  if (!options.skipPlayerInput) {
    oldPlayerMovementSystem(runtime, options.input, groundBodies);
  }

  collisionDynamicFilterSystem({
    registry: runtime.registry,
    playerEntity: runtime.playerEntity,
  });
  oldGravitySystem(runtime);
  Matter.Engine.update(runtime.engine, options.deltaMs);
  runtime.scheduler.update(options.deltaMs);
  worldBoundsSystem({
    world: runtime.world,
    registry: runtime.registry,
    events: runtime.events,
    levelState: runtime.levelState,
    playerEntity: runtime.playerEntity,
    levelBottom: runtime.mapSize.height,
    levelRight: runtime.mapSize.width,
  });

  const physicsEvents = runtime.events.drain();
  playerDamageEventSystem(
    runtime.registry,
    physicsEvents,
    runtime.scheduler,
    runtime.events,
  );

  return [...physicsEvents, ...runtime.events.drain()];
}

export function syncOldPhysicsRuntime(runtime: LevelRuntime): void {
  syncTransformsFromMatter(runtime.registry);
}

function oldGravitySystem(runtime: LevelRuntime): void {
  for (const entity of runtime.registry.view([CT.Physics])) {
    const physics = runtime.registry.getComponent(entity, CT.Physics);
    const body = physics?.body;
    if (!physics || !body || body.isStatic) continue;

    Matter.Body.applyForce(body, body.position, {
      x: 0,
      y: body.mass * OLD_GRAVITY * OLD_GRAVITY_SCALE * physics.gravityScale,
    });
  }
}

function oldPlayerMovementSystem(
  runtime: LevelRuntime,
  operation: PlayerOperation,
  groundBodies: Matter.Body[],
): void {
  const entities = runtime.registry.view([CT.Player, CT.Physics, CT.Animator]);

  for (const entity of entities) {
    const control = runtime.registry.getComponent(entity, CT.Player);
    const physics = runtime.registry.getComponent(entity, CT.Physics);
    const animator = runtime.registry.getComponent(entity, CT.Animator);
    const body = physics?.body;

    if (!control || !physics || !animator || !body) continue;
    if (control.lifeState === LifeState.DYING) continue;

    control.walkSpeed = OLD_WALK_SPEED;
    control.runSpeed = OLD_RUN_SPEED;
    control.jumpForce = OLD_JUMP_FORCE;
    control.isOnGround = isPlayerOnOldGround(body, physics, groundBodies);

    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = operation.run ? OLD_RUN_SPEED : OLD_WALK_SPEED;

    if (control.knockbackFrames > 0) {
      control.moveState = MoveState.KNOCKBACK;
    } else if (!control.isOnGround) {
      control.moveState = vy > 0 ? MoveState.FALLING : MoveState.JUMPING;
    } else if (operation.left || operation.right) {
      control.moveState = MoveState.WALKING;
    } else {
      control.moveState = MoveState.IDLE;
    }

    switch (control.moveState) {
      case MoveState.KNOCKBACK:
        control.knockbackFrames--;
        setVelocityX(body, vx * OLD_H_DECEL);
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
        setVelocityX(body, vx * OLD_H_DECEL);
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
          setVelocityX(body, vx * OLD_H_DECEL);
        }
        animator.currentAnim = "idle";
        break;
    }

    const jumpJustPressed = operation.jump && !control.jumpKeyWasDown;
    control.jumpKeyWasDown = operation.jump;

    if (jumpJustPressed && control.isOnGround) {
      setVelocityY(body, OLD_JUMP_FORCE);
      control.jumpHoldFrames = 0;
    } else if (
      operation.jump &&
      vy < 0 &&
      control.jumpHoldFrames < OLD_JUMP_HOLD_MAX_FRAMES
    ) {
      setVelocityY(body, vy + OLD_JUMP_HOLD_FORCE);
      control.jumpHoldFrames++;
    } else if (!operation.jump) {
      control.jumpHoldFrames = OLD_JUMP_HOLD_MAX_FRAMES;
    }

    if (control.moveState === MoveState.FALLING) {
      setVelocityY(body, Math.min(vy + OLD_FALL_BOOST, OLD_MAX_FALL_VY));
    }

    lockRotation(body);
  }
}

function isPlayerOnOldGround(
  body: Matter.Body,
  _physics: Physics,
  groundBodies: Matter.Body[],
): boolean {
  const feetY = body.bounds.max.y + 8;
  return hasBodyAtPoint(groundBodies, {
    x: body.position.x,
    y: feetY,
  });
}
