import * as Comp from "../ecs/components";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes";
import type { Registry } from "../ecs/core/Registry";
import type { TileMetadataResource } from "./tileMetadata";

export type PhaserRenderContext = {
  scene: Phaser.Scene;
  gameObjects: Map<number, Phaser.GameObjects.Sprite>;
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
  tileMetadata?: TileMetadataResource,
): Phaser.GameObjects.Sprite | undefined {
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  const transform = registry.getComponent<Comp.Transform>(entity, CT.Transform);
  if (!transform || !sprite) return undefined;

  const frame = resolveSpriteFrame(sprite, tileMetadata);
  const phaserSprite = context.scene.add.sprite(
    transform.x,
    transform.y,
    sprite.key,
    frame,
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
): Phaser.GameObjects.Sprite | undefined {
  return context.gameObjects.get(entity);
}

export function setGameObject(
  context: PhaserRenderContext,
  entity: number,
  gameObject: Phaser.GameObjects.Sprite,
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
  tileMetadata?: TileMetadataResource,
): void {
  registry.forEach([CT.Transform, CT.Sprite], (entity, transformRaw) => {
    let gameObject = getGameObject(context, entity);

    if (!gameObject) {
      gameObject = createSpriteForEntity(
        context,
        registry,
        entity,
        tileMetadata,
      );
    }
    if (!gameObject) return;

    const transform = transformRaw as Comp.Transform;
    gameObject.x = transform.x;
    gameObject.y = transform.y;
    gameObject.rotation = transform.rotation;

    if (tileMetadata && registry.hasComponent(entity, CT.Door)) {
      renderDoor(context, registry, tileMetadata, entity, transform);
    }
  });
}

function resolveSpriteFrame(
  sprite: Comp.Sprite,
  tileMetadata?: TileMetadataResource,
): string | number {
  if (sprite.key !== "tiles" || !tileMetadata) return sprite.frame;
  if (!Number.isNaN(Number(sprite.frame))) return sprite.frame;

  return tileMetadata.frameByType.get(sprite.frame) ?? sprite.frame;
}

function renderDoor(
  context: PhaserRenderContext,
  registry: Registry,
  tileMetadata: TileMetadataResource,
  entity: number,
  transform: Comp.Transform,
): void {
  const door = registry.getComponent<Comp.Door>(entity, CT.Door);
  const bottomSprite = getGameObject(context, entity);
  if (!door || !bottomSprite) return;

  const bottomFrame = tileMetadata.frameByType.get(
    door.isOpen ? "Door_Open" : "Door_Closed",
  );
  const topFrame = tileMetadata.frameByType.get(
    door.isOpen ? "Door_Open_Top" : "Door_Closed_Top",
  );

  if (bottomFrame !== undefined) {
    bottomSprite.setFrame(bottomFrame);
  }

  if (topFrame === undefined) return;

  let topSprite = context.doorTops.get(entity);
  if (!topSprite) {
    topSprite = context.scene.add.image(transform.x, transform.y - 128, "tiles");
    context.doorTops.set(entity, topSprite);
  }

  topSprite.x = transform.x;
  topSprite.y = transform.y - 128;
  topSprite.rotation = transform.rotation;
  if (topSprite.frame.name !== topFrame.toString()) {
    topSprite.setFrame(topFrame);
  }
}
