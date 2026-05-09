import Matter from "matter-js";
import Phaser from "phaser";
import { spawnEntity } from "../EntityFactory";
import type { Registry } from "../core/Registry";
import { createMatterBodyForEntity } from "./matterAdapter";
import { createViewForEntity } from "./phaserAdapter";




/**
 * spawn method for headless 
 */
export function spawnHeadlessEntity(
  registry: Registry,
  world: Matter.World,
  type: string,
  x: number,
  y: number,
  frame?: number,
): number {
  const entity = spawnEntity(registry, type, x, y, frame);
  if (entity === -1) return -1;

  createMatterBodyForEntity(world, registry, entity);

  return entity;
}

/**
 * spawn method for browswer
 */
export function spawnPhaserEntity(
  scene: Phaser.Scene,
  registry: Registry,
  type: string,
  x: number,
  y: number,
  frame?: number,
): number {
  const entity = spawnHeadlessEntity(
    registry,
    getPhaserMatterWorld(scene),
    type,
    x,
    y,
    frame,
  );

  if (entity === -1) return -1;

  createViewForEntity(scene, registry, entity);

  return entity;
}

function getPhaserMatterWorld(scene: Phaser.Scene): Matter.World {
  return scene.matter.world.localWorld as unknown as Matter.World;
}
