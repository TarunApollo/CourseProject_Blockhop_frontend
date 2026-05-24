

/**
 * adapter for input state
 * allow partial boolean value
 */
export type PlayerInputState = {
  left?: boolean;
  right?: boolean;
  up?: boolean;
  down?: boolean;
  jump?: boolean;
  climbExit?: boolean;
  run?: boolean;
  throw?: boolean;
};


export type PlayerOperation = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  climbExit: boolean;
  run: boolean;
  throw: boolean;
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
    up: input.up ?? false,
    down: input.down ?? false,
    jump: input.jump ?? false,
    climbExit: input.climbExit ?? false,
    run: input.run ?? false,
    throw: input.throw ?? false,
  };
}
