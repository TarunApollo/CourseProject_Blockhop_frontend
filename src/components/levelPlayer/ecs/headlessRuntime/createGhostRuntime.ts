import { createHeadlessLevelRuntime } from "./create";
import { LevelRuntime } from "./update";
import { LevelData } from "./types";
import * as Comp from "../components/ComponentClasses";

/**
 * Per-frame input snapshot from the backend ghost endpoint
 * (`List<InputFrameDTO>` in `GhostDTO.inputLog`).
 *
 * Mirrors the anticheat `InputFrameDTO` shape exactly. `throw` is
 * intentionally absent: the backend does not currently include it in
 * `InputFrameDTO`, so a ghost cannot reproduce button-triggered shell
 * pickups or throws today. Collision-triggered pickups still work.
 */
export type GhostInputFrame = {
  frame: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
};

/**
 * A ghost-replay runtime: a fully isolated headless `LevelRuntime` paired
 * with the recorded input log it will replay frame-by-frame, plus a cursor
 * tracking how many frames have already been consumed.
 *
 * The ghost runtime lives in its own Matter world and its own ECS registry,
 * so collisions and events cannot cross into the live runtime. The only
 * shared resource is the Phaser scene's wall clock, which the lockstep tick
 * uses to keep the ghost in sync with the live player.
 */
export type GhostRuntime = {
  runtime: LevelRuntime;
  inputLog: GhostInputFrame[];
  cursor: number;
};

/**
 * Creates a ghost runtime for the given level data and recorded input log.
 *
 * The headless runtime is constructed the same way the live runtime is, so
 * its player entity moves through the same physics for the same inputs. The
 * player entity is then tagged with {@link Comp.Ghost} so the dedicated
 * ghost render pass (see `renderSystem` filter in F7) draws it translucent.
 *
 * Items the ghost picks up (e.g. carried shells) will inherit the
 * {@link Comp.Ghost} marker dynamically when `carrySystem` equips them on a
 * tagged carrier (see F5).
 *
 * @param levelData the same level data passed to the live runtime
 * @param inputLog  the per-frame input snapshots to replay (frontend shape
 *                  of `InputFrameDTO`); the array is held by reference and
 *                  is not mutated
 * @returns a ghost runtime ready to be ticked in lockstep with the live one
 */
export function createGhostRuntime(
  levelData: LevelData,
  inputLog: GhostInputFrame[],
): GhostRuntime {
  const runtime = createHeadlessLevelRuntime(levelData);
  runtime.registry.addComponent(runtime.playerEntity, new Comp.Ghost());
  return { runtime, inputLog, cursor: 0 };
}
