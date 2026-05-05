import Phaser from "phaser";
import { Registry } from "./core/Registry";
import { ComponentTypes as CT } from "./core/ComponentTypes";
import * as Comp from "./components";
import { CATEGORY_DEFAULT } from "../mechanics/constants";

/**
 * Sets up Phaser physics and sprites when a player component is added.
 */
export function registerPlayerHooks(registry: Registry) {
  registry.onComponentAdd(CT.Player, (id, _controlComp) => {
    const spriteComp = registry.getComponent<Comp.Sprite>(id, CT.Sprite);
    if (!spriteComp || !spriteComp.gameObject) return;

    const p = spriteComp.gameObject as Phaser.Physics.Matter.Sprite;
    const { width, height } = spriteComp;
    const w = width || 128;
    const h = height || 128;

    p.setDisplaySize(w, h);
    p.setOrigin(0.5, 0.5);

    const MatterField = (Phaser.Physics.Matter as any).Matter;

    // Main physical body
    const mainBody = MatterField.Bodies.rectangle(0, 0, w * 0.55, h - 8, {
      label: "player",
      collisionFilter: {
        category: CATEGORY_DEFAULT,
        mask: 0xffff,
      },
    });

    // Bottom foot sensor
    const footSensor = MatterField.Bodies.rectangle(0, 0, w * 0.5, 16, {
      isSensor: true,
      label: "playerSensor",
      collisionFilter: {
        mask: 0xffff,
      },
    });

    // Combine parts into a single symmetrical body
    const compoundBody = MatterField.Body.create({
      parts: [mainBody, footSensor],
      friction: 0.05,
      frictionStatic: 0,
      restitution: 0,
    });

    MatterField.Body.setCentre(compoundBody, { x: 0, y: 0 }, true);

    const startX = p.x;
    const startY = p.y;

    p.setExistingBody(compoundBody);
    p.setPosition(startX, startY);
    p.setFixedRotation();
    p.setAngularVelocity(0);

    const physComp = registry.getComponent<Comp.Physics>(id, CT.Physics);
    if (physComp) {
      physComp.body = compoundBody;
    }
  });
}

/**
 * Creates a player entity in the registry and scene.
 */
export function spawnPlayer(
  scene: Phaser.Scene,
  registry: Registry,
  x: number,
  y: number,
): Phaser.Physics.Matter.Sprite {
  const playerId = registry.createEntity();

  const player = scene.matter.add.sprite(x, y, "player");
  const pSpriteComp = new Comp.Sprite("player", "p1_stand", 128, 128);
  pSpriteComp.gameObject = player;

  registry.addComponent(playerId, CT.Sprite, pSpriteComp);

  registry.addComponent(playerId, CT.Player, new Comp.PlayerControl());
  registry.addComponent(playerId, CT.Animator, new Comp.Animator());

  registry.addComponent(
    playerId,
    CT.Physics,
    new Comp.Physics(
      player.displayWidth * 0.55,
      player.displayHeight - 8,
      "player",
      CATEGORY_DEFAULT,
      [0xffff],
    ),
  );

  return player;
}
