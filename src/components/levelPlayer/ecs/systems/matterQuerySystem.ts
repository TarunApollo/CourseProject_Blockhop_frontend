import Matter from "matter-js";

const NON_MOVEMENT_BLOCKING_LABELS = new Set(["player", "enemy", "shell", "coin"]);


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
  map: { heightInPixels: number },
): boolean {
  return body.bounds.max.x < 0 || isBodyBelowY(body, map.heightInPixels);
}
