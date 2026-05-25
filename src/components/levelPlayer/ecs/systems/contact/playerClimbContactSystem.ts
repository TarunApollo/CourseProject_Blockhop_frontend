import type * as Matter from "matter-js";
import { getPhysicsBody } from "../../matter/matterAdapter";
import {
  getActiveCollisionPairs,
  getOtherBodyInPair,
} from "../../matter/matterUtils";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

/**
 * Updates whether the player is touching a climbable world sensor
 * 
 */
export function playerClimbContactSystem(
  registry: Registry,
  engine: Matter.Engine,
  playerEntity: number,
): void {
  const contact = registry.getComponent(playerEntity, CT.PlayerContact);
  const playerBody = getPhysicsBody(registry, playerEntity);
  if (!contact || !playerBody) return;

  contact.climbContactEntity = findClimbContactEntity(
    registry,
    engine,
    playerBody,
  );
}

function findClimbContactEntity(
  registry: Registry,
  engine: Matter.Engine,
  playerBody: Matter.Body,
): number | null {
  for (const pair of getActiveCollisionPairs(engine)) {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    if (!otherBody) continue;

    const otherEntity = registry.getEntityByBodyId(otherBody.id);
    if (otherEntity === undefined) continue;

    if (registry.hasComponent(otherEntity, CT.Climbable)) return otherEntity;
  }

  return null;
}
