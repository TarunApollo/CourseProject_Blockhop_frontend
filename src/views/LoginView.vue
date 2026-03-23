<script setup>
import { useRouter } from 'vue-router'
import { login } from '../stores/auth'

const router = useRouter()

function handleLogin() {
    login()
    router.push('/home')
}

const tileSources = [
  '/assets/block_plank.png',
  '/assets/block_planks.png',
  '/assets/terrain_grass_block.png'
]

const totalTileCopies = 30
const minDistance = 22

function buildRandomTiles() {
  const placedPoints = []
  const tiles = []

  for (let index = 0; index < totalTileCopies; index++) {
    let x = Math.floor(Math.random() * 86) + 7
    let y = Math.floor(Math.random() * 78) + 7
    let validSpot = false
    let attempts = 0

    while (!validSpot && attempts < 200) {
      x = Math.floor(Math.random() * 86) + 7
      y = Math.floor(Math.random() * 78) + 7

      validSpot = placedPoints.every((point) => {
        const dx = x - point.x
        const dy = y - point.y
        return Math.sqrt((dx * dx) + (dy * dy)) >= minDistance
      })

      attempts += 1
    }

    placedPoints.push({ x, y })

    tiles.push({
      id: index,
      src: tileSources[Math.floor(Math.random() * tileSources.length)],
      left: `${x}%`,
      top: `${y}%`,
      rotate: `${Math.floor(Math.random() * 31) - 15}deg`,
      width: `${Math.floor(Math.random() * 31) + 40}px`
    })
  }

  return tiles
}

const randomTiles = buildRandomTiles()
</script>

<template>
     <!-- 
        This is a simulation of what is accessible to users before login and after
    -->
    <div class="scene">
        <img src="/assets/background/overworld/loginpic.png" class="layer" alt="Background Image"/>
        <div class="tiles">
          <img
            v-for="(tile, index) in randomTiles"
            :key="tile.id"
            :src="tile.src"
            :alt="`Tile ${index + 1}`"
            class="tile"
            :style="{ left: tile.left, top: tile.top, transform: `rotate(${tile.rotate})`, width: tile.width }"
          />
        </div>

        <section class="login-content">
            <div class="login-container">
                <h1 class="game-title">Blockhop</h1>
                <p class="game-description">Click to start your journey!</p>
                <button @click="handleLogin" class="login-button">Login</button>
            </div>
        </section>
    </div>
</template>

<style scoped>
.scene {
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
}

.tiles {
  position: absolute;
  inset: 0;
}

.tile {
  position: absolute;
  width: 60px;
  pointer-events: none;
}

.login-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.login-container {
    text-align: center;
    max-width: 700px;
}

.game-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 135px;
  color: #906520;
  text-shadow: 8px 8px 0 #b51b42;
  margin: 0;
}

.game-description {
  font-family: 'Fredoka', sans-serif;
  font-size: 50px;
  color: #ae7313;
  text-shadow: 2px 2px 0 #b51b42;
  margin: 40px 0 70px;
}

.login-button {
    padding: 2rem 4rem;
    font-size: 1.5rem;
    background-color: #a87118;
    box-shadow: 8px 8px 0 #b51b42;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.login-button:hover {
    background-color: #ce680e;
    transform: scale(1.4);
}
</style>