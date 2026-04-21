export const TILE_SIZE = 128;
export const TILESET_COLUMNS = 10;

export function getTileSpriteStyle(gid, displaySize = 64) {
  if (!gid) return {};
  const id = gid - 1;
  const col = id % TILESET_COLUMNS;
  const row = Math.floor(id / TILESET_COLUMNS);

  const scale = displaySize / TILE_SIZE;
  const bgWidth = TILESET_COLUMNS * TILE_SIZE * scale;

  return {
    backgroundImage: "url('/assets/tiles.png')",
    backgroundSize: `${bgWidth}px auto`,
    backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
    width: `${displaySize}px`,
    height: `${displaySize}px`,
  };
}
