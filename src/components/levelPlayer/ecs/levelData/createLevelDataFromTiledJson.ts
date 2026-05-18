export function createLevelDataFromTiledJson(mapJson: TiledMapJson): LevelData {
  const tileset = mapJson.tilesets[0];
  if (!tileset) throw new Error("no tileset");

  return {
    mapSize: {
      width: mapJson.width * mapJson.tilewidth,
      height: mapJson.height * mapJson.tileheight,
    },
    properties: mapJson.properties,
    worldTiles: createWorldLayer(getWorldLayer(mapJson), mapJson, tileset),
    objectTiles: createObjectLayer(mapJson, tileset),
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
  tileset: Tileset,
): WorldTile[] {
  return layer.data.flatMap((gid, index) => {
    if (gid === 0) return [];
    const tile = getTilesetTile(gid, tileset);
    const tileX = index % layer.width;
    const tileY = Math.floor(index / layer.width);

    return {
      x: tileX * mapJson.tilewidth + mapJson.tilewidth / 2,
      y: tileY * mapJson.tileheight + mapJson.tileheight / 2,
      width: mapJson.tilewidth,
      height: mapJson.tileheight,
      label: tile?.type || "tile",
    };
  });
}

function createObjectLayer(
  mapJson: TiledMapJson,
  tileset: Tileset,
): ObjectTile[] {
  return mapJson.layers
    .filter((layer): layer is TiledObjectLayer => layer.type === "objectgroup")
    .flatMap((layer) => layer.objects)
    .flatMap((object) => {
      const frame = object.gid - tileset.firstgid;
      const tile = getTilesetTile(object.gid, tileset);
      const type = tile?.type || object.type;
      if (!type) return [];

      const objectTile = {
        type,
        x: object.x + object.width / 2,
        y: object.y - object.height / 2,
        frame,
      };
      const content = object.properties?.find(
        (property) => property.name === "Content",
      )?.value;

      return content === undefined ? objectTile : { ...objectTile, content };
    });
}

function getTilesetTile(
  gid: number,
  tileset: Tileset,
): TilesetTile | undefined {
  return tileset.tiles.find((tile) => tile.id === gid - tileset.firstgid);
}
