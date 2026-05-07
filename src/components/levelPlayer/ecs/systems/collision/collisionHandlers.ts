import { EventBus } from "../../../EventBus";
import { burstEffect } from "../../../mechanics/effects.js";
import { hitDamage } from "../../../mechanics/playerDamage.js";
import { JUMP_VY } from "../../../mechanics/constants.js";
import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionTypes";

export function handlePlayerHazard(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  processPlayerHazardContact(context, collision);
}

export function handlePlayerDoor(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const door = context.registry.getComponent<Comp.Door>(
    collision.target,
    CT.Door,
  );
  const player = context.registry.getComponent<Comp.PlayerControl>(
    collision.subject,
    CT.Player,
  );

  if (door?.isOpen && player) {
    player.isLevelComplete = true;
  }
}

export function handlePlayerCoin(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const coin = context.registry.getComponent<Comp.Coin>(
    collision.target,
    CT.Coin,
  );
  const sprite = context.registry.getComponent<Comp.Sprite>(
    collision.target,
    CT.Sprite,
  );

  if (!coin || !sprite?.gameObject) return;

  burstEffect(
    context.scene,
    sprite.gameObject.x,
    sprite.gameObject.y,
    sprite.gameObject.texture.key,
    sprite.gameObject.frame.name,
    {
      quantity: 6,
      speed: { min: 60, max: 150 },
      scale: { start: 0.3, end: 0 },
      gravityY: 150,
      lifespan: 400,
      stopAfter: 6,
    },
  );

  EventBus.emit("CoinCollected", coin.coinType);
  destroyPhysicsEntity(context.registry, collision.target);
}

export function handlePlayerDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const playerBody = getPhysicsBody(context.registry, collision.subject);
  const isHitFromBelow =
    playerBody?.velocity?.y < 0 &&
    Math.abs(collision.pair.collision?.normal?.x ?? 0) <= 0.5;

  if (!isHitFromBelow) return;

  breakDestructibleBox(context, collision.target);
}

export function handleAIWalkerDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  turnWalkerOnSideContact(context.registry, collision.subject, collision);
}

export function handleAIWalkerAIWalker(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  if (!isSideContact(collision)) return;

  flipWalker(context.registry, collision.subject);
  flipWalker(context.registry, collision.target);
}

export function handleAIWalkerShell(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  turnWalkerOnSideContact(context.registry, collision.subject, collision);
}

export function handlePlayerHazardActive(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  processPlayerHazardContact(context, collision);
}

function processPlayerHazardContact(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const playerBody = getPhysicsBody(registry, collision.subject);
  const hazardBody = getPhysicsBody(registry, collision.target);
  const playerSprite = getGameObject(registry, collision.subject);

  const isStomp =
    playerBody?.velocity?.y > 0 &&
    Math.abs(collision.pair.collision?.normal?.x ?? 0) <= 0.5;

  if (isStomp) {
    if (registry.hasComponent(collision.target, CT.Snail)) {
      return;
    }

    killEnemy(context, collision.target);
    playerSprite?.setVelocityY(JUMP_VY * 0.6);
    return;
  }

  if (context.state && playerSprite && hazardBody) {
    hitDamage(
      context.scene,
      playerSprite,
      { x: hazardBody.position.x },
      context.state,
    );
  }
}

function breakDestructibleBox(
  context: CollisionHandlerContext,
  boxEntity: number,
): void {
  const registry = context.registry;
  const box = registry.getComponent<Comp.DestructibleBox>(
    boxEntity,
    CT.DestructibleBox,
  );
  const sprite = registry.getComponent<Comp.Sprite>(boxEntity, CT.Sprite);

  if (!box || !sprite?.gameObject) return;

  burstEffect(
    context.scene,
    sprite.gameObject.x,
    sprite.gameObject.y,
    sprite.gameObject.texture.key,
    sprite.gameObject.frame.name,
  );

  EventBus.emit("BoxDestroyed", box.content);
  destroyPhysicsEntity(registry, boxEntity);
}

function killEnemy(context: CollisionHandlerContext, enemyEntity: number): void {
  const registry = context.registry;
  const sprite = registry.getComponent<Comp.Sprite>(enemyEntity, CT.Sprite);
  const gameObject = sprite?.gameObject;
  if (!gameObject) return;

  burstEffect(
    context.scene,
    gameObject.x,
    gameObject.y,
    gameObject.texture.key,
    gameObject.frame.name,
  );

  EventBus.emit("EnemyKilled", getEnemyType(registry, enemyEntity));
  destroyPhysicsEntity(registry, enemyEntity);
}

function turnWalkerOnSideContact(
  registry: Registry,
  walkerEntity: number,
  collision: MatchedCollision,
): void {
  if (!isSideContact(collision)) return;
  flipWalker(registry, walkerEntity);
}

function flipWalker(registry: Registry, walkerEntity: number): void {
  const walker = registry.getComponent<Comp.AIWalker>(
    walkerEntity,
    CT.AIWalker,
  );

  if (!walker) return;

  walker.direction *= -1;
  walker.skipVelCheck = true;
}

function destroyPhysicsEntity(registry: Registry, entity: number): void {
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  const gameObject = getGameObject(registry, entity);

  unlinkPhysicsBody(registry, physics?.body);
  gameObject?.destroy();
  registry.destroyEntity(entity);
}

function unlinkPhysicsBody(registry: Registry, body: any): void {
  if (!body) return;

  registry.unlinkBody(body.id);
  body.parts?.forEach((part: { id: number }) => registry.unlinkBody(part.id));
}

function getPhysicsBody(registry: Registry, entity: number): any {
  const physics = registry.getComponent<Comp.Physics>(entity, CT.Physics);
  return physics?.body;
}

function getGameObject(registry: Registry, entity: number): any {
  const sprite = registry.getComponent<Comp.Sprite>(entity, CT.Sprite);
  return sprite?.gameObject;
}

function isSideContact(collision: MatchedCollision): boolean {
  return Math.abs(collision.pair.collision?.normal?.x ?? 0) > 0.5;
}

function getEnemyType(registry: Registry, entity: number): string {
  if (registry.hasComponent(entity, CT.Snail)) return "Enemy_Snail";
  if (registry.hasComponent(entity, CT.Slime)) return "Enemy_Slime_Normal";
  return "Enemy";
}
