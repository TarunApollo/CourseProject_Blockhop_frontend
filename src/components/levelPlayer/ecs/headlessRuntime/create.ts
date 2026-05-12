import Matter from "matter-js";
import { EventBus } from "../../EventBus.js";
import { createBgRow } from "../../phaser/background.js";
import { setupGlobalAnimations } from "../../phaser/animationSetup.ts";
import {
  createMatterBodyForEntity,
  getPhysicsBody,
  syncTransformsFromMatter,
} from "../adapter/matterAdapter.ts";
import {
  createPhaserRenderContext,
  ensureDoorTopSprite,
  getGameObject,
  removeGameObject,
  renderSystem,
  setDoorFrames,
} from "../adapter/phaserAdapter.ts";
import {
  CATEGORY_DEFAULT,
  CATEGORY_ENEMY,
  GRAVITY,
} from "../constants.ts";
import { ComponentTypes as CT } from "../core/ComponentTypes.ts";
import { Registry } from "../core/Registry.ts";
import { EventQueue } from "../eventQueue.ts";
import { spawnEntity } from "../EntityFactory.ts";
import { spawnPlayer } from "../playerSetup.ts";
import { createLevelStateResourceFromMapProperties } from "../resources/levelState.ts";
import {
  createTileMetadataResource,
  getTileFrameByType,
} from "../resources/tileMetadata.ts";
import {
  applyTileCollisionFilter,
  collisionFilterSystem,
} from "../systems/collision/collisionFilterSystem.ts";
import { routeCollisionPair } from "../systems/collision/collisionRouter.ts";
import {
  collisionEndRules,
  collisionStartRules,
} from "../systems/collision/collisionRules.ts";
import { levelStateSystem } from "../systems/levelStateSystem.ts";

function createTileMatterBodies(layer, matterWorld) {
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

function createWorldBounds(map, matterWorld) {
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

function createPhaserScheduler(scene) {
  return {
    schedule(delayMs, callback) {
      const timer = scene.time.delayedCall(delayMs, callback);
      return {
        remove() {
          timer.remove(false);
        },
      };
    },
  };
}

function freezePlayerBody(runtime) {
  const body = getPhysicsBody(runtime.registry, runtime.playerEntity);
  if (!body) return;

  Matter.Body.setStatic(body, true);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(body, 0);
  Matter.Body.setAngle(body, 0);
}

function setDoorVisualState(runtime, isOpen) {
  const bottomFrame = getTileFrameByType(
    runtime.tileMetadata,
    isOpen ? "Door_Open" : "Door_Closed",
  );
  const topFrame = getTileFrameByType(
    runtime.tileMetadata,
    isOpen ? "Door_Open_Top" : "Door_Closed_Top",
  );

  runtime.registry.view([CT.Door]).forEach((doorEntity) => {
    const door = runtime.registry.getComponent(doorEntity, CT.Door);
    if (door) door.isOpen = isOpen;
    setDoorFrames(runtime.renderContext, doorEntity, bottomFrame, topFrame);
  });
}

export function createLevelRuntime(scene) {
  const registry = new Registry();
  const renderContext = createPhaserRenderContext(scene);
  const events = new EventQueue();
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY },
  });
  const world = engine.world;

  registry.onComponentRemove(CT.Sprite, (entity) => {
    removeGameObject(renderContext, entity);
  });

  const map = scene.make.tilemap({ key: "map" });
  const groundTiles = map.addTilesetImage("tiles");
  const groundLayer = map.createLayer("World", groundTiles, 0, 0);
  groundLayer.setCollisionByExclusion([-1]);
  createTileMatterBodies(groundLayer, world);

  const groundTileset = map.getTileset("tiles");
  const tileMetadata = createTileMetadataResource(groundTileset);
  const levelState = createLevelStateResourceFromMapProperties(map.properties);
  setupGlobalAnimations(scene, groundTileset);

  const runtime = {
    scene,
    registry,
    renderContext,
    engine,
    world,
    events,
    map,
    tileMetadata,
    levelState,
    cursors: undefined,
    playerEntity: -1,
    completionSequenceStarted: false,
    attemptFailedEmitted: false,
    lastDoorOpen: levelState.doorOpen,
    setDoorVisualState: (isOpen) => setDoorVisualState(runtime, isOpen),
    completeLevel: () => {},
  };

  map.objects.forEach((objLayer) => {
    objLayer.objects.forEach((obj) => {
      if (obj.gid === undefined) return;

      const frame = obj.gid - groundTileset.firstgid;
      const type = groundTileset.tileData[frame]?.type;
      const x = obj.x + obj.width / 2;
      const y = obj.y - obj.height / 2;
      const entity = spawnEntity(registry, type, x, y, frame);
      if (entity === -1) return;

      createMatterBodyForEntity(world, registry, entity);

      if (type === "Door_Closed") {
        const topFrame = getTileFrameByType(tileMetadata, "Door_Closed_Top");
        if (topFrame !== undefined) {
          ensureDoorTopSprite(renderContext, registry, entity, topFrame);
        }
      }
    });
  });

  levelStateSystem(levelState, []);
  runtime.setDoorVisualState(levelState.doorOpen);

  createBgRow(
    scene,
    0,
    "bg_layer1",
    -4,
    map.widthInPixels,
    map.heightInPixels / 4,
  );
  createBgRow(
    scene,
    map.heightInPixels / 4,
    "bg_layer2",
    -3,
    map.widthInPixels,
    map.heightInPixels / 4,
  );
  createBgRow(
    scene,
    (map.heightInPixels / 4) * 2,
    "bg_layer3",
    -2,
    map.widthInPixels,
    map.heightInPixels / 4,
  );
  createBgRow(
    scene,
    (map.heightInPixels / 4) * 3,
    "bg_layer4",
    -1,
    map.widthInPixels,
    map.heightInPixels / 4,
  );

  createWorldBounds(map, world);

  let spawnX = 200;
  let spawnY = 200;
  registry.view([CT.StartFlag, CT.Transform]).forEach((entity) => {
    const transform = registry.getComponent(entity, CT.Transform);
    spawnX = transform.x;
    spawnY = transform.y;
  });

  runtime.playerEntity = spawnPlayer(registry, spawnX, spawnY);
  createMatterBodyForEntity(world, registry, runtime.playerEntity);
  collisionFilterSystem(runtime);
  syncTransformsFromMatter(registry);
  renderSystem(renderContext, registry);

  const player = getGameObject(renderContext, runtime.playerEntity);

  const collisionContext = {
    registry,
    world,
    tileMetadata,
    scheduler: createPhaserScheduler(scene),
    events,
  };

  Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      routeCollisionPair(collisionContext, collisionStartRules, pair);
    });
  });

  Matter.Events.on(engine, "collisionEnd", (event) => {
    event.pairs.forEach((pair) => {
      routeCollisionPair(collisionContext, collisionEndRules, pair);
    });
  });

  runtime.completeLevel = () => {
    if (runtime.completionSequenceStarted) return;
    runtime.completionSequenceStarted = true;

    freezePlayerBody(runtime);

    const [doorEntity] = registry.view([CT.Door, CT.Transform]);
    const doorTransform = doorEntity
      ? registry.getComponent(doorEntity, CT.Transform)
      : undefined;

    if (!player || !doorTransform) {
      EventBus.emit("LevelCompleted");
      return;
    }

    scene.tweens.add({
      targets: player,
      x: doorTransform.x,
      duration: 400,
      ease: "Quad.easeInOut",
      onComplete: () => {
        scene.tweens.add({
          targets: player,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 300,
          ease: "Quad.easeIn",
          onComplete: () => {
            scene.cameras.main.flash(500, 255, 255, 255);
            scene.time.delayedCall(400, () => EventBus.emit("LevelCompleted"));
          },
        });
      },
    });
  };

  EventBus.on("ClearConditionCompleted", () => {
    runtime.levelState.doorOpen = true;
    runtime.setDoorVisualState(true);
    runtime.lastDoorOpen = true;
  });

  runtime.cursors = scene.input.keyboard.createCursorKeys();
  scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  scene.cameras.main.setZoom(scene.cameras.main.height / map.heightInPixels);
  if (player) {
    scene.cameras.main.startFollow(player);
  }

  EventBus.emit("RunStarted");

  return runtime;
}
