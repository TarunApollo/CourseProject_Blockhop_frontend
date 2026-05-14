import { createHeadlessLevelRuntime } from "../ecs/headlessRuntime/create.js";
import {
  updateHeadlessLevel,
  type LevelRuntime,
} from "../ecs/headlessRuntime/update";
import type { GameEvent } from "../ecs/eventQueue";
import {
  actionToInput,
  type LevelPlayerAction,
} from "./levelPlayerActions";
import {
  observeRuntime,
  type LevelPlayerObservation,
} from "./levelPlayerObservation";
import { computeLevelPlayerReward } from "./levelPlayerReward";

const DEFAULT_MAX_STEPS = 1200;

export type LevelPlayerStepResult = {
  observation: LevelPlayerObservation;
  reward: number;
  terminated: boolean;
  truncated: boolean;
  done: boolean;
  events: GameEvent[];
  info: LevelPlayerStepInfo;
};

export type LevelPlayerStepInfo = {
  step: number;
  isComplete: boolean;
  gameOver: boolean;
};

export class LevelPlayerEnv {
  private runtime: LevelRuntime | undefined;
  private stepCount = 0;
  private previousObservation: LevelPlayerObservation | undefined;

  constructor(private readonly levelData: LevelData) {}

  reset(): LevelPlayerObservation {
    this.runtime = createHeadlessLevelRuntime(this.levelData);
    this.stepCount = 0;
    this.previousObservation = observeRuntime(this.runtime, this.stepCount);
    return this.previousObservation;
  }

  step(action: LevelPlayerAction): LevelPlayerStepResult {
    const runtime = this.requireRuntime();
    const previousObservation =
      this.previousObservation ?? observeRuntime(runtime, this.stepCount);

    this.stepCount++;

    const update = updateHeadlessLevel(runtime, {
      input: actionToInput(action),
    });
    const observation = observeRuntime(runtime, this.stepCount);
    const terminated = update.isComplete || update.gameOver;
    const truncated = !terminated && this.stepCount >= DEFAULT_MAX_STEPS;
    const reward = computeLevelPlayerReward({
      updateResult: update,
      observation,
      previousObservation,
    });

    this.previousObservation = observation;

    return {
      observation,
      reward,
      terminated,
      truncated,
      done: terminated || truncated,
      events: update.events,
      info: {
        step: this.stepCount,
        isComplete: update.isComplete,
        gameOver: update.gameOver,
      },
    };
  }

  observe(): LevelPlayerObservation {
    return observeRuntime(this.requireRuntime(), this.stepCount);
  }

  getRuntime(): LevelRuntime | undefined {
    return this.runtime;
  }

  private requireRuntime(): LevelRuntime {
    if (!this.runtime) {
      throw new Error("LevelPlayerEnv.reset() must be called before use");
    }
    return this.runtime;
  }
}

export type { LevelPlayerAction } from "./levelPlayerActions";
export {
  actionToInput,
  LEVEL_PLAYER_ACTIONS,
} from "./levelPlayerActions";
export type {
  LevelPlayerObservation,
  ObservedEntity,
} from "./levelPlayerObservation";
export {
  observationToVector,
} from "./levelPlayerObservation";
export {
  computeLevelPlayerReward,
  type LevelPlayerRewardContext,
} from "./levelPlayerReward";
