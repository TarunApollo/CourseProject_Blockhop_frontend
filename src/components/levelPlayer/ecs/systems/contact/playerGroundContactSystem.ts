import type * as Matter from "matter-js";
import { isSemisolidBody } from "../../adapter/matterQueryUtils";
import { getPhysicsBody } from "../../adapter/matterAdapter";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";

const NON_GROUND_CONTACT_LABELS = new Set([
  "player",
  "enemy",
  "coin",
]);

export function playerGroundContactSystem(
  registry: Registry,
  engine: Matter.Engine,
  playerEntity: number,
): void {
  const control = registry.getComponent(playerEntity, CT.Player);
  const playerBody = getPhysicsBody(registry, playerEntity);
  if (!control || !playerBody) return;

  if (control.forceGroundState !== null) {
    control.isOnGround = control.forceGroundState;
    return;
  }

  control.isOnGround = getActivePairs(engine).some((pair) => {
    const otherBody = getOtherBodyInPair(pair, playerBody);
    return (
      !!otherBody &&
      isGroundContactCandidate(registry, otherBody) &&
      isGroundContact(playerBody, otherBody, pair)
    );
  });
}

function getActivePairs(engine: Matter.Engine): Matter.Pair[] {
  const pairs = engine.pairs as { list?: Matter.Pair[] };
  return (pairs.list ?? []).filter((pair) => pair.isActive);
}

function getOtherBodyInPair(
  pair: Matter.Pair,
  playerBody: Matter.Body,
): Matter.Body | null {
  const bodyA = getParentBody(pair.collision.parentA ?? pair.bodyA);
  const bodyB = getParentBody(pair.collision.parentB ?? pair.bodyB);

  if (bodyA === playerBody) return bodyB;
  if (bodyB === playerBody) return bodyA;
  return null;
}

function getParentBody(body: Matter.Body): Matter.Body {
  return body.parent ?? body;
}

function isGroundContactCandidate(
  registry: Registry,
  body: Matter.Body,
): boolean {
  if (body.isSensor || isSemisolidBody(body)) return false;
  if (body.label === "shell") return isRestingShellBody(registry, body);
  return !NON_GROUND_CONTACT_LABELS.has(body.label);
}

function isRestingShellBody(registry: Registry, body: Matter.Body): boolean {
  const entity = registry.getEntityByBodyId(body.id);
  if (entity === undefined) return false;

  const shell = registry.getComponent(entity, CT.Shell);
  const walker = registry.getComponent(entity, CT.HorizontalWalker);
  return !!shell && !!walker && !walker.active;
}

function isGroundContact(
  playerBody: Matter.Body,
  groundBody: Matter.Body,
  pair: Matter.Pair,
): boolean {
  const normal = pair.collision.normal;
  if (Math.abs(normal.y) <= Math.abs(normal.x)) return false;

  return groundBody.position.y > playerBody.position.y;
}
