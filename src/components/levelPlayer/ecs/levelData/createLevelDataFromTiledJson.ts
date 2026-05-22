import type {
  LevelData,
  ObjectTile,
  TileCatalogEntry,
  TiledMapJson,
  TiledObjectLayer,
  TiledWorldLayer,
  WorldTile,
} from "./types";

export function createLevelDataFromTiledJson(mapJson: TiledMapJson): LevelData {
  const catalog = createCatalogMap(mapJson.tileCatalog ?? []);
  const world = createWorldLayer(getWorldLayer(mapJson), mapJson, catalog);

  return {
    mapSize: {
      width: mapJson.width * mapJson.tilewidth,
      height: mapJson.height * mapJson.tileheight,
    },
    properties: mapJson.properties,
    worldTiles: world.worldTiles,
    objectTiles: [...createObjectLayer(mapJson, catalog), ...world.hazardTiles],
  };
}

function createCatalogMap(entries: TileCatalogEntry[]) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

function getWorldLayer(mapJson: TiledMapJson): TiledWorldLayer {
  const layer = mapJson.layers.find(
    (layer): layer is TiledWorldLayer =>
      layer.name === "World" && layer.type === "tilelayer",
  );

  if (!layer) throw new Error("no world tile layer");
  return layer;
}

function createWorldLayer(
  layer: TiledWorldLayer,
  mapJson: TiledMapJson,
  catalog: Map<string, TileCatalogEntry>,
): { worldTiles: WorldTile[]; hazardTiles: ObjectTile[] } {
  const worldTiles: WorldTile[] = [];
  const hazardTiles: ObjectTile[] = [];

  layer.data.forEach((tileId, index) => {
    if (!tileId) return;
    const entry = requireCatalogEntry(catalog, tileId);
    const tileX = index % layer.width;
    const tileY = Math.floor(index / layer.width);
    const cx = tileX * mapJson.tilewidth + mapJson.tilewidth / 2;
    const cy = tileY * mapJson.tileheight + mapJson.tileheight / 2;

    if (entry.type === "Damage") {
      hazardTiles.push(buildObjectTile(entry, cx, cy, mapJson.tilewidth, mapJson.tileheight));
      return;
    }

    worldTiles.push({
      tileId,
      type: entry.type,
      x: cx,
      y: cy,
      width: mapJson.tilewidth,
      height: mapJson.tileheight,
      label: entry.type || "tile",
      physics: entry.physics,
      visual: entry.visual,
    });
  });

  return { worldTiles, hazardTiles };
}

function createObjectLayer(
  mapJson: TiledMapJson,
  catalog: Map<string, TileCatalogEntry>,
): ObjectTile[] {
  return mapJson.layers
    .filter((layer): layer is TiledObjectLayer => layer.type === "objectgroup")
    .flatMap((layer) => layer.objects)
    .flatMap((object) => {
      if (!object.tileId) return [];
      const entry = requireCatalogEntry(catalog, object.tileId);
      const objectTile = buildObjectTile(
        entry,
        object.x + object.width / 2,
        object.y - object.height / 2,
        object.width,
        object.height,
      );
      const content = object.properties?.find(
        (property) => property.name === "Content",
      )?.value;

      return content === undefined ? objectTile : { ...objectTile, content };
    });
}

function buildObjectTile(
  entry: TileCatalogEntry,
  cx: number,
  cy: number,
  width: number,
  height: number,
): ObjectTile {
  return {
    tileId: entry.id,
    type: entry.type,
    x: cx,
    y: cy,
    width,
    height,
    physics: entry.physics,
    visual: entry.visual,
  };
}

function requireCatalogEntry(
  catalog: Map<string, TileCatalogEntry>,
  tileId: string,
): TileCatalogEntry {
  const entry = catalog.get(tileId);
  if (!entry) throw new Error(`Missing tile catalog entry: ${tileId}`);
  return entry;
}
