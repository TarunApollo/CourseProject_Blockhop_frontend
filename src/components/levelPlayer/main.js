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
import { reset as resetInputRecorder, record as recordInput, getLog as getInputLog } from "./mechanics/inputRecorder.js";
import { setupCollisionHandlers } from "./mechanics/collisionHandlers.js";

var config = {
  type: Phaser.AUTO,
  width: 1536,
  height: 768,
  fps: {
    target: 60,
    forceSetTimeOut: true,
    // https://newdocs.phaser.io/docs/3.80.0/Phaser.Types.Core.FPSConfig
    // Locks the game loop to 60 fps via setTimeout instead of requestAnimationFrame.
    // This is very important for our anticheat as well as for high refresh rate monitors.
    // Otherwise the game would run at 2x or beyond.
  },
  physics: {
    default: "matter",
    matter: {
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

  // Spawn position – overridden by the Start_Flag handler if one exists.
  const spawn = { x: 200, y: 200 };

  const groundTileset = map.getTileset("tiles");
  const OBJECT_HANDLERS = createObjectHandlers(this, groundTileset, {
    destructibles,
    coinMap,
    enemies,
    shells,
    doors,
    damageBodies,
    spawn,
  });
  const transformShellToSnail = OBJECT_HANDLERS._transformShellToSnail;
  map.objects.forEach((objLayer) => {
    objLayer.objects.forEach((obj) => {
      if (obj.gid === undefined) return;
      const frame = obj.gid - groundTileset.firstgid;
      const type = groundTileset.tileData[frame]?.type;
      const handler = OBJECT_HANDLERS[type];
      if (!handler) return;
      const x = obj.x + obj.width / 2;
      const y = obj.y - obj.height / 2;
      handler(this, obj, frame, x, y);
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
    const door = doors.reduce(
      (best, d) =>
        Math.abs(player.x - d.x) < Math.abs(player.x - best.x) ? d : best,
      doors[0],
    );
    const doorCenterX = door.x;

    // 1. Slide player to the horizontal centre of the door's bottom tile.
    this.tweens.add({
      targets: player,
      x: doorCenterX,
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
            this.time.delayedCall(400, () => EventBus.emit("LevelCompleted", { inputLog: getInputLog() }));
          },
        });
      },
    });
  };

  // Open all doors when the clear condition is met.
  EventBus.on("ClearConditionCompleted", () => {
    state.doorOpen = true; // readable from update()
    const openFrame = parseInt(
      Object.entries(groundTileset.tileData).find(
        ([, d]) => d.type === "Door_Open",
      )?.[0],
    );
    const openTopFrame = parseInt(
      Object.entries(groundTileset.tileData).find(
        ([, d]) => d.type === "Door_Open_Top",
      )?.[0],
    );
    for (const door of doors) {
      if (!isNaN(openFrame)) door.bottom.setFrame(openFrame);
      if (!isNaN(openTopFrame) && door.top) door.top.setFrame(openTopFrame);
    }
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

  // create the player sprite at the spawn point set by Start_Flag (or default)
  player = this.matter.add.sprite(spawn.x, spawn.y, "player");
  player.setDisplaySize(128, 128); // fit a 128x128 tile
  // No bounce – Mario lands cleanly with no rubber-ball rebound.
  player.setBounce(0);
  player.setFixedRotation();
  player.setAngularVelocity(0);
  // hard lock rotation at the Matter body level
  player.body.inertia = Infinity;
  player.body.inverseInertia = 0;
  player.setOrigin(0.5, 0.5);

  // Narrow the collision body to match the foot sensor width (40% of the
  // sprite).  This keeps the hitbox tight so the player doesn't snag on
  // tile edges with the sides of the sprite art.
  player.setRectangle(player.displayWidth * 0.55, player.displayHeight - 8, {
    label: "player",
  });

  // create a sensor at the player's feet to detect ground contact.
  // Taller height (16px) makes it resilient to small positional offsets
  // that can occur after a jump when the sensor lags a frame behind.
  footSensor = this.matter.add.rectangle(
    player.x,
    player.y + player.displayHeight / 2 + 2,
    player.displayWidth * 0.5,
    16,
    { isSensor: true, label: "playerSensor" },
  );

  // update semisolid pass-through mask before each physics step
  this.matter.world.on("beforeupdate", () => {
    if (state.isDying) {
      // During the death arc the player must fly through everything.
      player.body.collisionFilter.mask = 0;
      footSensor.collisionFilter.mask = 0;
      return;
    }
    // When the player is moving upward, exclude semisolid category so the
    // body (and foot sensor) pass straight through.  When falling or standing,
    // include it so the platform acts as solid ground from the top.
    const mask =
      player.body.velocity.y < 0
        ? CATEGORY_DEFAULT
        : CATEGORY_DEFAULT | CATEGORY_SEMISOLID;
    // Always collide with enemies (damage + stomp); foot sensor excludes
    // them so enemies don't register as ground.
    player.body.collisionFilter.mask =
      mask | CATEGORY_ENEMY | CATEGORY_COIN | CATEGORY_DOOR;
    footSensor.collisionFilter.mask = mask;
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

  // player walk animation
  this.anims.create({
    key: "walk",
    frames: this.anims.generateFrameNames("player", {
      prefix: "p1_walk",
      start: 1,
      end: 11,
      zeroPad: 2,
    }),
    frameRate: 15,
    repeat: -1,
  });
  // idle with only one frame, so repeat is not needed
  this.anims.create({
    key: "idle",
    frames: [{ key: "player", frame: "p1_stand" }],
    frameRate: 10,
  });

  cursors = this.input.keyboard.createCursorKeys();

  // set bounds so the camera won't go outside the game world
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // zoom to fit map height exactly (no black bars), which shows 24 blocks wide at 1536px canvas
  this.cameras.main.setZoom(this.cameras.main.height / map.heightInPixels);
  // make the camera follow the player
  this.cameras.main.startFollow(player);

  resetInputRecorder();
  EventBus.emit("RunStarted");
}

function update(time, delta) {
  // Record player input for anti-cheat replay validation.
  if (cursors) recordInput(cursors);

  // Query ground contact directly: check whether a point 4 px below the
  // player's feet overlaps any solid body.  This is frame-accurate and
  // immune to the event-ordering / sensor-sleep issues that plagued the
  // old groundContacts counter approach.
  {
    const MatterLib = Phaser.Physics.Matter.Matter;
    const feetY = player.y + player.displayHeight / 2 + 4;
    const allBodies = MatterLib.Composite.allBodies(
      this.matter.world.localWorld,
    ).filter((b) => b !== player.body && b !== footSensor);
    state.isOnGround =
      MatterLib.Query.point(allBodies, { x: player.x, y: feetY }).length > 0;
  }

  // Pre-compute the set of solid bodies used for enemy/shell wall queries.
  // Enemies, coins, the player body and foot sensor are excluded so they
  // don't count as obstacles for pathfinding purposes.
  const groundBodies = Phaser.Physics.Matter.Matter.Composite.allBodies(
    this.matter.world.localWorld,
  ).filter(
    (b) =>
      b.label !== "enemy" &&
      b.label !== "coin" &&
      b !== player.body &&
      b !== footSensor,
  );

  // Enemies and shells move independently of the player state.
  updateEnemies(this, enemies, damageBodies, map, groundBodies);
  updateShells(this, shells, damageBodies, map, groundBodies);

  // When the level is complete, freeze everything and skip input.
  if (state.isLevelComplete) {
    player.setAngularVelocity(0);
    player.setAngle(0);
    return;
  }

  // Check if player has entered an open door.
  if (state.doorOpen) {
    for (const door of doors) {
      const doorCenterY = door.y - door.tileSize / 2;
      if (
        Math.abs(player.x - door.x) < door.tileSize * 0.5 &&
        Math.abs(player.y - doorCenterY) < door.tileSize
      ) {
        completeLevel();
        break;
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

  // Sample current velocity once at the top of the frame.
  // By the time update() runs, Matter has already applied gravity for this
  // step, so these values include that contribution.
  var vx = player.body.velocity.x;
  var vy = player.body.velocity.y;

  var speed = cursors.shift.isDown ? RUN_SPEED : WALK_SPEED;

  // Keep the foot sensor glued directly under the player body.
  Phaser.Physics.Matter.Matter.Body.setPosition(footSensor, {
    x: player.x,
    y: player.y + player.displayHeight / 2,
  });

  // Force rotation lock every frame (prevents tilting on wall contacts).
  player.setAngularVelocity(0);
  player.setAngle(0);

  // ── Horizontal movement ───────────────────────────────────────────────
  if (state.knockbackFrames > 0) {
    // During knockback the player cannot steer; velocity decays naturally.
    state.knockbackFrames--;
    player.setVelocityX(vx * H_DECEL);
    player.anims.play("idle", true);
  } else if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.anims.play("walk", true);
    player.flipX = true; // mirror sprite to face left
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.anims.play("walk", true);
    player.flipX = false;
  } else {
    // Decelerate instead of stopping instantly.
    // Multiplying by H_DECEL each frame bleeds speed off quickly but
    // gives a short, perceptible skid – like Mario on a normal surface.
    player.setVelocityX(vx * H_DECEL);
    player.anims.play("idle", true);
  }

  // ── Variable-height jump ──────────────────────────────────────────────
  // Detect a *fresh* key press (edge trigger, not a sustained hold).
  // This prevents the player from holding jump across a landing to bounce.
  var jumpJustPressed = cursors.up.isDown && !state.jumpKeyWasDown;
  state.jumpKeyWasDown = cursors.up.isDown;

  if (jumpJustPressed && state.isOnGround) {
    // Initial impulse: sets upward velocity immediately on key press.
    player.setVelocityY(JUMP_VY);
    state.jumpHoldFrames = 0; // reset the hold counter for this new jump
  } else if (
    cursors.up.isDown &&
    vy < 0 &&
    state.jumpHoldFrames < JUMP_HOLD_MAX_FRAMES
  ) {
    // Jump key held while still rising: apply a small extra upward push
    // each frame.  This is what creates variable jump height – tap for a
    // short hop, hold for a full arc (up to JUMP_HOLD_MAX_FRAMES frames).
    player.setVelocityY(vy + JUMP_HOLD_FORCE);
    state.jumpHoldFrames++;
  } else if (!cursors.up.isDown) {
    // Key released before reaching the hold limit: exhaust the counter so
    // the hold extension doesn't resume if the player re-presses mid-air.
    state.jumpHoldFrames = JUMP_HOLD_MAX_FRAMES;
  }

  // ── Fast fall (asymmetric gravity arc) ────────────────────────────────
  // Re-read vy so we see any velocity set by the jump block above.
  // When the player is descending (vy > 0), add an extra downward push on
  // top of the base gravity.  This makes the fall arc steeper than the
  // rise arc – the defining "floats up / plummets down" trait of Mario.
  var vyNow = player.body.velocity.y;
  if (vyNow > 0 && !state.isOnGround) {
    player.setVelocityY(Math.min(vyNow + FALL_BOOST, MAX_FALL_VY));
  }

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
