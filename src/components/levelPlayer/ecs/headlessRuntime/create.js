function createTileMatterBodies(layer) {
  layer.forEachTile((tile) => {
    if (tile.index === -1) return;

    const tileset = tile.tileset;
    const tileData = tileset.tileData[tile.index - tileset.firstgid];
    const label = tileData?.type ?? "tile";
    const body = Matter.Bodies.rectangle(
      tile.pixelX + tile.width / 2,
      tile.pixelY + tile.height / 2,
      tile.width,
      tile.height,
      {
        isStatic: true,
        label,
      },
    );

    applyTileCollisionFilter(body, label);
    Matter.World.add(matterWorld, body);
  });
}

function createWorldBounds() {
  const wallThickness = 64;
  const wallHeight = map.heightInPixels + 200;
  const leftWall = Matter.Bodies.rectangle(
    -wallThickness / 2,
    wallHeight / 2,
    wallThickness,
    wallHeight,
    {
      isStatic: true,
      label: "world-left",
    },
  );
  const rightWall = Matter.Bodies.rectangle(
    map.widthInPixels + wallThickness / 2,
    wallHeight / 2,
    wallThickness,
    wallHeight,
    {
      isStatic: true,
      label: "world-right",
    },
  );

  leftWall.collisionFilter.category = CATEGORY_DEFAULT;
  leftWall.collisionFilter.mask = 0xffff & ~CATEGORY_ENEMY;
  rightWall.collisionFilter.category = CATEGORY_DEFAULT;
  rightWall.collisionFilter.mask = 0xffff;

  Matter.World.add(matterWorld, [leftWall, rightWall]);
}
export function create() {
  // reset registry for new scene
  registry = new Registry();
  renderContext = createPhaserRenderContext(this);
  eventQueue = new EventQueue();
  matterEngine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY },
  });
  matterWorld = matterEngine.world;
  registry.onComponentRemove(CT.Sprite, (entity) => {
    removeGameObject(renderContext, entity);
  });

  // reset state on scene (re)start
  state.isSmall = false;
  state.isInvincible = false;
  state.isDying = false;
  state.isLevelComplete = false;
  state.doorOpen = false;
  state.knockbackFrames = 0;
  state.jumpHoldFrames = 0;
  state.jumpKeyWasDown = false;
  completeLevel = null;
  playerEntity = undefined;
  collisionContext = undefined;

  map = this.make.tilemap({ key: "map" });

  // tiles for the ground layer
  var groundTiles = map.addTilesetImage("tiles");
  // create the ground layer
  groundLayer = map.createLayer("World", groundTiles, 0, 0);

  // Enable collision on every non-empty tile.
  groundLayer.setCollisionByExclusion([-1]);

  createTileMatterBodies(groundLayer);

  const groundTileset = map.getTileset("tiles");
  tileMetadata = createTileMetadataResource(groundTileset);
  levelState = createLevelStateResourceFromMapProperties(map.properties);

  //
  // component hooks to define setup data
  //
  setupGlobalAnimations(this, groundTileset);

  map.objects.forEach((objLayer) => {
    objLayer.objects.forEach((obj) => {
      if (obj.gid === undefined) return;
      const gid = obj.gid;
      const frame = gid - groundTileset.firstgid;
      const type = groundTileset.tileData[frame]?.type;
      const x = obj.x + obj.width / 2;
      const y = obj.y - obj.height / 2;
      console.log(
        `object at (${x}, ${y}) type: "${type}", gid: ${obj.gid}, frame: ${frame}`,
      );
      const res = spawnEntity(registry, type, x, y, frame);
      if (res === -1) {
        console.log(`Failed to spawn entity of type: ${type} AND ${res} `);
        return;
      }

      if (type == "Door_Closed") {
        console.log(res);
      }
      createMatterBodyForEntity(matterWorld, registry, res);

      if (type === "Door_Closed") {
        const topFrame = findTilesetFrameByType(
          groundTileset,
          "Door_Closed_Top",
        );
        if (topFrame !== undefined) {
          ensureDoorTopSprite(renderContext, registry, res, topFrame);
        }
      }
    });
  });
  levelStateSystem(levelState, []);
  setDoorVisualState(levelState.doorOpen);

  completeLevel = () => {
    if (state.isLevelComplete) return;
    state.isLevelComplete = true;

    // Detach player rendering from physics so tweens can move it freely.
    freezePlayerBody();

    // Find the closest open door to tween towards.

    const [doorId] = registry.view([CT.Door]);
    const doorPos = registry.getComponent(doorId, CT.Transform);

    // 1. Slide player to the horizontal centre of the door's bottom tile.
    this.tweens.add({
      targets: player,
      x: doorPos.x,
      duration: 400,
      ease: "Quad.easeInOut",
      onComplete: () => {
        // 2. Shrink and fade — player disappears into the door.
        this.tweens.add({
          targets: player,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 300,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(400, () => EventBus.emit("LevelCompleted"));
          },
        });
      },
    });
  };

  // Open all doors when the clear condition is met.
  EventBus.on("ClearConditionCompleted", () => {
    levelState.doorOpen = true;
    setDoorVisualState(true);
  });

  // create repeating background layers (4 vertically stacked, each 1/4 height)
  // TileSprite tiles the SOURCE texture, so we use regular images scaled to fit
  var mapWidth = map.widthInPixels;
  var gameHeight = map.heightInPixels;
  var sliceH = gameHeight / 4;

  createBgRow(this, 0, "bg_layer1", -4, mapWidth, sliceH);
  createBgRow(this, sliceH, "bg_layer2", -3, mapWidth, sliceH);
  createBgRow(this, sliceH * 2, "bg_layer3", -2, mapWidth, sliceH);
  createBgRow(this, sliceH * 3, "bg_layer4", -1, mapWidth, sliceH);

  createWorldBounds();

  // create the player sprite at the spawn point set by Start_Flag
  let spawn_x = 200;
  let spawn_y = 200;

  registry.view([CT.StartFlag, CT.Transform]).forEach((id) => {
    const pos = registry.getComponent(id, CT.Transform);
    spawn_x = pos.x;
    spawn_y = pos.y;
  });

  playerEntity = spawnPlayer(registry, spawn_x, spawn_y);
  createMatterBodyForEntity(matterWorld, registry, playerEntity);
  syncTransformsFromMatter(registry);
  renderSystem(renderContext, registry);
  player = getGameObject(renderContext, playerEntity);

  collisionContext = {
    registry,
    world: matterWorld,
    tileMetadata,
    scheduler: createPhaserScheduler(this),
    events: eventQueue,
  };

  Matter.Events.on(matterEngine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      routeCollisionPair(collisionContext, collisionStartRules, pair);
    });
  });

  Matter.Events.on(matterEngine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      routeCollisionPair(collisionContext, collisionEndRules, pair);
    });
  });

  // define input cursors
  cursors = this.input.keyboard.createCursorKeys();
  // set bounds so the camera won't go outside the game world
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // zoom to fit map height exactly (no black bars), which shows 24 blocks wide at 1536px canvas
  this.cameras.main.setZoom(this.cameras.main.height / map.heightInPixels);
  // make the camera follow the player
  this.cameras.main.startFollow(player);

  EventBus.emit("RunStarted");
}
