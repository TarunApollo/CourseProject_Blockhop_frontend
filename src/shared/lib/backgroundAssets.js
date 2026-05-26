const BACKGROUND_ASSETS = [
  ["bg_sky", "/assets/background/overworld/background_solid_sky.png"],
  ["bg_clouds", "/assets/background/overworld/background_clouds.png"],
  ["bg_trees", "/assets/background/overworld/background_color_trees.png"],
  ["bg_grass", "/assets/background/overworld/background_solid_grass.png"],
];

const queuedBackgroundTextures = new Set();

export function preloadBackgroundAssets(scene) {
  for (const [key, url] of BACKGROUND_ASSETS) {
    if (scene.textures.exists(key) || queuedBackgroundTextures.has(key)) {
      continue;
    }

    queuedBackgroundTextures.add(key);
    scene.load.once(`filecomplete-image-${key}`, () => {
      queuedBackgroundTextures.delete(key);
    });
    scene.load.once(`loaderror`, (file) => {
      if (file?.key === key) {
        queuedBackgroundTextures.delete(key);
      }
    });
    scene.load.image(key, url);
  }
}

export function hasBackgroundAssets(scene) {
  return BACKGROUND_ASSETS.every(([key]) => scene.textures.exists(key));
}

export function whenBackgroundAssetsReady(scene, callback) {
  if (hasBackgroundAssets(scene)) {
    callback();
    return;
  }

  preloadBackgroundAssets(scene);

  const waitForTextures = scene.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (!hasBackgroundAssets(scene)) return;
      waitForTextures.remove(false);
      callback();
    },
  });

  scene.events.once("shutdown", () => {
    waitForTextures.remove(false);
  });
}
