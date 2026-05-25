import { Registry } from "../ecs/core/Registry";
import { CT } from "../ecs/core/ComponentTypes";
import * as Comp from "../ecs/components";
import { burstEffect } from "./effects";
import { getGameObject, type PhaserRenderContext } from "./phaserAdapter";
import type { GameEvent } from "../ecs/eventQueue";
import {
  COIN_POP_DURATION,
  COIN_POP_HEIGHT,
  COIN_POP_SIZE,
  DAMAGE_SHAKE_DURATION,
  DAMAGE_SHAKE_INTENSITY,
} from "./phaserConstants";

/**
 * Updates animations and sprite mirroring using the Animator component.
 */
export function animationSystem(
  context: PhaserRenderContext,
  registry: Registry,
) {
  const entities = registry.view([CT.Animator, CT.Sprite]);

  for (const entity of entities) {
    const animator = registry.getComponent(entity, CT.Animator);
    const gameObject: Phaser.GameObjects.Sprite | undefined = getGameObject(
      context,
      entity,
    );
    if (!animator || !gameObject) continue;

    const animKey = getAnimationKey(animator);
    if (animKey && gameObject.anims) {
      if (gameObject.anims.currentAnim?.key !== animKey) {
        if (!context.scene.anims.exists(animKey)) continue;
        gameObject.anims.play(animKey, true);
      }
    }

    gameObject.flipX = animator.flipX;
  }
}

function getAnimationKey(animator: Comp.Animator): string {
  if (animator.lockFrames > 0 && animator.lockedAnim) {
    animator.lockFrames--;
    const lockedAnim = animator.lockedAnim;
    if (animator.lockFrames === 0) animator.lockedAnim = null;
    return lockedAnim;
  }

  return animator.currentAnim;
}

export function animationEventSystem(
  context: PhaserRenderContext,
  events: GameEvent[],
  options: { onCoinPopComplete?: ((coinType: string) => void) | undefined } = {},
): void {
  for (const event of events) {
    if (event.type === "CoinPopRequested") {
      playCoinPopAnimation(
        context.scene,
        event.x,
        event.y,
        event.coinType,
        options.onCoinPopComplete,
      );
    } else if (event.type === "BurstRequested") {
      burstEffect(context.scene, event.x, event.y, event.texture, event.frame);
    } else if (event.type === "PlayerTookDamage") {
      const sprite = getGameObject(context, event.entity);
      if (sprite) {
        context.scene.cameras.main.shake(
          DAMAGE_SHAKE_DURATION,
          DAMAGE_SHAKE_INTENSITY,
        );
        context.scene.tweens.add({
          targets: sprite,
          alpha: { from: 0.3, to: 1 },
          duration: 100,
          repeat: 10,
          onComplete: () => {
            sprite.alpha = 1;
          },
        });
      }
    }
  }
}

function playCoinPopAnimation(
  scene: Phaser.Scene,
  x: number,
  y: number,
  coinType: string,
  onCompleteExec?: (coinType: string) => void,
): void {
  const frame = coinFrameByType(coinType);
  const coinSprite = scene.add.sprite(x, y, "tiles.default", frame);
  coinSprite.setDisplaySize(COIN_POP_SIZE, COIN_POP_SIZE);

  const animKey = `coin_spin_${coinType.replace("Item_Coin_", "").toLowerCase()}`;
  if (scene.anims.exists(animKey)) coinSprite.play(animKey);

  scene.tweens.add({
    targets: coinSprite,
    y: y - COIN_POP_HEIGHT,
    alpha: { from: 1, to: 0 },
    duration: COIN_POP_DURATION,
    ease: "Quad.easeOut",
    onComplete: () => {
      coinSprite.destroy();
      onCompleteExec?.(coinType);
    },
  });
}

function coinFrameByType(coinType: string): string {
  if (coinType === "Item_Coin_Silver") return "coin_silver";
  if (coinType === "Item_Coin_Bronze") return "coin_bronze";
  return "coin_gold";
}
