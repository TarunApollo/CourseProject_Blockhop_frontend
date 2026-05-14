import type { LevelPlayerObservation } from "./levelPlayerObservation";
import type { HeadlessUpdateResult } from "../ecs/headlessRuntime/update";

/**
 * curObs + preObs + whathappened
 */
export type LevelPlayerRewardContext = {
  updateResult: HeadlessUpdateResult;
  observation: LevelPlayerObservation;
  previousObservation: LevelPlayerObservation;
};

export function computeLevelPlayerReward(
  _context: LevelPlayerRewardContext,
): number {
  return 0;
}
