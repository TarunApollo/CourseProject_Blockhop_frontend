/**
 * background.js
 *
 * Sets up the parallax background layers for the login scene.
 * Returns references to the scrollable tileSprites so the caller
 * can update tilePositionX each frame.
 *
 * @param {Phaser.Scene} scene
 * @param {number} W  scene width
 * @param {number} H  scene height
 * @returns {{ bgClouds, bgTrees, bgGrass }}
 */
export function createBackground(scene, W, H) {
    // Sky — static stretched image (solid colour, no detail to distort)
    scene.add.image(0, 0, 'bg_sky')
        .setOrigin(0, 0).setDisplaySize(W, Math.ceil(H)).setDepth(0)

    // Clouds — tileSprite so they repeat at natural proportions
    const cloudsTex = scene.textures.get('bg_clouds').getSourceImage()
    const cloudsH   = Math.ceil(H * 0.30)
    const bgClouds  = scene.add.tileSprite(0, Math.floor(H*0.27), W, cloudsH, 'bg_clouds')
        .setOrigin(0, 0).setTileScale(cloudsH / cloudsTex.height).setDepth(1)

    // Trees — tileSprite
    const treesTex = scene.textures.get('bg_trees').getSourceImage()
    const treesH   = Math.ceil(H * 0.35)
    const bgTrees  = scene.add.tileSprite(0, Math.floor(H * 0.55), W, treesH, 'bg_trees')
        .setOrigin(0, 0).setTileScale(treesH / treesTex.height).setDepth(2)

    // Grass — tileSprite (fastest, closest)
    const grassTex = scene.textures.get('bg_grass').getSourceImage()
    const grassH   = Math.ceil(H * 0.20)
    const bgGrass  = scene.add.tileSprite(0, Math.floor(H * 0.85), W, grassH, 'bg_grass')
        .setOrigin(0, 0).setTileScale(grassH / grassTex.height).setDepth(2)

    // Sun
    const sun = scene.add.graphics().setDepth(4).setPosition(W - 110, 90)
    drawSun(sun)
    scene.tweens.add({ targets: sun, angle: 360, duration: 20000, repeat: -1 })

    return { bgClouds, bgTrees, bgGrass }
}

/**
 * Scrolls the background layers — call every frame from update().
 *
 * @param {{ bgClouds, bgTrees, bgGrass }} bg  returned by createBackground()
 * @param {number} dt  delta / 16 (frame-rate-independent multiplier)
 */
export function scrollBackground(bg, dt) {
    bg.bgClouds.tilePositionX += 0.3 * dt
    bg.bgTrees.tilePositionX  += 0.4 * dt
    bg.bgGrass.tilePositionX  += 0.7 * dt
}

function drawSun(g) {
    g.fillStyle(0xfde047, 0.12).fillCircle(0, 0, 56)
    g.fillStyle(0xfde047, 0.22).fillCircle(0, 0, 42)
    g.fillStyle(0xfef08a, 1   ).fillCircle(0, 0, 28)
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        g.fillStyle(0xfde047, 0.95).fillTriangle(
            Math.cos(a)        * 32, Math.sin(a)        * 32,
            Math.cos(a + 0.22) * 50, Math.sin(a + 0.22) * 50,
            Math.cos(a - 0.22) * 50, Math.sin(a - 0.22) * 50,
        )
    }
}