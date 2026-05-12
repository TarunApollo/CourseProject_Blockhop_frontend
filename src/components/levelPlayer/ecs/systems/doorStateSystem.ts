import * as Comp from "../components";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import type { Registry } from "../core/Registry";
import type { LevelStateResource } from "../resources/levelState";

export function doorStateSystem(
  registry: Registry,
  levelState: LevelStateResource,
): void {
  registry.forEach([CT.Door], (_entity, doorRaw) => {
    const door = doorRaw as Comp.Door;
    door.isOpen = levelState.doorOpen;
  });
}
