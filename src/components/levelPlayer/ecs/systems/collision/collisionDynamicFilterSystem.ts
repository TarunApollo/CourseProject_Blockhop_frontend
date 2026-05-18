import Matter from "matter-js";
import { applyCollisionMask } from "../../adapter/matterAdapter";
import { LifeState } from "../../components/ComponentEnum";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

export type CollisionFilterContext = {
  registry: Registry;
  playerEntity: number;
};

/**
 * dynamic filter -> update with the player's velocity with
 * semisolid
 */
export function collisionDynamicFilterSystem(
  context: CollisionFilterContext,
): void {
  updatePlayerCollisionMask(context);
}

/**
 * player can jump on semisolid withoutCollision
 * but when it on the semisolid it will trigger collision(semisolid
 * will become a ground)
 */
function updatePlayerCollisionMask(context: CollisionFilterContext): void {
  const physics = context.registry.getComponent(
    context.playerEntity,
    CT.Physics,
  );
  const body = physics?.body as Matter.Body | undefined;
  if (!body) return;

  const control = context.registry.getComponent(
    context.playerEntity,
    CT.Player,
  );
  const filter = context.registry.getComponent(
    context.playerEntity,
    CT.PlayerCollisionFilter,
  );
  if (!filter) return;

  const isDying = control?.lifeState === LifeState.DYING;
  const mask = isDying
    ? filter.disabledMask
    : body.velocity.y < 0
      ? filter.risingMask
      : filter.normalMask;

  applyCollisionMask(body, mask);
}
