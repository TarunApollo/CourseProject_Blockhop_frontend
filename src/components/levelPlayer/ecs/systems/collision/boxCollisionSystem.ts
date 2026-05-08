import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import { burstGameObject } from "../../effects";

import {
  destroyPhysicsEntity,
  getPhysicsBody,
} from "../../phaserBridge";
import { EventBus } from "../../../EventBus";
import type {
  CollisionHandlerContext,
  MatchedCollision,
} from "./collisionUtils";
import { crushEnemiesOnBox } from "./enemyCollisionSystem";
import { requireTileFrameByType } from "../../resources/tileMetadata";


/**
 * player -> box
 * check the collision should condition
 * destroy the box
 */
export function handlePlayerDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const playerBody = getPhysicsBody(registry, collision.subject);
  const boxBody = getPhysicsBody(registry, collision.target);
  if (playerBoxCondChecker(playerBody, collision.pair)) {
    breakDestructibleBox(context, collision.target, boxBody.bounds);
  }
}

/**
 * shell -> box
 * destory box and reverse direction of shell
 */
export function handleShellDestructibleBox(
  context: CollisionHandlerContext,
  collision: MatchedCollision,
): void {
  const registry = context.registry;
  const shellWalker = registry.getComponent<Comp.HorizontalWalker>(
    collision.subject,
    CT.HorizontalWalker,
  );
  const boxBody = getPhysicsBody(registry, collision.target);

  if (shellWalker?.active) {
    breakDestructibleBox(context, collision.target, boxBody.bounds);
    shellWalker.direction *= -1;
    shellWalker.skipVelCheck = true;
  }
}

/**
 * helper for detecting player -> box condition
 */
function playerBoxCondChecker(playerBody: any, pair: any): boolean {
  const isJumpUp = playerBody.velocity.y < 0;
  const isVerticalContact = Math.abs(pair.collision.normal.x) <= 0.5;

  return isJumpUp && isVerticalContact;
}

/**
 * main process of player->box
 * 1.burn the gameobject
 * 2.pop coin in the box if box has coin
 * 3.destory box
 * 4.kill enemy on box
 */
export function breakDestructibleBox(
  context: CollisionHandlerContext,
  boxEntity: number,
  boxBounds: any,
): void {
  const registry = context.registry;
  const box = registry.getComponent<Comp.DestructibleBox>(
    boxEntity,
    CT.DestructibleBox,
  );
  const sprite = registry.getComponent<Comp.Sprite>(
    boxEntity,
    CT.Sprite,
  );
  const gameObject = sprite?.gameObject;

  burstGameObject(context.scene,gameObject);
  if (box.content) {
    popBoxCoin(context, gameObject.x, gameObject.y, box.content);
  }
  EventBus.emit("BoxDestroyed", box.content);
  destroyPhysicsEntity(registry, boxEntity);
  crushEnemiesOnBox(context, boxBounds.min, boxBounds.max);
}

/**
 * 
 */
function popBoxCoin(
  context: CollisionHandlerContext,
  x: number,
  y: number,
  coinType: string,
): void {
  const frame = requireTileFrameByType(context.tileMetadata, coinType);
  const tileSize = 128;
  const coinSprite = context.scene.add.sprite(x, y, "tiles", frame);
  coinSprite.setDisplaySize(tileSize * 0.6, tileSize * 0.6);

  const animKey = `coin_spin_${coinType.replace("Item_Coin_", "").toLowerCase()}`;
  if (context.scene.anims.exists(animKey)) coinSprite.play(animKey);

  context.scene.tweens.add({
    targets: coinSprite,
    y: y - tileSize * 1.5,
    alpha: { from: 1, to: 0 },
    duration: 500,
    ease: "Quad.easeOut",
    onComplete: () => {
      coinSprite.destroy();
      EventBus.emit("CoinCollected", coinType);
    },
  });
}
