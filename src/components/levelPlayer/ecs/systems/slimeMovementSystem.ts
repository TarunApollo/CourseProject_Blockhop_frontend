import { Registry } from "../core/Registry";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import * as Comp from "../components";

/**
 * Moves slimes to the left.
 */
export function slimeMovementSystem(registry: Registry) {
  registry.forEach(
    [CT.Slime, CT.AIWalker, CT.Sprite],
    (
      _id: number,
      _slime: Comp.Slime,
      ai: Comp.AIWalker,
      sprite: Comp.Sprite,
    ) => {
      if (!sprite.gameObject) return;
      const gameObject = sprite.gameObject as Phaser.Physics.Matter.Sprite;

      // Verify object still exists before moving
      if (gameObject && gameObject.body) {
        // Apply leftward velocity
        gameObject.setVelocityX(-ai.speed);

        // Face left
        gameObject.flipX = true;
      }
    },
  );
}
