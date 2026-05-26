const MASK_N = 1
const MASK_E = 2
const MASK_S = 4
const MASK_W = 8

// cloud tiles
const LEVITATING_ROLES = new Set([
    'cloud.left', 'cloud.middle', 'cloud.right', 'cloud'
])

// MudGrass: top-surface tiles with grass edges on closed sides
const MUD_GRASS_ROLES = new Set([
    'block.top.left', 'block.top', 'block.top.right',
    'horizontal.left', 'horizontal.middle', 'horizontal.right',
    'block', 'vertical.top'
])

// MudBare: below-surface dirt/fill tiles
const MUD_BARE_ROLES = new Set([
    'block.left', 'block.center', 'block.right',
    'vertical.middle', 'block.bottom.left', 'block.bottom', 'block.bottom.right',
    'horizontal.overhang.left', 'horizontal.overhang.right', 'vertical.bottom'
])

// MudGrass caps 
const MUD_GRASS_CAP_ROLES = new Set([
    'horizontal.overhang.left', 'horizontal.overhang.right'
])

// Mask bits = where neighbors ARE (open/connected sides).
// "Closed" (border/edge) = bit is NOT set.

export const MUD_GRASS_MASK_TO_ROLE = {
    0: 'block',                                     // all sides closed
    [MASK_S]: 'vertical.top',                      // only S open
    [MASK_E]: 'horizontal.left',                   // only E open
    [MASK_W]: 'horizontal.right',                  // only W open
    [MASK_E | MASK_S]: 'block.top.left',           // E+S open
    [MASK_E | MASK_W]: 'horizontal.middle',        // E+W open
    [MASK_S | MASK_W]: 'block.top.right',          // S+W open
    [MASK_E | MASK_S | MASK_W]: 'block.top',       // E+S+W open
}

export const MUD_BARE_MASK_TO_ROLE = {
    [MASK_N]: 'vertical.bottom',                    // only N open
    [MASK_N | MASK_E]: 'block.bottom.left',          // N+E open
    [MASK_N | MASK_W]: 'block.bottom.right',         // N+W open
    [MASK_N | MASK_S]: 'vertical.middle',           // N+S open
    [MASK_N | MASK_E | MASK_W]: 'block.bottom',     // N+E+W open
    [MASK_N | MASK_E | MASK_S]: 'block.left',       // N+E+S open
    [MASK_N | MASK_S | MASK_W]: 'block.right',      // N+S+W open
    [MASK_N | MASK_E | MASK_S | MASK_W]: 'block.center', // all open
}

/**
 * Splits a full tile name into its theme and its specific shape.
 * Example: "terrain.grass.block.top.left" becomes -> theme: "grass", shape: "block.top.left"
 */
export function parseTileId(tileId) {
    if (!tileId) return { theme: null, role: null };
    const parts = tileId.split('.');
    if (parts.length >= 3 && parts[0] === 'terrain') {
        const theme = parts[1]; // The color/biome (like "grass" or "snow")
        const role = parts.slice(2).join('.'); // The actual shape (like "top left corner")
        return { theme, role };
    }
    return { theme: null, role: tileId };
}

export function getAutotileFamilyByTileId(tileId) {
    const { role } = parseTileId(tileId);
    if (!role) return null;
    if (LEVITATING_ROLES.has(role)) return 'levitating';
    if (MUD_GRASS_ROLES.has(role)) return 'mudGrass';
    if (MUD_BARE_ROLES.has(role)) return 'mudBare';
    return null;
}

export function isMudGrassCapTileId(tileId) {
    const { role } = parseTileId(tileId);
    return role ? MUD_GRASS_CAP_ROLES.has(role) : false;
}

export function computeAutotileMask(x, y, hasTileAt) {
    let mask = 0
    if (hasTileAt(x, y - 1)) mask |= MASK_N
    if (hasTileAt(x + 1, y)) mask |= MASK_E
    if (hasTileAt(x, y + 1)) mask |= MASK_S
    if (hasTileAt(x - 1, y)) mask |= MASK_W
    return mask
}

function roleFromLevitatingMask(mask, seedRole) {
    const hasEast = (mask & MASK_E) !== 0
    const hasWest = (mask & MASK_W) !== 0

    if (hasEast && hasWest) return 'cloud.middle'
    if (hasEast) return 'cloud.left'
    if (hasWest) return 'cloud.right'
    return 'cloud'
}

function fallbackMudGrassRole(mask, seedRole) {
    const east = (mask & MASK_E) !== 0
    const south = (mask & MASK_S) !== 0
    const west = (mask & MASK_W) !== 0

    // Ignore any blocks above this one, because this is a surface grass block
    const stripped = mask & (MASK_E | MASK_S | MASK_W)
    if (MUD_GRASS_MASK_TO_ROLE[stripped] !== undefined) {
        return MUD_GRASS_MASK_TO_ROLE[stripped]
    }

    // If we can't find an exact match, try our best to guess the closest shape
    if (east && south && west) return 'block.top'
    if (east && south) return 'block.top.left'
    if (south && west) return 'block.top.right'
    if (east && west) return 'horizontal.middle'
    if (south) return 'vertical.top'
    if (east) return 'horizontal.left'
    if (west) return 'horizontal.right'
    return 'block'
}

function fallbackMudBareRole(mask, seedRole) {
    const north = (mask & MASK_N) !== 0
    const east = (mask & MASK_E) !== 0
    const south = (mask & MASK_S) !== 0
    const west = (mask & MASK_W) !== 0

    // Underground dirt blocks should always have another block directly above them
    if (north && east && south && west) return 'block.center'
    if (north && east && west) return 'block.bottom'
    if (north && east && south) return 'block.left'
    if (north && south && west) return 'block.right'
    if (north && east) return 'block.bottom.left'
    if (north && west) return 'block.bottom.right'
    if (north && south) return 'vertical.middle'
    if (north) return 'vertical.bottom'
    return seedRole
}

export function resolveAutotileRole(family, mask, seedRole) {
    if (family === 'levitating') {
        return roleFromLevitatingMask(mask, seedRole)
    }

    if (family === 'mudGrass') {
        return MUD_GRASS_MASK_TO_ROLE[mask] ?? fallbackMudGrassRole(mask, seedRole)
    }

    if (family === 'mudBare') {
        return MUD_BARE_MASK_TO_ROLE[mask] ?? fallbackMudBareRole(mask, seedRole)
    }

    return seedRole
}
