import type * as Matter from "matter-js";
import { LifeState } from "../../components/ComponentEnum";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { EventSink } from "../../eventQueue";
import {
  getBodyBoundsHalfHeight,
  getBodyBoundsHalfWidth,
} from "../../matter/matterQueryUtils";
import type { PlayerOperation } from "./playerControlInputSystem";

const SHELL_PICKUP_RANGE_X = 24;
const SHELL_PICKUP_RANGE_Y = 24;

/**
 * Converts player shell-carry input into shell equip/throw requests.
 */
export function playerShellCarryInputSystem(
  registry: Registry,
  operation: PlayerOperation,
  eventSink: EventSink,
): void {
  for (const entity of registry.view([CT.Player, CT.PlayerLife, CT.Physics])) {
    const control = registry.getComponent(entity, CT.Player);
    const life = registry.getComponent(entity, CT.PlayerLife);
    const physics = registry.getComponent(entity, CT.Physics);
    const body = physics?.body;
    if (!control || !life || !body) continue;
    if (life.lifeState === LifeState.DYING) continue;

    const throwJustPressed = operation.throw && !control.throwKeyWasDown;
    const throwJustReleased = !operation.throw && control.throwKeyWasDown;
    control.throwKeyWasDown = operation.throw;

    // Pickup: resting shells equip on any frame Z is held; active shells require
    // a fresh press-edge while in proximity. That gives a frame-precise catch.
    if (operation.throw) {
      const carrier = registry.getComponent(entity, CT.Carrier);
      if (carrier?.heldEntity == null) {
        const shellEntity = findNearbyShellEntity(
          registry,
          entity,
          body,
          throwJustPressed,
        );
        if (shellEntity != null) {
          const shellMotion = registry.getComponent(
            shellEntity,
            CT.HorizontalMotion,
          );
          const shell = registry.getComponent(shellEntity, CT.Shell);
          if (shellMotion?.active && shell) {
            shell.ignorePlayerUntilContactEnd = true;
          }
          eventSink.emit({
            type: "ShellEquipRequested",
            playerEntity: entity,
            shellEntity,
          });
        }
      }
    }

    if (throwJustReleased) {
      const carrier = registry.getComponent(entity, CT.Carrier);
      if (carrier?.heldEntity != null) {
        eventSink.emit({
          type: "ShellThrowRequested",
          playerEntity: entity,
        });
      }
    }
  }
}

function findNearbyShellEntity(
  registry: Registry,
  playerEntity: number,
  playerBody: Matter.Body,
  isFreshPress: boolean,
): number | null {
  let nearestShell: { entity: number; distanceSquared: number } | null = null;

  for (const shellEntity of registry.view([
    CT.Shell,
    CT.Physics,
    CT.HorizontalMotion,
  ])) {
    if (shellEntity === playerEntity) continue;

    const shellMotion = registry.getComponent(shellEntity, CT.HorizontalMotion);
    const shellPhysics = registry.getComponent(shellEntity, CT.Physics);
    const shell = registry.getComponent(shellEntity, CT.Shell);
    const shellBody = shellPhysics?.body as Matter.Body | undefined;
    if (
      !shellMotion ||
      !shellBody ||
      shellBody.isSensor ||
      shell?.ignorePlayerUntilContactEnd
    ) {
      continue;
    }
    // Active (dangerous) shells are catchable only on a fresh Z press.
    // Resting shells equip on hold or press.
    if (shellMotion.active && !isFreshPress) continue;

    const maxDx =
      getBodyBoundsHalfWidth(playerBody) +
      getBodyBoundsHalfWidth(shellBody) +
      SHELL_PICKUP_RANGE_X;
    const maxDy =
      getBodyBoundsHalfHeight(playerBody) +
      getBodyBoundsHalfHeight(shellBody) +
      SHELL_PICKUP_RANGE_Y;
    const dx = shellBody.position.x - playerBody.position.x;
    const dy = shellBody.position.y - playerBody.position.y;

    if (Math.abs(dx) > maxDx || Math.abs(dy) > maxDy) continue;

    const distanceSquared = dx * dx + dy * dy;
    if (
      nearestShell == null ||
      distanceSquared < nearestShell.distanceSquared
    ) {
      nearestShell = { entity: shellEntity, distanceSquared };
    }
  }

  return nearestShell?.entity ?? null;
}
