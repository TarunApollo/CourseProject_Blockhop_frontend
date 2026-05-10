import Phaser from "phaser";
import { Registry } from "../ecs/core/Registry";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes";
import * as Comp from "../ecs/components";
import { EventBus } from "../EventBus";
import { burstEffect } from "./effects";
import {
  requireTileFrameByType,
  type TileMetadataResource,
} from "../ecs/resources/tileMetadata";

type CoinPopRequestedPayload = {
  x: number;
  y: number;
  coinType: string;
};

type BurstRequestedPayload = {
  x: number;
  y: number;
  texture: string;
  frame: string | number;
};

/**
 * Updates animations and sprite mirroring using the Animator component.
 */
export function animationSystem(registry: Registry) {
  registry.forEach([CT.Animator, CT.Sprite], (_id, animatorRaw, spriteRaw) => {
    const animator = animatorRaw as Comp.Animator;
    const sprite = spriteRaw as Comp.Sprite;

    if (!sprite.gameObject) return;
    const gameObject = sprite.gameObject as any;

    if (animator.currentAnim && gameObject.anims) {
      if (gameObject.anims.currentAnim?.key !== animator.currentAnim) {
        console.log(`Playing animation "${animator.currentAnim}" on entity ${_id}`);
        gameObject.anims.play(animator.currentAnim, true);
      }
    } else if (animator.currentAnim && !gameObject.anims) {
      console.warn(`Entity ${_id} has Animator component with "${animator.currentAnim}" but gameObject has no anims property! (type: ${gameObject.type})`);
    }

    gameObject.flipX = animator.flipX;
  });
}


export function registerAnimationEvents(
  scene: Phaser.Scene,
  tileMetadata: TileMetadataResource,
): void {
  EventBus.on("CoinPopRequested", ({ x, y, coinType }: CoinPopRequestedPayload) => {
    playCoinPopAnimation(scene, tileMetadata, x, y, coinType);
  });

  EventBus.on("BurstRequested", ({ x, y, texture, frame }: BurstRequestedPayload) => {
    burstEffect(scene, x, y, texture, frame);
  });
}

function playCoinPopAnimation(
  scene: Phaser.Scene,
  tileMetadata: TileMetadataResource,
  x: number,
  y: number,
  coinType: string,
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
      EventBus.emit("CoinCollected", coinType);
    },
  });
}
