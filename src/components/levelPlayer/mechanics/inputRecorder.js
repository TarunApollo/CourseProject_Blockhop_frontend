/**
 * inputRecorder.js
 *
 * Anti-cheat input recorder.  Records every movement key-press during a run
 * so the backend can replay the inputs against the level's physics and
 * validate that the submitted completion is legitimate.
 *
 * Usage (from the Phaser scene):
 *   create()  → call reset() to start a fresh recording
 *   update()  → call record(cursors, scene) every frame
 *   on complete → read getLog() and send it with the attempt payload
 */

/** @type {{ key: string, time: number }[]} */
let log = [];

/** High-resolution epoch timestamp captured at the start of the run. */
let startTime = 0;

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
  startTime = Date.now();
  prevState = {};
}

/**
 * Sample the cursor keys and record any state changes that happened
 * since the previous frame.
 *
 * Each entry uses the format:
 *   { key: "<keyName>_down" | "<keyName>_up", time: <ms since run start> }
 *
 * Only *edges* (press / release) are recorded so the log stays compact.
 *
 * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors
 */
export function record(cursors) {
  const now = Date.now() - startTime;

  for (const name of TRACKED_KEYS) {
    const isDown = cursors[name]?.isDown ?? false;
    const wasDown = prevState[name] ?? false;

    if (isDown && !wasDown) {
      log.push({ key: `${name}_down`, time: now });
    } else if (!isDown && wasDown) {
      log.push({ key: `${name}_up`, time: now });
    }

    prevState[name] = isDown;
  }
}

/**
 * Return a shallow copy of the recorded log.
 * Safe to call at any point; does not mutate internal state.
 *
 * @returns {{ key: string, time: number }[]}
 */
export function getLog() {
  return [...log];
}
