import * as Comp from "../ecs/components";
import { CT } from "../ecs/core/ComponentTypes";
import type { Registry } from "../ecs/core/Registry";
import {
  getGameObject,
  removeGameObject,
  setGameObject,
  type PhaserRenderContext,
} from "./phaserAdapter";
import {
  DOOR_TOP_OFFSET,
  PLAYER_ORIGIN_Y,
  PLAYER_RENDER_SIZE,
  SHELL_ORIGIN_Y,
  SNAIL_ORIGIN_Y,
  SLIME_ORIGIN_Y,
  SMALL_PLAYER_RENDER_SIZE,
} from "./phaserConstants";

const PLAYER_DEPTH = Number.MAX_SAFE_INTEGER - 1;
const CARRIED_SHELL_DEPTH = Number.MAX_SAFE_INTEGER;
const DOOR_FRAME_CLOSED = "door_closed";
const DOOR_FRAME_CLOSED_TOP = "door_closed_top";
const DOOR_FRAME_OPEN = "door_open";
const DOOR_FRAME_OPEN_TOP = "door_open_top";
let debugBodiesVisible = false;

export function setDebugBodiesVisible(visible: boolean): void {
  debugBodiesVisible = visible;
}

export function renderSystem(
  context: PhaserRenderContext,
  registry: Registry,
): void {
  removeDeadGameObjects(context, registry);

  const entities = registry.view([CT.Transform, CT.Sprite]);

  for (const entity of entities) {
    const transform = registry.getComponent(entity, CT.Transform);
    let gameObject = getGameObject(context, entity);

    if (!gameObject) {
      gameObject = createSpriteForEntity(
        context,
        registry,
        entity,
      );
    }
    if (!gameObject) continue;

    if (!transform) continue;
    gameObject.x = transform.x;
    gameObject.y = transform.y;
    gameObject.rotation = transform.rotation;

    if (registry.hasComponent(entity, CT.Player)) {
      renderPlayerSize(registry, entity, gameObject);
    }

    if (registry.hasComponent(entity, CT.Snail)) {
      gameObject.setOrigin(0.5, SNAIL_ORIGIN_Y);
    }

    if (registry.hasComponent(entity, CT.Slime)) {
      gameObject.setOrigin(0.5, SLIME_ORIGIN_Y);
    }

    if (registry.hasComponent(entity, CT.Shell)) {
      gameObject.setOrigin(0.5, SHELL_ORIGIN_Y);
    }

    if (registry.hasComponent(entity, CT.Door)) {
      renderDoor(context, registry, entity, transform);
    }
  }

  applyCarrierDepth(context, registry);
  if (debugBodiesVisible) {
    debugDrawBodies(context, registry);
  } else {
    context.debugGraphics?.clear();
  }
}

function applyCarrierDepth(
  context: PhaserRenderContext,
  registry: Registry,
): void {
  for (const entity of registry.view([CT.Carrier])) {
    const heldEntity = registry.getComponent(
      entity,
      CT.Carrier,
    )?.heldEntity;
    if (heldEntity == null) continue;
    getGameObject(context, heldEntity)?.setDepth(CARRIED_SHELL_DEPTH);
  }
}

function removeDeadGameObjects(
  context: PhaserRenderContext,
  registry: Registry,
): void {
  for (const entity of context.gameObjects.keys()) {
    if (!registry.hasComponent(entity, CT.Sprite)) {
      removeGameObject(context, entity);
    }
  }
}

function createSpriteForEntity(
  context: PhaserRenderContext,
  registry: Registry,
  entity: number,
): Phaser.GameObjects.Sprite | undefined {
  const sprite = registry.getComponent(entity, CT.Sprite);
  const transform = registry.getComponent(entity, CT.Transform);
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
  if (sprite.originX !== undefined && sprite.originY !== undefined) {
    phaserSprite.setOrigin(sprite.originX, sprite.originY);
  }

  if (registry.hasComponent(entity, CT.Player)) {
    phaserSprite.setDepth(PLAYER_DEPTH);
  }

  setGameObject(context, entity, phaserSprite);

  return phaserSprite;
}

function renderPlayerSize(
  registry: Registry,
  entity: number,
  sprite: Phaser.GameObjects.Sprite,
): void {
  const playerLife = registry.getComponent(entity, CT.PlayerLife);
  const size = playerLife?.isSmall ? SMALL_PLAYER_RENDER_SIZE : PLAYER_RENDER_SIZE;
  sprite.setDisplaySize(size, size);
  sprite.setOrigin(0.5, PLAYER_ORIGIN_Y);
}

function renderDoor(
  context: PhaserRenderContext,
  registry: Registry,
  entity: number,
  transform: Comp.Transform,
): void {
  const door = registry.getComponent(entity, CT.Door);
  const bottomSprite = getGameObject(context, entity);
  if (!door || !bottomSprite) return;

  const bottomFrame = door.isOpen ? DOOR_FRAME_OPEN : DOOR_FRAME_CLOSED;
  const topFrame = door.isOpen ? DOOR_FRAME_OPEN_TOP : DOOR_FRAME_CLOSED_TOP;
  bottomSprite.setFrame(bottomFrame);

  let topSprite = context.doorTop;
  if (!topSprite) {
    topSprite = context.scene.add.image(
      transform.x,
      // LEAVE IT LIKE THIS
      transform.y - DOOR_TOP_OFFSET + 1,
      "tiles.default",
    );
    topSprite.setDisplaySize(128, 128);
    context.doorTop = topSprite;
  }

  topSprite.x = transform.x;
  // LEAVE IT LIKE THIS
  topSprite.y = transform.y - DOOR_TOP_OFFSET + 1;
  topSprite.rotation = transform.rotation;
  if (topSprite.frame.name !== topFrame.toString()) {
    topSprite.setFrame(topFrame);
  }
}

function debugDrawBodies(context: PhaserRenderContext, registry: Registry) {
  if (!context.debugGraphics) {
    context.debugGraphics = context.scene.add.graphics();
    context.debugGraphics.setDepth(9999);
  }
  const g = context.debugGraphics;
  g.clear();
  g.lineStyle(2, 0xff0000, 1);
  for (const entity of registry.view([CT.Physics])) {
    const phys = registry.getComponent(entity, CT.Physics);
    if (phys && phys.body && phys.body.vertices && phys.body.vertices.length > 0) {
      g.beginPath();
      const vertices = phys.body.vertices;
      g.moveTo(vertices[0]!.x, vertices[0]!.y);
      for (let i = 1; i < vertices.length; i++) {
        g.lineTo(vertices[i]!.x, vertices[i]!.y);
      }
      g.closePath();
      g.strokePath();
    }
  }
}
