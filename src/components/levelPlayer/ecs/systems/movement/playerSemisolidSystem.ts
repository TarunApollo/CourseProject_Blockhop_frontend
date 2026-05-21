import type * as Matter from "matter-js";
import type { Registry } from "../../core/Registry";

type PlayerSemisolidContext = {
  registry: Registry;
  world: Matter.World;
  playerEntity: number;
};

/**
 * Placeholder for custom player/semisolid handling.
 */
export function playerSemisolidSystem(_context: PlayerSemisolidContext): void {}


export function isPlayerSupportedBySemisolid(
  _body: Matter.Body,
  _groundBodies: Matter.Body[],
): boolean {
  return false;
}
