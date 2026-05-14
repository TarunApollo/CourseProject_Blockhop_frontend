import type { PlayerInputState } from "../ecs/systems/inputSystem";

export enum LevelPlayerAction {
  IDLE = 0,
  LEFT = 1,
  RIGHT = 2,
  JUMP = 3,
  LEFT_JUMP = 4,
  RIGHT_JUMP = 5,
  LEFT_RUN = 6,
  RIGHT_RUN = 7,
}

export type LevelPlayerActionDefinition = {
  action: LevelPlayerAction;
  name: string;
  input: PlayerInputState;
};

export const LEVEL_PLAYER_ACTIONS: readonly LevelPlayerActionDefinition[] = [
  createAction(LevelPlayerAction.IDLE, "idle", {}),
  createAction(LevelPlayerAction.LEFT, "left", { left: true }),
  createAction(LevelPlayerAction.RIGHT, "right", { right: true }),
  createAction(LevelPlayerAction.JUMP, "jump", { jump: true }),
  createAction(LevelPlayerAction.LEFT_JUMP, "leftJump", {
    left: true,
    jump: true,
  }),
  createAction(LevelPlayerAction.RIGHT_JUMP, "rightJump", {
    right: true,
    jump: true,
  }),
  createAction(LevelPlayerAction.LEFT_RUN, "leftRun", {
    left: true,
    run: true,
  }),
  createAction(LevelPlayerAction.RIGHT_RUN, "rightRun", {
    right: true,
    run: true,
  }),
];

/**
 * action -> input
 */
export function actionToInput(action: LevelPlayerAction): PlayerInputState {
  return { ...(LEVEL_PLAYER_ACTIONS[action]?.input ?? {}) };
}

function createAction(
  action: LevelPlayerAction,
  name: string,
  input: PlayerInputState,
): LevelPlayerActionDefinition {
  return { action, name, input };
}
