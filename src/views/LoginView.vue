<script setup>
import {onMounted, onBeforeUnmount, ref, computed, nextTick} from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import Phaser from 'phaser'

const auth = useAuthStore()
const router = useRouter()

if (auth.isAuthenticated) {
  router.replace({ name: 'home' })
}

const isLoading = computed(() => auth.isLoading)
const gameContainer = ref(null)
let game = null

function handleLogin() {
  auth.loginWithSwitch()
}

class LoginScene extends Phaser.Scene {
  constructor() { super({ key: 'LoginScene' }) }

  preload() {
    this.load.image('bg_sky',    '/assets/background/overworld/background_solid_sky.png')
    this.load.image('bg_clouds', '/assets/background/overworld/background_clouds.png')
    this.load.image('bg_trees',  '/assets/background/overworld/background_color_trees.png')
    this.load.image('bg_grass',  '/assets/background/overworld/background_solid_grass.png')
    this.load.spritesheet('tiles', '/assets/tiles.png', { frameWidth: 128, frameHeight: 128 })
    this.load.image('coin',     '/assets/coin/coin_gold.png')
    this.load.image('coinside', '/assets/coin/coin_gold_side.png')
    this.load.atlas('player', '/assets/player.png', '/assets/player.json')
  }

  create() {
    const W    = this.scale.width
    const H    = this.scale.height
    const TILE = 64

    // ── Backgrounds ───────────────────────────────────────────────────────
    this.add.image(0, 0, 'bg_sky')
        .setOrigin(0, 0).setDisplaySize(W, Math.ceil(H * 0.55)).setDepth(0)

    const cloudsTex = this.textures.get('bg_clouds').getSourceImage()
    const cloudsH   = Math.ceil(H * 0.30)
    this.bgClouds = this.add.tileSprite(0, Math.floor(H * 0.28), W, cloudsH, 'bg_clouds')
        .setOrigin(0, 0).setTileScale(cloudsH / cloudsTex.height).setDepth(1)

    const treesTex = this.textures.get('bg_trees').getSourceImage()
    const treesH   = Math.ceil(H * 0.35)
    this.bgTrees = this.add.tileSprite(0, Math.floor(H * 0.55), W, treesH, 'bg_trees')
        .setOrigin(0, 0).setTileScale(treesH / treesTex.height).setDepth(2)

    const grassTex = this.textures.get('bg_grass').getSourceImage()
    const grassH   = Math.ceil(H * 0.20)
    this.bgGrass = this.add.tileSprite(0, Math.floor(H * 0.82), W, grassH, 'bg_grass')
        .setOrigin(0, 0).setTileScale(grassH / grassTex.height).setDepth(2)

    // ── Sun ───────────────────────────────────────────────────────────────
    const sun = this.add.graphics().setDepth(4).setPosition(W - 110, 90)
    this.drawSun(sun)
    this.tweens.add({ targets: sun, angle: 360, duration: 20000, repeat: -1 })

    // ── Platforms ─────────────────────────────────────────────────────────
    const GROUND_Y = H * 0.78
    const platforms = [
      { x: W * 0.06, y: GROUND_Y,              cols: 5 },
      { x: W * 0.28, y: GROUND_Y - TILE * 2.5, cols: 3 },
      { x: W * 0.50, y: GROUND_Y - TILE * 1.5, cols: 4 },
      { x: W * 0.76, y: GROUND_Y,              cols: 4 },
    ]

    const platGroup = this.physics.add.staticGroup()
    platforms.forEach(({ x, y, cols }) => {
      for (let col = 0; col < cols; col++) {
        const frame = col === 0 ? 13 : col === cols - 1 ? 15 : 14
        this.add.image(x + col * TILE, y, 'tiles', frame)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(3)
      }
      const bodyW = cols * TILE
      const body  = this.add.rectangle(x + bodyW / 2, y + 4, bodyW, 8)
      this.physics.add.existing(body, true)
      body.body.checkCollision.down  = false
      body.body.checkCollision.left  = false
      body.body.checkCollision.right = false
      platGroup.add(body)
    })

    // ── Coins on p1 and p2 ────────────────────────────────────────────────
    this.coins = platforms.slice(1, 3).map(({ x, y, cols }, i) => {
      const cx    = x + (cols / 2) * TILE
      const baseY = y - 52
      const sprite = this.add.image(cx, baseY, 'coin').setScale(0.65).setDepth(4)
      this.tweens.add({
        targets: sprite, scaleX: -0.65,
        duration: 400 + i * 30, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
      return { sprite, x: cx, y: baseY, collected: false }
    })

    // ── Animations ────────────────────────────────────────────────────────
    if (!this.anims.exists('walk')) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', { prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2 }),
        frameRate: 12, repeat: -1,
      })
    }
    if (!this.anims.exists('jump'))
      this.anims.create({ key: 'jump', frames: [{ key: 'player', frame: 'p1_jump' }], frameRate: 1 })
    if (!this.anims.exists('idle'))
      this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 'p1_stand' }], frameRate: 1 })

    // ── Alien ─────────────────────────────────────────────────────────────
    const p0 = platforms[0]
    this.player = this.physics.add.sprite(
        p0.x + (p0.cols / 2) * TILE, p0.y - 2, 'player'
    ).setOrigin(0.5, 1).setScale(0.75).setDepth(5).setCollideWorldBounds(true)

    this.player.body.setSize(
        this.player.displayWidth * 0.6,
        this.player.displayHeight * 0.9,
    )
    this.player.play('idle')

    this.physics.add.collider(this.player, platGroup, null,
        (alien) => alien.body.velocity.y > 10, this
    )

    // ── AI waypoints ──────────────────────────────────────────────────────
    this.waypoints = [
      { x: p0.x + p0.cols * TILE - 30,                          action: 'walk',     pauseMs: 800 },
      { x: platforms[1].x + (platforms[1].cols / 2) * TILE,     action: 'jump',     pauseMs: 350 },
      { x: platforms[2].x + (platforms[2].cols / 2) * TILE,     action: 'jump',     pauseMs: 500, steps: 2, dir: 1 },
      { x: platforms[3].x + (platforms[3].cols / 2) * TILE,     action: 'jump',     pauseMs: 500, hops: 3 },
      { x: platforms[3].x + (platforms[3].cols / 2) * TILE,     action: 'fall_off', pauseMs: 600 },
    ]

    this.wpIdx         = 0
    this.aiState       = 'pre_action'
    this.aiTimer       = this.waypoints[0].pauseMs
    this.airborneTimer = 0
    this.hopCount      = 0
    this.platforms     = platforms
    this.TILE          = TILE
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

    // ── Parallax scroll ───────────────────────────────────────────────────
    this.bgClouds.tilePositionX += 0.3 * dt
    this.bgTrees.tilePositionX  += 0.4 * dt
    this.bgGrass.tilePositionX  += 0.7 * dt

    const p        = this.player
    const onGround = p.body.blocked.down

    // ── Coin collection ───────────────────────────────────────────────────
    this.coins.forEach(c => {
      if (c.collected) return
      if (Math.abs(p.x - c.x) < 40 && Math.abs(p.y - c.y) < 60) {
        c.collected = true
        this.tweens.killTweensOf(c.sprite)
        this.tweens.add({
          targets: c.sprite, y: c.sprite.y - 50, alpha: 0,
          duration: 350, ease: 'Cubic.Out',
          onComplete: () => {
            this.time.delayedCall(10000, () => {
              c.collected = false
              c.sprite.setVisible(true).setAlpha(1).setY(c.y).setScale(0.65)
              this.tweens.add({
                targets: c.sprite, scaleX: -0.65,
                duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
              })
            })
          },
        })
      }
    })

    // ── AI state machine ──────────────────────────────────────────────────
    switch (this.aiState) {

      case 'pre_action':
        p.setVelocityX(0)
        p.play('idle', true)
        this.aiTimer -= delta
        if (this.aiTimer <= 0) {
          const wp = this.waypoints[this.wpIdx]
          if (wp.action === 'walk')          this.aiState = 'walk'
          else if (wp.action === 'fall_off') this.aiState = 'fall_off'
          else if (wp.steps) {
            this.stepsLeft = wp.steps
            this.stepDir   = wp.dir ?? 1
            this.aiState   = 'steps_before_jump'
          } else if (wp.hops) {
            this.hopCount = wp.hops
            this.aiState  = 'hopping'
          } else {
            p.setFlipX(wp.x < p.x)
            this.aiState = 'jump'
          }
        }
        break

      case 'walk': {
        const wp  = this.waypoints[this.wpIdx]
        const dx  = wp.x - p.x
        const dir = dx > 0 ? 1 : -1
        p.setFlipX(dir < 0)
        if (Math.abs(dx) > 6) {
          p.setVelocityX(dir * 120)
          p.play('walk', true)
        } else {
          p.setVelocityX(0)
          p.play('idle', true)
          this.wpIdx++
          const next = this.waypoints[this.wpIdx]
          p.setFlipX(next.x < p.x)
          this.aiTimer = next.pauseMs
          this.aiState = 'pre_action'
        }
        break
      }

      case 'steps_before_jump': {
        const wp  = this.waypoints[this.wpIdx]
        const dir = this.stepDir
        p.setFlipX(dir < 0)
        if (this.stepsLeft > 0) {
          p.setVelocityX(dir * 120)
          p.play('walk', true)
          if (Math.abs(p.body.velocity.x) > 0) {
            this.stepDist = (this.stepDist ?? 0) + Math.abs(p.body.velocity.x) * (delta / 1000)
            if (this.stepDist >= 40) { this.stepDist = 0; this.stepsLeft-- }
          }
        } else {
          p.setVelocityX(0)
          p.play('idle', true)
          p.setFlipX(wp.x < p.x)
          this.aiState = 'jump'
        }
        break
      }

      case 'hopping':
        if (onGround && this.hopCount > 0) {
          p.setVelocityY(-320)
          p.setVelocityX(0)
          p.play('jump', true)
          this.hopCount--
          this.aiState = 'hop_airborne'
        } else if (this.hopCount <= 0 && onGround) {
          const wp = this.waypoints[this.wpIdx]
          p.setFlipX(wp.x < p.x)
          this.aiState = 'jump'
        }
        break

      case 'hop_airborne':
        p.setVelocityX(0)
        if (onGround) { p.play('idle', true); this.aiTimer = 200; this.aiState = 'hop_pause' }
        break

      case 'hop_pause':
        this.aiTimer -= delta
        if (this.aiTimer <= 0) this.aiState = 'hopping'
        break

      case 'jump':
        if (onGround) {
          const wp = this.waypoints[this.wpIdx]
          p.setFlipX(wp.x < p.x)
          p.setVelocityY(-520)
          // Set horizontal velocity immediately — same frame as vertical impulse
          p.setVelocityX(Phaser.Math.Clamp((wp.x - p.x) * 3, -200, 200))
          p.play('jump', true)
          this.airborneTimer = 200  // must be airborne at least 200ms before landing counts
          this.aiState = 'airborne'
        }
        break

      case 'airborne': {
        const wp = this.waypoints[this.wpIdx]
        const dx = wp.x - p.x
        p.setVelocityX(Math.abs(dx) > 8 ? Phaser.Math.Clamp(dx * 3, -200, 200) : 0)
        p.setFlipX(dx < 0)
        this.airborneTimer = Math.max(0, this.airborneTimer - delta)
        // Only register landing after min airborne time — prevents false ground detection
        if (onGround && this.airborneTimer <= 0) {
          p.setVelocityX(0)
          p.play('idle', true)
          this.wpIdx++
          if (this.wpIdx >= this.waypoints.length) this.wpIdx = 0
          const next = this.waypoints[this.wpIdx]
          this.aiTimer = next.pauseMs
          this.aiState = 'pre_action'
        }
        break
      }

      case 'fall_off':
        if (onGround) {
          p.setCollideWorldBounds(false)
          p.setVelocityX(180)
          p.setVelocityY(-380)
          p.play('jump', true)
          this.aiState = 'respawning'
          this.time.delayedCall(2000, () => p.setVisible(false))
          this.time.delayedCall(3000, () => {
            const p0 = this.platforms[0]
            p.setCollideWorldBounds(true)
            p.setPosition(p0.x + (p0.cols / 2) * this.TILE, p0.y - 2)
            p.setVelocity(0, 0)
            p.setVisible(true)
            p.play('idle', true)
            this.wpIdx   = 0
            this.aiTimer = this.waypoints[0].pauseMs
            this.aiState = 'pre_action'
            this.coins.forEach(c => {
              if (!c.collected) return
              c.collected = false
              c.sprite.setVisible(true).setAlpha(1).setY(c.y).setScale(0.65)
              this.tweens.add({
                targets: c.sprite, scaleX: -0.65,
                duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
              })
            })
          })
        }
        break

      case 'respawning':
        break
    }
  }
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    backgroundColor: '#87ceeb',
    scene: [LoginScene],
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 600 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width:  window.innerWidth,
      height: window.innerHeight,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  })
}, 280) // resolves RESIZE problem
})              // When page is loaded, it is not displayed correctly

onBeforeUnmount(() => {
  if (game) { game.destroy(true); game = null }
})
</script>

<template>
  <div class="login-root">
    <div ref="gameContainer" class="game-canvas" />
    <div class="overlay">
      <div class="center-cta">
        <div class="brand">
          <h1 class="brand__title">Block<span class="brand__hop">hop</span></h1>
          <span class="brand__splash">Now with aliens!</span>
        </div>

        <button class="login-btn" :disabled="isLoading" @click="handleLogin">
          <span v-if="!isLoading">Sign in with SWITCH edu-ID</span>
          <span v-else class="btn-loading"><span class="btn-spinner" />Redirecting…</span>
        </button>
        <p v-if="auth.error" class="login-error" role="alert">Login failed — please try again</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.login-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.game-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.game-canvas :deep(canvas) {
  display: block;
  position: absolute;
  top: 0; left: 0;
  width: 100% !important;
  height: 100% !important;
}
.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.brand {
  user-select: none;
  text-align: center;
  position: relative;
  display: inline-block;
}
.brand__splash {
  position: absolute;
  bottom: -8px;
  right: -20px;
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(0.9rem, 1.5vw, 1.2rem);
  color: #FFE03A;
  text-shadow: 2px 2px 0 #7a5a00, 0 0 12px #FFE03Acc;
  transform: rotate(18deg);
  transform-origin: left center;
  white-space: nowrap;
  animation: splash-pulse 1.2s ease-in-out infinite alternate;
  pointer-events: none;
}
.brand__title {
  font-family: 'Pixelify Sans', monospace;
  font-size: clamp(10rem, 6vw, 5rem);
  line-height: 1;
  color: #fff;
  animation: title-wobble 6s ease-in-out infinite alternate;
  transform-style: preserve-3d;
  display: inline-block;
  text-shadow: 3px 3px 0 #1a4a0a, 5px 5px 0 rgba(0,0,0,0.25);
}
.brand__hop {
  color: #4ade80;
  text-shadow: 3px 3px 0 #166534, 5px 5px 0 rgba(0,0,0,0.25);
}
.center-cta {
  position: absolute;
  top: 27%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  pointer-events: all;
}
.login-btn {
  padding: 25px 55px;
  background: #4ade80;
  color: #052e16;
  border: #181818 2px solid;
  font-family: 'Pixelify Sans', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 5px 0 #166534, 0 8px 18px rgba(0,0,0,0.25);
  transition: transform 0.07s, box-shadow 0.07s;
}
.login-btn:hover:not(:disabled) {
  background: #86efac;
  transform: translateY(-3px);
  box-shadow: 0 8px 0 #166534, 0 12px 24px rgba(0,0,0,0.28);
}
.login-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 1px 0 #166534;
}
.login-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-loading { display: flex; align-items: center; gap: 9px; }
.btn-spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(5,46,22,0.2);
  border-top-color: #052e16;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
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
.login-error {
  font-size: 0.8rem;
  color: #ef4444;
  background: rgba(0,0,0,0.4);
  padding: 5px 12px;
}
</style>