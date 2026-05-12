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

function preload() {
  // map made with backend TiledMap in JSON format
  this.load.tilemapTiledJSON("map", gameMapJson);

  // background layers (4 vertically stacked images)
  this.load.image(
    "bg_layer1",
    "/assets/background/overworld/background_solid_sky.png",
  );
  this.load.image(
    "bg_layer2",
    "/assets/background/overworld/background_clouds.png",
  );
  this.load.image(
    "bg_layer3",
    "/assets/background/overworld/background_fade_trees.png",
  );
  this.load.image(
    "bg_layer4",
    "/assets/background/overworld/background_solid_sky.png",
  );

  // tiles in spritesheet
  this.load.spritesheet("tiles", "/assets/tiles.png", {
    frameWidth: 128,
    frameHeight: 128,
  });
  // coin images for spinning animation
  this.load.image("coin_gold", "/assets/coin/coin_gold.png");
  this.load.image("coin_gold_side", "/assets/coin/coin_gold_side.png");
  // saw enemy images
  this.load.image("saw_a", "/assets/enemies/saw/saw_a.png");
  this.load.image("saw_b", "/assets/enemies/saw/saw_b.png");
  // slime enemy animations
  this.load.atlas(
    "slime_normal",
    "/assets/enemies/slime_normal.png",
    "/assets/enemies/slime_normal.json",
  );
  // snail enemy animations
  this.load.atlas(
    "snail",
    "/assets/enemies/snail.png",
    "/assets/enemies/snail.json",
  );
  // player animations
  this.load.atlas("player", "/assets/player.png", "/assets/player.json");
}

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

function createTileMatterBodies(layer) {
  layer.forEachTile((tile) => {
    if (tile.index === -1) return;

    const tileset = tile.tileset;
    const tileData = tileset.tileData[tile.index - tileset.firstgid];
    const label = tileData?.type ?? "tile";
    const body = Matter.Bodies.rectangle(
      tile.pixelX + tile.width / 2,
      tile.pixelY + tile.height / 2,
      tile.width,
      tile.height,
      {
        isStatic: true,
        label,
      },
    );

    applyTileCollisionFilter(body, label);
    Matter.World.add(matterWorld, body);
  });
}

function createWorldBounds() {
  const wallThickness = 64;
  const wallHeight = map.heightInPixels + 200;
  const leftWall = Matter.Bodies.rectangle(
    -wallThickness / 2,
    wallHeight / 2,
    wallThickness,
    wallHeight,
    {
      isStatic: true,
      label: "world-left",
    },
  );
  const rightWall = Matter.Bodies.rectangle(
    map.widthInPixels + wallThickness / 2,
    wallHeight / 2,
    wallThickness,
    wallHeight,
    {
      isStatic: true,
      label: "world-right",
    },
  );

  leftWall.collisionFilter.category = CATEGORY_DEFAULT;
  leftWall.collisionFilter.mask = 0xffff & ~CATEGORY_ENEMY;
  rightWall.collisionFilter.category = CATEGORY_DEFAULT;
  rightWall.collisionFilter.mask = 0xffff;

  Matter.World.add(matterWorld, [leftWall, rightWall]);
}

function create() {
  // reset registry for new scene
  registry = new Registry();
  renderContext = createPhaserRenderContext(this);
  eventQueue = new EventQueue();
  matterEngine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY },
  });
  matterWorld = matterEngine.world;
  registry.onComponentRemove(CT.Sprite, (entity) => {
    removeGameObject(renderContext, entity);
  });

  // reset state on scene (re)start
  state.isSmall = false;
  state.isInvincible = false;
  state.isDying = false;
  state.isLevelComplete = false;
  state.doorOpen = false;
  state.knockbackFrames = 0;
  state.jumpHoldFrames = 0;
  state.jumpKeyWasDown = false;
  completeLevel = null;
  playerEntity = undefined;
  collisionContext = undefined;

  map = this.make.tilemap({ key: "map" });

  // tiles for the ground layer
  var groundTiles = map.addTilesetImage("tiles");
  // create the ground layer
  groundLayer = map.createLayer("World", groundTiles, 0, 0);

  // Enable collision on every non-empty tile.
  groundLayer.setCollisionByExclusion([-1]);

  createTileMatterBodies(groundLayer);

  const groundTileset = map.getTileset("tiles");
  tileMetadata = createTileMetadataResource(groundTileset);
  levelState = createLevelStateResourceFromMapProperties(map.properties);

  //
  // component hooks to define setup data
  //
  setupGlobalAnimations(this, groundTileset);

  map.objects.forEach((objLayer) => {
    objLayer.objects.forEach((obj) => {
      if (obj.gid === undefined) return;
      const gid = obj.gid;
      const frame = gid - groundTileset.firstgid;
      const type = groundTileset.tileData[frame]?.type;
      const x = obj.x + obj.width / 2;
      const y = obj.y - obj.height / 2;
      console.log(
        `object at (${x}, ${y}) type: "${type}", gid: ${obj.gid}, frame: ${frame}`,
      );
      const res = spawnEntity(registry, type, x, y, frame);
      if (res === -1) {
        console.log(`Failed to spawn entity of type: ${type} AND ${res} `);
        return;
      }

      if (type == "Door_Closed") {
        console.log(res);
      }
      createMatterBodyForEntity(matterWorld, registry, res);

      if (type === "Door_Closed") {
        const topFrame = findTilesetFrameByType(
          groundTileset,
          "Door_Closed_Top",
        );
        if (topFrame !== undefined) {
          ensureDoorTopSprite(renderContext, registry, res, topFrame);
        }
      }
    });
  });
  levelStateSystem(levelState, []);
  setDoorVisualState(levelState.doorOpen);

  completeLevel = () => {
    if (state.isLevelComplete) return;
    state.isLevelComplete = true;

    // Detach player rendering from physics so tweens can move it freely.
    freezePlayerBody();

    // Find the closest open door to tween towards.

    const [doorId] = registry.view([CT.Door]);
    const doorPos = registry.getComponent(doorId, CT.Transform);

    // 1. Slide player to the horizontal centre of the door's bottom tile.
    this.tweens.add({
      targets: player,
      x: doorPos.x,
      duration: 400,
      ease: "Quad.easeInOut",
      onComplete: () => {
        // 2. Shrink and fade — player disappears into the door.
        this.tweens.add({
          targets: player,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 300,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(400, () => EventBus.emit("LevelCompleted"));
          },
        });
      },
    });
  };

  // Open all doors when the clear condition is met.
  EventBus.on("ClearConditionCompleted", () => {
    levelState.doorOpen = true;
    setDoorVisualState(true);
  });

  // create repeating background layers (4 vertically stacked, each 1/4 height)
  // TileSprite tiles the SOURCE texture, so we use regular images scaled to fit
  var mapWidth = map.widthInPixels;
  var gameHeight = map.heightInPixels;
  var sliceH = gameHeight / 4;

  createBgRow(this, 0, "bg_layer1", -4, mapWidth, sliceH);
  createBgRow(this, sliceH, "bg_layer2", -3, mapWidth, sliceH);
  createBgRow(this, sliceH * 2, "bg_layer3", -2, mapWidth, sliceH);
  createBgRow(this, sliceH * 3, "bg_layer4", -1, mapWidth, sliceH);

  createWorldBounds();

  // create the player sprite at the spawn point set by Start_Flag
  let spawn_x = 200;
  let spawn_y = 200;

  registry.view([CT.StartFlag, CT.Transform]).forEach((id) => {
    const pos = registry.getComponent(id, CT.Transform);
    spawn_x = pos.x;
    spawn_y = pos.y;
  });

  playerEntity = spawnPlayer(registry, spawn_x, spawn_y);
  createMatterBodyForEntity(matterWorld, registry, playerEntity);
  syncTransformsFromMatter(registry);
  renderSystem(renderContext, registry);
  player = getGameObject(renderContext, playerEntity);

  collisionContext = {
    registry,
    world: matterWorld,
    tileMetadata,
    scheduler: createPhaserScheduler(this),
    events: eventQueue,
  };

  Matter.Events.on(matterEngine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      routeCollisionPair(collisionContext, collisionStartRules, pair);
    });
  });

  Matter.Events.on(matterEngine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      routeCollisionPair(collisionContext, collisionEndRules, pair);
    });
  });

  // define input cursors
  cursors = this.input.keyboard.createCursorKeys();
  // set bounds so the camera won't go outside the game world
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // zoom to fit map height exactly (no black bars), which shows 24 blocks wide at 1536px canvas
  this.cameras.main.setZoom(this.cameras.main.height / map.heightInPixels);
  // make the camera follow the player
  this.cameras.main.startFollow(player);

  EventBus.emit("RunStarted");
}

function update(time, delta) {
  const groundBodies = getMovementBlockingBodies(matterWorld);

  // ECS Systems
  horizontalMovementSystem(registry, groundBodies);
  // When the level is complete, freeze everything and skip input.
  if (state.isLevelComplete) {
    lockPlayerBodyRotation();
    return;
  }

  // During the death animation let physics run freely; skip all input logic.
  if (state.isDying) {
    lockPlayerBodyRotation();
    setPlayerAnimation("idle");
    return;
  }

  // ── Run ECS Player Movement ──
  const playerOperation = {
    left: cursors.left.isDown,
    right: cursors.right.isDown,
    jump: cursors.up.isDown,
    run: cursors.shift.isDown,
  };
  playerMovementSystem(registry, playerOperation, groundBodies);
  collisionFilterSystem({
    registry,
    playerEntity,
  });
  Matter.Engine.update(matterEngine, delta);
  worldBoundsSystem({
    world: matterWorld,
    registry,
    events: eventQueue,
    levelState,
    playerEntity,
    map,
  });

  const events = eventQueue.drain();
  processGameEvents(this, events);
  syncTransformsFromMatter(registry);
  renderSystem(renderContext, registry);
  animationSystem(renderContext, registry);
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
