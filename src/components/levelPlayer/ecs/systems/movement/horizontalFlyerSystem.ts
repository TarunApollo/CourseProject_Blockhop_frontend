import Matter from "matter-js";
import { Registry } from "../../core/Registry";
import { CT } from "../../core/ComponentTypes";
import type { GameEvent } from "../../eventQueue";
import { lockRotation, setVelocityX, setVelocityY } from "./movementUtils";

export function horizontalFlyerEventSystem(
  registry: Registry,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "HorizontalFlyerReverseRequested":
        const flyer = registry.getComponent(event.entity, CT.HorizontalFlyer);
        if (flyer) flyer.direction *= -1;
        break;
    }
  }
}

export function horizontalFlyerSystem(registry: Registry): void {
  const entities = registry.view([CT.Bee, CT.HorizontalFlyer, CT.Physics]);

  for (const entity of entities) {
    const flyer = registry.getComponent(entity, CT.HorizontalFlyer)!;
    const physics = registry.getComponent(entity, CT.Physics);
    const body = physics?.body as Matter.Body | undefined;
    if (!body) continue;

    setVelocityX(body, flyer.speed * flyer.direction);
    setVelocityY(body, 0);
    lockRotation(body);

    const animator = registry.getComponent(entity, CT.Animator);
    if (animator) animator.flipX = flyer.direction > 0;
  }
}
