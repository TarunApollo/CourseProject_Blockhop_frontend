import type { PlayerOperation } from "./movement/playerMovementSystem";

// TODO(leon): Convert Phaser cursor input into PlayerInputState, then call
// playerOperationFromInput before passing it to playerMovementSystem.
// write the logic in phaser/not here because this file is belongs to ECS system


/**
 * adapter for input state
 * allow partial boolean value 
 */
export type PlayerInputState = {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  run?: boolean;
};



/**
 * convert to playerInputState -> playerOperation(must 4 boolean)
 * and consumed by movementSystem
 */
export function playerOperationFromInput(
    input: PlayerInputState = {},
): PlayerOperation {
    return {
        left: input.left ?? false,
        right: input.right ?? false,
        jump: input.jump ?? false,
        run: input.run ?? false,
    };
}

