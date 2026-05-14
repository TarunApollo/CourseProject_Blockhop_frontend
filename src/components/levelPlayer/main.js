import Phaser from "phaser";
import { preloadLevelAssets } from "./phaser/preload.ts";
import { createPhaserLevelRuntime } from "./phaser/createPhaserLevelRuntime.js";
import { updatePhaserLevel } from "./phaser/updatePhaserLevel.ts";
import { createLevelDataFromTiledJson } from "./ecs/levelData/createLevelDataFromTiledJson.ts";

let gameMapJson;
let gameLevelData;
let runtime;
let runtimeCallbacks = {};

const config = {
  type: Phaser.AUTO,
  width: 1536,
  height: 768,
  scene: {
    key: "main",
    preload() {
      if (!gameMapJson) {
        throw new Error("preload level: missing map JSON");
      }
      preloadLevelAssets(this, gameMapJson);
    },
    create() {
      if (!gameLevelData) {
        throw new Error("create level: missing level data");
      }
      runtime = createPhaserLevelRuntime(this, {
        callbacks: runtimeCallbacks,
        levelData: gameLevelData,
      });
    },
    update(time, delta) {
      if (!runtime) return;
      updatePhaserLevel(runtime, this, time, delta);
    },
  },
};

const StartGame = (parent, width, height, mapJson, callbacks = {}) => {
  gameMapJson = mapJson;
  gameLevelData = createLevelDataFromTiledJson(mapJson);
  runtimeCallbacks = callbacks;
  return new Phaser.Game({ ...config, parent, width, height });
};

export default StartGame;
