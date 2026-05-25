export enum MoveState {
  IDLE,
  WALKING,
  JUMPING,
  FALLING,
  KNOCKBACK,
}

export enum LifeState {
  ALIVE,
  DYING,
  DEAD,
}

export const HORIZONTAL_DIRECTION = {
  LEFT: "left",
  NONE: "none",
  RIGHT: "right",
} as const;

export type HorizontalDirection = "left" | "none" | "right";
export type ActiveHorizontalDirection = "left" | "right";
