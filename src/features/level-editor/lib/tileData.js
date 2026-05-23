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
  tileId: 'terrain.grass.block',
  type: 'AutoTile',
  category: 'ground',
}

export const TILE_ID_BY_GID = {
  1: 'terrain.grass.block.top.left',
  2: 'terrain.grass.block.top',
  3: 'terrain.grass.block.top.right',
  4: 'terrain.grass.horizontal.left',
  5: 'terrain.grass.horizontal.middle',
  6: 'terrain.grass.horizontal.right',
  7: 'terrain.grass.block',
  8: 'terrain.grass.vertical.top',
  10: 'platform.bridge.logs',
  11: 'terrain.grass.block.left',
  12: 'terrain.grass.block.center',
  13: 'terrain.grass.block.right',
  14: 'terrain.grass.cloud.left',
  15: 'terrain.grass.cloud.middle',
  16: 'terrain.grass.cloud.right',
  17: 'terrain.grass.cloud',
  18: 'terrain.grass.vertical.middle',
  21: 'terrain.grass.block.bottom.left',
  22: 'terrain.grass.block.bottom',
  23: 'terrain.grass.block.bottom.right',
  24: 'terrain.grass.horizontal.overhang.left',
  26: 'terrain.grass.horizontal.overhang.right',
  28: 'terrain.grass.vertical.bottom',
  33: 'block.strong.empty',
  38: 'terrain.grass.ramp.long.a',
  39: 'terrain.grass.ramp.long.b',
  43: 'decoration.mushroom.red',
  48: 'decoration.hill',
  49: 'terrain.grass.ramp.long.c',
  51: 'block.red',
  52: 'block.green',
  53: 'block.blue',
  58: 'terrain.grass.ramp.short.a',
  59: 'terrain.grass.ramp.short.b',
  61: 'hazard.block.spikes',
  62: 'hazard.spikes',
  41: 'block.planks',
  42: 'block.plank',
  67: 'decoration.sign',
  68: 'decoration.bush',
  69: 'flag.green',
  77: 'decoration.sign.right',
  78: 'decoration.cactus',
  87: 'decoration.sign.exit',
  88: 'decoration.grass.purple',
  91: 'enemy.slime.normal',
  92: 'enemy.snail',
  93: 'enemy.bee',
  94: 'enemy.slime.spiked',
  97: 'decoration.sign.left',
  98: 'decoration.grass',
  106: 'door.closed.top',
  107: 'door.open.top',
  108: 'decoration.fence',
  109: 'coin.gold',
  116: 'door.closed.bottom',
  117: 'door.open.bottom',
  119: 'coin.silver',
  129: 'coin.bronze',
}
export const GID_BY_TILE_ID = Object.fromEntries(
  Object.entries(TILE_ID_BY_GID).map(([gid, tileId]) => [tileId, Number(gid)])
)

export function gidToTileId(gid) {
  return TILE_ID_BY_GID[gid] || 'terrain.grass.horizontal.middle'
}

export function tileIdToGid(tileId) {
  return GID_BY_TILE_ID[tileId] || 5
}

function withTileIds(tile) {
  return {
    ...tile,
    tileId: gidToTileId(tile.gid),
    tiles: tile.tiles?.map(offset => ({
      ...offset,
      tileId: gidToTileId(offset.gid),
    })),
  }
}

export const groundTiles = [
  SPECIAL_AUTOTILE,
  ...ALL_GROUND_TILES.filter(tile => (
    tile.gid !== SPECIAL_AUTOTILE.gid &&
    SIDEBAR_GROUND_GIDS.has(tile.gid)
  )).sort((a, b) => (
    SIDEBAR_GROUND_GID_INDEX.get(a.gid) - SIDEBAR_GROUND_GID_INDEX.get(b.gid)
  )).map(withTileIds)
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
  { gid: 93, type: 'Enemy_Bee', category: 'enemy' },
  { gid: 94, type: 'Enemy_Slime_Spiked', category: 'enemy' },
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
].map(withTileIds)

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
