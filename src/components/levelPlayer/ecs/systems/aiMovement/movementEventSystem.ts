import type * as Matter from "matter-js";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { GameEvent } from "../../eventQueue";
import { JUMP_VY } from "../../resources/physicsConfig";
import { setVelocityY } from "../../matter/matterUtils";
import {
  reverseHorizontalMotion,
  setHorizontalMotionDirection,
} from "./horizontalTurnSystem";

export function movementEventSystem(
  registry: Registry,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "HorizontalMotionReverseRequested":
        reverseHorizontalMotionForEntity(registry, event.entity);
        break;
      case "HorizontalMotionDirectionRequested":
        setHorizontalMotionDirectionForEntity(
          registry,
          event.entity,
          event.direction,
        );
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

function setHorizontalMotionDirectionForEntity(
  registry: Registry,
  entity: number,
  direction: -1 | 1,
): void {
  const motion = registry.getComponent(entity, CT.HorizontalMotion);
  if (!motion?.active) return;

  const walker = registry.getComponent(entity, CT.HorizontalWalker);
  setHorizontalMotionDirection(motion, direction, walker);
}

function bouncePlayerForEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent(entity, CT.Physics);
  const player = registry.getComponent(entity, CT.Player);
  const body = physics?.body as Matter.Body | undefined;
  if (!body) return;

  if (player?.jumpKeyWasDown) {
    setVelocityY(body, JUMP_VY * 1.0)
  } else {
    setVelocityY(body, JUMP_VY * 0.6);
  }
}
