import Matter from "matter-js";
import { LifeState } from "../../components/ComponentEnum";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { GameEvent, EventSink } from "../../eventQueue";
import type { Scheduler } from "../../resources/scheduler";
import { getPhysicsBody } from "../../adapter/matterAdapter";

export function playerDamageEventSystem(
  registry: Registry,
  events: GameEvent[],
  scheduler: Scheduler,
  eventSink: EventSink,
): void {
  for (const event of events) {
    if (event.type === "PlayerDamageContactStarted") {
      handlePlayerDamage(
        registry,
        event.playerEntity,
        event.hazardEntity,
        scheduler,
        eventSink,
      );
    }
  }
}

function handlePlayerDamage(
  registry: Registry,
  playerEntity: number,
  hazardEntity: number,
  scheduler: Scheduler,
  eventSink: EventSink,
): void {
  const life = registry.getComponent(
    playerEntity,
    CT.PlayerLife,
  );
  const hazard = registry.getComponent(hazardEntity, CT.Hazard);
  const playerBody = getPhysicsBody(registry, playerEntity);
  const hazardBody = getPhysicsBody(registry, hazardEntity);

  if (!life || !hazard || !playerBody || !hazardBody) return;
  if (!hazard.active || !hazard.targetPlayer) return;
  if (life.isInvincible || life.lifeState !== LifeState.ALIVE)
    return;

  if (!life.isSmall) {
    life.isSmall = true;
    life.isInvincible = true;
    life.knockbackFrames = 25;

    const knockbackX = playerBody.position.x < hazardBody.position.x ? -14 : 14;
    Matter.Body.setVelocity(playerBody, { x: knockbackX, y: -10 });

    scheduler.schedule(1000, () => {
      life.isInvincible = false;
    });

    eventSink.emit({ type: "PlayerTookDamage", entity: playerEntity });
  } else {
    life.lifeState = LifeState.DYING;
    life.isInvincible = true;

    Matter.Body.setVelocity(playerBody, { x: 0, y: -16 });
    eventSink.emit({ type: "PlayerDied" });
  }
}
