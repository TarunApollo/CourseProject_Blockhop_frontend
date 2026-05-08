export const ComponentTypes = {
  Transform: 1 << 0,
  Motion: 1 << 1,
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
  

  Health: 1 << 6,
  Collision: 1 << 7,
  Door: 1 << 8,
  Item: 1 << 9,
  Hazard: 1 << 10,
  StartFlag: 1 << 11,
  Animator: 1 << 12,
  Slime: 1 << 13,
  Shell: 1 << 14,
  Snail: 1 << 15,
  DestructibleBox : 1<<16,
  Coin:1<<17,
};
