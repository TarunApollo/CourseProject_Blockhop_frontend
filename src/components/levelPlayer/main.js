import Phaser from "phaser";
import { createLevelRuntime } from "./ecs/headlessRuntime/create.ts";
import { preloadLevelAssets } from "./ecs/headlessRuntime/preload.js";
import { updatePhaserLevel } from "./ecs/headlessRuntime/update.ts";

let gameMapJson = "assets/map1.json";
let runtime;

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
      runtime = createLevelRuntime(this);
    },
    update(time, delta) {
      if (!runtime) return;
      updatePhaserLevel(runtime, this, time, delta);
    },
  },
};

const StartGame = (parent, width, height, mapJson) => {
  if (mapJson) gameMapJson = mapJson;
  return new Phaser.Game({ ...config, parent, width, height });
};

export default StartGame;
