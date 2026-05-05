import Phaser from "phaser";
import { Registry } from "../core/Registry";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import * as Comp from "../components";

/**
 * Handles AI movement. Reverses direction at walls or ledges.
 */
export function aiWalkerSystem(registry: Registry, groundBodies: any[]) {
  const MatterField = (Phaser.Physics.Matter as any).Matter;

  registry.forEach(
    [CT.AIWalker, CT.Physics, CT.Sprite, CT.Snail],
    (_id, walkerRaw, physicsRaw, spriteRaw) => {
      const walker = walkerRaw as Comp.AIWalker;
      const physics = physicsRaw as Comp.Physics;
      const sprite = spriteRaw as Comp.Sprite;

      const gameObject = sprite.gameObject as Phaser.Physics.Matter.Sprite;
      if (!gameObject || !gameObject.body) return;

      const { x, y, displayWidth, displayHeight } = gameObject;

      // Reverse at ledge
      if (walker.turnAtLedge) {
        const checkX = x + walker.direction * (displayWidth * 0.5 + 4);
        const checkY = y + displayHeight * 0.5 + 8;

        if (
          MatterField.Query.point(groundBodies, { x: checkX, y: checkY })
            .length === 0
        ) {
          walker.direction *= -1;
          walker.skipVelCheck = true;
        }
      }

      // Reverse at wall
      if (walker.skipVelCheck) {
        walker.skipVelCheck = false;
      } else {
        const vx = gameObject.body.velocity.x;
        const velocityBlocked =
          (walker.direction > 0 && vx < walker.speed * 0.5) ||
          (walker.direction < 0 && vx > -walker.speed * 0.5);

        if (velocityBlocked) {
          const aheadX = x + walker.direction * (displayWidth * 0.5 + 4);
          const wallAhead =
            MatterField.Query.point(groundBodies, { x: aheadX, y: y }).length >
            0;

          if (wallAhead) {
            walker.direction *= -1;
            walker.skipVelCheck = true;
            if (gameObject) {
              console.log("BEFORE: ", gameObject);
              gameObject.setFlipX(true);
              console.log("AFTER: ", gameObject);
            }
          }
        }
      }
      // Apply horizontal velocity
      if (gameObject) {
        gameObject.setVelocityX(walker.speed * walker.direction);

        gameObject.setAngularVelocity(0);
        gameObject.setFlipX(false);
        gameObject.setAngle();
      }
    },
  );
}
