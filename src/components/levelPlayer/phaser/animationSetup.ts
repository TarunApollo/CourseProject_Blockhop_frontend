import Phaser from "phaser";
import { DEFAULT_PLAYER_SKIN, PLAYER_SKINS } from "./phaserConstants";

/**
 * Creates animations at the start of a scene.
 */
export function setupGlobalAnimations(
  scene: Phaser.Scene,
  playerSkin = DEFAULT_PLAYER_SKIN,
) {
  const skin = PLAYER_SKINS.includes(playerSkin)
    ? playerSkin
    : DEFAULT_PLAYER_SKIN;

  // Player Animations
  if (!scene.anims.exists("walk")) {
    scene.anims.create({
      key: "walk",
      frames: [
        { key: "player", frame: `character_${skin}_walk_a` },
        { key: "player", frame: `character_${skin}_walk_b` },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("climb")) {
    scene.anims.create({
      key: "climb",
      frames: [
        { key: "player", frame: `character_${skin}_climb_a` },
        { key: "player", frame: `character_${skin}_climb_b` },
      ],
      frameRate: 6,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("jump")) {
    scene.anims.create({
      key: "jump",
      frames: [{ key: "player", frame: `character_${skin}_jump` }],
      frameRate: 8,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("idle")) {
    scene.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: `character_${skin}_idle` }],
      frameRate: 10,
    });
  }

  if (!scene.anims.exists("duck")) {
    scene.anims.create({
      key: "duck",
      frames: [{ key: "player", frame: `character_${skin}_duck` }],
      frameRate: 10,
    });
  }

  if (!scene.anims.exists("hit")) {
    scene.anims.create({
      key: "hit",
      frames: [{ key: "player", frame: `character_${skin}_hit` }],
      frameRate: 10,
    });
  }

  // Flag Animation
  if (!scene.anims.exists("flag_spin")) {
    scene.anims.create({
      key: "flag_spin",
      frames: [
        { key: "tiles.default", frame: "flag_green_a" },
        { key: "tiles.default", frame: "flag_green_b" },
      ],
      frameRate: 4,
      repeat: -1,
    });
  }

  // Slime Animations
  if (!scene.anims.exists("slime_walk")) {
    scene.anims.create({
      key: "slime_walk",
      frames: [
        { key: "enemies", frame: "slime_normal_walk_a" },
        { key: "enemies", frame: "slime_normal_walk_b" },
      ],
      frameRate: 4,
      repeat: -1,
    });
  }

  // Snail Animations
  if (!scene.anims.exists("snail_walk")) {
    scene.anims.create({
      key: "snail_walk",
      frames: [
        { key: "enemies", frame: "snail_walk_a" },
        { key: "enemies", frame: "snail_walk_b" },
      ],
      frameRate: 4,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("bee_fly")) {
    scene.anims.create({
      key: "bee_fly",
      frames: [
        { key: "enemies", frame: "bee_a" },
        { key: "enemies", frame: "bee_b" },
      ],
      frameRate: 6,
      repeat: -1,
      yoyo: true,
    });
  }

  createCoinAnimation(scene, "coin_gold", "coin_gold_side", "coin_spin_gold");
  createCoinAnimation(
    scene,
    "coin_silver",
    "coin_silver_side",
    "coin_spin_silver",
  );
  createCoinAnimation(
    scene,
    "coin_bronze",
    "coin_bronze_side",
    "coin_spin_bronze",
  );
}

function createCoinAnimation(
  scene: Phaser.Scene,
  frontFrame: string,
  sideFrame: string,
  animKey: string,
): void {
  if (scene.anims.exists(animKey)) return;

  scene.anims.create({
    key: animKey,
    frames: [
      { key: "tiles.default", frame: frontFrame },
      { key: "tiles.default", frame: sideFrame },
    ],
    frameRate: 4,
    repeat: -1,
    yoyo: true,
  });
}
