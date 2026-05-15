import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import type * as Matter from "matter-js";
import { createMatterBodyForEntity } from "../adapter/matterAdapter";
import { BLUEPRINTS } from "./blueprints";

/**
 * blueprint -> entity and fix the tileFrame
 */
export function spawnEntity(
  registry: Registry,
  type: string,
  x: number,
  y: number,
  tileFrame?: number,
  content?: string,
): number {
  //find blueprint
  const build = BLUEPRINTS[type];
  if (!build) return -1;

  //create entity
  const entity = registry.createEntity();

  //load component for entity
  build(x, y).forEach((comp) => {
    const bit = (comp.constructor as any).bit;
    if (bit) registry.addComponent(entity, bit, comp);
  });

  //TODO:write real frame in blueprint to avoid write this part
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  if (sprite && tileFrame !== undefined && sprite.key === "tiles") {
    sprite.frame = tileFrame.toString();
  }

  const box = registry.getComponent<Comp.DestructibleBox>(
    entity,
    CT.DestructibleBox,
  );
  if (box && content) {
    box.content = content;
  }
  return entity;
}

export type SpawnHeadlessEntityOptions = {
  configure?: (entity: number) => void;
};

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
  content?: string,
  options: SpawnHeadlessEntityOptions = {},
): number {
  const entity = spawnEntity(registry, type, x, y, frame, content);
  if (entity === -1) return -1;

  options.configure?.(entity);

  createMatterBodyForEntity(world, registry, entity);

  return entity;
}
