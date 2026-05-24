import Matter from "matter-js";
import { getPhysicsBody } from "../../matter/matterAdapter";
import {
  getBodyBoundsHalfHeight,
  isSemisolidBody,
} from "../../matter/matterUtils";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

type PlayerSemisolidContext = {
  registry: Registry;
  world: Matter.World;
  playerEntity: number;
};

/**
 * if the player is supported by a semisolid set ground state = true
 * and put the player.y on the top of the semisolid and set velocity.y = 0
 * 
 */
export function playerSemisolidSystem(context: PlayerSemisolidContext): void {
  const contact = context.registry.getComponent(
    context.playerEntity,
    CT.PlayerContact,
  );
  const playerBody = getPhysicsBody(
    context.registry,
    context.playerEntity,
  );
  if (!contact || !playerBody) return;

  const supportingSemisolid = findSupportingSemisolidBody(
    playerBody,
    Matter.Composite.allBodies(context.world),
  );

  contact.forceGroundState = supportingSemisolid ? true : null;
  if (!supportingSemisolid) return;

  landPlayerOnSemisolid(playerBody, supportingSemisolid);
  contact.isOnGround = true;
}

export function isPlayerSupportedBySemisolid(
  body: Matter.Body,
  bodies: Matter.Body[],
): boolean {
  return findSupportingSemisolidBody(body, bodies) !== null;
}

function findSupportingSemisolidBody(
  playerBody: Matter.Body,
  bodies: Matter.Body[],
): Matter.Body | null {
  if (playerBody.velocity.y < 0) return null;

  let supportingBody: Matter.Body | null = null;
  for (const body of bodies) {
    if (!isSemisolidBody(body)) continue;
    if (!isSemisolidLandingCandidate(playerBody, body)) continue;

    if (
      !supportingBody ||
      body.bounds.min.y < supportingBody.bounds.min.y
    ) {
      supportingBody = body;
    }
  }

  return supportingBody;
}


function isSemisolidLandingCandidate(
  playerBody: Matter.Body,
  semisolidBody: Matter.Body,
): boolean {
  const playerFeetY = playerBody.bounds.max.y;
  const semisolidTopY = semisolidBody.bounds.min.y;

  const playerHorizontallyOverlapsSemisolid =
    playerBody.bounds.max.x > semisolidBody.bounds.min.x &&
    playerBody.bounds.min.x < semisolidBody.bounds.max.x;
  const playerReachedSemisolidTop = playerFeetY >= semisolidTopY;
  const playerCenterIsAboveSemisolidTop =
    playerBody.position.y < semisolidTopY;

  return (
    playerHorizontallyOverlapsSemisolid &&
    playerReachedSemisolidTop &&
    playerCenterIsAboveSemisolidTop
  );
}

function landPlayerOnSemisolid(
  playerBody: Matter.Body,
  semisolidBody: Matter.Body,
): void {
  const playerHalfHeight = getBodyBoundsHalfHeight(playerBody);
  Matter.Body.setPosition(playerBody, {
    x: playerBody.position.x,
    y: semisolidBody.bounds.min.y - playerHalfHeight,
  });
  Matter.Body.setVelocity(playerBody, {
    x: playerBody.velocity.x,
    y: 0,
  });
}
