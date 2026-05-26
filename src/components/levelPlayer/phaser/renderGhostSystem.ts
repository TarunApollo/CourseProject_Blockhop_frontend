import { CT } from "../ecs/core/ComponentTypes";
import type { Registry } from "../ecs/core/Registry";
import {
  getGameObject,
  removeGameObject,
  setGameObject,
  type PhaserRenderContext,
} from "./phaserAdapter";
import {
  PLAYER_ORIGIN_Y,
  PLAYER_RENDER_SIZE,
  SHELL_ORIGIN_Y,
  SMALL_PLAYER_RENDER_SIZE,
} from "./phaserConstants";

/**
 * Render depth for ghost sprites.
 *
 * Strictly below the live `PLAYER_DEPTH` (`Number.MAX_SAFE_INTEGER - 1`) so
 * the live player always draws on top of any ghost — including when the
 * ghost is carrying a shell. The exact value is unimportant as long as it
 * stays below the live depths used in `renderSystem`.
 */
const GHOST_DEPTH = Number.MAX_SAFE_INTEGER - 1000;

/// Translucency applied to every ghost sprite.
const GHOST_ALPHA = 0.45;

/**
 * Bluish tint applied to ghost sprites to visually distinguish them from
 * the live player. Reads as "spectral / replay" rather than realistic.
 */
const GHOST_TINT = 0x88aaff;

/**
 * Renders the ghost-replay entities of a separate ECS registry into a
 * separate Phaser sprite cache.
 *
 * Only entities carrying `CT.Ghost` are drawn — the ghost runtime's other
 * entities (tiles, enemies, the door, etc.) are intentionally invisible so
 * they don't duplicate the live world.
 *
 * Sprites are stored in `context.gameObjects`, keyed by entity id. The
 * caller must pass a render context distinct from the live one (typically
 * stored alongside the ghost runtime), otherwise live and ghost sprite
 * caches would collide on overlapping entity ids.
 *
 * Idempotent: safe to call once per frame.
 *
 * @param context  ghost-only render context (separate from the live one)
 * @param registry the ghost runtime's ECS registry
 */
export function renderGhostSystem(
  context: PhaserRenderContext,
  registry: Registry,
): void {
  removeDeadGhostObjects(context, registry);

  for (const entity of registry.view([CT.Ghost, CT.Transform, CT.Sprite])) {
    const transform = registry.getComponent(entity, CT.Transform);
    if (!transform) continue;

    let gameObject = getGameObject(context, entity);
    if (!gameObject) {
      gameObject = createGhostSpriteForEntity(context, registry, entity);
    }
    if (!gameObject) continue;

    gameObject.x = transform.x;
    gameObject.y = transform.y;
    gameObject.rotation = transform.rotation;

    if (registry.hasComponent(entity, CT.Player)) {
      const player = registry.getComponent(entity, CT.Player);
      const size = player?.isSmall ? SMALL_PLAYER_RENDER_SIZE : PLAYER_RENDER_SIZE;
      gameObject.setDisplaySize(size, size);
      gameObject.setOrigin(0.5, PLAYER_ORIGIN_Y);
    }

    if (registry.hasComponent(entity, CT.Shell)) {
      gameObject.setOrigin(0.5, SHELL_ORIGIN_Y);
    }
  }
}

/**
 * Removes Phaser sprites whose underlying entities have been destroyed or
 * lost their `Sprite` / `Ghost` component since the last frame. Without
 * this, ghost-tagged entities removed from the ghost runtime would leave
 * orphaned sprites on the scene.
 */
function removeDeadGhostObjects(
  context: PhaserRenderContext,
  registry: Registry,
): void {
  for (const entity of context.gameObjects.keys()) {
    if (
      !registry.hasComponent(entity, CT.Sprite)
      || !registry.hasComponent(entity, CT.Ghost)
    ) {
      removeGameObject(context, entity);
    }
  }
}

/**
 * Creates a new Phaser sprite for the given ghost-tagged entity and
 * applies the ghost visual treatment (alpha, tint, depth).
 *
 * The visual treatment is applied once at creation. Phaser sprite state
 * is sticky, so per-frame reapplication is unnecessary.
 */
function createGhostSpriteForEntity(
  context: PhaserRenderContext,
  registry: Registry,
  entity: number,
): Phaser.GameObjects.Sprite | undefined {
  const sprite = registry.getComponent(entity, CT.Sprite);
  const transform = registry.getComponent(entity, CT.Transform);
  if (!transform || !sprite) return undefined;

  const phaserSprite = context.scene.add.sprite(
    transform.x,
    transform.y,
    sprite.key,
    sprite.frame,
  );

  if (sprite.width !== undefined && sprite.height !== undefined) {
    phaserSprite.setDisplaySize(sprite.width, sprite.height);
  }
  if (sprite.originX !== undefined && sprite.originY !== undefined) {
    phaserSprite.setOrigin(sprite.originX, sprite.originY);
  }

  phaserSprite.setAlpha(GHOST_ALPHA);
  phaserSprite.setTint(GHOST_TINT);
  phaserSprite.setDepth(GHOST_DEPTH);

  setGameObject(context, entity, phaserSprite);
  return phaserSprite;
}
