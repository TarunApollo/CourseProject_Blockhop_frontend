<!-- <script setup>
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
// import { logout } from '@/stores/auth' added useAuthStore instead of logout
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

// added authStore
const authStore = useAuthStore()

function handleLogout() {
  //logout() // replaced with authStore.logout()
  authStore.logout()
  router.push('/')
}
</script> -->

<!-- <template>
  <main class="home-view">
    <img src="/assets/background/overworld/loginpic.png" class="layer" alt="Background Image"/>
    <h1 class="home-title">Blockhop</h1>
    <p class="home-subtitle">bla bla bla</p>
    
    <div class="menu-grid">
      <RouterLink to="/my-stats" class="menu-button">
        <span class="my-stats">My Stats</span>
      </RouterLink>

      <RouterLink to="/last-played" class="menu-button">
        <span class="last-played">Resume Last Played Level</span>
      </RouterLink>

      <RouterLink to="/level-list" class="menu-button">
        <span class="level-list">Levels</span>
      </RouterLink>
      
      <RouterLink to="/play-demo" class="menu-button">
        <span class="play-demo">Play Demo</span>
      </RouterLink>
      
      <RouterLink to="/about" class="menu-button">
        <span class="about">About</span>
      </RouterLink>
      
      <button @click="handleLogout" class="menu-button logout-btn">
        <span class="logout-label">Logout</span>
      </button>
    </div>
  </main>
</template> -->

<!-- <style scoped>
.home-view {
  width: 100%;
  height: 97vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.layer {
  position: absolute;
  width: 100%;
  height: auto;
  left: 0;
  z-index: 0;
}

.home-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 70px;
  color: #906520;
  text-shadow: 4px 4px 0 #b51b42;
  margin: 0;
  position: relative;
  z-index: 1;
  margin-top: 0rem;
  margin-left: -24px;
}

/* .home-subtitle {
  color: inherit;
  font-size: 1.2rem;
  margin-top: 0.75rem;
  position: relative;
  z-index: 1;
} */

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3.5rem;
  margin-top: 3rem;
  width: 100%;
  max-width: 600px;
  padding: 0 13rem;
  position: relative;
  z-index: 1;
}

.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 4rem;
  color: white;
  font-family: 'Fredoka', sans-serif;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.4rem;
  min-height: 210px;
  min-width: 210px;
  cursor: pointer;
  
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: none;
  border-radius: 20px;
  background-image: url('/assets/terrain_grass_block.png');
  transition: transform 0.2s ease;
}

.my-stats {
  width: 100%;
  height: 100%;
}

.last-played {
  width: 100%;
  height: 100%;
}

.level-list {
  width: 100%;
  height: 100%;
}

.play-demo {
  width: 100%;
  height: 100%;
}

.about {
  width: 100%;
  height: 100%;
}

.logout-label {
  width: 100%;
  height: 100%;
  background-color: #b51b42;
  z-index: 2;
  min-height: 80px;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-button:hover {
  transform: scale(1.2);
  background-color: aquamarine;
}

.menu-button:active {
  transform: scale(0.98);
}
</style> -->

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import Phaser from 'phaser'

const gameContainer = ref(null)
let game = null

class HomeScene extends Phaser.Scene {
  constructor() { super({ key: 'HomeScene' }) }

  preload() {
    this.load.image('bg_sky', '/assets/background/overworld/background_solid_sky.png')
    this.load.image('bg_clouds', '/assets/background/overworld/background_clouds.png')
    this.load.image('bg_trees', '/assets/background/overworld/background_color_trees.png')
    this.load.image('bg_grass', '/assets/background/overworld/background_solid_grass.png')
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    this.add.image(0, 0, 'bg_sky')
      .setOrigin(0, 0)
      .setDisplaySize(W, Math.ceil(H * 0.55))
      .setDepth(0)

    const cloudsTex = this.textures.get('bg_clouds').getSourceImage()
    const cloudsH = Math.ceil(H * 0.30)
    this.bgClouds = this.add.tileSprite(0, Math.floor(H * 0.25), W, cloudsH, 'bg_clouds')
      .setOrigin(0, 0)
      .setTileScale(cloudsH / cloudsTex.height)
      .setDepth(1)

    const treesTex = this.textures.get('bg_trees').getSourceImage()
    const treesH = Math.ceil(H * 0.35)
    this.bgTrees = this.add.tileSprite(0, Math.floor(H * 0.50), W, treesH, 'bg_trees')
      .setOrigin(0, 0)
      .setTileScale(treesH / treesTex.height)
      .setDepth(2)

    const grassTex = this.textures.get('bg_grass').getSourceImage()
    const grassH = Math.ceil(H * 0.20)
    this.bgGrass = this.add.tileSprite(0, Math.floor(H * 0.78), W, grassH, 'bg_grass')
      .setOrigin(0, 0)
      .setTileScale(grassH / grassTex.height)
      .setDepth(3)

    this.tweens.add({
      targets: this.bgClouds,
      y: this.bgClouds.y + 10,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.tweens.add({
      targets: this.bgTrees,
      y: this.bgTrees.y + 6,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.sun = this.add.graphics()
    this.sunX = W - 110
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

  update(time, delta) {
    const dt = delta / 16

    this.bgClouds.tilePositionX += 0.15 * dt
    this.bgTrees.tilePositionX  += 0.35 * dt
    this.bgGrass.tilePositionX  += 0.8  * dt
  }
}

onMounted(async () => {
  await nextTick()

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    scene: [HomeScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
  })
})

onBeforeUnmount(() => {
  if (game) game.destroy(true)
})
</script>

<template>
  <div class="home-root">
    <div ref="gameContainer" class="game-canvas" />

    <div class="overlay">
      <div class="center-cta">
        <h1 class="home-title">Blockhop</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

.home-root {
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
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.center-cta {
  display: flex;
  flex-direction: column;
  gap: 20px;
  pointer-events: all;
}

.home-title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(10rem, 6vw, 5rem);
  line-height: 1;
  color: green;
  animation: title-wobble 6s ease-in-out infinite alternate;
  transform-style: preserve-3d;
  display: inline-block;
  text-shadow: 3px 3px 0 #1a4a0a, 5px 5px 0 rgba(0,0,0,0.25);
}
</style>