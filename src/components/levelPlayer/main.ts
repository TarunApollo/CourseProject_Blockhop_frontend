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
import type { GhostInputFrame } from "./ecs/headlessRuntime/createGhostRuntime.js";
import { destroyAllGameObjects } from "./phaser/phaserAdapter.js";
import { renderGhostSystem } from "./phaser/renderGhostSystem.js";

let gameMapJson: TiledMapJson;
let gameLevelData: LevelData;
let runtime: PhaserLevelRuntime | undefined;
let runtimeCallbacks: PhaserLevelCallbacks = {};
let gamePlayerSkin = DEFAULT_PLAYER_SKIN;
let gameGhostInputLog: GhostInputFrame[] | null = null;
let gameGhostVisible = true;


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
      ghostInputLog: gameGhostInputLog,
      ghostVisible: gameGhostVisible,
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
  ghostInputLog: GhostInputFrame[] | null = null,
  ghostVisible = true,
) => {
  gameMapJson = mapJson;
  gameLevelData = createLevelDataFromTiledJson(gameMapJson);
  runtimeCallbacks = callbacks;
  gamePlayerSkin = playerSkin;
  gameGhostInputLog = ghostInputLog;
  gameGhostVisible = ghostVisible;
  const game = new Phaser.Game({ ...config, parent, width, height });
  game.canvas.style.imageRendering = "pixelated";

  const controls = {
    setGhostVisible(visible: boolean): void {
      gameGhostVisible = visible;
      if (!runtime) return;
      runtime.ghostVisible = visible;
      if (!visible && runtime.ghostRenderContext) {
        destroyAllGameObjects(runtime.ghostRenderContext);
      } else if (visible && runtime.ghost && runtime.ghostRenderContext) {
        // The scene may be paused (update() not running), so force one render
        // pass immediately so the ghost sprites appear without needing to resume.
        renderGhostSystem(runtime.ghostRenderContext, runtime.ghost.runtime.registry);
      }
    },
    hasGhost(): boolean {
      return ghostInputLog !== null;
    },
  };

  return { game, controls };
};

export default StartGame;
