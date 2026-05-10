import Phaser from "phaser";

/**
 * Creates animations at the start of a scene.
 */
export function setupGlobalAnimations(scene: Phaser.Scene, groundTileset: any) {
  // Player Animations
  if (!scene.anims.exists("walk")) {
    scene.anims.create({
      key: "walk",
      frames: scene.anims.generateFrameNames("player", {
        prefix: "p1_walk",
        start: 1,
        end: 11,
        zeroPad: 2,
      }),
      frameRate: 15,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("idle")) {
    scene.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: "p1_stand" }],
      frameRate: 10,
    });
  }

  // Flag Animation
  if (!scene.anims.exists("flag_spin")) {
    const flagA = Object.entries(groundTileset.tileData).find(
      ([, d]: [string, any]) => d.type === "Start_Flag",
    );
    const flagB = Object.entries(groundTileset.tileData).find(
      ([, d]: [string, any]) => d.type === "Start_Flag_B",
    );

    if (flagA && flagB) {
      console.log(`Creating flag_spin animation with frames ${flagA[0]} and ${flagB[0]}`);
      scene.anims.create({
        key: "flag_spin",
        frames: [
          { key: "tiles", frame: parseInt(flagA[0]) },
          { key: "tiles", frame: parseInt(flagB[0]) },
        ],
        frameRate: 4,
        repeat: -1,
      });
    } else {
      console.warn(`Failed to find Start_Flag (${!!flagA}) or Start_Flag_B (${!!flagB}) in tileset!`);
    }
  }

  // Slime Animations
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

  // Snail Animations
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
}
