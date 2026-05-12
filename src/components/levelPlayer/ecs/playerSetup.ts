import { ComponentTypes as CT } from "./core/ComponentTypes";
import { Registry } from "./core/Registry";
import * as Comp from "./components";
import { CATEGORY_DEFAULT } from "../mechanics/constants";

/**
 * Creates the player entity and data only.
 */
export function spawnPlayer(registry: Registry, x: number, y: number): number {
  const playerId = registry.createEntity();

  registry.addComponent(playerId, CT.Transform, new Comp.Transform(x, y));
  registry.addComponent(
    playerId,
    CT.Sprite,
    new Comp.Sprite("player", "p1_stand", 128, 128),
  );
  registry.addComponent(
    playerId,
    CT.Physics,
    new Comp.Physics(128 * 0.55, 128 - 8, "player", CATEGORY_DEFAULT, [0xffff]),
  );
  registry.addComponent(playerId, CT.Player, new Comp.PlayerControl());
  registry.addComponent(playerId, CT.Animator, new Comp.Animator("idle"));

  return playerId;
}
