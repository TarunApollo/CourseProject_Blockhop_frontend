/**
 * objectHandlers.js
 *
 * Builds a dispatch table that maps Tiled object type strings to spawn
 * functions.  The main entry point is `createObjectHandlers`; everything
 * else is a private factory used by that function.
 *
 * Adding a new object type
 * ────────────────────────
 * 1. Create a factory function  make<TypeName>(deps…)  that returns a handler
 *    with signature  (scene, obj, frame, x, y).
 * 2. Add an entry to the object returned by `createObjectHandlers`, keyed by
 *    the exact Tiled type string.
 *
 * Coordinate convention
 * ──────────────────────
 * Tiled tile-objects anchor at bottom-left; Phaser images anchor at center.
 * The caller (in main.js) converts before calling each handler:
 *   x = obj.x + obj.width  / 2
 *   y = obj.y - obj.height / 2
 */

import {
  CATEGORY_DEFAULT,
  CATEGORY_SEMISOLID,
  CATEGORY_ENEMY,
  CATEGORY_COIN,
  CATEGORY_DOOR,
} from "./constants.js";

// ── Per-type handler factories ───────────────────────────────────────────────
//
// Each factory receives only the context it actually needs and returns a
// handler with signature  (scene, obj, frame, x, y).

function makeStartFlagHandler(groundTileset, spawn) {
  return (scene, obj, frame, x, y) => {
    const sprite = scene.add.sprite(x, y, "tiles", frame);

    // Find the companion frame (Start_Flag_B) by type in the tileset.
    const flagBEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === "Start_Flag_B",
    );
    if (flagBEntry) {
      const frameB = parseInt(flagBEntry[0]);
      if (!scene.anims.exists("flag_spin")) {
        scene.anims.create({
          key: "flag_spin",
          frames: [
            { key: "tiles", frame },
            { key: "tiles", frame: frameB },
          ],
          frameRate: 4,
          repeat: -1,
        });
      }
      sprite.play("flag_spin");
    }

    spawn.x = obj.x + 128; // spawn player 128 px to the right of the flag
    spawn.y = y;
  };
}

function makeDecorationHandler() {
  return (scene, _obj, frame, x, y) => {
    scene.add.image(x, y, "tiles", frame);
  };
}

function makeSlimeHandler(damageBodies, enemies) {
  return (scene, obj, _frame, x, y) => {
    if (!scene.anims.exists("slime_walk")) {
      scene.anims.create({
        key: "slime_walk",
        frames: [
          { key: "slime_normal", frame: "slime_normal_walk_a" },
          { key: "slime_normal", frame: "slime_normal_walk_b" },
        ],
        frameRate: 4,
        repeat: -1,
      });
    }
    const slime = scene.matter.add.sprite(x, y, "slime_normal");
    slime.setDisplaySize(obj.width * 0.8, obj.height * 0.8);
    slime.setRectangle(obj.width * 0.64, obj.height * 0.64, { label: "enemy" });
    slime.setFixedRotation(); // must come after setRectangle (new body)
    slime.body.inertia = Infinity;
    slime.body.inverseInertia = 0;
    // Slimes pass through the left world wall but still land on tiles.
    slime.setCollisionCategory(CATEGORY_ENEMY);
    slime.setCollidesWith([
      CATEGORY_DEFAULT,
      CATEGORY_SEMISOLID,
      CATEGORY_ENEMY,
    ]);
    slime.anims.play("slime_walk", true);
    slime.enemyType = "Enemy_Slime_Normal";
    slime.moveDir = -1; // starts moving left
    slime.skipVelCheck = false;
    damageBodies.add(slime.body.id);
    enemies.push(slime);
  };
}

function makeBeeHandler(damageBodies, enemies) {
  return (scene, obj, _frame, x, y) => {
    if (!scene.anims.exists("bee_fly")) {
      scene.anims.create({
        key: "bee_fly",
        frames: [{ key: "bee_a" }, { key: "bee_b" }],
        frameRate: 8,
        repeat: -1,
      });
    }
    const bee = scene.matter.add.sprite(x, y, "bee_a");
    bee.setDisplaySize(obj.width * 0.8, obj.height * 0.8);
    bee.setRectangle(obj.width * 0.64, obj.height * 0.64, { label: "enemy" });
    bee.setFixedRotation();
    bee.body.inertia = Infinity;
    bee.body.inverseInertia = 0;
    bee.setIgnoreGravity(true);
    bee.setCollisionCategory(CATEGORY_ENEMY);
    bee.setCollidesWith([CATEGORY_DEFAULT, CATEGORY_ENEMY]);
    bee.anims.play("bee_fly", true);
    bee.enemyType = "Enemy_Bee";
    bee.moveDir = -1;
    bee.skipVelCheck = false;
    damageBodies.add(bee.body.id);
    enemies.push(bee);
  };
}

function makeSnailHandler(damageBodies, enemies) {
  return (scene, obj, _frame, x, y) => {
    if (!scene.anims.exists("snail_walk")) {
      scene.anims.create({
        key: "snail_walk",
        frames: [
          { key: "snail", frame: "snail_walk_a" },
          { key: "snail", frame: "snail_walk_b" },
        ],
        frameRate: 4,
        repeat: -1,
      });
    }
    const snail = scene.matter.add.sprite(x, y, "snail");
    snail.setDisplaySize(obj.width * 0.8, obj.height * 0.8);
    snail.setRectangle(obj.width * 0.64, obj.height * 0.64, { label: "enemy" });
    snail.setFixedRotation();
    snail.body.inertia = Infinity;
    snail.body.inverseInertia = 0;
    snail.setCollisionCategory(CATEGORY_ENEMY);
    snail.setCollidesWith([
      CATEGORY_DEFAULT,
      CATEGORY_SEMISOLID,
      CATEGORY_ENEMY,
    ]);
    snail.anims.play("snail_walk", true);
    snail.enemyType = "Enemy_Snail";
    snail.moveDir = -1; // starts moving left
    snail.skipVelCheck = false;
    damageBodies.add(snail.body.id);
    enemies.push(snail);
  };
}

function makeShellHandler(groundTileset, shells) {
  return (scene, obj, frame, x, y) => {
    const shell = scene.matter.add.sprite(x, y, "tiles", frame);
    const scale = 0.9;
    shell.setDisplaySize(obj.width * scale, obj.height * scale);
    const physObj = groundTileset.tileData[frame]?.objectgroup?.objects?.[0];
    const bodyW = (physObj?.width ?? obj.width) * scale;
    const bodyH = (obj.height * scale) / 2;
    shell.setRectangle(bodyW, bodyH, { label: "shell" });
    shell.setFixedRotation();
    shell.body.inertia = Infinity;
    shell.body.inverseInertia = 0;
    shell.isMoving = false;
    shell.moveDir = 0;
    shell.skipVelCheck = false;
    shells.push(shell);
  };
}

// coinType  e.g. "Item_Coin_Gold" → looks for companion "Item_Coin_Gold_Side"
//           and uses animation key "coin_spin_gold".
function makeCoinHandler(coinType, groundTileset, coinMap) {
  return (scene, obj, frame, x, y) => {
    const sideType = `${coinType}_Side`;
    const animKey = `coin_spin_${coinType.replace("Item_Coin_", "").toLowerCase()}`;
    const sideEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === sideType,
    );
    if (!scene.anims.exists(animKey)) {
      const frames = [{ key: "tiles", frame }];
      if (sideEntry)
        frames.push({ key: "tiles", frame: parseInt(sideEntry[0]) });
      scene.anims.create({
        key: animKey,
        frames,
        frameRate: 4,
        repeat: -1,
        yoyo: true,
      });
    }
    const coin = scene.matter.add.sprite(x, y, "tiles", frame);
    coin.setDisplaySize(obj.width * 0.8, obj.height * 0.8);
    coin.setRectangle(obj.width * 0.6, obj.height * 0.6, {
      isStatic: true,
      isSensor: true,
      label: "coin",
    });
    coin.setCollisionCategory(CATEGORY_COIN);
    coin.setCollidesWith([CATEGORY_DEFAULT]); // only the player can collect it
    coin.coinType = coinType;
    coin.anims.play(animKey, true);
    coinMap.set(coin.body.id, coin);
  };
}

function makeBoxHandler(destructibles) {
  return (scene, obj, frame, x, y) => {
    const img = scene.add.image(x, y, "tiles", frame);
    const body = scene.matter.add.rectangle(x, y, obj.width, obj.height, {
      isStatic: true,
      label: "BoxDouble",
    });
    const content =
      obj.properties?.find((p) => p.name === "Content")?.value ?? null;
    destructibles.set(body.id, { img, body, content });
  };
}

function makeDoorHandler(groundTileset, doors) {
  return (scene, obj, frame, x, y) => {
    const tileSize = obj.width;
    // Bottom tile
    const bottom = scene.add.image(x, y, "tiles", frame);
    // Top tile
    const topEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === "Door_Closed_Top",
    );
    const top = topEntry
      ? scene.add.image(x, y - tileSize, "tiles", parseInt(topEntry[0]))
      : null;
    doors.push({ bottom, top, x, y, tileSize });
    // Sensor spanning both tiles – fires collision events with the player only
    const body = scene.matter.add.rectangle(
      x,
      y - tileSize / 2,
      tileSize,
      tileSize * 2,
      {
        isStatic: true,
        isSensor: true,
        label: "door",
      },
    );
    body.collisionFilter.category = CATEGORY_DOOR;
    body.collisionFilter.mask = CATEGORY_DEFAULT;
  };
}

function makeDamageHandler(damageBodies) {
  return (scene, obj, frame, x, y) => {
    scene.add.image(x, y, "tiles", frame);
    const body = scene.matter.add.rectangle(x, y, obj.width, obj.height, {
      isStatic: true,
      label: "Damage",
    });
    damageBodies.add(body.id);
  };
}

// ── Internal spawn helpers (used by the factory below) ───────────────────────

function makeSpawnSnail(scene, damageBodies, enemies) {
  return (x, y) => {
    const tileSize = 128;
    const snail = scene.matter.add.sprite(x, y, "snail");
    snail.setDisplaySize(tileSize * 0.8, tileSize * 0.8);
    snail.setRectangle(tileSize * 0.64, tileSize * 0.64, { label: "enemy" });
    snail.setFixedRotation();
    snail.body.inertia = Infinity;
    snail.body.inverseInertia = 0;
    snail.setCollisionCategory(CATEGORY_ENEMY);
    snail.setCollidesWith([
      CATEGORY_DEFAULT,
      CATEGORY_SEMISOLID,
      CATEGORY_ENEMY,
    ]);
    snail.anims.play("snail_walk", true);
    snail.enemyType = "Enemy_Snail";
    snail.moveDir = -1;
    snail.skipVelCheck = false;
    damageBodies.add(snail.body.id);
    enemies.push(snail);
  };
}

function makeTransformShellToSnail(shells, damageBodies, spawnSnail) {
  // Replace a (alive) shell with a snail at the same position.
  return (shell) => {
    const idx = shells.indexOf(shell);
    if (idx === -1) return; // already removed (e.g. destroyed by another event)
    shells.splice(idx, 1);
    damageBodies.delete(shell.body.id);
    const { x, y } = shell;
    shell.destroy();
    spawnSnail(x, y);
  };
}

// ── Factory that builds the full dispatch table ───────────────────────────────
//
// Parameters:
//   scene         – the Phaser scene (replaces `this` from create())
//   groundTileset – the Tiled tileset used to look up companion frames by type
//   ctx           – shared mutable collections:
//     { destructibles, coinMap, enemies, shells, doors, damageBodies, spawn }
//     spawn = { x, y } is mutated by the Start_Flag handler to set the player
//     spawn position; the caller reads spawn.x / spawn.y after the map is loaded.
//
// Returns an object whose keys are Tiled type strings and whose values are
// handler functions with signature (scene, obj, frame, x, y).
export function createObjectHandlers(
  scene,
  groundTileset,
  { destructibles, coinMap, enemies, shells, doors, damageBodies, spawn },
) {
  const spawnSnail = makeSpawnSnail(scene, damageBodies, enemies);
  const transformShellToSnail = makeTransformShellToSnail(
    shells,
    damageBodies,
    spawnSnail,
  );

  const box = makeBoxHandler(destructibles);

  return {
    Start_Flag: makeStartFlagHandler(groundTileset, spawn),
    Decoration: makeDecorationHandler(),
    Enemy_Slime_Normal: makeSlimeHandler(damageBodies, enemies),
    Enemy_Snail: makeSnailHandler(damageBodies, enemies),
    Enemy_Bee: makeBeeHandler(damageBodies, enemies),
    Item_Shell: makeShellHandler(groundTileset, shells),
    Item_Coin_Gold: makeCoinHandler("Item_Coin_Gold", groundTileset, coinMap),
    Item_Coin_Silver: makeCoinHandler(
      "Item_Coin_Silver",
      groundTileset,
      coinMap,
    ),
    Item_Coin_Bronze: makeCoinHandler(
      "Item_Coin_Bronze",
      groundTileset,
      coinMap,
    ),
    BoxDouble: box,
    Box: box,
    Door_Closed: makeDoorHandler(groundTileset, doors),
    Damage: makeDamageHandler(damageBodies),

    // Prefixed with _ to signal it is an implementation detail, not a
    // game-object type.  Exposed so collisionHandlers.js can schedule the
    // shell → snail transition via a Phaser timer.
    _transformShellToSnail: transformShellToSnail,
  };
}
