import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import Matter from "matter-js";
import { spawnEntity } from "../EntityFactory";
import { applyStaticCollisionFilter } from "../systems/collision/collisionFilterSystem";

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




export function getPhysicsBody(registry: Registry, entity: number): any {
    const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
    return physics?.body;
}


export function linkPhysicsBody(registry: Registry, entity: number, body: any): void {
    if (body) {
        registry.linkBody(entity, body);
        body.parts?.forEach((part: { id: number }) => registry.linkBody(entity, part));
    }
}

export function unlinkPhysicsBody(registry: Registry, body: any): void {
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

export type SpawnHeadlessEntityOptions = {
  configure?: (entity: number) => void;
};

/**
 * spawn method for headless 
 */
export function spawnHeadlessEntity(
  registry: Registry,
  world: Matter.World,
  type: string,
  x: number,
  y: number,
  frame?: number,
  options: SpawnHeadlessEntityOptions = {},
): number {
  const entity = spawnEntity(registry, type, x, y, frame);
  if (entity === -1) return -1;

  options.configure?.(entity);

  createMatterBodyForEntity(world, registry, entity);

  return entity;
}
