import Phaser from "phaser";
import { createBackground, scrollBackground } from "./background.js";

export class BackgroundScene extends Phaser.Scene {
  constructor() {
    super({ key: "BackgroundScene" });
  }

  preload() {
    this.load.image(
      "bg_sky",
      "/assets/background/overworld/background_solid_sky.png",
    );
    this.load.image(
      "bg_clouds",
      "/assets/background/overworld/background_clouds.png",
    );
    this.load.image(
      "bg_trees",
      "/assets/background/overworld/background_color_trees.png",
    );
    this.load.image(
      "bg_grass",
      "/assets/background/overworld/background_solid_grass.png",
    );
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    // this.bg = createBackground(this, W, H)
    this.bg = createBackground(this, this.scale.width, this.scale.height);
  }

  update(time, delta) {
    scrollBackground(this.bg, delta / 16);
  }
}
