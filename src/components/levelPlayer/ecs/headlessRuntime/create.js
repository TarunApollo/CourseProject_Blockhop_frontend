import * as Matter from "matter-js";
import { spawnEntity } from "../entities/spawnEntity.js";
import {
  CATEGORY_DEFAULT,
  CATEGORY_ENEMY,
  CATEGORY_SEMISOLID,
  GRAVITY,
} from "../resources/physicsConfig.js";
import {
  applyCollisionMask,
  createMatterBodyForEntity,
} from "../adapter/matterAdapter.js";
import { ComponentTypes as CT } from "../core/ComponentTypes.js";
import { Registry } from "../core/Registry.js";
import { EventQueue } from "../eventQueue.js";
import { createLevelStateResourceFromMapProperties } from "../resources/levelState.js";
import { Scheduler } from "../resources/scheduler.js";
import { doorStateSystem } from "../systems/doorStateSystem.js";
import { levelStateSystem } from "../systems/levelStateSystem.js";
import { setupCollisionRouterSystem } from "../systems/collision/collisionRouterSystem.js";

const DEFAULT_SPAWN = { x: 200, y: 200 };

// Runtime means ECS + Matter
export function createHeadlessLevelRuntime(levelData) {
  const registry = new Registry();
  const events = new EventQueue();
  const scheduler = new Scheduler();
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: GRAVITY },
  });
  const world = engine.world;
  const levelState = createLevelStateResourceFromMapProperties(
    levelData.properties,
  );

  createTileMatterBodies(world, levelData.solidTiles);
  createWorldBounds(world, levelData.mapSize);

  const runtime = {
    registry,
    events,
    scheduler,
    engine,
    world,
    mapSize: levelData.mapSize,
    levelState,
    playerEntity: undefined,
  };

  spawnLevelEntities(runtime, levelData.entities);
  levelStateSystem(levelState, []);
  doorStateSystem(registry, levelState);

  spawnRuntimePlayer(runtime);
  setupCollisionRouterSystem(runtime);

  return runtime;
}

function createTileMatterBodies(world, solidTiles = []) {
  solidTiles.forEach((tile) => {
    const body = Matter.Bodies.rectangle(
      tile.x,
      tile.y,
      tile.width,
      tile.height,
      {
        isStatic: true,
        label: tile.label,
      },
    );

    applyTileCollisionFilter(body, tile.label);
    Matter.World.add(world, body);
  });
}

/**
 * assign collision category for tiles
 */
function applyTileCollisionFilter(body, label) {
  body.collisionFilter.category =
    label === "Semisolid" ? CATEGORY_SEMISOLID : CATEGORY_DEFAULT;
  applyCollisionMask(body, 0xffff);
}

function createWorldBounds(world, mapSize) {
  const wallThickness = 64;
  const wallHeight = mapSize.height + 200;
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
    mapSize.width + wallThickness / 2,
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

  Matter.World.add(world, [leftWall, rightWall]);
}

function spawnLevelEntities(runtime, entities = []) {
  entities.forEach((entityData) => {
    const entity = spawnEntity(
      runtime.registry,
      entityData.type,
      entityData.x,
      entityData.y,
      entityData.frame,
    );
    if (entity === -1) return;

    createMatterBodyForEntity(runtime.world, runtime.registry, entity);
  });
}

function spawnRuntimePlayer(runtime) {
  const spawn = findPlayerSpawn(runtime);
  runtime.playerEntity = spawnEntity(
    runtime.registry,
    "Player",
    spawn.x,
    spawn.y,
  );
  if (runtime.playerEntity === -1) {
    throw new Error("Failed to spawn player entity");
  }

  createMatterBodyForEntity(
    runtime.world,
    runtime.registry,
    runtime.playerEntity,
  );
}

function findPlayerSpawn(runtime) {
  const startFlags = runtime.registry.view([CT.StartFlag, CT.Transform]);
  const startFlag = startFlags[0];
  if (startFlag === undefined) return DEFAULT_SPAWN;

  const transform = runtime.registry.getComponent(startFlag, CT.Transform);
  return transform ?? DEFAULT_SPAWN;
}
