import { EventBus } from "../EventBus";

/**
 * playerDamage.js
 *
 * Handles the two-hit damage progression and scene restart:
 *   big player → (hit) → small player → (hit) → death → scene restart
 *
 * Both exported functions receive the Phaser scene as `scene` (replaces
 * `this`) and mutate `state` properties directly so the caller sees changes
 * in the same frame.
 */

/**
 * React to the player touching a damage body.
 *
 * First hit: shrink to small form, apply knockback, flash invincibility.
 * Second hit: trigger death via resetGame().
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.Physics.Matter.Sprite} player
 * @param {{x: number}} damageSource  only the `x` coordinate is needed to
 *                                    determine knockback direction
 * @param {object} state  shared game-state flags
 */
export function hitDamage(scene, player, damageSource, state) {
  if (state.isInvincible) return;

  if (!state.isSmall) {
    state.isSmall = true;
    state.isInvincible = true;

    player.setScale(1.15);

    // Strong knockback impulse away from the damage source.
    const knockbackX = player.x < damageSource.x ? -14 : 14;
    player.setVelocity(knockbackX, -10);
    state.knockbackFrames = 25; // ~0.4 s of locked input at 60 fps
    scene.cameras.main.shake(200, 0.007);

    // Flash the player to show invincibility.
    scene.tweens.add({
      targets: player,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 10,
      onComplete: () => {
        player.alpha = 1;
        state.isInvincible = false;
      },
    });
  } else {
    // Second hit: die.
    resetGame(scene, player, state);
  }
}

/**
 * Restart the scene when the player falls off the map or dies.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.Physics.Matter.Sprite} player
 * @param {object}  state
 * @param {boolean} [fromFall=false]  true → instant restart (no animation);
 *                                    false → play the Mario-style death arc first
 */
export function resetGame(scene, player, state, fromFall = false) {
  if (state.isDying) return; // already in progress
  state.isDying = true;
  state.isInvincible = true;
  state.isSmall = false;
  EventBus.emit("AttemptFailed", { reason: fromFall ? "fall" : "damage" });

  if (fromFall) {
    // Fell off screen – no animation, restart promptly.
    scene.time.delayedCall(300, () => {
      scene.scene.restart();
    });
    return;
  }

  // Mario-style death: short camera shake, launch up, fall back down.
  scene.cameras.main.shake(150, 0.012);

  // Stop horizontal motion and launch the sprite straight up.
  state.knockbackFrames = 0;
  player.setVelocity(0, -16);

  // Wait long enough for the arc to complete, then restart.
  scene.time.delayedCall(1500, () => {
    scene.scene.restart();
  });
}
