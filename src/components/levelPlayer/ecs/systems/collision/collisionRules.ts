import { ComponentTypes as CT } from "../../core/ComponentTypes";
import {
  handlePlayerDestructibleBox,
  handlePlayerCoin,
  handlePlayerDoor,
  handlePlayerEnemy,
  handlePlayerEnemyEnd,
  handlePlayerShell,
  handlePlayerShellEnd,
} from "./handlers/playerCollisionHandlers";
import {
  handleEnemyDestructibleBox,
  handleEnemyEnemy,
} from "./handlers/enemyCollisionHandlers";
import {
  handleShellDestructibleBox,
  handleShellEnemy,
  handleShellShell,
} from "./handlers/shellCollisionHandlers";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionRouterSystem";

export type CollisionRule = {
  subject: number;
  target: number;
  handler: (
    context: CollisionHandlerContext,
    collision: MatchedCollision,
  ) => void;
};

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
    subject: CT.Shell,
    target: CT.Shell,
    handler: handleShellShell,
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
    target: CT.Enemy,
    handler: handlePlayerEnemyEnd,
  },
  {
    subject: CT.Player,
    target: CT.Shell,
    handler: handlePlayerShellEnd,
  },
];

/**
 * table for handler for active (continuous) collision
 */
export const collisionActiveRules: CollisionRule[] = [
  {
    subject: CT.Player,
    target: CT.Enemy,
    handler: handlePlayerEnemy,
  },
  {
    subject: CT.Player,
    target: CT.Shell,
    handler: handlePlayerShell,
  },
];
