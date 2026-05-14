export function createLevelDataFromPhaserMap(map, groundLayer, groundTileset) {
  return {
    mapSize: {
      width: map.widthInPixels,
      height: map.heightInPixels,
    },
    properties: map.properties,
    solidTiles: getSolidTilesFromLayer(groundLayer),
    entities: getEntitiesFromMapObjects(map, groundTileset),
  };
}

function getSolidTilesFromLayer(layer) {
  const solidTiles = [];

  layer.forEachTile((tile) => {
    if (tile.index === -1) return;

    const tileData = tile.tileset.tileData[tile.index - tile.tileset.firstgid];

    solidTiles.push({
      x: tile.pixelX + tile.width / 2,
      y: tile.pixelY + tile.height / 2,
      width: tile.width,
      height: tile.height,
      label: tileData?.type ?? "tile",
    });
  });

  return solidTiles;
}

function getEntitiesFromMapObjects(map, groundTileset) {
  const entities = [];

  map.objects.forEach((objectLayer) => {
    objectLayer.objects.forEach((object) => {
      if (object.gid === undefined) return;

      const frame = object.gid - groundTileset.firstgid;
      const type = object.type || groundTileset.tileData[frame]?.type;
      if (!type) return;

      entities.push({
        type,
        x: object.x + object.width / 2,
        y: object.y - object.height / 2,
        frame,
        content: getObjectContent(object),
      });
    });
  });

  return entities;
}

function getObjectContent(object) {
  const directContent = normalizeObjectContent(object.content);
  if (directContent) return directContent;

  const propertyContent = object.properties?.find(
    (property) => property.name?.toLowerCase() === "content",
  )?.value;
  return normalizeObjectContent(propertyContent);
}

function normalizeObjectContent(content) {
  if (typeof content === "string") return content;
  if (content?.type === "some" && typeof content.coinType === "string") {
    return content.coinType;
  }
  return undefined;
}
