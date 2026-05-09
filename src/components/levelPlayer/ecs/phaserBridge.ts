import * as Comp from "./components";
import { ComponentTypes as CT } from "./core/ComponentTypes";
import type { Registry } from "./core/Registry";

export function getGameObject(registry: Registry, entity: number): any {
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  return sprite?.gameObject;
}

export function getPhysicsBody(registry: Registry, entity: number): any {
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  return physics?.body;
}

export function unlinkPhysicsBody(registry: Registry, body: any): void {
  if (!body) return;

  registry.unlinkBody(body.id);
  body.parts?.forEach((part: { id: number }) => registry.unlinkBody(part.id));
}

export function destroyPhysicsEntity(
  registry: Registry,
  entity: number,
): void {
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  const gameObject = getGameObject(registry, entity);

  unlinkPhysicsBody(registry, physics?.body);
  gameObject?.destroy();
  registry.destroyEntity(entity);
}
