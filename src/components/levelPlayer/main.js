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
import { EventBus } from "./EventBus";
import {
  CATEGORY_DEFAULT,
  CATEGORY_SEMISOLID,
  CATEGORY_ENEMY,
  CATEGORY_COIN,
  CATEGORY_DOOR,
  GRAVITY,
  JUMP_VY,
  JUMP_HOLD_FORCE,
  JUMP_HOLD_MAX_FRAMES,
  FALL_BOOST,
  MAX_FALL_VY,
  WALK_SPEED,
  RUN_SPEED,
  H_DECEL,
} from "./mechanics/constants.js";
import { createBgRow } from "./mechanics/background.js";
import { resetGame } from "./mechanics/playerDamage.js";
import { updateEnemies, updateShells } from "./mechanics/enemyMovement.js";
import { createObjectHandlers } from "./mechanics/objectHandlers.js";
import { setupCollisionHandlers } from "./mechanics/collisionHandlers.js";
import { Registry } from "./ecs/core/Registry.ts";
import { ComponentTypes as CT } from "./ecs/core/ComponentTypes.ts";
import {
  playerMovementSystem,
  animationSystem,
  slimeMovementSystem,
  aiWalkerSystem,
} from "./ecs/systems/index.ts";
import { registerPlayerHooks, spawnPlayer } from "./ecs/playerSetup.ts";
import { setupGlobalAnimations } from "./ecs/animationSetup";
import { spawnEntity } from "./ecs/EntityFactory";
import { registerDoorHooks } from "./ecs/doorSetup";

var config = {
  type: Phaser.AUTO,
  width: 1536,
  height: 768,
  physics: {
    default: "matter",
    matter: {
      // Use the tuned GRAVITY constant instead of the old sluggish 0.9.
      gravity: { y: GRAVITY },
      debug: false,
    },
  },
  scene: {
    key: "main",
    preload: preload,
    create: create,
    update: update,
  },
};

var registry;
var map;
var player;
var cursors;
var groundLayer;
var footSensor;
var completeLevel = null; // assigned in create() — captures scene context
var enemies = []; // active enemy sprites
var shells = []; // active shell sprites
var doors = []; // door image pairs { bottom, top, x, y, tileSize }
var damageBodies; // Set of body.id values that deal damage to the player

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

function create() {
  // reset registry for new scene
  registry = new Registry();

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
  enemies = [];
  shells = [];
  doors = [];

  map = this.make.tilemap({ key: "map" });

  // tiles for the ground layer
  var groundTiles = map.addTilesetImage("tiles");
  // create the ground layer
  groundLayer = map.createLayer("World", groundTiles, 0, 0);

  // Enable collision on every non-empty tile.
  groundLayer.setCollisionByExclusion([-1]);
  // convert tilemap layer collisions to Matter bodies
  this.matter.world.convertTilemapLayer(groundLayer);

  // Label every Matter body with the tile's Tiled type string so collision
  // handlers can identify it (e.g. "Semisolid", "BoxDouble").
  // Semisolid tiles additionally get their own collision category so the
  // player can jump through them from below (see beforeupdate mask logic).
  groundLayer.forEachTile((tile) => {
    if (tile.physics.matterBody) {
      const tileset = tile.tileset;
      const tileData = tileset.tileData[tile.index - tileset.firstgid];
      const label = tileData?.type ?? "tile";
      tile.physics.matterBody.body.label = label;
      if (label === "Semisolid") {
        tile.physics.matterBody.body.collisionFilter.category =
          CATEGORY_SEMISOLID;
      }
    }
  });

  // Render tile objects from object layers (objects that have a gid).
  // Tiled tile-objects anchor at bottom-left; Phaser images anchor at center,
  // so subtract half the height to convert.
  //
  // Add a handler to OBJECT_HANDLERS to support a new type.
  // Objects whose type is not listed here are silently skipped.
  const destructibles = new Map(); // body.id → { img, body }
  const coinMap = new Map(); // body.id → coin sprite
  damageBodies = new Set(); // body.id for damage-dealing objects (module-level)

  const groundTileset = map.getTileset("tiles");
  const OBJECT_HANDLERS = createObjectHandlers(this, groundTileset, {
    destructibles,
    coinMap,
    enemies,
    shells,
    doors,
    damageBodies,
  });
  const transformShellToSnail = OBJECT_HANDLERS._transformShellToSnail;

  //
  // component hooks to define setup data
  //
  registerPlayerHooks(registry);
  registerDoorHooks(this, registry, groundTileset);
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
      const res = spawnEntity(this, registry, type, x, y, frame);
      if (res === -1) {
        console.log(`Failed to spawn entity of type: ${type}`);
      }
    });
  });

  completeLevel = () => {
    if (state.isLevelComplete) return;
    state.isLevelComplete = true;

    // Freeze enemies and shells.
    for (const e of enemies) e.setVelocity(0, 0);
    for (const s of shells) {
      s.setVelocity(0, 0);
      s.isMoving = false;
    }

    // Detach player from physics so tweens can move it freely.
    player.setStatic(true);
    player.setVelocity(0, 0);

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
    state.doorOpen = true;

    // Find the correct open frames in the tileset by searching for Type metadata
    const openFrameEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === "Door_Open",
    );
    const openTopFrameEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === "Door_Open_Top",
    );

    const openFrame = openFrameEntry ? parseInt(openFrameEntry[0]) : NaN;
    const openTopFrame = openTopFrameEntry
      ? parseInt(openTopFrameEntry[0])
      : NaN;

    const doorIds = registry.view([CT.Door]);
    doorIds.forEach((id) => {
      const doorComp = registry.getComponent(id, CT.Door);
      if (doorComp) {
        doorComp.isOpen = true;

        if (doorComp.bottomSprite) {
          if (!isNaN(openFrame)) {
            doorComp.bottomSprite.setFrame(openFrame);
          }
        }

        if (doorComp.topSprite && !isNaN(openTopFrame)) {
          doorComp.topSprite.setFrame(openTopFrame);
        }
      }
    });
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

  // set the boundaries of our game world
  this.matter.world.setBounds(
    0,
    0,
    map.widthInPixels,
    map.heightInPixels + 200, // extend bottom so player can fall off
    64,
    true, // left
    true, // right
    false, // top  – open so player can jump through
    false, // bottom – open so player can fall off
  );
  // Let enemies walk through the left wall so they disappear off-screen.
  if (this.matter.world.walls.left) {
    this.matter.world.walls.left.collisionFilter.mask &= ~CATEGORY_ENEMY;
  }

  // create the player sprite at the spawn point set by Start_Flag
  let spawn_x = 200;
  let spawn_y = 200;

  registry.view([CT.StartFlag, CT.Transform]).forEach((id) => {
    const pos = registry.getComponent(id, CT.Transform);
    spawn_x = pos.x;
    spawn_y = pos.y;
  });

  player = spawnPlayer(this, registry, spawn_x, spawn_y);
  // update semisolid pass-through mask before each physics step
  this.matter.world.on("beforeupdate", () => {
    if (state.isDying) {
      // During the death arc the player must fly through everything.
      player.body.collisionFilter.mask = 0;
      return;
    }
    // When the player is moving upward, exclude semisolid category.
    const mask =
      player.body.velocity.y < 0
        ? CATEGORY_DEFAULT
        : CATEGORY_DEFAULT | CATEGORY_SEMISOLID;

    // Apply mask to ALL parts of the compound body
    player.body.parts.forEach((part) => {
      part.collisionFilter.mask =
        mask | CATEGORY_ENEMY | CATEGORY_COIN | CATEGORY_DOOR;
    });

    // Specific override for the foot sensor part (usually the second part)
    const footPart = player.body.parts.find((p) => p.label === "playerSensor");
    if (footPart) {
      footPart.collisionFilter.mask = mask;
    }
  });

  setupCollisionHandlers(this, {
    player,
    state,
    destructibles,
    coinMap,
    enemies,
    shells,
    damageBodies,
    groundTileset,
    transformShellToSnail,
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
  // Query ground contact directly: check whether a point 4 px below the
  // player's feet overlaps any solid body.
  {
    const MatterLib = Phaser.Physics.Matter.Matter;
    const feetY = player.y + player.displayHeight / 2 + 4;

    // Filter out all parts of the player's own compound body
    const allBodies = MatterLib.Composite.allBodies(
      this.matter.world.localWorld,
    ).filter((b) => !player.body.parts.includes(b));

    state.isOnGround =
      MatterLib.Query.point(allBodies, { x: player.x, y: feetY }).length > 0;
  }

  // Pre-compute solid bodies for enemy queries
  const groundBodies = Phaser.Physics.Matter.Matter.Composite.allBodies(
    this.matter.world.localWorld,
  ).filter(
    (b) =>
      b.label !== "enemy" &&
      b.label !== "coin" &&
      !player.body.parts.includes(b),
  );

  // ECS Systems
  // updateShells(this, shells, damageBodies, map, groundBodies);
  slimeMovementSystem(registry);
  aiWalkerSystem(registry, groundBodies);
  // When the level is complete, freeze everything and skip input.
  if (state.isLevelComplete) {
    player.setAngularVelocity(0);
    player.setAngle(0);
    return;
  }

  // Check if player has entered an open door.
  if (state.doorOpen) {
    const doorIds = registry.view([CT.Door, CT.Transform]);
    for (const id of doorIds) {
      const doorComp = registry.getComponent(id, CT.Door);
      const transform = registry.getComponent(id, CT.Transform);

      if (doorComp && doorComp.isOpen && transform) {
        // Tiled objects are 128x128. Door is 2 tiles high.
        // Check if player is within 64px horizontally and vertically of the door center.
        const doorCenterY = transform.y - 64;
        if (
          Math.abs(player.x - transform.x) < 64 &&
          Math.abs(player.y - doorCenterY) < 128
        ) {
          completeLevel();
          break;
        }
      }
    }
  }

  // During the death animation let physics run freely; skip all input logic.
  if (state.isDying) {
    player.setAngularVelocity(0);
    player.setAngle(0);
    player.anims.play("idle", true);
    return;
  }

  // ── Run ECS Player Movement ──
  playerMovementSystem(registry, cursors, state);
  animationSystem(registry);

  // ── Fall-off detection ────────────────────────────────────────────────
  if (!state.isDying && player.y > map.heightInPixels) {
    resetGame(this, player, state, true); // fell off – skip death animation
  }
}

const StartGame = (parent, width, height, mapJson) => {
  if (mapJson) gameMapJson = mapJson;
  return new Phaser.Game({ ...config, parent, width, height });
};

export default StartGame;
