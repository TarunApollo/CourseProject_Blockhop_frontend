import type { Registry } from "../../core/Registry";
import type { CollisionRule } from "./collisionRules";
import type {
  CollisionPair,
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";

export function routeCollisionPair(
  context: CollisionHandlerContext,
  rules: CollisionRule[],
  pair: CollisionPair,
): void {
  const registry = context.registry;
  const entityA = registry.getEntityByBodyId(pair.bodyA.id);
  const entityB = registry.getEntityByBodyId(pair.bodyB.id);

  if (entityA === undefined || entityB === undefined) return;

  for (const rule of rules) {
    const collision = matchCollisionRule(
      registry,
      rule,
      entityA,
      entityB,
      pair,
    );

    if (!collision) continue;
    rule.handler(context, collision);
  }
}

function matchCollisionRule(
  registry: Registry,
  rule: CollisionRule,
  entityA: number,
  entityB: number,
  pair: CollisionPair,
): MatchedCollision | undefined {
  const sigA = registry.getSignature(entityA);
  const sigB = registry.getSignature(entityB);

  if (sigA & rule.subject && sigB & rule.target) {
    return { subject: entityA, target: entityB, pair };
  }

  if (sigB & rule.subject && sigA & rule.target) {
    return { subject: entityB, target: entityA, pair };
  }

  return undefined;
}
