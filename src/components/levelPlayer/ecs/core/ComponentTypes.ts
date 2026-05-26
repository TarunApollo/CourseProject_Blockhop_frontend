/**
 * Component type bit flags
 *
 * values used as bitmasks in entity signatures
 * - add: signature | CT.Transform
 * - remove: signature & ~CT.Transform
 * - has: (signature & CT.Transform) === CT.Transform
 *
 */
export const CT = {
  /*
   * position
   */
  Transform: 1,

  /**
   * render
   */
  Sprite: 2,

  /**
   * physics body config + runtime Matter body reference
   */
  Physics: 4,

  /**
   * player-only control + state
   */
  Player: 8,

  /**
   * player contact state observed by contact systems
   */
  PlayerContact: 8388608,

  /**
   * player life and damage response state
   */
  PlayerLife: 16777216,

  /**
   * player climb movement state
   */
  PlayerClimb: 33554432,

  /**
   * player crouch state
   */
  PlayerCrouch: 67108864,

  /**
   * abstract horizontal movement behavior
   */
  HorizontalWalker: 16,

  /**
   * shared horizontal movement state
   */
  HorizontalMotion: 2097152,

  /**
   * climbable world sensor such as ladder or chain
   */
  Climbable: 4194304,

  /**
   * door state (open or not)
   */
  Door: 32,

  /**
   *  tag component for dying entities / out of world
   */
  OutOfBounds: 64,

  /**
   * dynamic collision filter
   */
  PlayerCollisionFilter: 128,

  /**
   * abstract damage component
   */
  Hazard: 256,

  StartFlag: 512,

  /**
   * animation state
   */
  Animator: 1024,

  /**
   * tag component
   */
  Slime: 2048,

  /**
   * tag
   */
  Shell: 4096,

  /**
   * tag
   */
  Snail: 8192,

  /**
   * breakable box with optional content
   */
  DestructibleBox: 16384,

  /**
   * collectable coin 
   */
  Coin: 32768,

  /**
   * enemy component for collision 
   */
  Enemy: 65536,

  /**
   * horizontal flyer behavior
   */
  HorizontalFlyer: 131072,

  /**
   * tag
   */
  Bee: 262144,

  /**
   * hazard entity that is not also an enemy or shell.
   */
  PassiveHazard: 524288,

  /**
   * player carry state
   */
  Carrier: 1048576,

  /**
   * tag — entity belongs to a ghost-replay runtime (translucent render,
   * no interaction with the live world). Only entities carrying this
   * marker are drawn by the ghost render pass.
   */
  Ghost: 4194304,
} as const;

export type ComponentType = (typeof CT)[keyof typeof CT];
