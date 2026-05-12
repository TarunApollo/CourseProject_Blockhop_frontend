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
