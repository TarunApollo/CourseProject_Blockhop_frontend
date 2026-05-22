import Matter from "matter-js";
import { CATEGORY_SEMISOLID } from "../resources/physicsConfig";

const NON_MOVEMENT_BLOCKING_LABELS = new Set([
  "player",
  "enemy",
  "shell",
  "coin",
]);

/**
 * checking the candidates that can block movement in matter.world
 * used by update.ts to send the candidates query list to
 * movementSystem
 */
export function getMovementBlockingBodies(world: Matter.World): Matter.Body[] {
  return Matter.Composite.allBodies(world).filter((body) => {
    if (body.isSensor) return false;
    return !NON_MOVEMENT_BLOCKING_LABELS.has(body.label);
  });
}

/**
 * check whether body is at a point
 */
export function hasBodyAtPoint(
  bodies: Matter.Body[],
  point: { x: number; y: number },
): boolean {
  return Matter.Query.point(bodies, point).length > 0;
}

/**
 * returns bodies at a point.
 */
export function bodiesAtPoint(
  bodies: Matter.Body[],
  point: { x: number; y: number },
): Matter.Body[] {
  return Matter.Query.point(bodies, point);
}

/**
 * checks whether a Matter body is a one-way semisolid platform.
 */
export function isSemisolidBody(body: Matter.Body): boolean {
  return (
    body.label === "Semisolid" ||
    (body.collisionFilter.category & CATEGORY_SEMISOLID) !== 0
  );
}

/**
 * returns half of the body's current Matter bounds width.
 */
export function getBodyBoundsHalfWidth(body: Matter.Body): number {
  return (body.bounds.max.x - body.bounds.min.x) * 0.5;
}

/**
 * returns half of the body's current Matter bounds height.
 */
export function getBodyBoundsHalfHeight(body: Matter.Body): number {
  return (body.bounds.max.y - body.bounds.min.y) * 0.5;
}

/**
 * check whether body is below y
 */
export function isBodyBelowY(body: Matter.Body, y: number): boolean {
  return body.bounds.min.y > y;
}

/**
 * check whether body has fully left the playable world
 */
export function isBodyOutOfWorld(
  body: Matter.Body,
  levelBottom: number,
  levelRight: number,
): boolean {
  return body.bounds.max.x < 0 || body.bounds.min.x > levelRight || isBodyBelowY(body, levelBottom);
}
