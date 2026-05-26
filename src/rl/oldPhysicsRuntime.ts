import Matter from "matter-js";
import {
  applyCollisionMask,
  linkPhysicsBody,
  syncTransformsFromMatter,
  unlinkPhysicsBody,
} from "../components/levelPlayer/ecs/matter/matterAdapter";
import {
  getActiveCollisionPairs,
  getMovementBlockingBodies,
  getOtherBodyInPair,
  isSemisolidBody,
} from "../components/levelPlayer/ecs/matter/matterUtils";
import {
  HORIZONTAL_DIRECTION,
  LifeState,
  MoveState,
  type ActiveHorizontalDirection,
  type HorizontalDirection,
} from "../components/levelPlayer/ecs/components/ComponentEnum";
import { CT } from "../components/levelPlayer/ecs/core/ComponentTypes";
import type { LevelRuntime } from "../components/levelPlayer/ecs/headlessRuntime/update";
import { playerOperationFromInput, type PlayerInputState, type PlayerOperation } from "../components/levelPlayer/ecs/systems/input/playerControlInputSystem";
import { collisionDynamicFilterSystem } from "../components/levelPlayer/ecs/systems/collision/collisionDynamicFilterSystem";
import { horizontalMotionSystem } from "../components/levelPlayer/ecs/systems/aiMovement/horizontalMotionSystem";
import { horizontalTurnSystem } from "../components/levelPlayer/ecs/systems/aiMovement/horizontalTurnSystem";
import { lockRotation, setVelocityX, setVelocityY } from "../components/levelPlayer/ecs/matter/matterUtils";
import { processRuntimeEvents } from "../components/levelPlayer/ecs/systems/runtimeEvents";
import { worldBoundsSystem } from "../components/levelPlayer/ecs/systems/lifecycle/worldBoundsSystem";
import {
  CATEGORY_COIN,
  CATEGORY_DEFAULT,
  CATEGORY_DOOR,
  CATEGORY_ENEMY,
  CATEGORY_SEMISOLID,
} from "../components/levelPlayer/ecs/resources/physicsConfig";





/**
 * This file is just a adapter to the locked-engine for RL agent
 * replay. No need to refactor it , just keep it here.
 */
const DEFAULT_DELTA_MS = 1000 / 60;

const OLD_GRAVITY = 2.5;
const OLD_GRAVITY_SCALE = 0.001;
const OLD_JUMP_FORCE = -30;
const OLD_JUMP_GRAVITY_CUT = 2.5;
const OLD_FALL_BOOST = 0.8;
const OLD_MAX_FALL_VY = 18;
const OLD_H_DECEL = 0.8;
const OLD_WALK_SPEED = 8;
const OLD_RUN_SPEED = 15;
const OLD_PLAYER_WIDTH = 128 * 0.55;
const OLD_PLAYER_HEIGHT = 128 - 8;
const OLD_ENEMY_SIZE = 128 * 0.64;
const OLD_COIN_SIZE = 128 * 0.6;
const OLD_SHELL_WIDTH = 128 * 0.9;
const OLD_SHELL_HEIGHT = OLD_SHELL_WIDTH / 2;
const OLD_TILE_SIZE = 128;
const WALL_JUMP_KICK_FRAMES = 10;
const NON_GROUND_CONTACT_LABELS = new Set([
  "player",
  "enemy",
  "coin",
]);
const NON_WALL_CONTACT_LABELS = new Set([
  "player",
  "enemy",
  "shell",
  "coin",
]);

export function configureOldPhysicsRuntime(runtime: LevelRuntime): void {
  runtime.engine.gravity.x = 0;
  runtime.engine.gravity.y = 0;
  configureLockedRuntimeBodies(runtime);
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

  oldPlayerWallContactSystem(runtime);
  oldPlayerGroundContactSystem(runtime);
  horizontalTurnSystem(runtime.registry, groundBodies, {
    left: Number.NEGATIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
  });
  horizontalMotionSystem(runtime.registry);

  if (!options.skipPlayerInput) {
    oldPlayerMovementSystem(runtime, options.input, groundBodies);
  }

  collisionDynamicFilterSystem({
    registry: runtime.registry,
    playerEntity: runtime.playerEntity,
  });
  oldGravitySystem(runtime);
  Matter.Engine.update(runtime.engine, options.deltaMs);
  oldPlayerWallContactSystem(runtime);
  oldPlayerGroundContactSystem(runtime);
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
  oldPlayerDamageEventSystem(
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

function oldPlayerWallContactSystem(runtime: LevelRuntime): void {
  const control = runtime.registry.getComponent(runtime.playerEntity, CT.Player);
  const contact = runtime.registry.getComponent(runtime.playerEntity, CT.PlayerContact);
  const playerBody = runtime.registry.getComponent(runtime.playerEntity, CT.Physics)?.body;
  if (!control || !playerBody) return;

  let touchingLeftWall = false;
  let touchingRightWall = false;

  for (const pair of getActiveCollisionPairs(runtime.engine)) {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    if (!otherBody || !isOldWallContactCandidate(otherBody)) continue;

    const direction = getOldWallDirection(playerBody, otherBody, pair);
    if (direction === HORIZONTAL_DIRECTION.LEFT) touchingLeftWall = true;
    if (direction === HORIZONTAL_DIRECTION.RIGHT) touchingRightWall = true;
  }

  const wallContactDirection =
    touchingLeftWall === touchingRightWall
      ? HORIZONTAL_DIRECTION.NONE
      : touchingLeftWall
        ? HORIZONTAL_DIRECTION.LEFT
        : HORIZONTAL_DIRECTION.RIGHT;

  control.wallContactDirection = wallContactDirection;
  if (contact) contact.wallContactDirection = wallContactDirection;
}

function isOldWallContactCandidate(body: Matter.Body): boolean {
  return (
    !body.isSensor &&
    !isSemisolidBody(body) &&
    !NON_WALL_CONTACT_LABELS.has(body.label)
  );
}

function getOldWallDirection(
  playerBody: Matter.Body,
  wallBody: Matter.Body,
  pair: Matter.Pair,
): ActiveHorizontalDirection | typeof HORIZONTAL_DIRECTION.NONE {
  const normal = pair.collision.normal;
  const contactIsHorizontal = Math.abs(normal.x) > Math.abs(normal.y);
  if (!contactIsHorizontal) return HORIZONTAL_DIRECTION.NONE;

  return wallBody.position.x < playerBody.position.x
    ? HORIZONTAL_DIRECTION.LEFT
    : HORIZONTAL_DIRECTION.RIGHT;
}

function oldPlayerGroundContactSystem(runtime: LevelRuntime): void {
  const control = runtime.registry.getComponent(runtime.playerEntity, CT.Player);
  const contact = runtime.registry.getComponent(runtime.playerEntity, CT.PlayerContact);
  const playerBody = runtime.registry.getComponent(runtime.playerEntity, CT.Physics)?.body;
  if (!control || !playerBody) return;

  if (contact?.forceGroundState !== null && contact?.forceGroundState !== undefined) {
    control.isOnGround = contact.forceGroundState;
    contact.isOnGround = contact.forceGroundState;
    return;
  }

  const isOnGround = getActiveCollisionPairs(runtime.engine).some((pair) => {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    if (!otherBody) return false;

    return (
      isOldGroundContactCandidate(runtime, otherBody) &&
      isOldGroundContact(playerBody, otherBody, pair)
    );
  });

  control.isOnGround = isOnGround;
  if (contact) contact.isOnGround = isOnGround;
}

function isOldGroundContactCandidate(
  runtime: LevelRuntime,
  body: Matter.Body,
): boolean {
  if (body.isSensor || isSemisolidBody(body)) return false;
  if (body.label === "shell") return isOldRestingShellBody(runtime, body);
  return !NON_GROUND_CONTACT_LABELS.has(body.label);
}

function isOldRestingShellBody(runtime: LevelRuntime, body: Matter.Body): boolean {
  const entity = runtime.registry.getEntityByBodyId(body.id);
  if (entity === undefined) return false;

  const shell = runtime.registry.getComponent(entity, CT.Shell);
  const motion = runtime.registry.getComponent(entity, CT.HorizontalMotion);
  if (!shell || !motion) return false;

  return !motion.active;
}

function isOldGroundContact(
  playerBody: Matter.Body,
  groundBody: Matter.Body,
  pair: Matter.Pair,
): boolean {
  const normal = pair.collision.normal;
  const contactIsVertical = Math.abs(normal.y) > Math.abs(normal.x);
  const groundIsBelowPlayer = groundBody.position.y > playerBody.position.y;

  return contactIsVertical && groundIsBelowPlayer;
}

function getOldHorizontalInputDirection(
  operation: PlayerOperation,
): HorizontalDirection {
  if (operation.left === operation.right) return HORIZONTAL_DIRECTION.NONE;
  return operation.left
    ? HORIZONTAL_DIRECTION.LEFT
    : HORIZONTAL_DIRECTION.RIGHT;
}

function getOldWallContactDirection(
  direction: HorizontalDirection,
): ActiveHorizontalDirection | null {
  return direction === HORIZONTAL_DIRECTION.NONE ? null : direction;
}

function getOldOppositeHorizontalDirection(
  direction: ActiveHorizontalDirection,
): ActiveHorizontalDirection {
  return direction === HORIZONTAL_DIRECTION.LEFT
    ? HORIZONTAL_DIRECTION.RIGHT
    : HORIZONTAL_DIRECTION.LEFT;
}

function getOldHorizontalDirectionSign(
  direction: ActiveHorizontalDirection,
): number {
  return direction === HORIZONTAL_DIRECTION.LEFT ? -1 : 1;
}

function oldPlayerDamageEventSystem(
  registry: LevelRuntime["registry"],
  events: ReturnType<LevelRuntime["events"]["drain"]>,
  scheduler: LevelRuntime["scheduler"],
  eventSink: LevelRuntime["events"],
): void {
  for (const event of events) {
    if (event.type !== "PlayerDamageContactStarted") continue;

    handleOldPlayerDamage(
      registry,
      event.playerEntity,
      event.hazardEntity,
      scheduler,
      eventSink,
    );
  }
}

function handleOldPlayerDamage(
  registry: LevelRuntime["registry"],
  playerEntity: number,
  hazardEntity: number,
  scheduler: LevelRuntime["scheduler"],
  eventSink: LevelRuntime["events"],
): void {
  const control = registry.getComponent(playerEntity, CT.Player);
  const life = registry.getComponent(playerEntity, CT.PlayerLife);
  const hazard = registry.getComponent(hazardEntity, CT.Hazard);
  const playerBody = registry.getComponent(playerEntity, CT.Physics)?.body;
  const hazardBody = registry.getComponent(hazardEntity, CT.Physics)?.body;
  if (!control || !life || !hazard || !playerBody || !hazardBody) return;
  if (!hazard.active || !hazard.targetPlayer) return;
  if (life.isInvincible || life.lifeState !== LifeState.ALIVE) return;

  if (!life.isSmall) {
    life.isSmall = true;
    life.isInvincible = true;
    life.knockbackFrames = 25;

    const knockbackX = playerBody.position.x < hazardBody.position.x ? -14 : 14;
    Matter.Body.setVelocity(playerBody, { x: knockbackX, y: -10 });

    scheduler.schedule(1000, () => {
      life.isInvincible = false;
    });

    eventSink.emit({ type: "PlayerTookDamage", entity: playerEntity });
    return;
  }

  life.lifeState = LifeState.DYING;
  life.isInvincible = true;
  Matter.Body.setVelocity(playerBody, { x: 0, y: -16 });
  eventSink.emit({ type: "PlayerDied" });
}

function oldPlayerMovementSystem(
  runtime: LevelRuntime,
  operation: PlayerOperation,
  groundBodies: Matter.Body[],
): void {
  const entities = runtime.registry.view([CT.Player, CT.Physics, CT.Animator]);

  for (const entity of entities) {
    const control = runtime.registry.getComponent(entity, CT.Player);
    const life = runtime.registry.getComponent(entity, CT.PlayerLife);
    const physics = runtime.registry.getComponent(entity, CT.Physics);
    const animator = runtime.registry.getComponent(entity, CT.Animator);
    const body = physics?.body;

    if (!control || !physics || !animator || !body) continue;
    if (life?.lifeState === LifeState.DYING || control.lifeState === LifeState.DYING) continue;

    control.walkSpeed = OLD_WALK_SPEED;
    control.runSpeed = OLD_RUN_SPEED;
    control.jumpForce = OLD_JUMP_FORCE;

    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = operation.run ? OLD_RUN_SPEED : OLD_WALK_SPEED;
    const wallDirection = control.isOnGround
      ? null
      : getOldWallContactDirection(control.wallContactDirection);
    const horizontalInputDirection = getOldHorizontalInputDirection(operation);
    const pressingIntoWall =
      wallDirection !== null && horizontalInputDirection === wallDirection;
    const wallKickActive =
      control.wallJumpKickFrames > 0 &&
      control.wallJumpKickDirection !== HORIZONTAL_DIRECTION.NONE;

    const knockbackFrames = life?.knockbackFrames ?? control.knockbackFrames ?? 0;

    if (knockbackFrames > 0) {
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
        if (life) life.knockbackFrames--;
        else control.knockbackFrames--;
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
        if (wallKickActive) {
          const kickDirection = control.wallJumpKickDirection;
          setVelocityX(
            body,
            getOldHorizontalDirectionSign(kickDirection) * OLD_RUN_SPEED,
          );
          control.wallJumpKickFrames--;
          animator.flipX = kickDirection === HORIZONTAL_DIRECTION.LEFT;
          if (control.wallJumpKickFrames <= 0) {
            control.wallJumpKickDirection = HORIZONTAL_DIRECTION.NONE;
          }
        } else if (pressingIntoWall) {
          setVelocityX(body, 0);
        } else if (operation.left) {
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

    if (control.isOnGround) {
      control.wallJumpLockDirection = HORIZONTAL_DIRECTION.NONE;
      control.wallJumpKickDirection = HORIZONTAL_DIRECTION.NONE;
      control.wallJumpKickFrames = 0;
    }
    const canWallJump =
      wallDirection !== null &&
      control.wallJumpLockDirection !== wallDirection;

    if (jumpJustPressed && (control.isOnGround || canWallJump)) {
      setVelocityY(body, OLD_JUMP_FORCE);
      if (wallDirection !== null) {
        const kickDirection = getOldOppositeHorizontalDirection(wallDirection);
        setVelocityX(
          body,
          getOldHorizontalDirectionSign(kickDirection) * OLD_RUN_SPEED,
        );
        control.wallJumpLockDirection = wallDirection;
        control.wallJumpKickDirection = kickDirection;
        control.wallJumpKickFrames = WALL_JUMP_KICK_FRAMES;
      }
      control.jumpHoldFrames = 0;
    }

    if (!control.isOnGround) {
      const vyNow = body.velocity.y;
      if (vyNow < 0 && !operation.jump) {
        setVelocityY(body, vyNow + OLD_JUMP_GRAVITY_CUT);
      } else if (vyNow > 0) {
        setVelocityY(body, Math.min(vyNow + OLD_FALL_BOOST, OLD_MAX_FALL_VY));
      }
    }

    lockRotation(body);
  }
}

function configureLockedRuntimeBodies(runtime: LevelRuntime): void {
  configureLockedPlayerBody(runtime);

  for (const entity of runtime.registry.view([CT.Physics])) {
    if (entity === runtime.playerEntity) continue;

    if (runtime.registry.hasComponent(entity, CT.Enemy)) {
      configureLockedEnemy(runtime, entity);
      continue;
    }

    if (runtime.registry.hasComponent(entity, CT.Door)) {
      replaceMatterBody(runtime, entity, {
        kind: "door",
        width: OLD_TILE_SIZE,
        height: OLD_TILE_SIZE * 2,
        label: "door",
        category: CATEGORY_DOOR,
        collidesWith: [CATEGORY_DEFAULT],
      });
      continue;
    }

    if (runtime.registry.hasComponent(entity, CT.Coin)) {
      replaceMatterBody(runtime, entity, {
        kind: "coin",
        width: OLD_COIN_SIZE,
        height: OLD_COIN_SIZE,
        label: "coin",
        category: CATEGORY_COIN,
        collidesWith: [CATEGORY_DEFAULT],
      });
      continue;
    }

    if (runtime.registry.hasComponent(entity, CT.Shell)) {
      replaceMatterBody(runtime, entity, {
        kind: "shell",
        width: OLD_SHELL_WIDTH,
        height: OLD_SHELL_HEIGHT,
        label: "shell",
        category: CATEGORY_DEFAULT,
        collidesWith: [0xffff],
      });
    }
  }
}

function configureLockedPlayerBody(runtime: LevelRuntime): void {
  replaceMatterBody(runtime, runtime.playerEntity, {
    kind: "player",
    width: OLD_PLAYER_WIDTH,
    height: OLD_PLAYER_HEIGHT,
    label: "player",
    category: CATEGORY_DEFAULT,
    collidesWith: [0xffff],
  });
}

function configureLockedEnemy(runtime: LevelRuntime, entity: number): void {
  const motion = runtime.registry.getComponent(entity, CT.HorizontalMotion);
  if (motion) {
    if (runtime.registry.hasComponent(entity, CT.Bee)) {
      motion.speed = 2;
    } else if (runtime.registry.hasComponent(entity, CT.Snail)) {
      motion.speed = 2.5;
    } else {
      motion.speed = 4;
    }
  }

  replaceMatterBody(runtime, entity, {
    kind: "enemy",
    width: OLD_ENEMY_SIZE,
    height: OLD_ENEMY_SIZE,
    label: "enemy",
    category: CATEGORY_ENEMY,
    collidesWith: [CATEGORY_DEFAULT, CATEGORY_SEMISOLID, CATEGORY_ENEMY],
  });
}

function replaceMatterBody(
  runtime: LevelRuntime,
  entity: number,
  options: {
    kind: string;
    width: number;
    height: number;
    label: string;
    category: number;
    collidesWith: number[];
  },
): void {
  const transform = runtime.registry.getComponent(entity, CT.Transform);
  const physics = runtime.registry.getComponent(entity, CT.Physics);
  const body = physics?.body;
  if (!transform || !physics || !body) return;

  physics.width = options.width;
  physics.height = options.height;
  physics.label = options.label;
  physics.category = options.category;
  physics.collidesWith = options.collidesWith;

  const mask = options.collidesWith.reduce(
    (result, category) => result | category,
    0,
  );

  if ((body as Matter.Body & { rlLockedBodyKind?: string }).rlLockedBodyKind === options.kind) {
    body.collisionFilter.category = options.category;
    applyCollisionMask(body, mask);
    return;
  }

  const lockedBody = Matter.Bodies.rectangle(
    transform.x,
    transform.y,
    options.width,
    options.height,
    {
      label: options.label,
      friction: 0,
      frictionStatic: 0,
      isSensor: physics.isSensor,
      isStatic: physics.isStatic,
    },
  ) as Matter.Body & { rlLockedBodyKind?: string };

  lockedBody.collisionFilter.category = options.category;
  applyCollisionMask(lockedBody, mask);
  lockedBody.rlLockedBodyKind = options.kind;
  if (physics.fixedRotation) {
    Matter.Body.setInertia(lockedBody, Infinity);
  }

  unlinkPhysicsBody(runtime.registry, body);
  Matter.World.remove(runtime.world, body);
  Matter.World.add(runtime.world, lockedBody);
  physics.body = lockedBody;
  linkPhysicsBody(runtime.registry, entity, lockedBody);
}
