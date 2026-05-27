const TILES_ATLAS_DIM = { w: 1169, h: 1169 };
const ENEMIES_ATLAS_DIM = { w: 519, h: 519 };

const cache = {
    tiles: { frames: null, promise: null },
    enemies: { frames: null, promise: null },
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const ATLAS_URLS = {
    tiles: `${API_BASE_URL}/assets/spritesheets?type=tiles`,
    enemies: `${API_BASE_URL}/assets/spritesheets?type=enemies`,
};

const ENEMY_TILE_TO_FRAME = {
    "enemy.slime.normal": "slime_normal_walk_a",
    "enemy.slime.spiked": "slime_spike_walk_a",
    "enemy.snail": "snail_walk_a",
    "enemy.bee": "bee_a",
};

export const TILE_IMAGE_PATH = "/assets/spritesheet-tiles-default.png";
export const ENEMY_IMAGE_PATH = "/assets/spritesheet-enemies-default.png";

async function loadAtlasMetadata(type) {
    const c = cache[type];
    if (c.frames) return c.frames;
    if (c.promise) return c.promise;

    c.promise = (async () => {
        try {
            const response = await fetch(ATLAS_URLS[type], { credentials: "include" });
            if (!response.ok) return null;
            const data = await response.json();
            c.frames = data.frames ?? null;
            return c.frames;
        } catch (err) {
            console.error(`Failed to load ${type} spritesheet atlas metadata`, err);
            return null;
        } finally {
            c.promise = null;
        }
    })();

    return c.promise;
}

export function getTileAtlasFrameByTileId(tileId) {
    if (!cache.tiles.frames) return null;
    return cache.tiles.frames[tileId.replaceAll(".", "_")] ?? null;
}

export function getEnemiesAtlasFrameByTileId(tileId) {
    if (!cache.enemies.frames) return null;
    const frameKey = ENEMY_TILE_TO_FRAME[tileId];
    return frameKey ? (cache.enemies.frames[frameKey] ?? null) : null;
}

export async function ensureAllAtlasMetadataLoaded() {
    const [tilesFrames, enemiesFrames] = await Promise.all([
        loadAtlasMetadata("tiles"),
        loadAtlasMetadata("enemies"),
    ]);
    return { tilesFrames, enemiesFrames };
}

/**
 *
 * The backend guarantees every atlas entry has:
 *   { frame: {x,y,w,h}, trimmed: false, spriteSourceSize: {x:0,y:0,w,h}, sourceSize: {w,h} }
 * All sprites are square
 */
export function getTileSpriteStyleByTileId(tileId, displaySize = 64) {
    if (!tileId) return {};

    const isEnemy = tileId.startsWith("enemy.");
    const entry = isEnemy ? getEnemiesAtlasFrameByTileId(tileId) : getTileAtlasFrameByTileId(tileId);
    if (!entry) return {};

    const frame = entry.frame;
    const imagePath = isEnemy ? ENEMY_IMAGE_PATH : TILE_IMAGE_PATH;
    const atlasDim = isEnemy ? ENEMIES_ATLAS_DIM : TILES_ATLAS_DIM;
    const scale = displaySize / frame.w;

    return {
        backgroundImage: `url('${imagePath}')`,
        backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
        backgroundSize: `${atlasDim.w * scale}px ${atlasDim.h * scale}px`,
        backgroundRepeat: "no-repeat",
        width: `${displaySize}px`,
        height: `${displaySize}px`,
    };
}
