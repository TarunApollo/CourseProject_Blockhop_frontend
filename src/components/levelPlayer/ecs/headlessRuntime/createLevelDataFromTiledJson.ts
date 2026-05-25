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
  const catalog = mapJson.tileCatalog ?? [];
  const world = createWorldLayer(getWorldLayer(mapJson), mapJson, catalog);

  return {
    mapSize: {
      width: mapJson.width * mapJson.tilewidth,
      height: mapJson.height * mapJson.tileheight,
    },
    properties: mapJson.properties,
    worldTiles: world.worldTiles,
    objectTiles: [
      ...createObjectLayer(mapJson, catalog),
      ...world.worldEntityTiles,
    ],
  };
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
  catalog: TileCatalogEntry[],
): { worldTiles: WorldTile[]; worldEntityTiles: ObjectTile[] } {
  const worldTiles: WorldTile[] = [];
  const worldEntityTiles: ObjectTile[] = [];

  layer.data.forEach((tileId, index) => {
    if (!tileId) return;
    const entry = requireCatalogEntry(catalog, tileId);
    const tileX = index % layer.width;
    const tileY = Math.floor(index / layer.width);
    const cx = tileX * mapJson.tilewidth + mapJson.tilewidth / 2;
    const cy = tileY * mapJson.tileheight + mapJson.tileheight / 2;

    if (isWorldEntityTile(entry.type)) {
      worldEntityTiles.push(
        buildObjectTile(
          entry.id,
          entry.type,
          cx,
          cy,
          mapJson.tilewidth,
          mapJson.tileheight,
        ),
      );
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
    });
  });

  return { worldTiles, worldEntityTiles };
}

function isWorldEntityTile(type: string): boolean {
  return type === "Damage" || type === "Ladder";
}

function createObjectLayer(
  mapJson: TiledMapJson,
  catalog: TileCatalogEntry[],
): ObjectTile[] {
  return mapJson.layers
    .filter((layer): layer is TiledObjectLayer => layer.type === "objectgroup")
    .flatMap((layer) => layer.objects)
    .flatMap((object) => {
      if (!object.tileId) return [];
      const entry = requireCatalogEntry(catalog, object.tileId);
      const objectTile = buildObjectTile(
        entry.id,
        entry.type,
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
  tileId: string,
  type: string,
  cx: number,
  cy: number,
  width: number,
  height: number,
): ObjectTile {
  return {
    tileId,
    type,
    x: cx,
    y: cy,
    width,
    height,
  };
}

function requireCatalogEntry(
  catalog: TileCatalogEntry[],
  tileId: string,
): TileCatalogEntry {
  const entry = catalog.find((entry) => entry.id === tileId);
  if (!entry) throw new Error(`Missing tile catalog entry: ${tileId}`);
  return entry;
}
