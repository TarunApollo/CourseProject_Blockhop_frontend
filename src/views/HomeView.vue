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

    const skyH  = Math.round(ScreenHeight * 0.55) // height of the sky layer
    const cloudsY = Math.round(ScreenHeight * 0.25)
    const cloudsH = Math.round(ScreenHeight * 0.30) // height of the clouds layer
    const treesY  = Math.round(ScreenHeight * 0.50)
    const treesH  = Math.round(ScreenHeight * 0.35) // height of the trees layer
    const grassY  = Math.round(ScreenHeight * 0.78)
    const grassH  = Math.round(ScreenHeight * 0.20) // height of the grass layer

    this.add.image(0, 0, 'bg_sky') // static image
      .setOrigin(0, 0)
      .setDisplaySize(ScreenWidth, skyH)
      .setDepth(0)

    const cloudsTex = this.textures.get('bg_clouds').getSourceImage() // get the raw texture for pixels height
    this.bgClouds = this.add.tileSprite(0, cloudsY, ScreenWidth, cloudsH, 'bg_clouds')
      .setOrigin(0, 0)
      .setTileScale(cloudsH / cloudsTex.height) // number of times to repeat the texture
      .setDepth(1)

    const treesTex = this.textures.get('bg_trees').getSourceImage()
    this.bgTrees = this.add.tileSprite(0, treesY, ScreenWidth, treesH, 'bg_trees')
      .setOrigin(0, 0)
      .setTileScale(treesH / treesTex.height)
      .setDepth(2)

    const grassTex = this.textures.get('bg_grass').getSourceImage()
    this.bgGrass = this.add.tileSprite(0, grassY, ScreenWidth, grassH, 'bg_grass')
      .setOrigin(0, 0)
      .setTileScale(grassH / grassTex.height)
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
  if (game) game.destroy(true)
})
</script>

<template>
  <div class="home">
    <div ref="gameContainer" class="game-canvas" />

    <div class="overlay">
      <div class="top-title">
        <h1 class="home-title">Block<span class="home-hop">hop</span></h1>
      </div>

      <div class="menu-grid">
        <RouterLink to="/my-stats" class="menu-button">My Stats</RouterLink>
        <RouterLink to="/last-played" class="menu-button">Resume Last Played</RouterLink>
        <RouterLink to="/level-list" class="menu-button">Levels</RouterLink>
        <RouterLink to="/play-demo" class="menu-button">Play Demo</RouterLink>
        <RouterLink to="/about" class="menu-button">About</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

.home {
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

.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.top-title {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
}

.menu-grid {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(450px, 90vw);
  margin: auto;
  display: grid;
  grid-template-columns: repeat(1, minmax(100px, 1fr));
  gap: 2px;
  pointer-events: all;
  margin-top: 25vh;
  margin-bottom: 5vh;
}

.home-title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(10rem, 6vw, 5rem);
  line-height: 1;
  color: #fff;
  animation: title-wobble 6s ease-in-out infinite alternate;
  transform-style: preserve-3d;
  display: inline-block;
  text-shadow: 3px 3px 0 #1a4a0a, 5px 5px 0 rgba(0,0,0,0.25);
}

.home-hop {
  color: #4ade80;
  text-shadow: 3px 3px 0 #166534, 5px 5px 0 rgba(0,0,0,0.25);
}

.menu-button {
  padding: 17px 55px;
  background: #4ade80;
  color: #052e16;
  border: #181818 2px solid;
  font-family: 'Pixelify Sans', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 5px 0 #166534, 0 8px 18px rgba(0,0,0,0.25);
  transition: transform 0.07s, box-shadow 0.07s;
  text-align: center;
}

.menu-button:hover {
  transform: translateY(-2px);
  background: #86efac;
}

.menu-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(2, minmax(130px, 1fr));
  }
}

@media (max-width: 480px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes splash-pulse {
  from { transform: rotate(18deg) scale(1); }
  to   { transform: rotate(18deg) scale(1.08); }
}
@keyframes title-wobble {
  from { transform: perspective(400px) rotateY(-4deg) scale(1); }
  to   { transform: perspective(400px) rotateY(4deg)  scale(1.04); }
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>