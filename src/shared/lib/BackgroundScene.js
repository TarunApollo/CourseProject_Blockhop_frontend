import Phaser from "phaser";
import { createBackground, scrollBackground } from "./background.js";
import {
  preloadBackgroundAssets,
  whenBackgroundAssetsReady,
} from "./backgroundAssets.js";

export class BackgroundScene extends Phaser.Scene {
  constructor() {
    super({ key: "BackgroundScene" });
  }

  preload() {
    preloadBackgroundAssets(this);
  }

  create() {
    whenBackgroundAssetsReady(this, () => {
      this.bg = createBackground(this, this.scale.width, this.scale.height);
    });
  }

  update(time, delta) {
    if (!this.bg) return;
    scrollBackground(this.bg, delta / 16);
  }
}
