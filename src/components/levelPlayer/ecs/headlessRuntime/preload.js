export function preload() {
  // map made with backend TiledMap in JSON format
  this.load.tilemapTiledJSON("map", gameMapJson);

  // background layers (4 vertically stacked images)
  this.load.image(
    "bg_layer1",
    "/assets/background/overworld/background_solid_sky.png",
  );
  this.load.image(
    "bg_layer2",
    "/assets/background/overworld/background_clouds.png",
  );
  this.load.image(
    "bg_layer3",
    "/assets/background/overworld/background_fade_trees.png",
  );
  this.load.image(
    "bg_layer4",
    "/assets/background/overworld/background_solid_sky.png",
  );

  // tiles in spritesheet
  this.load.spritesheet("tiles", "/assets/tiles.png", {
    frameWidth: 128,
    frameHeight: 128,
  });
  // coin images for spinning animation
  this.load.image("coin_gold", "/assets/coin/coin_gold.png");
  this.load.image("coin_gold_side", "/assets/coin/coin_gold_side.png");
  // saw enemy images
  this.load.image("saw_a", "/assets/enemies/saw/saw_a.png");
  this.load.image("saw_b", "/assets/enemies/saw/saw_b.png");
  // slime enemy animations
  this.load.atlas(
    "slime_normal",
    "/assets/enemies/slime_normal.png",
    "/assets/enemies/slime_normal.json",
  );
  // snail enemy animations
  this.load.atlas(
    "snail",
    "/assets/enemies/snail.png",
    "/assets/enemies/snail.json",
  );
  // player animations
  this.load.atlas("player", "/assets/player.png", "/assets/player.json");
}
