<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import Phaser from 'phaser'

const gameContainer = ref(null)
let game = null

class HomeScreen extends Phaser.Scene {
  constructor() { super({ key: 'HomeScreen' }) }

  preload() {
    this.load.image('bg_sky', '/assets/background/overworld/background_solid_sky.png')
    this.load.image('bg_clouds', '/assets/background/overworld/background_clouds.png')
    this.load.image('bg_trees', '/assets/background/overworld/background_color_trees.png')
    this.load.image('bg_grass', '/assets/background/overworld/background_solid_grass.png')
  }

  create() {
    const ScreenWidth = this.scale.width
    const ScreenHeight = this.scale.height

    this.cloudsTex = this.textures.get('bg_clouds').getSourceImage() // storing tex references for resizing later
    this.treesTex = this.textures.get('bg_trees').getSourceImage()
    this.grassTex = this.textures.get('bg_grass').getSourceImage()

    const skyH  = Math.round(ScreenHeight * 0.55) // height of the sky layer
    const cloudsY = Math.round(ScreenHeight * 0.25)
    const cloudsH = Math.round(ScreenHeight * 0.30) // height of the clouds layer
    const treesY  = Math.round(ScreenHeight * 0.50)
    const treesH  = Math.round(ScreenHeight * 0.35) // height of the trees layer
    const grassY  = Math.round(ScreenHeight * 0.78)
    const grassH  = Math.round(ScreenHeight * 0.20) // height of the grass layer

    this.bgSky = this.add.image(0, 0, 'bg_sky') // static image
      .setOrigin(0, 0)
      .setDisplaySize(ScreenWidth, skyH)
      .setDepth(0)

    this.bgClouds = this.add.tileSprite(0, cloudsY, ScreenWidth, cloudsH, 'bg_clouds')
      .setOrigin(0, 0)
      .setTileScale(cloudsH / this.cloudsTex.height) // number of times to repeat the texture
      .setDepth(1)

    this.bgTrees = this.add.tileSprite(0, treesY, ScreenWidth, treesH, 'bg_trees')
      .setOrigin(0, 0)
      .setTileScale(treesH / this.treesTex.height)
      .setDepth(2)

    this.bgGrass = this.add.tileSprite(0, grassY, ScreenWidth, grassH, 'bg_grass')
      .setOrigin(0, 0)
      .setTileScale(grassH / this.grassTex.height)
      .setDepth(3)
    
    this.tweens.add({
      targets: this.bgClouds,
      tilePositionX: '+=500',
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    })
    
    this.tweens.add({
      targets: this.bgTrees,
      tilePositionX: '+=700',
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    })
    
    this.tweens.add({
      targets: this.bgGrass,
      tilePositionX: '+=1000',
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    })

    this.sun = this.add.graphics()
    this.sunX = ScreenWidth - 110
    this.sunY = 90
    this.sun.setPosition(this.sunX, this.sunY)
    this.sun.setDepth(4)
    this.drawSun(this.sun)

    this.tweens.add({
      targets: this.sun,
      angle: 360,
      duration: 20000,
      repeat: -1,
    })

    this.scale.on('resize', this.handleResize, this)
  }

  drawSun(g) {
    g.fillStyle(0xfde047, 0.12).fillCircle(0, 0, 56) // outer glow with low opacity
    g.fillStyle(0xfde047, 0.22).fillCircle(0, 0, 42) // inner glow with medium opacity
    g.fillStyle(0xfef08a, 1   ).fillCircle(0, 0, 28) // core sun with full opacity
    for (let i = 0; i < 8; i++) { // 8 rays around the sun
      const a = (i / 8) * Math.PI * 2 // angle for each ray
      g.fillStyle(0xfde047, 0.95).fillTriangle( // polar coordinates to Cartesian for the triangle rays
          Math.cos(a)        * 32, Math.sin(a)        * 32,
          Math.cos(a + 0.22) * 50, Math.sin(a + 0.22) * 50,
          Math.cos(a - 0.22) * 50, Math.sin(a - 0.22) * 50,
      )
    }
  }

  handleResize(gameSize) {
    const newScreenWidth = gameSize.width
    const newScreenHeight = gameSize.height

    const skyH    = Math.round(newScreenHeight * 0.55)
    const cloudsY = Math.round(newScreenHeight * 0.25)
    const cloudsH = Math.round(newScreenHeight * 0.30)
    const treesY  = Math.round(newScreenHeight * 0.50)
    const treesH  = Math.round(newScreenHeight * 0.35)
    const grassY  = Math.round(newScreenHeight * 0.78)
    const grassH  = Math.round(newScreenHeight * 0.20)

    this.bgSky
      .setDisplaySize(newScreenWidth, skyH)

    this.bgClouds
      .setPosition(0, cloudsY)
      .setDisplaySize(newScreenWidth, cloudsH)
      .setTileScale(cloudsH / this.cloudsTex.height)

    this.bgTrees
      .setPosition(0, treesY)
      .setDisplaySize(newScreenWidth, treesH)
      .setTileScale(treesH / this.treesTex.height)

    this.bgGrass
      .setPosition(0, grassY)
      .setDisplaySize(newScreenWidth, grassH)
      .setTileScale(grassH / this.grassTex.height)

    this.sun.setPosition(newScreenWidth - 110, 90)
  }
}

onMounted(async () => {
  await nextTick() // wait for the DOM to render so gameContainer is not null

    game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    scene: [HomeScreen],
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    render: {
      pixelArt: true,
      roundPixels: true
    }
  })
})

onBeforeUnmount(() => {
  if (game) {
    game.scene.keys['HomeScene']?.scale.off('resize')
    game.destroy(true)
  }
})
</script>

<template>
  <div class="bg-container">
    <div ref="gameContainer" class="game-canvas" />
  </div>
</template>

<style scoped>
.bg-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.game-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.game-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>