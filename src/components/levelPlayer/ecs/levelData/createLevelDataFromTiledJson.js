export function createLevelDataFromTiledJson(mapJson) {
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

function requireMapLayer(mapJson, layerName) {
  const layer = mapJson.layers?.find(
    (candidate) => candidate.name === layerName,
  );
  if (!layer) {
    throw new Error(`Missing layer: ${layerName}`);
  }
  return layer;
}

function createFromWorldLayer(worldLayer, mapJson, tilesets) {
  if (worldLayer.type !== "tilelayer" || !Array.isArray(worldLayer.data)) {
    throw new Error("malformed data tileLayer");
  }

  const solidTiles = [];

  worldLayer.data.forEach((rawGid, index) => {
    const gid = rawGid;
    if (gid === 0) return;

    const tileX = index % worldLayer.width;
    const tileY = Math.floor(index / worldLayer.width);
    const tileset = findTileset(tilesets, gid);
    const localId = gid - tileset.firstgid;
    const tileData = findTileData(tileset, localId);

    solidTiles.push({
      x: tileX * mapJson.tilewidth + mapJson.tilewidth / 2,
      y: tileY * mapJson.tileheight + mapJson.tileheight / 2,
      width: mapJson.tilewidth,
      height: mapJson.tileheight,
      label:
        tileData?.type ?? getCustomPropertyValue(tileData, "label") ?? "tile",
    });
  });

  return solidTiles;
}

function createFromObjectLayer(mapJson, tilesets) {
  const entities = [];
  const objectLayers =
    mapJson.layers?.filter((layer) => layer.type === "objectgroup") ?? [];

  objectLayers.forEach((objectLayer) => {
    objectLayer.objects?.forEach((mapObject) => {
      if (mapObject.gid === undefined) return;

      const gid = mapObject.gid;
      const tileset = findTileset(tilesets, gid);
      const frame = gid - tileset.firstgid;
      const tileData = findTileData(tileset, frame);
      const type = mapObject.type || tileData?.type;
      if (!type) return;

      entities.push({
        type,
        x: mapObject.x + mapObject.width / 2,
        y: mapObject.y - mapObject.height / 2,
        frame,
        content: getObjectContent(mapObject),
      });
    });
  });

  return entities;
}

function findTileset(tilesets, gid) {
  const tileset = [...tilesets]
    .sort((a, b) => b.firstgid - a.firstgid)
    .find((candidate) => gid >= candidate.firstgid);

  if (!tileset) {
    throw new Error(`No tileset found for gid ${gid}`);
  }
  return tileset;
}

function findTileData(tileset, localId) {
  return tileset.tiles?.find((tile) => tile.id === localId);
}

function getObjectContent(object) {
  const directContent = normalizeObjectContent(object.content);
  if (directContent) return directContent;

  return normalizeObjectContent(getCustomPropertyValue(object, "content"));
}

function getCustomPropertyValue(mapEntry, propertyName) {
  return mapEntry?.properties?.find(
    (property) => property.name?.toLowerCase() === propertyName.toLowerCase(),
  )?.value;
}

function normalizeObjectContent(content) {
  if (typeof content === "string") return content;
  if (content?.type === "some" && typeof content.coinType === "string") {
    return content.coinType;
  }
  return undefined;
}
