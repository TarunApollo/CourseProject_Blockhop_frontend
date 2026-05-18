export type TiledLayer = TiledWorldLayer | TiledObjectLayer;

export type TiledMapJson = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: Tileset[];
  properties: TiledProperty[];
};

export type WorldTile = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type ObjectTile = {
  type: string;
  x: number;
  y: number;
  frame: number;
  content?: string;
};

export type LevelData = {
  mapSize: MapSize;
  properties: TiledProperty[];
  worldTiles: WorldTile[];
  objectTiles: ObjectTile[];
};
export type TiledProperty = {
  name: string;
  value: string;
};

export type MapSize = {
  width: number;
  height: number;
};

export type TilesetTile = {
  id: number;
  type: string;
  properties?: TiledProperty[];
};

export type Tileset = {
  firstgid: number;
  tiles: TilesetTile[];
};

export type TiledWorldLayer = {
  name: string;
  type: "tilelayer";
  data: number[];
  width: number;
};

export type TiledObject = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  gid: number;
  properties?: TiledProperty[];
};

export type TiledObjectLayer = {
  name: string;
  type: "objectgroup";
  objects: TiledObject[];
};
