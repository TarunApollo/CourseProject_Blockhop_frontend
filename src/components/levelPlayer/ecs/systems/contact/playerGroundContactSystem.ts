import type * as Matter from "matter-js";
import {
  getActiveCollisionPairs,
  getOtherBodyInPair,
  hasBodyAtPoint,
  isSemisolidBody,
} from "../../matter/matterUtils";
import { getPhysicsBody } from "../../matter/matterAdapter";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

const NON_GROUND_CONTACT_LABELS = new Set([
  "player",
  "enemy",
  "coin",
]);

/**
 * update whether player is on ground per tick
 */
export function playerGroundContactSystem(
  registry: Registry,
  engine: Matter.Engine,
  playerEntity: number,
  groundBodies: Matter.Body[] = [],
): void {
  const contact = registry.getComponent(playerEntity, CT.PlayerContact);
  const playerBody = getPhysicsBody(registry, playerEntity);
  if (!contact || !playerBody) return;

  if (contact.forceGroundState !== null) {
    contact.isOnGround = contact.forceGroundState;
    return;
  }

  const hasMatterGroundContact = getActiveCollisionPairs(engine).some((pair) => {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    if (!otherBody) return false;

    return (
      isGroundContactCandidate(registry, otherBody) &&
      isGroundContact(playerBody, otherBody, pair)
    );
  });

  contact.isOnGround =
    hasMatterGroundContact || hasGroundUnderPlayerFeet(playerBody, groundBodies);
}

/**
 * check whether the contact body can be a ground
 */
function isGroundContactCandidate(
  registry: Registry,
  body: Matter.Body,
): boolean {
  if (body.isSensor || isSemisolidBody(body)) return false;
  if (body.label === "shell") return isRestingShellBody(registry, body);
  return !NON_GROUND_CONTACT_LABELS.has(body.label);
}


function isRestingShellBody(registry: Registry, body: Matter.Body): boolean {
  const entity = registry.getEntityByBodyId(body.id);
  if (entity === undefined) return false;

  const shell = registry.getComponent(entity, CT.Shell);
  const motion = registry.getComponent(entity, CT.HorizontalMotion);
  if (!shell || !motion) return false;

  return !motion.active;
}


function isGroundContact(
  playerBody: Matter.Body,
  groundBody: Matter.Body,
  pair: Matter.Pair,
): boolean {
  const normal = pair.collision.normal;
  const contactIsVertical = Math.abs(normal.y) > Math.abs(normal.x);
  const groundIsBelowPlayer = groundBody.position.y > playerBody.position.y;

  return contactIsVertical && groundIsBelowPlayer;
}

/**
 * checks if the player still has ground under one foot
 */
function hasGroundUnderPlayerFeet(
  playerBody: Matter.Body,
  groundBodies: Matter.Body[],
): boolean {
  // check below both feet so one or the other foot can still hold the player up
  const footY = playerBody.bounds.max.y + 4;
  const leftFootX = playerBody.bounds.min.x + 12;
  const rightFootX = playerBody.bounds.max.x - 12;

  return (
    hasBodyAtPoint(groundBodies, { x: leftFootX, y: footY }) ||
    hasBodyAtPoint(groundBodies, { x: rightFootX, y: footY })
  );
}
