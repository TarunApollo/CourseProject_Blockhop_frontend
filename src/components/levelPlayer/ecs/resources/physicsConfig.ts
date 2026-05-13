/**
 * global physics parameters definition
 */
export const GRAVITY = 2.5;
export const JUMP_HOLD_FORCE = -0.8;
export const JUMP_HOLD_MAX_FRAMES = 18;
export const FALL_BOOST = 0.8;
export const MAX_FALL_VY = 18;
export const H_DECEL = 0.8;

/**
 * collision category 
 */
export const CATEGORY_DEFAULT = 0x0001;
export const CATEGORY_SEMISOLID = 0x0002;
export const CATEGORY_ENEMY = 0x0004;
export const CATEGORY_COIN = 0x0008;
export const CATEGORY_DOOR = 0x0010;
