import * as Comp from "./components";
import { ComponentTypes as CT } from "./core/ComponentTypes";
import { Registry } from "./core/Registry";
import {
  CATEGORY_DEFAULT,
  CATEGORY_SEMISOLID,
  CATEGORY_ENEMY,
  CATEGORY_DOOR,
  CATEGORY_COIN,
} from "../mechanics/constants";

const coinBlueprint =
  (coinType: string, animKey: string) => (x: number, y: number) => [
    new Comp.Transform(x, y),
    new Comp.Coin(coinType),
    new Comp.Physics(
      128 * 0.6,
      128 * 0.6,
      "coin",
      CATEGORY_COIN,
      [CATEGORY_DEFAULT],
      true,
      true,
    ),
    new Comp.Sprite("tiles", "0", 128 * 0.8, 128 * 0.8),
    new Comp.Animator(animKey),
  ];

const BLUEPRINTS: Record<string, (x: number, y: number) => any[]> = {
  Enemy_Slime_Normal: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Slime(),
    new Comp.AIWalker(4),
    new Comp.Hazard(1, true, false),
    new Comp.Physics(128 * 0.64, 128 * 0.64, "enemy", CATEGORY_ENEMY, [
      CATEGORY_DEFAULT,
      CATEGORY_SEMISOLID,
      CATEGORY_ENEMY,
    ]),
    new Comp.Sprite("slime_normal", "slime_normal_walk_a", 102, 102),
    new Comp.Animator("slime_walk"),
  ],
  Enemy_Snail: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.AIWalker(2.5, -1, true),
    new Comp.Hazard(1, true, false),
    new Comp.Physics(128 * 0.64, 128 * 0.64, "enemy", CATEGORY_ENEMY, [
      CATEGORY_DEFAULT,
      CATEGORY_SEMISOLID,
      CATEGORY_ENEMY,
    ]),
    new Comp.Snail(),
    new Comp.Sprite("snail", "snail_walk_a", 102, 102),
    new Comp.Animator("snail_walk"),
  ],
  Decoration: (x: number, y: number) => [
    new Comp.Sprite("tiles", "0"),
    new Comp.Transform(x, y),
  ],
  Player: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.PlayerControl(),
    new Comp.Physics(70, 128, "player", CATEGORY_DEFAULT, [0xffff]),
    new Comp.Sprite("player", "p1_stand", 128, 128),
    new Comp.Animator("idle"),
  ],
  Start_Flag: (x: number, y: number) => [
    new Comp.Transform(x, y),
    new Comp.StartFlag(),
    new Comp.Sprite("tiles", "0"),
    new Comp.Animator("flag_spin"),
  ],
  /**
   * Door blueprint.
   * bounding box creation handled by {@link registerDoorHooks} since autoLinkSprite = false
   */
  Door_Closed: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Physics(
      128,
      256,
      "door",
      CATEGORY_DOOR,
      [CATEGORY_DEFAULT],
      true,
      true,
      true,
      false,
    ),
    new Comp.Sprite("tiles", "0"),
    new Comp.Door(),
  ],
  Box: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Sprite("tiles", "0"),
    new Comp.Physics(128, 128, "Box", 0xffff, [0xffff], true, false),
    new Comp.DestructibleBox(),
  ],
  BoxDouble: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Physics(128, 128, "BoxDouble", 0xffff, [0xffff], true, false),
    new Comp.Sprite("tiles", "0"),
    new Comp.DestructibleBox(),
  ],
  Item_Shell: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Shell(),
    new Comp.Physics(
      128 * 0.9,
      (128 * 0.9) / 2,
      "shell",
      CATEGORY_DEFAULT,
      [0xffff],
    ),
    new Comp.Sprite("tiles", "0", 128 * 0.9, 128 * 0.9),
  ],
  Item_Coin_Gold: coinBlueprint("Item_Coin_Gold", "coin_spin_gold"),
  Item_Coin_Silver: coinBlueprint("Item_Coin_Silver", "coin_spin_silver"),
  Item_Coin_Bronze: coinBlueprint("Item_Coin_Bronze", "coin_spin_bronze"),
};

/**
 * Creates an entity from a predefined blueprint and adds it to the registry.
 */
export function spawnEntity(
  scene: Phaser.Scene,
  registry: Registry,
  type: string,
  x: number,
  y: number,
  tileFrame?: number,
): number {
  const build = BLUEPRINTS[type];
  if (!build) return -1;

  const entity = registry.createEntity();
  build(x, y).forEach((comp) => {
    const bit = (comp.constructor as any).bit;
    if (bit) registry.addComponent(entity, bit, comp);
  });

  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  const door = registry.getComponent<Comp.Door>(entity, CT.Door);

  if (sprite) {
    if (tileFrame !== undefined && sprite.key === "tiles") {
      sprite.frame = tileFrame.toString();
    }

    if (physics && physics.autoLinkSprite) {
      const phaserSprite = scene.matter.add.sprite(
        x,
        y,
        sprite.key,
        sprite.frame,
      );
      phaserSprite.setRectangle(physics.width, physics.height, {
        label: physics.label,
        friction: 0,
        frictionStatic: 0,
        isSensor: physics.isSensor,
        isStatic: physics.isStatic,
      });
      if (physics.fixedRotation) phaserSprite.setFixedRotation();
      phaserSprite.setCollisionCategory(physics.category);
      phaserSprite.setCollidesWith(physics.collidesWith);

      physics.body = phaserSprite.body;
      sprite.gameObject = phaserSprite;
      registry.linkBody(entity,phaserSprite.body);
    } else {
      sprite.gameObject = scene.add.sprite(x, y, sprite.key, sprite.frame);

      if (door) {
        door.bottomSprite = sprite.gameObject;
      }
    }

    if (sprite.width !== undefined && sprite.height !== undefined) {
      sprite.gameObject.setDisplaySize(sprite.width, sprite.height);
    }
  }

  return entity;
}
