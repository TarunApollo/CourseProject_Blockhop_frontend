import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import Phaser from "phaser";


const gameObjects = new Map<number, any>();

/**
 * create view for entity by phaser
 */
export function createViewForEntity(
  scene: Phaser.Scene,
  registry: Registry,
  entity: number,
): void {
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  const door = registry.getComponent<Comp.Door>(entity, CT.Door);
  const transform = registry.getComponent<Comp.Transform>(entity, CT.Transform);
  if (!transform || !sprite) return;

  const view = scene.add.sprite(
    transform.x,
    transform.y,
    sprite.key,
    sprite.frame
  );

  if (sprite.width !== undefined && sprite.height !== undefined) {
    view.setDisplaySize(sprite.width, sprite.height);
  }

  setGameObject(entity, view);

  if (door) {
    door.bottomSprite = view;
  }
}


export function getGameObject(registry: Registry, entity: number): any {
  return gameObjects.get(entity);
}

export function setGameObject(entity: number, gameObject: any): void {
  gameObjects.set(entity, gameObject);
}

export function removeGameObject(entity: number): void {
  gameObjects.delete(entity);
}


