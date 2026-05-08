/**
 * table for handler for touch time of collision
 */
export const collisionStartRules: CollisionRule[] = [
  {
    subject: CT.Player,
    target: CT.Door,
    handler: handlePlayerDoor,
  },
  {
    subject: CT.Player,
    target: CT.Coin,
    handler: handlePlayerCoin,
  },
  {
    subject: CT.Player,
    target: CT.DestructibleBox,
    handler: handlePlayerDestructibleBox,
  },

  {
    subject: CT.Player,
    target: CT.Shell,
    handler: handlePlayerShell,
  },

  {
    subject: CT.Player,
    target: CT.Enemy,
    handler: handlePlayerEnemy,
  },

  {
    subject: CT.Shell,
    target: CT.DestructibleBox,
    handler: handleShellDestructibleBox,
  },

  {
    subject: CT.Enemy,
    target: CT.Enemy,
    handler: handleEnemyEnemy,
  },

  {
    subject: CT.Shell,
    target: CT.Enemy,
    handler: handleShellEnemy,
  },

  {
    subject: CT.Enemy,
    target: CT.DestructibleBox,
    handler: handleEnemyDestructibleBox,
  },

];



/**
 * table for handler for end time of collision
 */
export const collisionEndRules: CollisionRule[] = [
  {
    subject: CT.Player,
    target: CT.Shell,
    handler: handlePlayerShellEnd,
  },
];
