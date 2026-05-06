// TODO: make get this from backend
const ALL_GROUND_TILES = [
  { gid: 1, type: 'Ground', category: 'ground' },
  { gid: 2, type: 'Ground', category: 'ground' },
  { gid: 3, type: 'Ground', category: 'ground' },
  { gid: 4, type: 'Ground', category: 'ground' },
  { gid: 5, type: 'Ground', category: 'ground' },
  { gid: 6, type: 'Ground', category: 'ground' },
  { gid: 7, type: 'Ground', category: 'ground' },
  { gid: 8, type: 'Ground', category: 'ground' },
  { gid: 11, type: 'Ground', category: 'ground' },
  { gid: 12, type: 'Ground', category: 'ground' },
  { gid: 13, type: 'Ground', category: 'ground' },
  { gid: 14, type: 'Ground', category: 'ground' },
  { gid: 15, type: 'Ground', category: 'ground' },
  { gid: 16, type: 'Ground', category: 'ground' },
  { gid: 17, type: 'Ground', category: 'ground' },
  { gid: 18, type: 'Ground', category: 'ground' },
  { gid: 21, type: 'Ground', category: 'ground' },
  { gid: 22, type: 'Ground', category: 'ground' },
  { gid: 23, type: 'Ground', category: 'ground' },
  { gid: 24, type: 'Ground', category: 'ground' },
  { gid: 26, type: 'Ground', category: 'ground' },
  { gid: 28, type: 'Ground', category: 'ground' },
  { gid: 33, type: 'Ground', category: 'ground' },
  { gid: 38, type: 'Ground', category: 'ground' },
  { gid: 39, type: 'Ground', category: 'ground' },
  { gid: 43, type: 'Ground', category: 'ground' },
  { gid: 48, type: 'Ground', category: 'ground' },
  { gid: 49, type: 'Ground', category: 'ground' },
  { gid: 51, type: 'Ground', category: 'ground' },
  { gid: 52, type: 'Ground', category: 'ground' },
  { gid: 53, type: 'Ground', category: 'ground' },
  { gid: 58, type: 'Ground', category: 'ground' },
  { gid: 59, type: 'Ground', category: 'ground' },
  { gid: 10, type: 'Semisolid', category: 'special' },
  { gid: 61, type: 'Damage', category: 'hazard' },
  { gid: 62, type: 'Damage', category: 'hazard' },
]

const SIDEBAR_GROUND_GID_ORDER = [
  7, 17, 33, 38, 39, 49, 58, 59, 10, 51, 53, 52, 62, 61
]

// Yes, having a map like this is done by design. This way
// we can have other mappings in the future that aren't +20.
export const TILE_VARIANT_MAP = {
  4: 24,
  24: 4,
  6: 26,
  26: 6,
}

const SIDEBAR_GROUND_GIDS = new Set(SIDEBAR_GROUND_GID_ORDER)
const SIDEBAR_GROUND_GID_INDEX = new Map(
  SIDEBAR_GROUND_GID_ORDER.map((gid, idx) => [gid, idx])
)

const SPECIAL_AUTOTILE = {
  gid: 7,
  type: 'AutoTile',
  category: 'ground',
}

export const groundTiles = [
  SPECIAL_AUTOTILE,
  ...ALL_GROUND_TILES.filter(tile => (
    tile.gid !== SPECIAL_AUTOTILE.gid &&
    SIDEBAR_GROUND_GIDS.has(tile.gid)
  )).sort((a, b) => (
    SIDEBAR_GROUND_GID_INDEX.get(a.gid) - SIDEBAR_GROUND_GID_INDEX.get(b.gid)
  ))
]

export const objectTiles = [
  // { gid: 31, type: 'ExclamationMark', category: 'decoration' },
  // { gid: 32, type: 'ExclamationMark', category: 'decoration' },
  { gid: 41, type: 'BoxDouble', category: 'item' },
  { gid: 42, type: 'Box', category: 'item' },
  { gid: 67, type: 'Decoration', category: 'decoration' },
  { gid: 68, type: 'Decoration', category: 'decoration' },
  { gid: 69, type: 'Start_Flag', category: 'essential' },
  { gid: 77, type: 'Decoration', category: 'decoration' },
  { gid: 78, type: 'Decoration', category: 'decoration' },
  { gid: 87, type: 'Decoration', category: 'decoration' },
  { gid: 88, type: 'Decoration', category: 'decoration' },
  { gid: 91, type: 'Enemy_Slime_Normal', category: 'enemy' },
  { gid: 92, type: 'Enemy_Snail', category: 'enemy' },
  { gid: 97, type: 'Decoration', category: 'decoration' },
  { gid: 98, type: 'Decoration', category: 'decoration' },
  {
    gid: 116,
    type: 'Door_Closed',
    category: 'essential',
    composite: true,
    tiles: [
      { gid: 116, dx: 0, dy: 0 },
      { gid: 106, dx: 0, dy: -1 }
    ]
  },
  { gid: 108, type: 'Decoration', category: 'decoration' },
  { gid: 109, type: 'Item_Coin_Gold', category: 'collectible' },
  // { gid: 110, type: 'Item_Coin_Gold_Side', category: 'collectible' },
  { gid: 119, type: 'Item_Coin_Silver', category: 'collectible' },
  // { gid: 120, type: 'Item_Coin_Silver_Side', category: 'collectible' },
  { gid: 129, type: 'Item_Coin_Bronze', category: 'collectible' },
  // { gid: 130, type: 'Item_Coin_Bronze_Side', category: 'collectible' },
]

import { getTileSpriteStyle } from "@/shared/lib/tileUtils";

export function getSpritePosition(gid, tileSize = 128) {
  const style = getTileSpriteStyle(gid, tileSize);
  return style.backgroundPosition;
}

export function getTileType(gid) {
  const allTiles = [...ALL_GROUND_TILES, ...objectTiles]
  const tile = allTiles.find(t => t.gid === gid)
  return tile?.type || null
}

export function getTileCategory(gid) {
  const allTiles = [...groundTiles, ...objectTiles]
  const tile = allTiles.find(t => t.gid === gid)
  return tile?.category || null
}

export function isGroundTile(gid) {
  return ALL_GROUND_TILES.some(t => t.gid === gid)
}

export function isObjectTile(gid) {
  return objectTiles.some(t => t.gid === gid)
}

export function getTileData(gid) {
  const allTiles = [...ALL_GROUND_TILES, ...objectTiles]
  return allTiles.find(t => t.gid === gid) || null
}
