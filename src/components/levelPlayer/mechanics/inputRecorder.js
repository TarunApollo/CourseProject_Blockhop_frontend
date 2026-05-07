/**
 * inputRecorder.js
 *
 * Anti-cheat input recorder.  Records every movement key-press during a run
 * so the backend can replay the inputs against the level's physics and
 * validate that the submitted completion is legitimate.
 *
 * Timestamps use the game frame count because the game runs at a fixed 60
 * fps timestep. Frame numbers are deterministic and directly comparable with
 * heartbeat data (to be implemented in the future).
 *
 * Phaser fixed timestep:
 *   https://newdocs.phaser.io/docs/3.80.0/Phaser.Types.Core.FPSConfig
 *
 * Usage (from the Phaser scene):
 *   create()  → call reset() to start a fresh recording
 *   update()  → call record(cursors) every frame
 *   on complete → read getLog() and send it with the attempt payload
 */

/** @type {{ key: string, frame: number }[]} */
let log = [];

/**
 * Monotonic frame counter, incremented once per call to record().
 * Starts at 0 on reset().
 */
let frameCount = 0;

/**
 * Snapshot of which keys were down last frame so we can detect
 * press / release edges and only log *changes*.
 */
let prevState = {};

const TRACKED_KEYS = ["left", "right", "up", "shift"];

/**
 * Reset the recorder for a new run.
 * Must be called at the start of every attempt (i.e. in create()).
 */
export function reset() {
  log = [];
  frameCount = 0;
  prevState = {};
}

/**
 * Sample the cursor keys and record any state changes that happened
 * since the previous frame.
 *
 * Each entry uses the format:
 *   { key: "<keyName>_down" | "<keyName>_up", frame: <frame number> }
 *
 * Only *edges* (press / release) are recorded so the log stays compact.
 *
 * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors
 */
export function record(cursors) {
  const frame = frameCount++;

  for (const name of TRACKED_KEYS) {
    const isDown = cursors[name]?.isDown ?? false;
    const wasDown = prevState[name] ?? false;

    if (isDown && !wasDown) {
      log.push({ key: `${name}_down`, frame });
    } else if (!isDown && wasDown) {
      log.push({ key: `${name}_up`, frame });
    }

    prevState[name] = isDown;
  }
}

/**
 * Return a shallow copy of the recorded log.
 * Safe to call at any point; does not mutate internal state.
 *
 * @returns {{ key: string, frame: number }[]}
 */
export function getLog() {
  return [...log];
}
