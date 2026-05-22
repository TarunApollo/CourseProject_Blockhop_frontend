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

  scene.load.atlasXML(
    "tiles.default",
    "/assets/spritesheet-tiles-default.png",
    "/assets/spritesheet-tiles-default.xml",
  );
  scene.load.atlasXML(
    "enemies",
    "/assets/spritesheet-enemies-default.png",
    "/assets/spritesheet-enemies-default.xml",
  );
  scene.load.atlasXML(
    "player",
    "/assets/spritesheet-characters-default.png",
    "/assets/spritesheet-characters-default.xml",
  );
}
