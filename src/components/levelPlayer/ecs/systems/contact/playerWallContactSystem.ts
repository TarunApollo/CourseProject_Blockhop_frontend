import Matter from "matter-js";
import {
  getActiveCollisionPairs,
  getOtherBodyInPair,
  isSemisolidBody,
} from "../../matter/matterUtils";
import { getPhysicsBody } from "../../matter/matterAdapter";
import {
  HORIZONTAL_DIRECTION,
  type ActiveHorizontalDirection,
} from "../../components/ComponentEnum";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

const NON_WALL_CONTACT_LABELS = new Set([
  "player",
  "enemy",
  "shell",
  "coin",
]);

// wall jump margin for player when its close to a wall
const WALL_CONTACT_MARGIN = 10;

export function playerWallContactSystem(
  registry: Registry,
  engine: Matter.Engine,
  playerEntity: number,
): void {
  const contact = registry.getComponent(playerEntity, CT.PlayerContact);
  const playerBody = getPhysicsBody(registry, playerEntity);
  if (!contact || !playerBody) return;

  let touchingLeftWall = false;
  let touchingRightWall = false;

  for (const pair of getActiveCollisionPairs(engine)) {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    if (!otherBody) continue;

    const bodyCanBeWall = isWallContactCandidate(otherBody);
    if (!bodyCanBeWall) continue;

    const direction = getWallDirection(playerBody, otherBody, pair);
    const touchesLeftWall = direction === HORIZONTAL_DIRECTION.LEFT;
    const touchesRightWall = direction === HORIZONTAL_DIRECTION.RIGHT;

    if (touchesLeftWall) touchingLeftWall = true;
    if (touchesRightWall) touchingRightWall = true;
  }

  // matter contact -> side check
  if (!touchingLeftWall) {
    touchingLeftWall = hasWallNearSide(
      playerBody,
      engine.world.bodies,
      HORIZONTAL_DIRECTION.LEFT,
    );
  }

  if (!touchingRightWall) {
    touchingRightWall = hasWallNearSide(
      playerBody,
      engine.world.bodies,
      HORIZONTAL_DIRECTION.RIGHT,
    );
  }

  const isTouchingNoWallOrBothWalls = touchingLeftWall === touchingRightWall;
  contact.wallContactDirection =
    isTouchingNoWallOrBothWalls
      ? HORIZONTAL_DIRECTION.NONE
      : touchingLeftWall
        ? HORIZONTAL_DIRECTION.LEFT
        : HORIZONTAL_DIRECTION.RIGHT;
}

function isWallContactCandidate(body: Matter.Body): boolean {
  const bodyIsSensor = body.isSensor;
  const bodyIsSemisolid = isSemisolidBody(body);
  const bodyIsNonWallLabel = NON_WALL_CONTACT_LABELS.has(body.label);

  return !bodyIsSensor && !bodyIsSemisolid && !bodyIsNonWallLabel;
}

/**
 * checks if a wall is close to one side of the player
 */
function hasWallNearSide(
  playerBody: Matter.Body,
  bodies: Matter.Body[],
  direction: ActiveHorizontalDirection,
): boolean {
  // cast one short line to catch walls that are close to the player 
  const rayEndX =
    direction === HORIZONTAL_DIRECTION.LEFT
      ? playerBody.bounds.min.x - WALL_CONTACT_MARGIN
      : playerBody.bounds.max.x + WALL_CONTACT_MARGIN;

  return Matter.Query.ray(
    bodies,
    playerBody.position,
    { x: rayEndX, y: playerBody.position.y },
  ).some((collision) => {
    const body = collision.bodyA;
    return body !== playerBody && isWallContactCandidate(body);
  });
}

function getWallDirection(
  playerBody: Matter.Body,
  wallBody: Matter.Body,
  pair: Matter.Pair,
): ActiveHorizontalDirection | typeof HORIZONTAL_DIRECTION.NONE {
  const normal = pair.collision.normal;
  const contactIsHorizontal = Math.abs(normal.x) > Math.abs(normal.y);
  if (!contactIsHorizontal) return HORIZONTAL_DIRECTION.NONE;

  const wallIsLeftOfPlayer = wallBody.position.x < playerBody.position.x;
  return wallIsLeftOfPlayer
    ? HORIZONTAL_DIRECTION.LEFT
    : HORIZONTAL_DIRECTION.RIGHT;
}
