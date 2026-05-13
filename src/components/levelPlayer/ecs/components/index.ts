import { ComponentTypes as CT } from "../core/ComponentTypes";
import type * as Matter from "matter-js";
import type { ScheduledTask } from "../resources/scheduler";

export class Transform {
  static readonly bit = CT.Transform;
  constructor(
    public x = 0,
    public y = 0,
    public rotation = 0,
  ) {}
}

export class Sprite {
  static readonly bit = CT.Sprite;
  constructor(
    public key: string,
    public frame: string,
    public width?: number,
    public height?: number,
  ) {}
}

export class Physics {
  static readonly bit = CT.Physics;
  public body: Matter.Body | null = null;
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

export enum MoveState {
  IDLE,
  WALKING,
  JUMPING,
  FALLING,
  KNOCKBACK,
}

export enum LifeState {
  ALIVE,
  DYING,
  DEAD,
}

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

export class Hazard {
  static readonly bit = CT.Hazard;
  constructor(
    public damage = 1,
    public targetPlayer = false,
    public targetEnemy = false,
    public active = true,
  ) {}
}

export class Animator {
  static readonly bit = CT.Animator;
  constructor(
    public currentAnim: string = "",
    public flipX: boolean = false,
  ) {}
}

export class Door {
  static readonly bit = CT.Door;
  public isOpen = false;
  constructor() {}
}

export class StartFlag {
  static readonly bit = CT.StartFlag;
  constructor() {}
}

export class Slime {
  static readonly bit = CT.Slime;
  constructor() {}
}

/**
 * shell itself only store the unique logic for respawn
 * movement state in horizontalWalker
 * damage state in hazard
 */
export class Shell {
  static readonly bit = CT.Shell;
  public respawnTimer: ScheduledTask | null = null;
  constructor() {}
}

/**
 * slime & snail = enemy
 * use enemy && shell to differentiate different abstraction
 * in collision system
 *
 */
export class Enemy {
  static readonly bit = CT.Enemy;
  constructor() {}
}

export class Snail {
  static readonly bit = CT.Snail;
  constructor() {}
}

export class DestructibleBox {
  static readonly bit = CT.DestructibleBox;
  constructor(public content?: string) {}
}

export class Coin {
  static readonly bit = CT.Coin;
  constructor(public coinType: string) {}
}

export class OutOfBounds {
  static readonly bit = CT.OutOfBounds;
  constructor(public enemyKilledType: string) {}
}

/**
 * dynamic filter for player collision
 */
export class PlayerCollisionFilter {
  static readonly bit = CT.PlayerCollisionFilter;

  constructor(
    public normalMask: number,
    public risingMask: number,
    public disabledMask = 0,
  ) {}
}
