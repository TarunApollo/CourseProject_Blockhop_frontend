/**
 * Tile a background image horizontally across the full map width.
 *
 * Each repetition is a plain Image (not a TileSprite) scaled so its height
 * exactly fills `sliceH`; width is derived from the same scale factor so the
 * source aspect ratio is preserved.  The +1 px height overlap prevents
 * sub-pixel gaps that can appear between adjacent rows at non-integer zoom levels.
 *
 * @param {Phaser.Scene} scene
 * @param {number} y        top edge of the row in world coordinates
 * @param {string} key      texture key loaded in preload()
 * @param {number} depth    render depth (use negatives to place behind the tilemap)
 * @param {number} mapWidth total pixel width of the level
 * @param {number} sliceH   height of this background slice in pixels
 */
export function createBgRow(scene, y, key, depth, mapWidth, sliceH) {
  const img = scene.textures.get(key).getSourceImage();
  const scale = sliceH / img.height;
  const scaledW = img.width * scale;
  for (let x = 0; x < mapWidth; x += scaledW) {
    const bg = scene.add.image(x, y, key).setOrigin(0, 0);
    bg.setDisplaySize(scaledW, sliceH + 1);
    bg.setDepth(depth);
    bg.setScrollFactor(1);
  }
}
