import { ComponentTypes as CT } from "../../core/ComponentTypes";
import {
  handleAIWalkerAIWalker,
  handleAIWalkerDestructibleBox,
  handleAIWalkerShell,
  handlePlayerCoin,
  handlePlayerDestructibleBox,
  handlePlayerDoor,
  handlePlayerHazard,
  handlePlayerHazardActive,
} from "./collisionHandlers";
import type { CollisionRule } from "./collisionTypes";

/**
 * table for handler of touch-time
 */
export const collisionStartRules: CollisionRule[] = [
  {
    subject: CT.Player,
    target: CT.Hazard,
    handler: handlePlayerHazard,
  },
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
  // {
  //   subject: CT.Player,
  //   target: CT.Shell,
  //   handler: handlePlayerShell,
  // },
  // {
  //   subject: CT.Shell,
  //   target: CT.Hazard,
  //   handler: handleShellHazard,
  // },
  // {
  //   subject: CT.Shell,
  //   target: CT.DestructibleBox,
  //   handler: handleShellDestructibleBox,
  // },
  {
    subject: CT.AIWalker,
    target: CT.DestructibleBox,
    handler: handleAIWalkerDestructibleBox,
  },
  {
    subject: CT.AIWalker,
    target: CT.AIWalker,
    handler: handleAIWalkerAIWalker,
  },
  {
    subject: CT.AIWalker,
    target: CT.Shell,
    handler: handleAIWalkerShell,
  },
];

/**
 * table for handler for continuing time of collision
 */
export const collisionActiveRules: CollisionRule[] = [
  {
    subject: CT.Player,
    target: CT.Hazard,
    handler: handlePlayerHazardActive,
  },

  // {
  //   subject: CT.Player,
  //   target: CT.Shell,
  //   handler: handlePlayerShellActive,
  // },
];

/**
 * table for handler for end time of collision
 */
export const collisionEndRules: CollisionRule[] = [
  // {
  //   subject: CT.Player,
  //   target: CT.Shell,
  //   handler: handlePlayerShellEnd,
  // },
];
