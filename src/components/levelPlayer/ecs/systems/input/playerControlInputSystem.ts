

/**
 * adapter for input state
 * allow partial boolean value
 */
export type PlayerInputState = {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  climbUp?: boolean;
  climbDown?: boolean;
  climbExit?: boolean;
  run?: boolean;
  pickupAndThrow?: boolean;
};


export type PlayerOperation = {
  left: boolean;
  right: boolean;
  jump: boolean;          // space on not ladder
  climbUp: boolean;       // up down only for climbing
  climbDown: boolean;
  climbExit: boolean;     // space on ladder
  run: boolean;
  pickupAndThrow: boolean; //z for pickup the throw shell
};

/**
 * convert to playerInputState -> playerOperation(must 5 boolean)
 * and consumed by movementSystem
 */
export function playerOperationFromInput(
  input: PlayerInputState = {},
): PlayerOperation {
  return {
    left: input.left ?? false,
    right: input.right ?? false,
    jump: input.jump ?? false,
    climbUp: input.climbUp ?? false,
    climbDown: input.climbDown ?? false,
    climbExit: input.climbExit ?? false,
    run: input.run ?? false,
    pickupAndThrow: input.pickupAndThrow ?? false,
  };
}
