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

function buildGridTiles() {
    const tiles = []

    const cols = 5 // tiles horizontally
    const rows = 4 // tiles vertically
    const cellWidth = 110 / cols
    const cellHeight = 110 / rows

    let id = 0

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (row === 1 || row === 2) {
                if (col === 1 || col === 2 || col === 3) {
                    continue
                }
            }
            tiles.push({
                id: id++,
                src: tileSources[Math.floor(Math.random() * tileSources.length)],
                left: `${col * cellWidth}%`,
                top: `${row * cellHeight}%`,
                width: `120px`
            })
        }
    }

    return tiles
}
const randomTiles = buildGridTiles()
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
}

.tile:hover {
  transform: scale(1.2);
  z-index: 1;
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