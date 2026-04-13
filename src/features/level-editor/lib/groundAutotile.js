const MASK_N = 1
const MASK_E = 2
const MASK_S = 4
const MASK_W = 8

const LEVITATING_SOURCE_GIDS = new Set([14, 15, 16, 17])
const LEVITATING_SINGLETON_GID = 17
const GROUND_SINGLETON_GID = 7
const MUD_GRASS_SOURCE_GIDS = new Set([1, 2, 3, 4, 5, 6, 7, 8])
const MUD_BARE_SOURCE_GIDS = new Set([11, 12, 13, 18, 21, 22, 23, 28])
const MUD_GRASS_CAP_GIDS = new Set([24, 26])

// Mask bits = where neighbors ARE (open/connected sides).
// "Closed" (border/edge) = bit is NOT set.

// MudGrass: top-surface tiles with grass edges on closed sides
// GID 7 is the isolated singleton all sides closed.
export const MUD_GRASS_MASK_TO_GID = {
  0: 7,                                     // all closed 
  [MASK_S]: 8,                               // only S open 
  [MASK_E]: 4,                               // only E open 
  [MASK_W]: 6,                               // only W open 
  [MASK_E | MASK_S]: 1,                      // E+S open 
  [MASK_E | MASK_W]: 5,                      // E+W open 
  [MASK_S | MASK_W]: 3,                      // S+W open 
  [MASK_E | MASK_S | MASK_W]: 2,             // E+S+W open 
}

// MudBare: below-surface dirt tiles
// GID 12 is the fully connected piece (mask with all relevant neighbors)
export const MUD_BARE_MASK_TO_GID = {
  [MASK_N]: 28,                              // only N open 
  [MASK_N | MASK_E]: 21,                     // N+E open 
  [MASK_N | MASK_W]: 23,                     // N+W open 
  [MASK_N | MASK_S]: 18,                     // N+S open 
  [MASK_N | MASK_E | MASK_W]: 22,            // N+E+W open 
  [MASK_N | MASK_E | MASK_S]: 11,            // N+E+S open 
  [MASK_N | MASK_S | MASK_W]: 13,            // N+S+W open 
  [MASK_N | MASK_E | MASK_S | MASK_W]: 12,   // all open 
}

function has(mask, bit) {
  return (mask & bit) !== 0
}

export function getAutotileFamily(gid) {
  if (LEVITATING_SOURCE_GIDS.has(gid)) return 'levitating'
  if (MUD_GRASS_SOURCE_GIDS.has(gid)) return 'mudGrass'
  if (MUD_BARE_SOURCE_GIDS.has(gid)) return 'mudBare'
  return null
}

export function isMudGrassCapGid(gid) {
  return MUD_GRASS_CAP_GIDS.has(gid)
}

export function computeAutotileMask(x, y, hasTileAt) {
  let mask = 0
  if (hasTileAt(x, y - 1)) mask |= MASK_N
  if (hasTileAt(x + 1, y)) mask |= MASK_E
  if (hasTileAt(x, y + 1)) mask |= MASK_S
  if (hasTileAt(x - 1, y)) mask |= MASK_W
  return mask
}

function fallbackMudGrassGid(mask, seedGid) {
  // For masks not in the table (lets say with N set, which mudGrass
  // shouldn't normally have since N neighbor occupies a  mudBare role),
  // degrade gracefully.
  const east = has(mask, MASK_E)
  const south = has(mask, MASK_S)
  const west = has(mask, MASK_W)

  // Ignore north bit for mudGrass — strip it and re-lookup
  const stripped = mask & (MASK_E | MASK_S | MASK_W)
  if (MUD_GRASS_MASK_TO_GID[stripped] !== undefined) {
    return MUD_GRASS_MASK_TO_GID[stripped]
  }

  // Last resort manual fallback
  if (east && south && west) return 2
  if (east && south) return 1
  if (south && west) return 3
  if (east && west) return 5
  if (south) return 8
  if (east) return 4
  if (west) return 6
  return 7 // isolated
}

function fallbackMudBareGid(mask, seedGid) {
  const north = has(mask, MASK_N)
  const east = has(mask, MASK_E)
  const south = has(mask, MASK_S)
  const west = has(mask, MASK_W)

  // mudBare should always have N (tile above is of mudGrass surface),
  if (north && east && south && west) return 12
  if (north && east && west) return 22
  if (north && east && south) return 11
  if (north && south && west) return 13
  if (north && east) return 21
  if (north && west) return 23
  if (north && south) return 18
  if (north) return 28
  // No north neighbor — shouldn't happen for mudBare, return seedGid
  return seedGid
}

function gidFromLevitatingMask(mask, seedGid) {
  const hasEast = (mask & MASK_E) !== 0
  const hasWest = (mask & MASK_W) !== 0

  if (hasEast && hasWest) return 15
  if (hasEast) return 14
  if (hasWest) return 16
  return LEVITATING_SINGLETON_GID
}

function gidFromMudGrassMask(mask, seedGid) {
  return MUD_GRASS_MASK_TO_GID[mask] ?? fallbackMudGrassGid(mask, seedGid)
}

function gidFromMudBareMask(mask, seedGid) {
  return MUD_BARE_MASK_TO_GID[mask] ?? fallbackMudBareGid(mask, seedGid)
}

export function resolveAutotileGid(family, mask, seedGid) {
  if (family === 'levitating') {
    return gidFromLevitatingMask(mask, seedGid)
  }

  if (family === 'mudGrass') {
    return gidFromMudGrassMask(mask, seedGid)
  }

  if (family === 'mudBare') {
    return gidFromMudBareMask(mask, seedGid)
  }

  return seedGid
}
