export const TILESET_ASSET_KEY = "tiles.default";

export function tileIdToFrame(tileId: string): string {
  return tileId.replaceAll(".", "_");
}
