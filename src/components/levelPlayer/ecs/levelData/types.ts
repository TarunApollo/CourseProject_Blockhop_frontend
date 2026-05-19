type TiledLayer = TiledWorldLayer | TiledObjectLayer;

type TiledMapJson = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: Tileset[];
  properties: TiledProperty[];
};

type WorldTile = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

type ObjectTile = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number;
  content?: string;
  collisionShapes?: CollisionShape[];
};

type Vec2 = { x: number; y: number };

/**
 * collision shape authored on a tileset tile.
 * coordinates are tile-local with origin at the tiles top-left, y-down.
 */
type CollisionShape =
  | { kind: "rectangle"; x: number; y: number; width: number; height: number }
  | { kind: "polygon"; x: number; y: number; vertices: Vec2[] };

type LevelData = {
  mapSize: MapSize;
  properties: TiledProperty[];
  worldTiles: WorldTile[];
  objectTiles: ObjectTile[];
};
type TiledProperty = {
  name: string;
  value: string;
};

type MapSize = {
  width: number;
  height: number;
};

type TilesetTile = {
  id: number;
  type: string;
  properties?: TiledProperty[];
  objectgroup?: { objects: TiledTileShape[] };
};

type TiledTileShape = {
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: Vec2[];
};

type Tileset = {
  firstgid: number;
  tiles: TilesetTile[];
};

type TiledWorldLayer = {
  name: string;
  type: "tilelayer";
  data: number[];
  width: number;
};

type TiledObject = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  gid: number;
  properties?: TiledProperty[];
};

type TiledObjectLayer = {
  name: string;
  type: "objectgroup";
  objects: TiledObject[];
};
