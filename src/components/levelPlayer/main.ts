import Phaser from "phaser";
import { preloadLevelAssets } from "./phaser/preload.js";
import { createPhaserLevelRuntime } from "./phaser/createPhaserLevelRuntime.js";
import {
  PhaserLevelCallbacks,
  PhaserLevelRuntime,
  updatePhaserLevel,
} from "./phaser/updatePhaserLevel.js";
import { createLevelDataFromTiledJson } from "./ecs/levelData/createLevelDataFromTiledJson.js";

let gameMapJson: TiledMapJson;
let gameLevelData: LevelData;
let runtime: PhaserLevelRuntime | undefined;
let runtimeCallbacks: PhaserLevelCallbacks = {};


class Main extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload(): void {
    preloadLevelAssets(this, gameMapJson);
  }

  create(): void {
    runtime = createPhaserLevelRuntime(this, {
      callbacks: runtimeCallbacks,
      levelData: gameLevelData,
    });
  }

  update(time: number, delta: number): void {
    if (!runtime) return;
    updatePhaserLevel(runtime, this, time, delta);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1536,
  height: 768,
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
  scene: Main,
};

const StartGame = (
  parent: string,
  width: number,
  height: number,
  mapJson: TiledMapJson,
  callbacks: PhaserLevelCallbacks = {},
) => {
  gameMapJson = mapJson;
  gameLevelData = createLevelDataFromTiledJson(gameMapJson);
  runtimeCallbacks = callbacks;
  return new Phaser.Game({ ...config, parent, width, height });
};

export default StartGame;
