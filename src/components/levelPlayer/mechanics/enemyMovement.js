import Phaser from "phaser";
import { EventBus } from "../EventBus.js";
import { SLIME_SPEED, SNAIL_SPEED, SHELL_SPEED } from "./constants.js";

/**
 * enemyMovement.js
 *
 * Per-frame update logic for enemy and shell sprites.
 *
 * Wall / ledge detection strategy
 * ────────────────────────────────
 * Collision events are unreliable for tile-seam detection: Matter can fire
 * collisionstart on the tiny gap between two adjacent tiles even with no real
 * wall present.  Instead we use a two-step velocity heuristic:
 *
 *   1. If the sprite's actual velocity is well below the target speed, something
 *      is probably blocking it.
 *   2. Confirm with a Matter.Query.point probe just ahead of the sprite at
 *      mid-height.  Ghost seam contacts have no body at that point; real walls do.
 *
 * When both conditions are true the direction is flipped.
 *
 * skipVelCheck convention
 * ────────────────────────
 * Whenever a direction flip happens (here or in collisionHandlers), `skipVelCheck`
 * is set to `true` on the sprite.  The next frame the velocity is still near zero
 * (the new impulse hasn't propagated yet), so without this flag step 1 above would
 * immediately re-flip the direction.  The flag suppresses the check for exactly
 * one frame, then clears itself.
 */

const Matter = Phaser.Physics.Matter.Matter;

/**
 * Advance all enemy sprites by one frame.
 *
 * @param {Phaser.Scene}   scene
 * @param {object[]}       enemies       live enemy sprites (mutated in place)
 * @param {Set<number>}    damageBodies  body.id set maintained alongside enemies[]
 * @param {Phaser.Tilemaps.Tilemap} map
 * @param {MatterJS.Body[]} groundBodies pre-filtered solid bodies for queries
 *                          (excludes enemies, coins, player, foot sensor)
 */
export function updateEnemies(scene, enemies, damageBodies, map, groundBodies) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // Destroy enemies that have fallen off the map.
    if (
      enemy.x < -enemy.displayWidth ||
      enemy.y > map.heightInPixels + enemy.displayHeight
    ) {
      EventBus.emit("EnemyKilled", enemy.enemyType);
      damageBodies.delete(enemy.body.id);
      enemy.destroy();
      enemies.splice(i, 1);
      continue;
    }

    // Don't move enemies that are off-screen to the right (beyond one screen
    // width past the camera's right edge).  This prevents wasted motion and
    // keeps enemies in their spawn position until the player approaches.
    const camRight = scene.cameras.main.worldView.right;
    if (enemy.x > camRight + scene.cameras.main.width) {
      enemy.setVelocityX(0);
      continue;
    }

    if (enemy.enemyType === "Enemy_Snail") {
      // Check for ground one step ahead; flip direction if none.
      const checkX = enemy.x + enemy.moveDir * (enemy.displayWidth * 0.5 + 4);
      const checkY = enemy.y + enemy.displayHeight * 0.5 + 8;
      if (
        Matter.Query.point(groundBodies, { x: checkX, y: checkY }).length === 0
      ) {
        enemy.moveDir *= -1;
        enemy.skipVelCheck = true;
      } else if (enemy.skipVelCheck) {
        enemy.skipVelCheck = false;
      } else {
        // Velocity-based wall detection for regular tiles.
        const vx = enemy.body.velocity.x;
        const blocked =
          (enemy.moveDir > 0 && vx < SNAIL_SPEED * 0.5) ||
          (enemy.moveDir < 0 && vx > -SNAIL_SPEED * 0.5);
        if (blocked) {
          const aheadX =
            enemy.x + enemy.moveDir * (enemy.displayWidth * 0.5 + 4);
          const wallAhead =
            Matter.Query.point(groundBodies, { x: aheadX, y: enemy.y }).length >
            0;
          if (wallAhead) {
            enemy.moveDir *= -1;
            enemy.skipVelCheck = true;
          }
        }
      }
      enemy.setVelocityX(SNAIL_SPEED * enemy.moveDir);
    } else {
      // Slime: velocity-based wall detection for regular tiles.
      if (enemy.skipVelCheck) {
        enemy.skipVelCheck = false;
      } else {
        const vx = enemy.body.velocity.x;
        const blocked =
          (enemy.moveDir > 0 && vx < SLIME_SPEED * 0.5) ||
          (enemy.moveDir < 0 && vx > -SLIME_SPEED * 0.5);
        if (blocked) {
          const aheadX =
            enemy.x + enemy.moveDir * (enemy.displayWidth * 0.5 + 4);
          const wallAhead =
            Matter.Query.point(groundBodies, { x: aheadX, y: enemy.y }).length >
            0;
          if (wallAhead) {
            enemy.moveDir *= -1;
            enemy.skipVelCheck = true;
          }
        }
      }
      enemy.setVelocityX(SLIME_SPEED * enemy.moveDir);
    }

    // Mirror sprite to face the direction of travel (default sprite faces left).
    enemy.flipX = enemy.moveDir > 0;
    enemy.setAngularVelocity(0);
    enemy.setAngle(0);
  }
}

/**
 * Advance all shell sprites by one frame.
 *
 * Shells use the same velocity-heuristic wall detection as enemies (see module
 * docblock above), but without a ground-ahead check — shells can slide off
 * ledges, unlike snails which turn at edges.
 *
 * Two-pass structure keeps cleanup (splice) separate from movement so index
 * shifts in the cleanup pass don't affect the movement pass.
 *
 * @param {Phaser.Scene}    scene
 * @param {object[]}        shells        live shell sprites (mutated in place)
 * @param {Set<number>}     damageBodies
 * @param {Phaser.Tilemaps.Tilemap} map
 * @param {MatterJS.Body[]} groundBodies
 */
export function updateShells(scene, shells, damageBodies, map, groundBodies) {
  // Pass 1: cleanup.
  for (let i = shells.length - 1; i >= 0; i--) {
    const shell = shells[i];
    if (
      shell.x < -shell.displayWidth ||
      shell.y > map.heightInPixels + shell.displayHeight
    ) {
      if (shell.isAlive) EventBus.emit("EnemyKilled", "Enemy_Snail");
      if (shell.aliveTimer) shell.aliveTimer.remove();
      shell.destroy();
      shells.splice(i, 1);
    }
  }

  // Pass 2: movement.
  for (const shell of shells) {
    if (shell.isMoving) {
      if (shell.skipVelCheck) {
        shell.skipVelCheck = false;
      } else {
        const vx = shell.body.velocity.x;
        const velocityBlocked =
          (shell.moveDir > 0 && vx < SHELL_SPEED * 0.5) ||
          (shell.moveDir < 0 && vx > -SHELL_SPEED * 0.5);
        if (velocityBlocked) {
          // Confirm there is a solid body at the shell's mid-height just
          // ahead of it.  Tile-seam ghost collisions slow the shell but
          // have no body at that height; real walls do.
          const aheadX =
            shell.x + shell.moveDir * (shell.displayWidth * 0.5 + 4);
          const wallAhead =
            Matter.Query.point(groundBodies, { x: aheadX, y: shell.y }).length >
            0;
          if (wallAhead) shell.moveDir *= -1;
        }
      }
      shell.setVelocityX(SHELL_SPEED * shell.moveDir);
    }
    shell.setAngularVelocity(0);
    shell.setAngle(0);
  }
}
