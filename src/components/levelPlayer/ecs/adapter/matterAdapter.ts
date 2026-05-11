import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import Matter from "matter-js";
import { spawnEntity } from "../EntityFactory";


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

    body.collisionFilter.category = physics.category;
    body.collisionFilter.mask = physics.collidesWith.reduce(
        (mask, category) => mask | category,
        0,
    );

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
): number {
  const entity = spawnEntity(registry, type, x, y, frame);
  if (entity === -1) return -1;

  createMatterBodyForEntity(world, registry, entity);

  return entity;
}
