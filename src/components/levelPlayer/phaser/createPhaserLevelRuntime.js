import * as Matter from "matter-js";
import { createBgRow } from "./background.js";
import { setupGlobalAnimations } from "./animationSetup.js";
import { createHeadlessLevelRuntime } from "../ecs/headlessRuntime/create.js";
import {
  createPhaserRenderContext,
  getGameObject,
  removeGameObject,
  renderSystem,
} from "./phaserAdapter.js";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes.js";
import { createTileMetadataResource } from "./tileMetadata.js";

// PhaserRuntime means Runtime + Phaser rendering and input.
// Phaser reads the map, then wraps the Runtime with sprites, camera, and keys.
export function createPhaserLevelRuntime(scene, options = {}) {
  const phaserLevel = createPhaserLevelData(scene);
  const headlessRuntime = createHeadlessLevelRuntime(options.levelData);
  const renderContext = createPhaserRenderContext(scene);
  const runtime = {
    ...headlessRuntime,
    renderContext,
    map: phaserLevel.map,
    worldLayer: phaserLevel.worldLayer,
    groundTileset: phaserLevel.groundTileset,
    tileMetadata: phaserLevel.tileMetadata,
    state: createPhaserRuntimeState(),
    callbacks: options.callbacks ?? {},
    player: undefined,
    cursors: undefined,
    completeLevel: undefined,
  };

  runtime.completeLevel = () => {
    completeLevel(scene, runtime);
  };

  runtime.registry.onComponentRemove(CT.Sprite, (entity) => {
    removeGameObject(renderContext, entity);
  });

  setupGlobalAnimations(scene, phaserLevel.groundTileset);
  setupPhaserDisplay(scene, runtime);

  runtime.callbacks.onRunStarted?.();
  runtime.callbacks.onSceneReady?.(scene);
  return runtime;
}

function createPhaserLevelData(scene) {
  const map = scene.make.tilemap({ key: "map" });
  const groundTiles = map.addTilesetImage("tiles");
  const worldLayer = map.createLayer("World", groundTiles, 0, 0);
  const groundTileset = map.getTileset("tiles");
  const tileMetadata = createTileMetadataResource(groundTileset);

  worldLayer.setCollisionByExclusion([-1]);

  return {
    map,
    worldLayer,
    groundTileset,
    tileMetadata,
  };
}

function createPhaserRuntimeState() {
  return {
    isDying: false,
    isLevelComplete: false,
  };
}

function setupPhaserDisplay(scene, runtime) {
  createBackground(scene, runtime.mapSize);
  renderSystem(runtime.renderContext, runtime.registry, runtime.tileMetadata);

  runtime.player = getGameObject(runtime.renderContext, runtime.playerEntity);
  runtime.cursors = scene.input.keyboard.createCursorKeys();

  scene.cameras.main.setBounds(
    0,
    0,
    runtime.mapSize.width,
    runtime.mapSize.height,
  );
  scene.cameras.main.setZoom(
    scene.cameras.main.height / runtime.mapSize.height,
  );
  if (runtime.player) {
    scene.cameras.main.startFollow(runtime.player);
  }
}

function createBackground(scene, mapSize) {
  const sliceHeight = mapSize.height / 4;

  createBgRow(scene, 0, "bg_layer1", -4, mapSize.width, sliceHeight);
  createBgRow(scene, sliceHeight, "bg_layer2", -3, mapSize.width, sliceHeight);
  createBgRow(
    scene,
    sliceHeight * 2,
    "bg_layer3",
    -2,
    mapSize.width,
    sliceHeight,
  );
  createBgRow(
    scene,
    sliceHeight * 3,
    "bg_layer4",
    -1,
    mapSize.width,
    sliceHeight,
  );
}

function completeLevel(scene, runtime) {
  if (runtime.state.isLevelComplete) return;
  runtime.state.isLevelComplete = true;

  freezePlayerBody(runtime);

  const doorId = runtime.registry.view([CT.Door])[0];
  const doorPosition = runtime.registry.getComponent(doorId, CT.Transform);
  if (!runtime.player || !doorPosition) return;

  scene.tweens.add({
    targets: runtime.player,
    x: doorPosition.x,
    duration: 400,
    ease: "Quad.easeInOut",
    onComplete: () => {
      scene.tweens.add({
        targets: runtime.player,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        ease: "Quad.easeIn",
        onComplete: () => {
          scene.cameras.main.flash(500, 255, 255, 255);
          scene.time.delayedCall(400, () => {
            runtime.callbacks.onLevelCompleted?.();
          });
        },
      });
    },
  });
}

function freezePlayerBody(runtime) {
  const body = getPlayerBody(runtime);
  if (!body) return;

  Matter.Body.setStatic(body, true);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
}

function getPlayerBody(runtime) {
  return runtime.registry.getComponent(runtime.playerEntity, CT.Physics)?.body;
}
