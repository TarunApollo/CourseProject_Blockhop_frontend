/**
 * collisionHandlers.js
 *
 * Registers all Matter.js collision listeners for the level scene.
 * Three events are handled:
 *
 *   collisionstart  – box breaking, damage/stomp, shell activation,
 *                     enemy reversal, coin collection
 *   collisionactive – re-applies damage every step so the player is
 *                     hit again after invincibility ends without needing
 *                     to re-enter the body
 *   collisionend    – makes a moving shell dangerous only after the
 *                     player physically separates from it, preventing
 *                     the activation touch from instantly dealing damage
 */

import { EventBus } from "../EventBus";
import { hitDamage } from "./playerDamage.js";
import { JUMP_VY } from "./constants.js";
import { burstEffect } from "../ecs/effects.ts";

/**
 * Register all Matter collision listeners on the scene.
 *
 * @param {Phaser.Scene} scene
 * @param {{
 *   player:               Phaser.Physics.Matter.Sprite,
 *   state:                object,          // shared mutable game-state flags
 *   destructibles:        Map<number, {img, content}>, // body.id → box entry
 *   coinMap:              Map<number, Phaser.GameObjects.Sprite>, // body.id → coin sprite
 *   enemies:              Phaser.Physics.Matter.Sprite[],
 *   shells:               Phaser.Physics.Matter.Sprite[],
 *   damageBodies:         Set<number>,     // body.id values that hurt the player
 *   groundTileset:        Phaser.Tilemaps.Tileset,
 *   transformShellToSnail: function        // callback: shell sprite → snail respawn
 * }} deps
 */
export function setupCollisionHandlers(
  scene,
  {
    player,
    state,
    destructibles,
    coinMap,
    enemies,
    shells,
    damageBodies,
    groundTileset,
    transformShellToSnail,
  },
) {
  // ── Helpers ────────────────────────────────────────────────────────────

  // Fly a coin sprite upward from (x, y) and emit CoinCollected when it fades.
  // coinType is a Tiled type string, e.g. "Item_Coin_Gold".
  const popBoxCoin = (x, y, coinType) => {
    const coinEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === coinType,
    );
    if (!coinEntry) return;
    const frame = parseInt(coinEntry[0]);
    const tileSize = 128;
    const coinSprite = scene.add.sprite(x, y, "tiles", frame);
    coinSprite.setDisplaySize(tileSize * 0.6, tileSize * 0.6);
    // Reuse the spin animation created by makeCoinHandler if available.
    const animKey = `coin_spin_${coinType.replace("Item_Coin_", "").toLowerCase()}`;
    if (scene.anims.exists(animKey)) coinSprite.play(animKey);
    scene.tweens.add({
      targets: coinSprite,
      y: y - tileSize * 1.5,
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: "Quad.easeOut",
      onComplete: () => {
        coinSprite.destroy();
        EventBus.emit("CoinCollected", coinType);
      },
    });
  };

  // Replace a stomped/crushed snail with a resting shell sprite.
  // The shell is added to shells[] and starts a 5-second countdown
  // before transforming back into a snail via transformShellToSnail.
  const spawnShellFromEnemy = (enemy) => {
    const shellEntry = Object.entries(groundTileset.tileData).find(
      ([, d]) => d.type === "Item_Shell",
    );
    if (!shellEntry) return;
    const shellFrame = parseInt(shellEntry[0]);
    const tileSize = 128;
    const scale = 0.9;
    const shell = scene.matter.add.sprite(
      enemy.x,
      enemy.y,
      "tiles",
      shellFrame,
    );
    shell.setDisplaySize(tileSize * scale, tileSize * scale);
    // Use the tile's Tiled physics object for the width so the hitbox matches
    // the art; halve the height so the shell sits low and doesn't float.
    const physObj =
      groundTileset.tileData[shellFrame]?.objectgroup?.objects?.[0];
    const bodyW = (physObj?.width ?? tileSize) * scale;
    const bodyH = (tileSize * scale) / 2;
    shell.setRectangle(bodyW, bodyH, { label: "shell" });
    shell.setFixedRotation();
    // Lock inertia so the shell never tilts on contact.
    shell.body.inertia = Infinity;
    shell.body.inverseInertia = 0;
    shell.isMoving = false;
    shell.moveDir = 0;
    // skipVelCheck: when true, updateShells() skips the wall-detection
    // velocity check for one frame (needed right after a direction change
    // because velocity hasn't caught up yet).
    shell.skipVelCheck = false;
    shell.isAlive = true;
    shell.aliveTimer = scene.time.delayedCall(5000, () =>
      transformShellToSnail(shell),
    );
    shells.push(shell);
  };

  // Crush an enemy that was standing on a just-destroyed box.
  // Snails retract into a resting shell; all other enemies burst.
  const crushEnemy = (enemy) => {
    const idx = enemies.indexOf(enemy);
    if (idx === -1) return;
    if (enemy.enemyType === "Enemy_Snail") {
      spawnShellFromEnemy(enemy);
    } else {
      burstEffect(scene, enemy.x, enemy.y, enemy.texture.key, enemy.frame.name);
      EventBus.emit("EnemyKilled", enemy.enemyType);
    }
    const bodyId = enemy.body.id;
    enemy.destroy();
    damageBodies.delete(bodyId);
    enemies.splice(idx, 1);
  };

  // Check every enemy to see if its feet are resting on the destroyed box.
  // boxMin/boxMax are the Matter bounds captured *before* world.remove() so
  // the coordinates are still valid. The ±8 px and 20 px tolerances absorb
  // the small gaps that can appear between a tile body and a sprite foot.
  const crushEnemiesOnBox = (boxMin, boxMax) => {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const feetY = e.y + e.displayHeight / 2;
      if (
        e.x >= boxMin.x - 8 &&
        e.x <= boxMax.x + 8 &&
        Math.abs(feetY - boxMin.y) <= 20
      )
        crushEnemy(e);
    }
  };

  // Handle a player ↔ damage-body contact: stomp or take damage.
  // Called on both collisionstart and collisionactive so the player is
  // damaged again after invincibility ends even without re-entering the body.
  const processDamageContacts = (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const isPlayerA = bodyA.label === "player";
      const isPlayerB = bodyB.label === "player";
      if (!isPlayerA && !isPlayerB) return;
      const playerBody = isPlayerA ? bodyA : bodyB;
      const otherBody = isPlayerA ? bodyB : bodyA;
      if (!damageBodies.has(otherBody.id)) return;

      // Stomp: player moving downward + mostly-vertical contact normal.
      // A predominantly horizontal normal (|nx| > 0.5) means a side hit → damage.
      const isStomp =
        playerBody.velocity.y > 0 && Math.abs(pair.collision.normal.x) <= 0.5;
      if (isStomp) {
        const idx = enemies.findIndex((e) => e.body.id === otherBody.id);
        if (idx !== -1) {
          const enemy = enemies[idx];
          if (enemy.enemyType === "Enemy_Snail") {
            spawnShellFromEnemy(enemy);
          } else {
            burstEffect(scene, enemy.x, enemy.y, enemy.texture.key, enemy.frame.name);
            EventBus.emit("EnemyKilled", enemy.enemyType);
            burstEffect(
              scene,
              enemy.x,
              enemy.y,
              "slime_normal",
              "slime_normal_walk_a",
            );
            events.emit({ type: "EnemyKilled", enemyType: enemy.enemyType });
          }
          enemy.destroy();
          damageBodies.delete(otherBody.id);
          enemies.splice(idx, 1);
          player.setVelocityY(JUMP_VY * 0.6); // small bounce after stomp
          return; // don't also damage the player
        }
        // Stomping a moving shell stops it; no damage.
        const shellSprite = shells.find((s) => s.body.id === otherBody.id);
        if (shellSprite && shellSprite.isMoving) {
          shellSprite.isMoving = false;
          shellSprite.moveDir = 0;
          damageBodies.delete(otherBody.id);
          // Restart the 5-second snail-respawn countdown now that it's resting.
          if (shellSprite.isAlive) {
            shellSprite.aliveTimer = scene.time.delayedCall(5000, () =>
              transformShellToSnail(shellSprite),
            );
          }
          player.setVelocityY(JUMP_VY * 0.6);
          return;
        }
      }

      hitDamage(scene, player, { x: otherBody.position.x }, state);
    });
  };

  // ── Event listeners ────────────────────────────────────────────────────

  scene.matter.world.on("collisionstart", (event) => {
    // Player jumps into a destructible box from below.
    // Requires upward velocity (vy < 0) and a vertical contact normal.
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const isPlayerA = bodyA.label === "player";
      const isPlayerB = bodyB.label === "player";
      if (!isPlayerA && !isPlayerB) return;
      const playerBody = isPlayerA ? bodyA : bodyB;
      const otherBody = isPlayerA ? bodyB : bodyA;
      if (playerBody.velocity.y >= 0) return;
      if (Math.abs(pair.collision.normal.x) > 0.5) return;
      const entry = destructibles.get(otherBody.id);
      if (!entry) return;
      burstEffect(
        scene,
        entry.img.x,
        entry.img.y,
        "tiles",
        entry.img.frame.name,
      );
      if (entry.content) popBoxCoin(entry.img.x, entry.img.y, entry.content);
      EventBus.emit("BoxDestroyed", entry.content);
      // Capture bounds before removal; crushEnemiesOnBox needs them.
      const { min: bMin, max: bMax } = otherBody.bounds;
      entry.img.destroy();
      scene.matter.world.remove(otherBody);
      destructibles.delete(otherBody.id);
      crushEnemiesOnBox(bMin, bMax);
    });

    processDamageContacts(event);

    // Shell state machine.
    //
    // Resting shell + player side-contact → start moving away from player.
    //   The shell is NOT added to damageBodies here; it becomes dangerous
    //   only after the player separates (see collisionend below).
    //
    // Moving shell + enemy contact  → kill enemy, reverse shell.
    // Moving shell + box contact    → break box, reverse shell.
    // Moving shell + player contact → reverse shell (damage via processDamageContacts).
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const isShellA = bodyA.label === "shell";
      const isShellB = bodyB.label === "shell";
      if (!isShellA && !isShellB) return;

      const shellBody = isShellA ? bodyA : bodyB;
      const otherBody = isShellA ? bodyB : bodyA;
      const shellSprite = shells.find((s) => s.body.id === shellBody.id);
      if (!shellSprite) return;

      if (!shellSprite.isMoving) {
        // Only a side contact from the player activates a resting shell.
        // Vertical contacts (e.g. player landing on top) are ignored so
        // that stomping a moving shell to stop it doesn't re-kick it.
        if (otherBody.label !== "player") return;
        if (Math.abs(pair.collision.normal.x) <= 0.5) return;
        shellSprite.moveDir = player.x < shellSprite.x ? 1 : -1;
        shellSprite.isMoving = true;
        shellSprite.skipVelCheck = true; // velocity is still 0 this frame
        // Suspend the snail-respawn timer while the shell is in motion.
        if (shellSprite.isAlive && shellSprite.aliveTimer) {
          shellSprite.aliveTimer.remove();
          shellSprite.aliveTimer = null;
        }
      } else {
        if (otherBody.label === "enemy") {
          const idx = enemies.findIndex((e) => e.body.id === otherBody.id);
          if (idx !== -1) {
            const enemy = enemies[idx];
            burstEffect(
              scene,
              enemy.x,
              enemy.y,
              enemy.texture.key,
              enemy.frame.name,
            );
            EventBus.emit("EnemyKilled", enemy.enemyType);
            enemy.destroy();
            damageBodies.delete(otherBody.id);
            enemies.splice(idx, 1);
            shellSprite.moveDir *= -1;
            shellSprite.skipVelCheck = true;
          }
        } else if (
          otherBody.label === "BoxDouble" ||
          otherBody.label === "Box"
        ) {
          const entry = destructibles.get(otherBody.id);
          if (entry) {
            burstEffect(
              scene,
              entry.img.x,
              entry.img.y,
              "tiles",
              entry.img.frame.name,
            );
            if (entry.content)
              popBoxCoin(entry.img.x, entry.img.y, entry.content);
            EventBus.emit("BoxDestroyed", entry.content);
            const { min: bMin, max: bMax } = otherBody.bounds;
            entry.img.destroy();
            scene.matter.world.remove(otherBody);
            destructibles.delete(otherBody.id);
            shellSprite.moveDir *= -1;
            shellSprite.skipVelCheck = true;
            crushEnemiesOnBox(bMin, bMax);
          }
        } else if (otherBody.label === "player") {
          shellSprite.moveDir *= -1;
          shellSprite.skipVelCheck = true;
        }
      }
      // Wall/tile reversal is handled in update() via velocity-based detection.
    });

    // Enemy hits a box, another enemy, or a shell → reverse direction.
    // Only side contacts qualify (|nx| > 0.5); vertical ones are ignored
    // so that enemies landing on each other don't flip unnecessarily.
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const isEnemyA = bodyA.label === "enemy";
      const isEnemyB = bodyB.label === "enemy";
      if (!isEnemyA && !isEnemyB) return;
      if (Math.abs(pair.collision.normal.x) <= 0.5) return;

      const flipEnemy = (enemyBody) => {
        const sprite = enemies.find((e) => e.body.id === enemyBody.id);
        if (sprite && sprite.moveDir !== undefined) {
          sprite.moveDir *= -1;
          sprite.skipVelCheck = true;
        }
      };

      const shouldFlip = (other) =>
        other.label === "BoxDouble" ||
        other.label === "Box" ||
        other.label === "enemy" ||
        other.label === "shell";

      if (isEnemyA && shouldFlip(bodyB)) flipEnemy(bodyA);
      if (isEnemyB && shouldFlip(bodyA)) flipEnemy(bodyB);
    });

    // Player touches a coin → collect it with a burst effect.
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const isPlayerA = bodyA.label === "player";
      const isPlayerB = bodyB.label === "player";
      if (!isPlayerA && !isPlayerB) return;
      const otherBody = isPlayerA ? bodyB : bodyA;
      if (otherBody.label !== "coin") return;
      const coin = coinMap.get(otherBody.id);
      if (!coin) return;
      coinMap.delete(otherBody.id);
      burstEffect(scene, coin.x, coin.y, coin.texture.key, coin.frame.name, {
        quantity: 6,
        speed: { min: 60, max: 150 },
        scale: { start: 0.3, end: 0 },
        gravityY: 150,
        lifespan: 400,
        stopAfter: 6,
      });
      coin.destroy();
      EventBus.emit("CoinCollected", coin.coinType);
    });
  });

  // Re-check damage every physics step so the player is hit again after
  // invincibility ends without needing to physically re-enter the body.
  scene.matter.world.on("collisionactive", processDamageContacts);

  // A moving shell becomes dangerous only after the player separates from it.
  // This prevents the kick that activates the shell from immediately dealing damage.
  scene.matter.world.on("collisionend", (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      const isShellA = bodyA.label === "shell";
      const isShellB = bodyB.label === "shell";
      if (!isShellA && !isShellB) return;
      const shellBody = isShellA ? bodyA : bodyB;
      const otherBody = isShellA ? bodyB : bodyA;
      if (otherBody.label !== "player") return;
      const shellSprite = shells.find((s) => s.body.id === shellBody.id);
      if (shellSprite && shellSprite.isMoving) {
        damageBodies.add(shellBody.id);
      }
    });
  });
}
