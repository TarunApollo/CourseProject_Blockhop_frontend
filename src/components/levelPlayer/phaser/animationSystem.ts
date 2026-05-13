import { Registry } from "../ecs/core/Registry";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes";
import * as Comp from "../ecs/components";
import { burstEffect } from "./effects";
import {
  requireTileFrameByType,
  type TileMetadataResource,
} from "./tileMetadata";
import { getGameObject, type PhaserRenderContext } from "./phaserAdapter";
import type { EventSink, GameEvent } from "../ecs/eventQueue";

/**
 * Updates animations and sprite mirroring using the Animator component.
 */
export function animationSystem(
  context: PhaserRenderContext,
  registry: Registry,
) {
  registry.forEach([CT.Animator, CT.Sprite], (_id, animatorRaw) => {
    const animator = animatorRaw as Comp.Animator;
    const gameObject: Phaser.GameObjects.Sprite | undefined = getGameObject(
      context,
      _id,
    );
    if (!gameObject) return;

    if (animator.currentAnim && gameObject.anims) {
      if (gameObject.anims.currentAnim?.key !== animator.currentAnim) {
        if (!context.scene.anims.exists(animator.currentAnim)) return;
        gameObject.anims.play(animator.currentAnim, true);
      }
    }

    gameObject.flipX = animator.flipX;
  });
}

export function animationEventSystem(
  context: PhaserRenderContext,
  tileMetadata: TileMetadataResource,
  events: GameEvent[],
  eventSink?: EventSink,
): void {
  for (const event of events) {
    if (event.type === "CoinPopRequested") {
      playCoinPopAnimation(
        context.scene,
        tileMetadata,
        event.x,
        event.y,
        event.coinType,
        eventSink,
      );
    } else if (event.type === "BurstRequested") {
      burstEffect(context.scene, event.x, event.y, event.texture, event.frame);
    } else if (event.type === "PlayerTookDamage") {
      const sprite = getGameObject(context, event.entity);
      if (sprite) {
        context.scene.cameras.main.shake(200, 0.007);
        sprite.setDisplaySize(128 * 0.8, 128 * 0.8);
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
  tileMetadata: TileMetadataResource,
  x: number,
  y: number,
  coinType: string,
  eventSink?: EventSink,
): void {
  const frame = requireTileFrameByType(tileMetadata, coinType);
  const tileSize = 128;
  const coinSprite = scene.add.sprite(x, y, "tiles", frame);
  coinSprite.setDisplaySize(tileSize * 0.6, tileSize * 0.6);

  const animKey = `coin_spin_${coinType.replace("Item_Coin_", "").toLowerCase()}`;
  if (scene.anims.exists(animKey)) coinSprite.play(animKey);

  scene.tweens.add({
    targets: coinSprite,
    y: y - tileSize * 1.5,
    alpha: { from: 1, to: 0 },
    duration: 500,
    ease: "Quad.easeOut",
    onComplete: () => {
      coinSprite.destroy();
      eventSink?.emit({ type: "CoinCollected", coinType });
    },
  });
}
