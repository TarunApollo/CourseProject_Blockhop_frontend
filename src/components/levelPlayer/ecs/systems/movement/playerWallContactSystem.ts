import type * as Matter from "matter-js";
import { isSemisolidBody } from "../../adapter/matterQueryUtils";
import { getPhysicsBody } from "../../adapter/matterAdapter";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

type WallDirection = -1 | 1;

const NON_WALL_CONTACT_LABELS = new Set([
  "player",
  "enemy",
  "shell",
  "coin",
]);

export function playerWallContactSystem(
  registry: Registry,
  engine: Matter.Engine,
  playerEntity: number,
): void {
  const control = registry.getComponent(playerEntity, CT.Player);
  const playerBody = getPhysicsBody(registry, playerEntity);
  if (!control || !playerBody) return;

  let touchingLeftWall = false;
  let touchingRightWall = false;

  for (const pair of getActivePairs(engine)) {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    if (!otherBody || !isWallContactCandidate(otherBody)) continue;

    const direction = getWallDirection(playerBody, otherBody);
    if (direction === -1) touchingLeftWall = true;
    if (direction === 1) touchingRightWall = true;
  }

  control.wallContactDirection =
    touchingLeftWall === touchingRightWall
      ? 0
      : touchingLeftWall
        ? -1
        : 1;
}

function getActivePairs(engine: Matter.Engine): Matter.Pair[] {
  const pairs = engine.pairs as { list?: Matter.Pair[] };
  return (pairs.list ?? []).filter((pair) => pair.isActive);
}

function getOtherBodyInPair(
  pair: Matter.Pair,
  playerBody: Matter.Body,
): Matter.Body | null {
  const bodyA = getParentBody(pair.collision.parentA ?? pair.bodyA);
  const bodyB = getParentBody(pair.collision.parentB ?? pair.bodyB);

  if (bodyA === playerBody) return bodyB;
  if (bodyB === playerBody) return bodyA;
  return null;
}

function getParentBody(body: Matter.Body): Matter.Body {
  return body.parent ?? body;
}

function isWallContactCandidate(body: Matter.Body): boolean {
  if (body.isSensor || isSemisolidBody(body)) return false;
  return !NON_WALL_CONTACT_LABELS.has(body.label);
}

function getWallDirection(
  playerBody: Matter.Body,
  wallBody: Matter.Body,
): WallDirection | 0 {
  const verticalOverlap =
    Math.min(playerBody.bounds.max.y, wallBody.bounds.max.y) -
    Math.max(playerBody.bounds.min.y, wallBody.bounds.min.y);
  const horizontalOverlap =
    Math.min(playerBody.bounds.max.x, wallBody.bounds.max.x) -
    Math.max(playerBody.bounds.min.x, wallBody.bounds.min.x);

  if (verticalOverlap <= 0 || horizontalOverlap <= 0) return 0;
  if (verticalOverlap <= horizontalOverlap) return 0;

  return wallBody.position.x < playerBody.position.x ? -1 : 1;
}
