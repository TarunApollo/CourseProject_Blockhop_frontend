import Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import * as Comp from "../../components";
import type { GameEvent } from "../../eventQueue";

export function horizontalMovementEventSystem(
  registry: Registry,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "HorizontalWalkerReverseRequested":
        reverseWalkerForEntity(registry, event.entity);
        break;
    }
  }
}



export function horizontalMovementSystem(registry: Registry, groundBodies: any[]) {
  registry.forEach(
    [CT.HorizontalWalker, CT.Physics],
    (id, walkerRaw, physicsRaw) => {
      const walker = walkerRaw as Comp.HorizontalWalker;
      const physics = physicsRaw as Comp.Physics;

      const body = physics.body as Matter.Body | undefined;
      if (!body) return;

      //handle static shell
      if (!walker.active) {
        stopHorizontalWalker(body);
        return;
      }

      if (walker.turnAtLedge && isLedgeAhead(body, physics, walker, groundBodies)) {
        reverseWalker(walker);
      }

      else if (walker.skipVelCheck) {
        walker.skipVelCheck = false;
      }

      else if (isAtWall(body, physics, walker, groundBodies)) {
        reverseWalker(walker);
      }

      applyWalkerMovement(body, walker);
      syncWalkerRenderState(registry, id, walker);
    });
}

//Helper for hanlde movement
function isLedgeAhead(
  body: Matter.Body,
  physics: Comp.Physics,
  walker: Comp.HorizontalWalker,
  groundBodies: Matter.Body[],
): boolean {
  const checkX = body.position.x + walker.direction * (physics.width * 0.5 + 4);
  const checkY = body.position.y + physics.height * 0.5 + 8;
  const ledgeAhead = Matter.Query.point(groundBodies, { x: checkX, y: checkY }).length === 0;

  return ledgeAhead;
}


/**
 * velocity heuristic + query to check whether at wall
 */
function isAtWall(
  body: Matter.Body,
  physics: Comp.Physics,
  walker: Comp.HorizontalWalker,
  groundBodies: Matter.Body[],
): boolean {
  const vx = body.velocity.x;
  const velocityBlocked =
    (walker.direction > 0 && vx < walker.speed * 0.5) ||
    (walker.direction < 0 && vx > -walker.speed * 0.5);
  const aheadX = body.position.x + walker.direction * (physics.width * 0.5 + 4);
  const wallAhead =
    Matter.Query.point(groundBodies, { x: aheadX, y: body.position.y }).length > 0;
  return wallAhead && velocityBlocked;
}

/**
 * reverse dir and set skip velocity check
 */
function reverseWalker(walker: Comp.HorizontalWalker): void {
  walker.direction *= -1;
  walker.skipVelCheck = true;
}

function reverseWalkerForEntity(registry: Registry, entity: number): void {
  const walker = registry.getComponent<Comp.HorizontalWalker>(
    entity,
    CT.HorizontalWalker,
  );
  if (walker) reverseWalker(walker);
}

function syncWalkerRenderState(
  registry: Registry,
  entity: number,
  walker: Comp.HorizontalWalker,
): void {
  const animator = registry.getComponent<Comp.Animator>(entity, CT.Animator);
  if (animator) animator.flipX = walker.direction > 0;
}


function stopHorizontalWalker(body: Matter.Body): void {
  Matter.Body.setVelocity(body, { x: 0, y: body.velocity.y });
  lockRotation(body);
}

function lockRotation(body: Matter.Body): void {
  Matter.Body.setAngularVelocity(body, 0);
  Matter.Body.setAngle(body, 0);
}


function applyWalkerMovement(body: Matter.Body, walker: Comp.HorizontalWalker): void {
  {
    Matter.Body.setVelocity(body, {
      x: walker.speed * walker.direction,
      y: body.velocity.y,
    });
    lockRotation(body);
  }
}
