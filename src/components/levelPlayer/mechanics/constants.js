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
// The original gravity (0.9) and flat jump velocity (-20) produced a sluggish,
// "floaty" feel.  The values below are tuned to match three key traits of
// Super Mario Bros.:
//
//   1. STRONG GRAVITY  – snappy, weighted jumps; the player lands quickly.
//   2. VARIABLE JUMP   – tap for a short hop, hold for a full-height jump.
//   3. FAST FALL       – descents are noticeably steeper than ascents,
//                        giving the iconic "floats up / plummets down" arc.
//   4. HORIZONTAL SKID – brief deceleration instead of an instant stop.
//
// Matter.js gravity is measured in pixels/frame² (added to vy every step).

// Base gravity
export const GRAVITY = 2.5;

// Upward velocity applied the instant the player presses jump.
// Raised from -17 to -22 so a full held jump clears ~2.5 tiles of height.
export const JUMP_VY = -22;

// Extra upward impulse per held frame while still rising.
export const JUMP_HOLD_FORCE = -0.8;

// Maximum frames the jump-hold extension can last.
// Raised from 14 to 18 frames (~0.3 s at 60 fps) so full-height jumps
// feel rewarding to hold without cutting off too soon.
export const JUMP_HOLD_MAX_FRAMES = 18;

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
export const BEE_SPEED = 3; // horizontal flight speed for bees (pixels / frame)
