import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import Phaser from 'phaser'
import { LAYER_ASSETS, SUN_CONFIG } from '@/lib/gameBackground/constants'
import { getBackgroundLayout } from '@/lib/gameBackground/layout'
import { drawSun } from '@/lib/gameBackground/sun'

class HomeScreen extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScreen' })
  }

  preload() {
    this.load.image('bg_sky', LAYER_ASSETS.sky)
    this.load.image('bg_clouds', LAYER_ASSETS.clouds)
    this.load.image('bg_trees', LAYER_ASSETS.trees)
    this.load.image('bg_grass', LAYER_ASSETS.grass)
  }

  create() {
    const { width, height } = this.scale
    const layout = getBackgroundLayout(width, height)

    this.cloudsTex = this.textures.get('bg_clouds').getSourceImage()
    this.treesTex = this.textures.get('bg_trees').getSourceImage()
    this.grassTex = this.textures.get('bg_grass').getSourceImage()

    this.bgSky = this.add.image(0, 0, 'bg_sky')
      .setOrigin(0, 0)
      .setDisplaySize(layout.screenWidth, layout.skyH)
      .setDepth(0)

    this.bgClouds = this.add.tileSprite(0, layout.cloudsY, layout.screenWidth, layout.cloudsH, 'bg_clouds')
      .setOrigin(0, 0)
      .setTileScale(layout.cloudsH / this.cloudsTex.height)
      .setDepth(1)

    this.bgTrees = this.add.tileSprite(0, layout.treesY, layout.screenWidth, layout.treesH, 'bg_trees')
      .setOrigin(0, 0)
      .setTileScale(layout.treesH / this.treesTex.height)
      .setDepth(2)

    this.bgGrass = this.add.tileSprite(0, layout.grassY, layout.screenWidth, layout.grassH, 'bg_grass')
      .setOrigin(0, 0)
      .setTileScale(layout.grassH / this.grassTex.height)
      .setDepth(3)

    this.tweens.add({ targets: this.bgClouds, tilePositionX: '+=500', duration: 20000, repeat: -1, ease: 'Linear' })
    this.tweens.add({ targets: this.bgTrees, tilePositionX: '+=700', duration: 20000, repeat: -1, ease: 'Linear' })
    this.tweens.add({ targets: this.bgGrass, tilePositionX: '+=1000', duration: 20000, repeat: -1, ease: 'Linear' })

    this.sun = this.add.graphics()
    this.sun.setPosition(width - SUN_CONFIG.offsetX, SUN_CONFIG.y)
    this.sun.setDepth(4)
    drawSun(this.sun)

    this.tweens.add({ targets: this.sun, angle: 360, duration: 20000, repeat: -1 })

    this.scale.on('resize', this.handleResize, this)
  }

  handleResize(gameSize) {
    const layout = getBackgroundLayout(gameSize.width, gameSize.height)

    this.bgSky.setDisplaySize(layout.screenWidth, layout.skyH)

    this.bgClouds
      .setPosition(0, layout.cloudsY)
      .setDisplaySize(layout.screenWidth, layout.cloudsH)
      .setTileScale(layout.cloudsH / this.cloudsTex.height)

    this.bgTrees
      .setPosition(0, layout.treesY)
      .setDisplaySize(layout.screenWidth, layout.treesH)
      .setTileScale(layout.treesH / this.treesTex.height)

    this.bgGrass
      .setPosition(0, layout.grassY)
      .setDisplaySize(layout.screenWidth, layout.grassH)
      .setTileScale(layout.grassH / this.grassTex.height)

    this.sun.setPosition(layout.screenWidth - SUN_CONFIG.offsetX, SUN_CONFIG.y)
  }
}

export function useGameBackground() {
  const gameContainer = ref(null)
  let game = null

  onMounted(async () => {
    await nextTick()

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
        roundPixels: true,
      },
    })
  })

  onBeforeUnmount(() => {
    if (game) {
      game.scene.keys.HomeScreen?.scale.off('resize')
      game.destroy(true)
    }
  })

  return {
    gameContainer,
  }
}
