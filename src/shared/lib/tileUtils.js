export const TILE_SIZE = 128;
export const TILESET_COLUMNS = 10;
const CUSTOM_TILE_IMAGE_BY_GID = {
  93: "/assets/enemies/bee/bee_rest.png",
};

export function getTileSpriteStyle(gid, displaySize = 64) {
  if (!gid) return {};
  const customImage = CUSTOM_TILE_IMAGE_BY_GID[gid];
  if (customImage) {
    return {
      backgroundImage: `url('${customImage}')`,
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      width: `${displaySize}px`,
      height: `${displaySize}px`,
    };
  }
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
