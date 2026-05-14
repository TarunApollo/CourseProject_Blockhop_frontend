import * as Comp from "../ecs/components";
import { getPhysicsBody } from "../ecs/adapter/matterAdapter";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes";
import type { LevelRuntime } from "../ecs/headlessRuntime/update";

const SPEED_NORMALIZE_SCAIL = 24;


export type ObservedEntity = {
  entity: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  distance: number;
};

export type LevelPlayerObservation = {
  step: number;
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    onGround: boolean;
    isSmall: boolean;
    isInvincible: boolean;
  };
  map: {
    width: number;
    height: number;
  };
  door: ObservedEntity | null;
  doorOpen: boolean;
  nearestEnemy: ObservedEntity | null;
  vector: number[];
};

export function observeRuntime(
  runtime: LevelRuntime,
  step: number,
): LevelPlayerObservation {
  const registry = runtime.registry;
  const playerBody = getPhysicsBody(registry, runtime.playerEntity);
  const playerControl = registry.getComponent<Comp.PlayerControl | undefined>(
    runtime.playerEntity,
    CT.Player,
  );

  if (!playerBody || !playerControl) {
    throw new Error("Cannot observe level without a player body");
  }

  const player = {
    x: playerBody.position.x,
    y: playerBody.position.y,
    vx: playerBody.velocity.x,
    vy: playerBody.velocity.y,
    onGround: playerControl.isOnGround,
    isSmall: playerControl.isSmall,
    isInvincible: playerControl.isInvincible,
  };
  const map = runtime.mapSize;
  const observation: LevelPlayerObservation = {
    step,
    player,
    map: {
      width: map.width,
      height: map.height,
    },
    door: nearestEntity(runtime, player, [CT.Door, CT.Transform]),
    doorOpen: runtime.levelState.doorOpen,
    nearestEnemy: nearestEntity(runtime, player, [CT.Enemy, CT.Transform]),
    vector: [],
  };

  observation.vector = observationToVector(observation);
  return observation;
}

export function observationToVector(
  observation: LevelPlayerObservation,
): number[] {
  const { player, map } = observation;
  const door = encodeRelativeOffset(observation.door, map);
  const enemy = encodeRelativeOffset(observation.nearestEnemy, map);

  return [
    normalize(player.x, map.width),
    normalize(player.y, map.height),
    normalize(player.vx, SPEED_NORMALIZE_SCAIL),
    normalize(player.vy, SPEED_NORMALIZE_SCAIL),
    player.onGround ? 1 : 0,
    player.isSmall ? 1 : 0,
    player.isInvincible ? 1 : 0,
    observation.doorOpen ? 1 : 0,
    ...door,
    ...enemy,
  ];
}

/**
 * helper for finding the nearestEntity by 
 * computing in Pythagorean theorem
 */
function nearestEntity(
  runtime: LevelRuntime,
  player: { x: number; y: number },
  components: number[],
): ObservedEntity | null {
  const entities = runtime.registry.view(components);
  let nearest: ObservedEntity | null = null;

  for (const entity of entities) {
    const transform = runtime.registry.getComponent<Comp.Transform | undefined>(
      entity,
      CT.Transform,
    );
    if (!transform) continue;

    const dx = transform.x - player.x;
    const dy = transform.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (!nearest || distance < nearest.distance) {
      nearest = {
        entity,
        x: transform.x,
        y: transform.y,
        dx,
        dy,
        distance,
      };
    }
  }
  return nearest;
}

function encodeRelativeOffset(
  entity: ObservedEntity | null,
  map: { width: number; height: number },
): number[] {
  if (!entity) return [0, 0];

  return [
    normalize(entity.dx, map.width),
    normalize(entity.dy, map.height),
  ];
}

function normalize(value: number, scale: number): number {
  if (scale === 0) return 0;
  return value / scale;
}
