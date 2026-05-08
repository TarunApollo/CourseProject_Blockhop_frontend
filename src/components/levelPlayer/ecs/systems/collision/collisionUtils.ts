import Phaser from "phaser";
import type { Registry } from "../../core/Registry";
import type { TileMetadataResource } from "../../resources/tileMetadata";

export type CollisionHandlerContext = {
  scene: Phaser.Scene;
  registry: Registry;
  tileMetadata: TileMetadataResource;
};

/**
 * the number is Ecs entity id
 */
export type MatchedCollision = {
  subject: number;
  target: number;
  pair: any;
};
