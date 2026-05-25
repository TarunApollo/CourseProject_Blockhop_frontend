export const TILE_SIZE = 128;

// To make the 97px tall visual alien exactly 1.3 blocks tall (166px):
// texture scale = 128/97 * 166 ≈ 219
export const PLAYER_RENDER_SIZE = 219;
// Small player must fit through a 1-tile (128px) gap. 166 * 0.72 = 119.5px tall.
export const SMALL_PLAYER_RENDER_SIZE = PLAYER_RENDER_SIZE * 0.72;
export const PLAYER_FRAME_SIZE = 128;
export const PLAYER_VISIBLE_HEIGHT = 97;
export const PLAYER_VISIBLE_BOTTOM_Y = 128;
export const PLAYER_ORIGIN_Y =
  (PLAYER_VISIBLE_BOTTOM_Y - PLAYER_VISIBLE_HEIGHT / 2) / PLAYER_FRAME_SIZE;
export const SNAIL_ORIGIN_Y = 75 / TILE_SIZE;
export const SHELL_ORIGIN_Y = 88 / TILE_SIZE;
export const SLIME_ORIGIN_Y = 87 / TILE_SIZE;
export const PLAYER_SKINS = ["beige", "green", "pink", "purple", "yellow"];
export const DEFAULT_PLAYER_SKIN = "green";
export const TARGET_RENDER_FPS = 120;

export const DOOR_TOP_OFFSET = TILE_SIZE;

export const COIN_POP_SIZE = TILE_SIZE * 0.6;
export const COIN_POP_HEIGHT = TILE_SIZE * 1.5;
export const COIN_POP_DURATION = 500;

export const DAMAGE_SHAKE_DURATION = 200;
export const DAMAGE_SHAKE_INTENSITY = 0.007;

export const DEATH_SHAKE_DURATION = 150;
export const DEATH_SHAKE_INTENSITY = 0.012;
export const FALL_RESTART_DELAY = 300;
export const DEATH_RESTART_DELAY = 1500;

export const LEVEL_COMPLETE_SLIDE_DURATION = 400;
export const  LEVEL_COMPLETE_FADE_DURATION = 300;
export const LEVEL_COMPLETE_FLASH_DURATION = 500;
export const LEVEL_COMPLETE_CALLBACK_DELAY = 400;
