export const ComponentTypes = {
  Transform: 1 << 0,
  Sprite: 1 << 2,
  Physics: 1 << 3,
  Player: 1 << 4,

  /**
   * abstraction on movementSystem
   * shell + snail + slime have similar logic in movement
   * so abstract them in name horizontalWalker
   *
   * if deepseek wanna add bee add a flyer
   */
  HorizontalWalker: 1 << 5,

  Door: 1 << 8,

  /**
   * hazard is a damage identity to abstract hazard in damage system
   */
  Hazard: 1 << 10,

  /**
   * enemy is a collision identity to abstract slime and snail
   */
  Enemy: 1 << 18,

  /**
   * component for normalize falling down the map
   * for snail,slime and shell
   */

  OutOfBounds: 1 << 7,

  /**
   * component for dynamic collision filter of player
   */
  PlayerCollisionFilter: 1 << 9,

  StartFlag: 1 << 11,
  Animator: 1 << 12,
  Slime: 1 << 13,
  Shell: 1 << 14,
  Snail: 1 << 15,
  DestructibleBox: 1 << 16,
  Coin: 1 << 17,
  HorizontalFlyer: 1 << 19,
  Bee: 1 << 20,
};
