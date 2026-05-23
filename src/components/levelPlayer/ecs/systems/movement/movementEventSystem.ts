import type * as Matter from "matter-js";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { GameEvent } from "../../eventQueue";
import { JUMP_VY } from "../../resources/physicsConfig";
import { setVelocityY } from "./movementUtils";
import { reverseHorizontalMotion } from "./horizontalTurnSystem";

export function movementEventSystem(
  registry: Registry,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "HorizontalMotionReverseRequested":
        reverseHorizontalMotionForEntity(registry, event.entity);
        break;
      case "PlayerBounceRequested":
        bouncePlayerForEntity(registry, event.entity);
        break;
    }
  }
}

/**
 * encapslated helper for event
 */

function reverseHorizontalMotionForEntity(
  registry: Registry,
  entity: number,
): void {
  const motion = registry.getComponent(entity, CT.HorizontalMotion);
  if (!motion) return;

  const walker = registry.getComponent(entity, CT.HorizontalWalker);
  reverseHorizontalMotion(motion, walker);
}

function bouncePlayerForEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent(entity, CT.Physics);
  const body = physics?.body as Matter.Body | undefined;
  if (!body) return;

  setVelocityY(body, JUMP_VY * 0.6);
}
