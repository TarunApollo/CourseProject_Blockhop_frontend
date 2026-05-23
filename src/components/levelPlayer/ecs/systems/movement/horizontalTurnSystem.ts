import Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { CT } from "../../core/ComponentTypes";
import * as Comp from "../../components";
import { hasBodyAtPoint } from "../../adapter/matterQueryUtils";
import { isHorizontalVelocityBlocked } from "./movementUtils";

export function horizontalTurnSystem(
  registry: Registry,
  groundBodies: Matter.Body[],
): void {
  updateHorizontalTurns(registry, groundBodies);
}

function updateHorizontalTurns(
  registry: Registry,
  groundBodies: Matter.Body[],
): void {
  const entities = registry.view([
    CT.HorizontalMotion,
    CT.Physics,
  ]);

  for (const entity of entities) {
    const motion = registry.getComponent(
      entity,
      CT.HorizontalMotion,
    );
    const walker = registry.getComponent(
      entity,
      CT.HorizontalWalker,
    );
    const flyer = registry.getComponent(
      entity,
      CT.HorizontalFlyer,
    );
    const physics = registry.getComponent(entity, CT.Physics);
    const body = physics?.body;
    if (!motion || !physics || !body) continue;

    if (!motion.active) continue;

    // dispatch to walker logic if component is walker
    if (walker) {
      updateWalkerTurn(body, physics, motion, walker, groundBodies);
      continue;
    }

    // dispatch to flyer logic if component is flyer
    if (flyer) {
      updateFlyerTurn(body, physics, motion, groundBodies);
    }
  }
}

/**
 * helper for walker turn logic
 */
function updateWalkerTurn(
  body: Matter.Body,
  physics: Comp.Physics,
  motion: Comp.HorizontalMotion,
  walker: Comp.HorizontalWalker,
  groundBodies: Matter.Body[],
): void {
  // if turnAtLegde(e.g snail) ,then reverse direction
  if (
    walker.turnAtLedge &&
    isLedgeAhead(body, physics, motion, groundBodies)
  ) {
    reverseHorizontalMotion(motion, walker);
    return;
  }

  // skip the velcheck in reverse frame
  if (walker.skipVelCheck) {
    walker.skipVelCheck = false;
    return;
  }

  // always reverse when wall
  if (isAtWall(body, physics, motion, groundBodies)) {
    reverseHorizontalMotion(motion, walker);
  }
}

/**
 * if meet Wall then reverse direction for fiyer
 */
function updateFlyerTurn(
  body: Matter.Body,
  physics: Comp.Physics,
  motion: Comp.HorizontalMotion,
  groundBodies: Matter.Body[],
): void {
  if (isAtWall(body, physics, motion, groundBodies)) {
    reverseHorizontalMotion(motion);
  }
}

/**
 * helper to check whether there is ledge in front
 */
function isLedgeAhead(
  body: Matter.Body,
  physics: Comp.Physics,
  motion: Comp.HorizontalMotion,
  groundBodies: Matter.Body[],
): boolean {
  const checkX = body.position.x + motion.direction * (physics.width * 0.5 + 4);
  const checkY = body.position.y + physics.height * 0.5 + 8;
  const ledgeAhead = !hasBodyAtPoint(groundBodies, { x: checkX, y: checkY });

  return ledgeAhead;
}

/**
 * velocity heuristic + query to check whether at wall
 */
function isAtWall(
  body: Matter.Body,
  physics: Comp.Physics,
  motion: Comp.HorizontalMotion,
  groundBodies: Matter.Body[],
): boolean {
  const velocityBlocked = isHorizontalVelocityBlocked(body, motion);
  const aheadX = body.position.x + motion.direction * (physics.width * 0.5 + 4);
  const bodyAhead = hasBodyAtPoint(groundBodies, {
    x: aheadX,
    y: body.position.y,
  });

  return bodyAhead && velocityBlocked;
}

export function reverseHorizontalMotion(
  motion: Comp.HorizontalMotion,
  walker?: Comp.HorizontalWalker,
): void {
  motion.direction *= -1;
  if (walker) walker.skipVelCheck = true;
}
