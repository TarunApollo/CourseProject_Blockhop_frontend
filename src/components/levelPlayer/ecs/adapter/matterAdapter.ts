import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import * as Matter from "matter-js";

/**
 * This file only contains the logic for non-game rule
 * matter adapter . e.g entity <--> body,helper for
 * get/destroy physics
 */

export function createMatterBodyForEntity(
  world: Matter.World,
  registry: Registry,
  entity: number,
): void {
  const transform = registry.getComponent<Comp.Transform>(entity, CT.Transform);
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);

  if (!transform || !physics) return;

  const body = Matter.Bodies.rectangle(
    transform.x,
    transform.y,
    physics.width,
    physics.height,
    {
      label: physics.label,
      friction: 0,
      frictionStatic: 0,
      isSensor: physics.isSensor,
      isStatic: physics.isStatic,
    },
  );

  applyStaticCollisionFilter(body, physics);

  if (physics.fixedRotation) {
    Matter.Body.setInertia(body, Infinity);
  }

  Matter.World.add(world, body);

  physics.body = body;
  linkPhysicsBody(registry, entity, body);
}

function applyStaticCollisionFilter(
  body: Matter.Body,
  physics: Comp.Physics,
): void {
  body.collisionFilter.category = physics.category;
  applyCollisionMask(
    body,
    physics.collidesWith.reduce((mask, category) => mask | category, 0),
  );
}

export function applyCollisionMask(body: Matter.Body, mask: number): void {
  const parts = body.parts.length > 0 ? body.parts : [body];
  for (const part of parts) {
    part.collisionFilter.mask = mask;
  }
}

export function getPhysicsBody(
  registry: Registry,
  entity: number,
): Matter.Body | undefined {
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  return physics?.body ?? undefined;
}

export function linkPhysicsBody(
  registry: Registry,
  entity: number,
  body: Matter.Body,
): void {
  if (body) {
    registry.linkBody(entity, body);
    body.parts?.forEach((part: { id: number }) =>
      registry.linkBody(entity, part),
    );
  }
}

export function unlinkPhysicsBody(
  registry: Registry,
  body: Matter.Body | undefined,
): void {
  if (body) {
    registry.unlinkBody(body.id);
    body.parts?.forEach((part: { id: number }) => registry.unlinkBody(part.id));
  }
}

export function destroyPhysicsEntity(
  world: Matter.World,
  registry: Registry,
  entity: number,
): void {
  const body = getPhysicsBody(registry, entity);

  unlinkPhysicsBody(registry, body);
  if (body) Matter.World.remove(world, body);
  registry.destroyEntity(entity);
}

export function syncTransformsFromMatter(registry: Registry): void {
  registry.forEach(
    [CT.Transform, CT.Physics],
    (_entity, transformRaw, physicsRaw) => {
      const transform = transformRaw as Comp.Transform;
      const physics = physicsRaw as Comp.Physics;
      const body = physics.body as Matter.Body | undefined;

      if (!body) return;

      transform.x = body.position.x;
      transform.y = body.position.y;
      transform.rotation = body.angle;
    },
  );
}
