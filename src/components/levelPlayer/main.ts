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
import {
  DEFAULT_PLAYER_SKIN,
  TARGET_RENDER_FPS,
} from "./phaser/phaserConstants.js";
import { LevelData, TiledMapJson } from "./ecs/headlessRuntime/types.js";

let gameMapJson: TiledMapJson;
let gameLevelData: LevelData;
let runtime: PhaserLevelRuntime | undefined;
let runtimeCallbacks: PhaserLevelCallbacks = {};
let gamePlayerSkin = DEFAULT_PLAYER_SKIN;

const RENDER_SCALE = 2;
const LEVEL_CAMERA_ZOOM_OUT = 0.9;


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
    target: TARGET_RENDER_FPS,
    forceSetTimeOut: true,
  },
  scene: Main,
};

const StartGame = (
  parent: string | HTMLElement,
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
  return new Phaser.Game({
    ...config,
    parent,
    width: Math.round(width * RENDER_SCALE),
    height: Math.round(height * RENDER_SCALE),
    zoom: 1 / RENDER_SCALE,
  });
};

export function resizeLevelGame(
  game: Phaser.Game,
  width: number,
  height: number,
): void {
  const nextWidth = Math.max(1, Math.round(width * RENDER_SCALE));
  const nextHeight = Math.max(1, Math.round(height * RENDER_SCALE));

  game.scale.resize(nextWidth, nextHeight);
  game.scale.setZoom(1 / RENDER_SCALE);

  const scene = game.scene.getScene("main") as Main | undefined;
  if (!scene || !runtime) return;

  scene.cameras.main.setZoom(
    (scene.cameras.main.height / runtime.mapSize.height) *
      LEVEL_CAMERA_ZOOM_OUT,
  );
}

export default StartGame;
