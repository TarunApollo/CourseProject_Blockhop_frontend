import Phaser from "phaser";
import { Registry } from "./core/Registry";
import { ComponentTypes as CT } from "./core/ComponentTypes";
import * as Comp from "./components";

/**
 * Configures the door entity its sensor and sprites.
 */
export function registerDoorHooks(
  scene: Phaser.Scene,
  registry: Registry,
  groundTileset: any,
) {
  registry.onComponentAdd(CT.Door, (id, door: Comp.Door) => {
    const transform = registry.getComponent<Comp.Transform>(id, CT.Transform);
    const physics = registry.getComponent<Comp.Physics>(id, CT.Physics);
    const sprite = registry.getComponent<Comp.Sprite>(id, CT.Sprite);

    if (!transform || !physics) return;

    const x = transform.x;
    const y = transform.y;

    if (sprite && sprite.gameObject) {
      door.bottomSprite = sprite.gameObject;
    }

    // top tile sprite
    const topEntry = Object.entries(groundTileset.tileData).find(
      ([, d]: [string, any]) => d.type === "Door_Closed_Top",
    );
    if (topEntry) {
      const topFrame = parseInt(topEntry[0]);
      door.topSprite = scene.add.image(x, y - 128, "tiles", topFrame);
    }

    // Create a sensor covering both tiles
    const body = scene.matter.add.rectangle(
      x,
      y - 64,
      physics.width,
      physics.height,
      {
        isStatic: true,
        isSensor: true,
        label: physics.label,
      },
    );
    body.collisionFilter.category = physics.category;
    if (physics.collidesWith && physics.collidesWith.length > 0) {
      body.collisionFilter.mask = physics.collidesWith[0];
    }

    physics.body = body;
  });
}
