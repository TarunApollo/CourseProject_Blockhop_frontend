import { CT } from "../core/ComponentTypes";
import Matter from "matter-js";
import {
  MoveState,
  LifeState,
  HORIZONTAL_DIRECTION,
  type HorizontalDirection,
  type ActiveHorizontalDirection,
} from "./ComponentEnum";
import type { ScheduledTask } from "../resources/scheduler";
import { ComponentType, CTsToType } from "../core/ComponentMeta";
import type { CollisionShape } from "../headlessRuntime/types";



/**
 * player moving,jumping, and anti-cheating mechinism
 */
export class PlayerControl {
  static readonly bit = CT.Player;

  public moveState = MoveState.IDLE;

  public pickupAndThrowKeyWasDown = false;
  public noclipActive = false;

  public jumpHoldFrames = 0;
  public jumpKeyWasDown = false;
  public wallJumpLockDirection: HorizontalDirection =
    HORIZONTAL_DIRECTION.NONE;
  public wallJumpKickDirection: HorizontalDirection =
    HORIZONTAL_DIRECTION.NONE;
  public wallJumpKickFrames = 0;

  constructor(
    public walkSpeed = 8,
    public runSpeed = 15,
    public jumpForce = -22,
  ) {}
}

/**
 * player contact state
 */
export class PlayerContact {
  static readonly bit = CT.PlayerContact;

  public isOnGround = false;
  public forceGroundState: boolean | null = null;
  public wallContactDirection: HorizontalDirection =
    HORIZONTAL_DIRECTION.NONE;
  public climbContactEntity: number | null = null;

  constructor() {}
}

/**
 * player life state
 */
export class PlayerLife {
  static readonly bit = CT.PlayerLife;

  public lifeState = LifeState.ALIVE;
  public isSmall = false;
  public isInvincible = false;
  public knockbackFrames = 0;

  constructor() {}
}

/**
 * player climb movement state
 */
export class PlayerClimb {
  static readonly bit = CT.PlayerClimb;

  public isClimbing = false;

  constructor(public speed = 12) {}
}

/**
 * shared horizontal movement state
 */
export class HorizontalMotion {
  static readonly bit = CT.HorizontalMotion;
  constructor(
    public speed = 4,
    public direction = -1,
    public active = true,
  ) {}
}

/**
 * horizontal ground movement behavior
 */
export class HorizontalWalker {
  static readonly bit = CT.HorizontalWalker;
  public skipVelCheck = false;
  constructor(public turnAtLedge = false) {}
}

/**
 * damage values and targets
 */
export class Hazard {
  static readonly bit = CT.Hazard;
  constructor(
    public damage = 1,
    public targetPlayer = false,
    public targetEnemy = false,
    public active = true,
  ) {}
}

/**
 * current animation state
 */
export class Animator {
  static readonly bit = CT.Animator;
  public lockedAnim: string | null = null;
  public lockFrames = 0;

  constructor(
    public currentAnim: string = "",
    public flipX: boolean = false,
    public isPaused: boolean = false,
  ) {}

  lock(animKey: string, frames: number): void {
    this.lockedAnim = animKey;
    this.lockFrames = frames;
  }
}

/**
 * door state
 */
export class Door {
  static readonly bit = CT.Door;
  public isOpen = false;
  constructor() {}
}

/**
 * player spawn tag
 */
export class StartFlag {
  static readonly bit = CT.StartFlag;
  constructor() {}
}

/**
 * slime tag
 */
export class Slime {
  static readonly bit = CT.Slime;
  constructor() {}
}

/**
 * shell state for snail -> shell
 */
export class Shell {
  static readonly bit = CT.Shell;
  public respawnTimer: ScheduledTask | null = null;
  public ignorePlayerUntilContactEnd: boolean = false;
  constructor() {}
}

/**
 * enemy tag
 */
export class Enemy {
  static readonly bit = CT.Enemy;
  constructor() {}
}

/**
 * snail tag
 */
export class Snail {
  static readonly bit = CT.Snail;
  constructor() {}
}

/**
 * breakable box with optional content
 */
export class DestructibleBox {
  static readonly bit = CT.DestructibleBox;
  constructor(public content?: string) {}
}

/**
 * collectable coin type
 */
export class Coin {
  static readonly bit = CT.Coin;
  constructor(public coinType: string) {}
}

/**
 * data for out of bounds behavior
 */
export class OutOfBounds {
  static readonly bit = CT.OutOfBounds;
  constructor() {}
}

/**
 * masks for player collision filtering
 */
export class PlayerCollisionFilter {
  static readonly bit = CT.PlayerCollisionFilter;

  constructor(
    public normalMask: number,
    public risingMask: number,
    public disabledMask = 0,
  ) {}
}

/**
 * world position and rotation
 */
export class Transform {
  static readonly bit = CT.Transform;
  constructor(
    public x = 0,
    public y = 0,
    public rotation = 0,
  ) {}
}

/**
 * sprite render config
 */
export class Sprite {
  static readonly bit = CT.Sprite;
  constructor(
    public key: string,
    public frame: string,
    public width?: number,
    public height?: number,
    public originX?: number,
    public originY?: number,
  ) {}
}

/**
 * physics body config and body ref
 */
export class Physics {
  static readonly bit = CT.Physics;
  public body: Matter.Body | undefined = undefined;
  public collisionShapes: CollisionShape[] | undefined = undefined;
  constructor(
    public width: number,
    public height: number,
    public label: string,
    public category: number,
    public collidesWith: number[],
    public isStatic = false,
    public isSensor = false,
    public fixedRotation = true,
    public gravityScale = 1,
  ) {}

  withRect(x: number, y: number, width: number, height: number): Physics {
    this.collisionShapes = [{ kind: "rectangle", x, y, width, height }];
    return this;
  }
}

/**
 * horizontal flyer movement behavior
 */
export class HorizontalFlyer {
  static readonly bit = CT.HorizontalFlyer;
  constructor() {}
}

/**
 * world sensor the player can climb, e.g. ladder or chain
 */
export class Climbable {
  static readonly bit = CT.Climbable;
  constructor() {}
}

/**
 * bee tag
 */
export class Bee {
  static readonly bit = CT.Bee;
  constructor() {}
}

/**
 * tag for hazard entities that are not Enemy or Shell (e.g. spike tiles).
 * collision rules dispatch on this directly instead of guarding inside the
 * handler.
 */
export class PassiveHazard {
  static readonly bit = CT.PassiveHazard;
  constructor() {}
}

/**
 * stores which entity the player is currently carrying
 * and how far from the player body it should be positioned
 */
export class Carrier {
  static readonly bit = CT.Carrier;

  constructor(
    public heldEntity: number | null = null,
    public offsetX = 90,
    public offsetY = 10,
  ) {}
}

export type Component = CTsToType[ComponentType];
