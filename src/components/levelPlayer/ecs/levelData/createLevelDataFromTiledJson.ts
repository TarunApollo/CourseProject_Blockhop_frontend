export type TiledMapJson = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
  properties: TiledProperty[];
};

export type TiledLayer = {
  name: string;
  type: string;
  data: number[];
  objects: TiledObject[];
  width: number;
  height: number;
};

export type TiledObject = {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: TiledProperty[];
  gid: number;
};

export type TiledTileData = {
  id: number;
  type: string;
  properties: TiledProperty[];
};

export type TiledTileset = {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tiles: TiledTileData[];
};

export type TiledPropValue = string | number | boolean;

export type TiledProperty = {
  name: string;
  type: string;
  value: TiledPropValue;
};

export type SolidTile = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type EntityData = {
  type: string;
  x: number;
  y: number;
  frame: number;
  content: string;
};

export type LevelData = {
  mapSize: {
    width: number;
    height: number;
  };
  properties: TiledProperty[];
  solidTiles: SolidTile[];
  entities: EntityData[];
};

export function createLevelDataFromTiledJson(mapJson: TiledMapJson): LevelData {
  const tilesets = mapJson.tilesets ?? [];
  const worldLayer = requireMapLayer(mapJson, "World");

  return {
    mapSize: {
      width: mapJson.width * mapJson.tilewidth,
      height: mapJson.height * mapJson.tileheight,
    },
    properties: mapJson.properties ?? [],
    solidTiles: createFromWorldLayer(worldLayer, mapJson, tilesets),
    entities: createFromObjectLayer(mapJson, tilesets),
  };
}

function requireMapLayer(mapJson: TiledMapJson, layerName: string): TiledLayer {
  const layer = mapJson.layers?.find(
    (candidate) => candidate.name === layerName,
  );
  if (!layer) {
    throw new Error(`Missing layer: ${layerName}`);
  }
  return layer;
}

function createFromWorldLayer(
  worldLayer: TiledLayer,
  mapJson: TiledMapJson,
  tilesets: TiledTileset[],
): SolidTile[] {
  if (worldLayer.type !== "tilelayer" || !Array.isArray(worldLayer.data)) {
    throw new Error("malformed data tileLayer");
  }
  if (worldLayer.width === undefined) {
    throw new Error("malformed data tileLayer width");
  }

  const solidTiles: SolidTile[] = [];

  worldLayer.data.forEach((rawGid: number, index: number) => {
    const gid = rawGid;
    if (gid === 0) return;
    const tileX = index % worldLayer.width;
    const tileY = Math.floor(index / worldLayer.width);
    const tileset = findTileset(tilesets, gid);
    const localId = gid - tileset.firstgid;
    const tileData = findTileData(tileset, localId);
    const newSolidTile: SolidTile = {
      x: tileX * mapJson.tilewidth + mapJson.tilewidth / 2,
      y: tileY * mapJson.tileheight + mapJson.tileheight / 2,
      width: mapJson.tilewidth,
      height: mapJson.tileheight,
      label: tileData?.type ?? getStringCustomProperty(tileData, "label"),
    };
    solidTiles.push(newSolidTile);
  });

  return solidTiles;
}

function createFromObjectLayer(
  mapJson: TiledMapJson,
  tilesets: TiledTileset[],
): EntityData[] {
  const entities: EntityData[] = [];
  const objectLayers =
    mapJson.layers?.filter((layer) => layer.type === "objectgroup") ?? [];

  objectLayers.forEach((objectLayer: TiledLayer) => {
    objectLayer.objects?.forEach((mapObject: TiledObject) => {
      if (mapObject.gid === undefined) return;

      const gid = mapObject.gid;
      const tileset = findTileset(tilesets, gid);
      const frame = gid - tileset.firstgid;
      const tileData = findTileData(tileset, frame);
      const type = mapObject.type || tileData?.type;
      if (!type) return;

      const newData: EntityData = {
        type,
        x: mapObject.x + (mapObject.width ?? mapJson.tilewidth) / 2,
        y: mapObject.y - (mapObject.height ?? mapJson.tileheight) / 2,
        frame,
        content: getObjectContent(mapObject),
      };
      entities.push(newData);
    });
  });

  return entities;
}

function findTileset(tilesets: TiledTileset[], gid: number): TiledTileset {
  const tileset = [...tilesets]
    .sort((a, b) => b.firstgid - a.firstgid)
    .find((candidate) => gid >= candidate.firstgid);

  if (!tileset) {
    throw new Error(`No tileset found for gid ${gid}`);
  }
  return tileset;
}

function findTileData(
  tileset: TiledTileset,
  localId: number,
): TiledTileData | undefined {
  return tileset.tiles?.find((tile) => tile.id === localId);
}

function getObjectContent(object: TiledObject): string {
  return getStringCustomProperty(object, "content");
}

function getStringCustomProperty(
  mapEntry: { properties?: TiledProperty[] } | undefined,
  propertyName: string,
): string {
  const value = mapEntry?.properties?.find(
    (property) => property.name?.toLowerCase() === propertyName.toLowerCase(),
  )?.value;

  return typeof value === "string" ? value : "none";
}
