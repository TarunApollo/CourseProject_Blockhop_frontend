import { TiledMapJson } from "../ecs/levelData/types";

export function preloadLevelAssets(scene: Phaser.Scene, _mapJson: TiledMapJson) {
  scene.load.image(
    "bg_layer1",
    "/assets/background/overworld/background_solid_sky.png",
  );
  scene.load.image(
    "bg_layer2",
    "/assets/background/overworld/background_clouds.png",
  );
  scene.load.image(
    "bg_layer3",
    "/assets/background/overworld/background_fade_trees.png",
  );
  scene.load.image(
    "bg_layer4",
    "/assets/background/overworld/background_solid_sky.png",
  );

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

  scene.load.atlas(
    "tiles.default",
    "/assets/spritesheet-tiles-default.png",
    `${apiUrl}/assets/spritesheets?type=tiles`
  );
  scene.load.atlas(
    "enemies",
    "/assets/spritesheet-enemies-default.png",
    `${apiUrl}/assets/spritesheets?type=enemies`
  );
  scene.load.atlas(
    "player",
    "/assets/spritesheet-characters-default.png",
    `${apiUrl}/assets/spritesheets?type=characters`
  );
}
