import * as Matter from "matter-js";
import { applyCollisionMask, getPhysicsBody } from "../adapter/matterAdapter";
import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { GameEvent } from "../eventQueue";
import type { RuntimeEventContext } from "./runtimeEvents";

export function carryEventSystem(
  context: RuntimeEventContext,
  events: GameEvent[],
): void {
  for (const event of events) {
    if (event.type !== "ShellEquipRequested") continue;

    const carrier = context.registry.getComponent<Comp.Carrier>(
      event.playerEntity,
      CT.Carrier,
    );
    if (!carrier || carrier.heldEntity != null) continue;

    const shell = context.registry.getComponent<Comp.Shell>(
      event.shellEntity,
      CT.Shell,
    );
    const shellWalker = context.registry.getComponent<Comp.HorizontalWalker>(
      event.shellEntity,
      CT.HorizontalWalker,
    );
    const hazard = context.registry.getComponent<Comp.Hazard>(
      event.shellEntity,
      CT.Hazard,
    );
    const shellBody = getPhysicsBody(context.registry, event.shellEntity);
    if (!shell || !shellWalker || !hazard || !shellBody) continue;

    carrier.heldEntity = event.shellEntity;

    hazard.active = false;
    hazard.targetPlayer = false;
    hazard.targetEnemy = false;

    shellWalker.active = false;
    shellWalker.direction = 0;
    shellWalker.skipVelCheck = false;

    // for now shells are inert, so they dont collide in active ticks.
    applyCollisionMask(shellBody, 0);
    Matter.Body.set(shellBody, { isSensor: true });

    shell.respawnTimer?.remove?.();
    shell.respawnTimer = null;
  }
}

export function carrySystem(registry: RuntimeEventContext["registry"]): void {
  registry.forEach(
    [CT.Carrier, CT.Physics, CT.Player],
    (_entity, carrierRaw, physicsRaw, playerRaw) => {
      const carrier = carrierRaw as Comp.Carrier;
      const physics = physicsRaw as Comp.Physics;
      const player = playerRaw as Comp.PlayerControl;

      if (carrier.heldEntity == null) return;
      if (player.lifeState !== Comp.LifeState.ALIVE) {
        carrier.heldEntity = null;
        return;
      }

      const playerBody = physics.body as Matter.Body | undefined;
      const shellBody = getPhysicsBody(registry, carrier.heldEntity);
      if (!playerBody || !shellBody) {
        carrier.heldEntity = null;
        return;
      }

      Matter.Body.setPosition(shellBody, {
        x: playerBody.position.x,
        y: playerBody.position.y + carrier.offsetY,
      });
      Matter.Body.setVelocity(shellBody, { x: 0, y: 0 });
    },
  );
}
