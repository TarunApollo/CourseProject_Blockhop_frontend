import Phaser from "phaser";
import { preloadLevelAssets } from "./phaser/preload.js";
import { createPhaserLevelRuntime } from "./phaser/createPhaserLevelRuntime.js";
import { updatePhaserLevel } from "./phaser/updatePhaserLevel.ts";

let gameMapJson = "assets/map1.json";
let runtime;
let runtimeCallbacks = {};

const config = {
  type: Phaser.AUTO,
  width: 1536,
  height: 768,
  scene: {
    key: "main",
    preload() {
      preloadLevelAssets(this, { mapJson: gameMapJson });
    },
    create() {
      runtime = createPhaserLevelRuntime(this, {
        callbacks: runtimeCallbacks,
      });
    },
    update(time, delta) {
      if (!runtime) return;
      updatePhaserLevel(runtime, this, time, delta);
    },
  },
};

const StartGame = (parent, width, height, mapJson, callbacks = {}) => {
  if (mapJson) gameMapJson = mapJson;
  runtimeCallbacks = callbacks;
  return new Phaser.Game({ ...config, parent, width, height });
};

export default StartGame;
