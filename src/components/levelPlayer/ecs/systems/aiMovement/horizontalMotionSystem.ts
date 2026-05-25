import * as Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { CT } from "../../core/ComponentTypes";
import type * as Comp from "../../components";
import {
  lockRotation,
  setVelocityX,
  setVelocityY,
} from "../../matter/matterUtils";

export function horizontalMotionSystem(registry: Registry): void {
  const entities = registry.view([
    CT.HorizontalMotion,
    CT.Physics,
  ]);

  for (const entity of entities) {
    const motion = registry.getComponent(entity, CT.HorizontalMotion);
    const physics = registry.getComponent(entity, CT.Physics);
    const body = physics?.body as Matter.Body | undefined;
    if (!motion || !physics || !body) continue;

    const isFlyer = registry.hasComponent(entity, CT.HorizontalFlyer);
    updateHorizontalMotion(body, motion, {
      lockVerticalVelocity: isFlyer,
    });

    const animator = registry.getComponent(entity, CT.Animator);
    if (animator) animator.flipX = motion.direction > 0;
  }
}

/**
 * for flyer,lock the velocity y to avoid gravity
 */
function updateHorizontalMotion(
  body: Matter.Body,
  motion: Comp.HorizontalMotion,
  options: { lockVerticalVelocity: boolean },
): void {
  const velocityX = motion.active ? motion.speed * motion.direction : 0;
  setVelocityX(body, velocityX);

  if (options.lockVerticalVelocity) {
    setVelocityY(body, 0);
  }

  lockRotation(body);
}
