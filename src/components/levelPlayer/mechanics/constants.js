/**
 * constants.js
 *
 * Physics constants and collision-category bitmasks shared across all mechanics
 * modules.  Tune the values in this file to adjust game feel without touching
 * any game logic.
 */

// Collision categories for Matter.js bitmask filtering.
// Two bodies collide only when (A.category & B.mask) && (B.category & A.mask).
export const CATEGORY_DEFAULT = 0x0001; // regular tiles, world bounds, player
export const CATEGORY_SEMISOLID = 0x0002; // one-way platforms (collide from top only)
export const CATEGORY_ENEMY = 0x0004; // enemies – pass through the left world wall
export const CATEGORY_COIN = 0x0008; // coins – only interact with the player
export const CATEGORY_DOOR = 0x0010; // doors – sensor-only, only interact with the player

// ── MARIO-STYLE PHYSICS CONSTANTS ─────────────────────────────────────────
//
// Matter.js gravity is measured in pixels/frame² (added to vy every step).

export const GRAVITY = 2.5;

// Upward velocity applied the instant the player presses jump.
export const JUMP_VY = -22;

// Extra downward velocity added per frame when jump is released while rising.
// Since GRAVITY is already applied by Matter, this increases the per frame
// vertical velocity step during released ascent to roughly double the held
// ascent rate. A held jump is therefore about twice the height of a tap jump
// without any second upward push.
export const JUMP_GRAVITY_CUT = 2.5;

// Extra downward velocity added per frame while the player is falling.
// On top of base gravity this makes descents steeper than ascents.
export const FALL_BOOST = 0.8;

// Terminal velocity cap – prevents tunnelling through thin platforms.
export const MAX_FALL_VY = 18;

// Horizontal speeds in Matter velocity units (≈ pixels / frame).
export const WALK_SPEED = 8;
export const RUN_SPEED = 10;

// Fraction of horizontal speed kept per frame when no direction key is held.
// Values below 1 create a short skid before stopping (like Mario on ice).
// 0.80 gives a snappy but perceptible deceleration.
export const H_DECEL = 0.8;

// Horizontal speed of slime enemies (pixels / frame).
export const SLIME_SPEED = 4;
export const SNAIL_SPEED = 2.5;
export const SHELL_SPEED = 15; // speed of a kicked shell (pixels / frame)
