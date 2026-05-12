import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";

type RenderableGameObject = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform;

type PhysicsBodyView = {
  position: { x: number; y: number };
  angle: number;
};

export type PhaserRenderContext = {
  scene: Phaser.Scene;
  gameObjects: Map<number, Phaser.GameObjects.GameObject>;
  doorTops: Map<number, Phaser.GameObjects.Image>;
};

export function createPhaserRenderContext(
  scene: Phaser.Scene,
): PhaserRenderContext {
  return {
    scene,
    gameObjects: new Map(),
    doorTops: new Map(),
  };
}

/**
 * Creates the Phaser sprite used to render an entity.
 */
export function createSpriteForEntity(
  context: PhaserRenderContext,
  registry: Registry,
  entity: number,
): Phaser.GameObjects.Sprite | undefined {
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  const transform = registry.getComponent<Comp.Transform>(entity, CT.Transform);
  if (!transform || !sprite) return undefined;

  const phaserSprite = context.scene.add.sprite(
    transform.x,
    transform.y,
    sprite.key,
    sprite.frame,
  );

  if (sprite.width !== undefined && sprite.height !== undefined) {
    phaserSprite.setDisplaySize(sprite.width, sprite.height);
  }

  if (registry.hasComponent(entity, CT.Player)) {
    phaserSprite.setDepth(Number.MAX_SAFE_INTEGER);
  }

  setGameObject(context, entity, phaserSprite);

  return phaserSprite;
}

export function getGameObject(
  context: PhaserRenderContext,
  entity: number,
): Phaser.GameObjects.GameObject | undefined {
  return context.gameObjects.get(entity);
}

export function setGameObject(
  context: PhaserRenderContext,
  entity: number,
  gameObject: Phaser.GameObjects.GameObject,
): void {
  context.gameObjects.set(entity, gameObject);
}

export function removeGameObject(
  context: PhaserRenderContext,
  entity: number,
): void {
  context.gameObjects.get(entity)?.destroy();
  context.gameObjects.delete(entity);
  context.doorTops.get(entity)?.destroy();
  context.doorTops.delete(entity);
}

export function renderSystem(
  context: PhaserRenderContext,
  registry: Registry,
): void {
  registry.forEach([CT.Transform, CT.Sprite], (entity, transformRaw) => {
    let gameObject = getGameObject(context, entity) as
      | RenderableGameObject
      | undefined;

    if (!gameObject) {
      gameObject = createSpriteForEntity(context, registry, entity) as
        | RenderableGameObject
        | undefined;
    }
    if (!gameObject) return;

    const transform = transformRaw as Comp.Transform;
    gameObject.x = transform.x;
    gameObject.y = transform.y;
    gameObject.rotation = transform.rotation;
  });
}

export function ensureDoorTopSprite(
  context: PhaserRenderContext,
  registry: Registry,
  entity: number,
  frame: number,
): Phaser.GameObjects.Image | undefined {
  const existing = context.doorTops.get(entity);
  if (existing) return existing;

  const transform = registry.getComponent<Comp.Transform>(entity, CT.Transform);
  if (!transform) return undefined;

  const topSprite = context.scene.add.image(
    transform.x,
    transform.y - 128,
    "tiles",
    frame,
  );
  context.doorTops.set(entity, topSprite);
  return topSprite;
}

export function setDoorFrames(
  context: PhaserRenderContext,
  entity: number,
  bottomFrame?: number,
  topFrame?: number,
): void {
  const bottomSprite = getGameObject(context, entity) as
    | Phaser.GameObjects.Sprite
    | undefined;
  const topSprite = context.doorTops.get(entity);

  if (bottomSprite && bottomFrame !== undefined) {
    bottomSprite.setFrame(bottomFrame);
  }
  if (topSprite && topFrame !== undefined) {
    topSprite.setFrame(topFrame);
  }
}
