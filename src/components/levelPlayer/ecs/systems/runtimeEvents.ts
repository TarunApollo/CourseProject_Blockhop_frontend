import type * as Matter from "matter-js";
import type { Registry } from "../core/Registry";
import type { EventSink, GameEvent } from "../eventQueue";
import type { LevelStateResource } from "../resources/levelState";
import type { Scheduler } from "../resources/scheduler";
import { playerCarryEventSystem } from "./playerAction/playerCarrySystem";
import { levelStateSystem } from "./lifecycle/levelStateSystem";
import { movementEventSystem } from "./aiMovement/movementEventSystem";

export type RuntimeEventContext = {
  registry: Registry;
  levelState: LevelStateResource;
  scheduler: Scheduler;
  world: Matter.World;
  events: EventSink;
};

export function processRuntimeEvents(
  runtime: RuntimeEventContext,
  events: GameEvent[],
): void {
  movementEventSystem(runtime.registry, events);
  levelStateSystem(runtime.registry, runtime.levelState, events);
  playerCarryEventSystem(runtime, events);
}
