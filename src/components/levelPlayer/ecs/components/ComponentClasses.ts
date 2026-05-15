import { CT } from "../core/ComponentTypes";
import Matter from "matter-js";
import { MoveState, LifeState } from "./ComponentEnum";
import type { ScheduledTask } from "../resources/scheduler";
import { ComponentType, CTsToType } from "../core/ComponentMeta";

/**
 * player movement and state
 */
export class PlayerControl {
  static readonly bit = CT.Player;

  public moveState = MoveState.IDLE;
  public lifeState = LifeState.ALIVE;

  public isSmall = false;
  public isInvincible = false;
  public isOnGround = false;

  public jumpHoldFrames = 0;
  public jumpKeyWasDown = false;

  public knockbackFrames = 0;

  constructor(
    public walkSpeed = 8,
    public runSpeed = 10,
    public jumpForce = -22,
  ) {}
}

/**
 * horizontal ground movement
 */
export class HorizontalWalker {
  static readonly bit = CT.HorizontalWalker;
  public skipVelCheck = false;
  constructor(
    public speed = 4,
    public direction = -1,
    public active = true,
    public turnAtLedge = false,
  ) {}
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
  constructor(
    public currentAnim: string = "",
    public flipX: boolean = false,
  ) {}
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
  constructor(public enemyKilledType: string) {}
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
  ) {}
}

/**
 * physics body config and body ref
 */
export class Physics {
  static readonly bit = CT.Physics;
  public body: Matter.Body | undefined = undefined;
  constructor(
    public width: number,
    public height: number,
    public label: string,
    public category: number,
    public collidesWith: number[],
    public isStatic = false,
    public isSensor = false,
    public fixedRotation = true,
  ) {}
}

/**
 * horizontal flyer movement
 */
export class HorizontalFlyer {
  static readonly bit = CT.HorizontalFlyer;
  constructor(
    public speed = 2,
    public direction = -1,
    public active = true,
  ) {}
}

/**
 * bee tag
 */
export class Bee {
  static readonly bit = CT.Bee;
  constructor() {}
}

export type Component = CTsToType[ComponentType]
