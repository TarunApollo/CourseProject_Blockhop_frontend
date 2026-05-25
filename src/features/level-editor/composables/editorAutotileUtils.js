import { worldLayer, levelTheme } from "./editorStore";
import { GRID_WIDTH, GRID_HEIGHT } from "../lib/editorConstants";
import {
  getAutotileFamilyByTileId,
  isMudGrassCapTileId,
  computeAutotileMask,
  resolveAutotileRole,
  parseTileId,
} from "../lib/groundAutotile";

export function isWithinBounds(x, y) {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

export function getKey(x, y) {
  return `${x},${y}`;
}

export function getAutoGroundTileAt(x, y) {
  const key = getKey(x, y);
  const tile = worldLayer.get(key);
  if (!tile || !tile.family) return null;
  return tile;
}

export function recomputeAutoGroundAt(x, y) {
  if (!isWithinBounds(x, y)) return;
  const key = getKey(x, y);
  const tile = worldLayer.get(key);

  if (!tile || !tile.auto) return;

  // Levitating tiles only see other levitating tiles as neighbors
  if (tile.family === "levitating") {
    const hasLevitatingAt = (nx, ny) => {
      const neighbor = getAutoGroundTileAt(nx, ny);
      return neighbor != null && neighbor.family === "levitating";
    };
    const mask = computeAutotileMask(x, y, hasLevitatingAt);
    const seedTileId = tile.seedTileId || tile.tileId;
    const { role } = parseTileId(seedTileId);
    const resolvedRole = resolveAutotileRole("levitating", mask, role);
    const resolvedTileId = `terrain.${levelTheme.value}.${resolvedRole}`;

    worldLayer.set(key, {
      ...tile,
      tileId: resolvedTileId,
    });
    return;
  }

  // Mud families: decide mudGrass vs mudBare based on north neighbor.
  const northNeighbor = getAutoGroundTileAt(x, y - 1);
  const northIsGround =
    northNeighbor &&
    (northNeighbor.family === "mudGrass" ||
      northNeighbor.family === "mudBare");

  const aboveTile = worldLayer.get(getKey(x, y - 1));
  const rightTile = worldLayer.get(getKey(x + 1, y));
  const aboveRole = aboveTile ? parseTileId(aboveTile.tileId).role : null;
  const rightRole = rightTile ? parseTileId(rightTile.tileId).role : null;

  const hasMudBareAnchor =
    aboveRole === "ramp.long.c" ||
    aboveRole === "ramp.short.a" ||
    aboveRole === "ramp.long.a" ||
    rightRole === "ramp.long.c";

  const roleFamily =
    tile.family === "mudBare"
      ? northIsGround || hasMudBareAnchor
        ? "mudBare"
        : "mudGrass"
      : northIsGround
        ? "mudBare"
        : "mudGrass";

  const hasMudNeighborAt = (nx, ny) => {
    const neighbor = getAutoGroundTileAt(nx, ny);
    if (neighbor) {
      if (neighbor.family === "levitating") return false;
      return true;
    }

    const worldNeighbor = worldLayer.get(getKey(nx, ny));
    if (!worldNeighbor) return false;
    const worldFamily = getAutotileFamilyByTileId(worldNeighbor.tileId);
    if (worldFamily) return worldFamily !== "levitating";
    return false;
  };

  const mask = computeAutotileMask(x, y, hasMudNeighborAt);
  const seedTileId = tile.seedTileId || tile.tileId;
  const { role } = parseTileId(seedTileId);
  const resolvedRole = resolveAutotileRole(roleFamily, mask, role);
  const resolvedTileId = `terrain.${levelTheme.value}.${resolvedRole}`;

  worldLayer.set(key, {
    ...tile,
    tileId: resolvedTileId,
  });
}

export function recomputeAutoGroundNeighborhood(x, y) {
  const offsets = [
    [0, 0],
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  for (const [dx, dy] of offsets) {
    recomputeAutoGroundAt(x + dx, y + dy);
  }
}

export function getForcedGroundPlacementTileId(x, y, tileId) {
  const { role } = parseTileId(tileId);
  if (role !== "block") return null;

  const aboveTile = worldLayer.get(getKey(x, y - 1));
  const belowTile = worldLayer.get(getKey(x, y + 1));
  const rightTile = worldLayer.get(getKey(x + 1, y));

  const aboveRole = aboveTile ? parseTileId(aboveTile.tileId).role : null;
  const belowRole = belowTile ? parseTileId(belowTile.tileId).role : null;
  const rightRole = rightTile ? parseTileId(rightTile.tileId).role : null;

  // Above ramp.long.a / ramp.long.b / ramp.short.b
  if (
    belowRole === "ramp.long.a" ||
    belowRole === "ramp.long.b" ||
    belowRole === "ramp.short.b"
  ) {
    return `terrain.${levelTheme.value}.block`;
  }

  // Below ramp.long.c / ramp.short.a
  if (aboveRole === "ramp.long.c" || aboveRole === "ramp.short.a") {
    return `terrain.${levelTheme.value}.vertical.bottom`;
  }

  // Left of ramp.long.a
  if (rightRole === "ramp.long.a") {
    return `terrain.${levelTheme.value}.horizontal.left`;
  }

  // Below ramp.long.a / left of ramp.long.c
  if (aboveRole === "ramp.long.a" || rightRole === "ramp.long.c") {
    return `terrain.${levelTheme.value}.block.bottom.left`;
  }

  return null;
}

export function resolvePreviewAutoGroundTileId(x, y, family, seedTileId) {
  const { role } = parseTileId(seedTileId);

  if (family === "levitating") {
    const hasLevitatingAt = (nx, ny) => {
      const neighbor = getAutoGroundTileAt(nx, ny);
      return neighbor != null && neighbor.family === "levitating";
    };
    const mask = computeAutotileMask(x, y, hasLevitatingAt);
    const resolvedRole = resolveAutotileRole("levitating", mask, role);
    return `terrain.${levelTheme.value}.${resolvedRole}`;
  }

  const northNeighbor = getAutoGroundTileAt(x, y - 1);
  const northIsGround =
    northNeighbor &&
    (northNeighbor.family === "mudGrass" ||
      northNeighbor.family === "mudBare");

  const roleFamily =
    family === "mudBare" ? "mudBare" : northIsGround ? "mudBare" : "mudGrass";

  const hasMudNeighborAt = (nx, ny) => {
    const neighbor = getAutoGroundTileAt(nx, ny);
    if (neighbor) {
      if (neighbor.family === "levitating") return false;
      return true;
    }

    const worldNeighbor = worldLayer.get(getKey(nx, ny));
    if (!worldNeighbor) return false;
    const worldFamily = getAutotileFamilyByTileId(worldNeighbor.tileId);
    if (worldFamily) return worldFamily !== "levitating";
    return false;
  };

  const mask = computeAutotileMask(x, y, hasMudNeighborAt);
  const resolvedRole = resolveAutotileRole(roleFamily, mask, role);
  return `terrain.${levelTheme.value}.${resolvedRole}`;
}

export function getPreviewPaintTileId(x, y, tile) {
  if (!tile || !tile.tileId) return null;

  let themedTile = { ...tile };
  if (themedTile.tileId.startsWith("terrain.")) {
    const parts = themedTile.tileId.split(".");
    if (parts.length >= 3) {
      themedTile.tileId = `terrain.${levelTheme.value}.${parts.slice(2).join(".")}`;
    }
  }

  if (!isWithinBounds(x, y)) return themedTile.tileId;

  const tileId = themedTile.tileId;
  const forcedPlacementId = getForcedGroundPlacementTileId(x, y, tileId);
  if (forcedPlacementId) {
    return forcedPlacementId;
  }

  if (isMudGrassCapTileId(tileId)) return tileId;

  const family = getAutotileFamilyByTileId(tileId);
  if (!family) return tileId;

  return resolvePreviewAutoGroundTileId(x, y, family, tileId);
}
