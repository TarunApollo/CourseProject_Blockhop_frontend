/**
 * main.js — Phaser scene entry point for the level player.
 *
 * Structure
 * ─────────
 *   preload()  load all assets (tilemap, spritesheets, atlases)
 *   create()   build the world: tilemap → physics bodies → objects → player →
 *              background → collision handlers → animations → camera
 *   update()   called every frame: ground detection → enemy/shell movement →
 *              player input (horizontal, jump, fast-fall) → fall-off check
 *
 * Game state
 * ──────────
 * All boolean/numeric flags are kept in the module-level `state` object so
 * they can be passed by reference to the mechanics modules without those
 * modules needing direct access to the Phaser scene.
 *
 * Module-level arrays (`enemies`, `shells`, `doors`) and the `damageBodies`
 * Set are similarly shared; they are passed into each mechanics module that
 * needs to read or mutate them.
 */

import Phaser from "phaser";
import Matter from "matter-js";
import { EventBus } from "./EventBus";
import {
  CATEGORY_DEFAULT,
  CATEGORY_ENEMY,
  GRAVITY,
} from "./mechanics/constants.js";
import { createBgRow } from "./mechanics/background.js";
import { Registry } from "./ecs/core/Registry.ts";
import { ComponentTypes as CT } from "./ecs/core/ComponentTypes.ts";
import {
  horizontalMovementEventSystem,
  playerMovementSystem,
  horizontalMovementSystem,
  playerMovementEventSystem,
  levelStateSystem,
  worldBoundsSystem,
} from "./ecs/systems/index.ts";
import { spawnPlayer } from "./ecs/playerSetup.ts";
import {
  animationEventSystem,
  animationSystem,
} from "./phaser/animationSystem.ts";
import { setupGlobalAnimations } from "./phaser/animationSetup.ts";
import { spawnEntity } from "./ecs/EntityFactory";
import { EventQueue } from "./ecs/eventQueue.ts";
import { createTileMetadataResource } from "./ecs/resources/tileMetadata.ts";
import { createLevelStateResourceFromMapProperties } from "./ecs/resources/levelState.ts";
import {
  createMatterBodyForEntity,
  syncTransformsFromMatter,
} from "./ecs/adapter/matterAdapter.ts";
import {
  createPhaserRenderContext,
  ensureDoorTopSprite,
  getGameObject,
  removeGameObject,
  renderSystem,
  setDoorFrames,
} from "./ecs/adapter/phaserAdapter.ts";
import { getMovementBlockingBodies } from "./ecs/systems/matterQuerySystem.ts";
import {
  applyTileCollisionFilter,
  collisionFilterSystem,
} from "./ecs/systems/collision/collisionFilterSystem.ts";
import {
  collisionEndRules,
  collisionStartRules,
} from "./ecs/systems/collision/collisionRules.ts";
import { routeCollisionPair } from "./ecs/systems/collision/collisionRouter.ts";

var config = {
  type: Phaser.AUTO,
  width: 1536,
  height: 768,
  scene: {
    key: "main",
    preload: preload,
    create: create,
    update: update,
  },
};

var registry;
var renderContext;
var eventQueue;
var matterEngine;
var matterWorld;
var tileMetadata;
var levelState;
var collisionContext;
var playerEntity;
var map;
var player;
var cursors;
var groundLayer;
var completeLevel = null; // assigned in create() — captures scene context

// All mutable boolean / numeric game-state flags live here so they can be
// passed by reference to extracted mechanics functions.
const state = {
  isSmall: false,
  isInvincible: false,
  isOnGround: false,
  knockbackFrames: 0,
  isDying: false,
  isLevelComplete: false,
  doorOpen: false,
  // Jump-state tracking needed for variable jump height.
  // jumpHoldFrames counts how many consecutive frames the jump key has been
  // held while the player is rising; resets to 0 on each new jump.
  // jumpKeyWasDown lets us detect a *fresh* press (edge, not level).
  jumpHoldFrames: 0,
  jumpKeyWasDown: false,
};

var gameMapJson = "assets/map1.json";

function findTilesetFrameByType(groundTileset, type) {
  for (const [frame, data] of Object.entries(groundTileset.tileData ?? {})) {
    if (
      data &&
      typeof data === "object" &&
      "type" in data &&
      data.type === type
    ) {
      return Number.parseInt(frame, 10);
    }
  }
  return undefined;
}

function getPlayerBody() {
  return registry.getComponent(playerEntity, CT.Physics)?.body;
}

function freezePlayerBody() {
  const body = getPlayerBody();
  if (!body) return;

  Matter.Body.setStatic(body, true);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
}

function lockPlayerBodyRotation() {
  const body = getPlayerBody();
  if (!body) return;

  Matter.Body.setAngularVelocity(body, 0);
  Matter.Body.setAngle(body, 0);
}

function setPlayerAnimation(animationKey) {
  const animator = registry.getComponent(playerEntity, CT.Animator);
  if (animator) animator.currentAnim = animationKey;
}

function processGameEvents(scene, events) {
  horizontalMovementEventSystem(registry, events);
  playerMovementEventSystem(registry, events);

  const wasDoorOpen = levelState.doorOpen;
  const wasComplete = levelState.isComplete;
  levelStateSystem(levelState, events);

  if (!wasDoorOpen && levelState.doorOpen) {
    setDoorVisualState(true);
  }

  if (!wasComplete && levelState.isComplete) {
    completeLevel();
  }

  animationEventSystem(renderContext, tileMetadata, events, eventQueue);
  forwardGameEventsToUi(scene, events);
}

function setDoorVisualState(isOpen) {
  state.doorOpen = isOpen;
  levelState.doorOpen = isOpen;

  const bottomFrame = tileMetadata.frameByType.get(
    isOpen ? "Door_Open" : "Door_Closed",
  );
  const topFrame = tileMetadata.frameByType.get(
    isOpen ? "Door_Open_Top" : "Door_Closed_Top",
  );

  const doorIds = registry.view([CT.Door]);
  doorIds.forEach((id) => {
    const doorComp = registry.getComponent(id, CT.Door);
    if (!doorComp) return;

    doorComp.isOpen = isOpen;

    const sprite = registry.getComponent(id, CT.Sprite);
    if (sprite && bottomFrame !== undefined) {
      sprite.frame = bottomFrame.toString();
    }

    setDoorFrames(renderContext, id, bottomFrame, topFrame);
  });
}

function createPhaserScheduler(scene) {
  return {
    schedule(delayMs, callback) {
      const delayedCall = scene.time.delayedCall(delayMs, callback);
      return {
        remove: () => delayedCall.remove(false),
      };
    },
  };
}

function restartAfterFailure(scene, reason) {
  if (state.isDying) return;

  state.isDying = true;
  EventBus.emit("AttemptFailed", { reason });
  scene.time.delayedCall(300, () => {
    scene.scene.restart();
  });
}

function forwardGameEventsToUi(scene, events) {
  for (const event of events) {
    switch (event.type) {
      case "CoinCollected":
        EventBus.emit("CoinCollected", event.coinType);
        break;
      case "EnemyKilled":
        EventBus.emit("EnemyKilled", event.enemyType);
        break;
      case "BoxDestroyed":
        EventBus.emit("BoxDestroyed", event.content);
        break;
      case "GameOver":
        restartAfterFailure(scene, "fall");
        break;
    }
  }
}

const StartGame = (parent, width, height, mapJson) => {
  if (mapJson) gameMapJson = mapJson;
  return new Phaser.Game({ ...config, parent, width, height });
};

export default StartGame;
