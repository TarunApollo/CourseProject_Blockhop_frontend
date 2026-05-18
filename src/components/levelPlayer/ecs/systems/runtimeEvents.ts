import type { Registry } from "../core/Registry";
import type { GameEvent } from "../eventQueue";
import type { LevelStateResource } from "../resources/levelState";
import { levelStateSystem } from "./levelStateSystem";
import { horizontalMovementEventSystem } from "./movement/horizontalMovementSystem";
import { playerMovementEventSystem } from "./movement/playerMovementSystem";

export type RuntimeEventContext = {
  registry: Registry;
  levelState: LevelStateResource;
};

export function processRuntimeEvents(
  runtime: RuntimeEventContext,
  events: GameEvent[],
): void {
  horizontalMovementEventSystem(runtime.registry, events);
  playerMovementEventSystem(runtime.registry, events);
  levelStateSystem(runtime.registry, runtime.levelState, events);
}
