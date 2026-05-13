import * as Comp from "../components";
import {
  CATEGORY_DEFAULT,
  CATEGORY_SEMISOLID,
  CATEGORY_ENEMY,
  CATEGORY_DOOR,
  CATEGORY_COIN,
} from "../resources/physicsConfig";

const mask = (...categories: number[]): number =>
  categories.reduce((result, category) => result | category, 0);

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

export const BLUEPRINTS: Record<string, (x: number, y: number) => any[]> = {
  Enemy_Slime_Normal: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Slime(),
    new Comp.HorizontalWalker(4, -1, true, false),
    new Comp.Hazard(1, true, false, true),
    new Comp.Enemy(),
    new Comp.OutOfBounds("Enemy_Slime_Normal"),
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
    new Comp.HorizontalWalker(2.5, -1, true, true),
    new Comp.Hazard(1, true, false, true),
    new Comp.Enemy(),
    new Comp.OutOfBounds("Enemy_Snail"),
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
    new Comp.Physics(128 * 0.55, 128 - 8, "player", CATEGORY_DEFAULT, [0xffff]),
    new Comp.Sprite("player", "p1_stand", 128, 128),
    new Comp.Animator("idle"),
    new Comp.PlayerCollisionFilter(
      mask(
        CATEGORY_DEFAULT,
        CATEGORY_SEMISOLID,
        CATEGORY_ENEMY,
        CATEGORY_COIN,
        CATEGORY_DOOR,
      ),
      mask(CATEGORY_DEFAULT, CATEGORY_ENEMY, CATEGORY_COIN, CATEGORY_DOOR),
      0,
    ),
  ],
  Start_Flag: (x: number, y: number) => [
    new Comp.Transform(x, y),
    new Comp.StartFlag(),
    new Comp.Sprite("tiles", "0"),
    new Comp.Animator("flag_spin"),
  ],
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
  /**
   * this blueprint can be only used in runtime.
   * editor cannot place shell directly on the original map
   * it can be only spawned when snail go back to shell
   */
  Item_Shell: (x, y) => [
    new Comp.Transform(x, y),
    new Comp.Shell(),
    new Comp.HorizontalWalker(15, 0, false, false),
    new Comp.Hazard(1, true, true, false),
    new Comp.OutOfBounds("Enemy_Snail"),
    new Comp.Physics(
      128 * 0.9,
      (128 * 0.9) / 2,
      "shell",
      CATEGORY_DEFAULT,
      [0xffff],
    ),
    new Comp.Sprite("tiles", "Item_Shell", 128 * 0.9, 128 * 0.9),
  ],
  Item_Coin_Gold: coinBlueprint("Item_Coin_Gold", "coin_spin_gold"),
  Item_Coin_Silver: coinBlueprint("Item_Coin_Silver", "coin_spin_silver"),
  Item_Coin_Bronze: coinBlueprint("Item_Coin_Bronze", "coin_spin_bronze"),
};
