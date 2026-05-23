import Phaser from "phaser";
import { preloadLevelAssets } from "./phaser/preload.js";
import { createPhaserLevelRuntime } from "./phaser/createPhaserLevelRuntime.js";
import {
  PhaserLevelCallbacks,
  PhaserLevelRuntime,
  updatePhaserLevel,
} from "./phaser/updatePhaserLevel.js";
import { createLevelDataFromTiledJson } from "./ecs/headlessRuntime/createLevelDataFromTiledJson.js";
import { installScriptingCheats } from "../cheats/cheats.js";
import { DEFAULT_PLAYER_SKIN } from "./phaser/phaserConstants.js";
import { LevelData, TiledMapJson } from "./ecs/headlessRuntime/types.js";

let gameMapJson: TiledMapJson;
let gameLevelData: LevelData;
let runtime: PhaserLevelRuntime | undefined;
let runtimeCallbacks: PhaserLevelCallbacks = {};
let gamePlayerSkin = DEFAULT_PLAYER_SKIN;


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
      playerSkin: gamePlayerSkin,
    });
    installScriptingCheats(runtime, this);
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
  render: {
    roundPixels: true,
  },
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
  playerSkin = DEFAULT_PLAYER_SKIN,
) => {
  gameMapJson = mapJson;
  gameLevelData = createLevelDataFromTiledJson(gameMapJson);
  runtimeCallbacks = callbacks;
  gamePlayerSkin = playerSkin;
  const game = new Phaser.Game({ ...config, parent, width, height });
  game.canvas.style.imageRendering = "pixelated";
  return game;
};

export default StartGame;
