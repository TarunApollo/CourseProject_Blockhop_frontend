import Phaser from 'phaser'
import { createBackground, scrollBackground } from '@/shared/lib/background.js'
import { createPlatforms, checkCoinCollection } from '@/features/login-page/lib/platforms.js'
import { createAlienAnimations, initAlienAI, updateAlienAI } from '@/features/login-page/lib/alienai.js'

export class LoginScene extends Phaser.Scene {
    constructor() { super({ key: 'LoginScene' }) }

    preload() {
        if (!this.textures.exists('bg_sky')) {
            this.load.image('bg_sky', '/assets/background/overworld/background_solid_sky.png')
        }
        if (!this.textures.exists('bg_clouds')) {
            this.load.image('bg_clouds', '/assets/background/overworld/background_clouds.png')
        }
        if (!this.textures.exists('bg_trees')) {
            this.load.image('bg_trees', '/assets/background/overworld/background_color_trees.png')
        }
        if (!this.textures.exists('bg_grass')) {
            this.load.image('bg_grass', '/assets/background/overworld/background_solid_grass.png')
        }
        this.load.spritesheet('tiles', '/assets/tiles.png', { frameWidth: 128, frameHeight: 128 })
        this.load.image('coin',     '/assets/coin/coin_gold.png')
        this.load.image('coinside', '/assets/coin/coin_gold_side.png')
        this.load.atlas('player', '/assets/player.png', '/assets/player.json')
    }

    create() {
        const W    = this.scale.width
        const H    = this.scale.height
        const TILE = 64

        this.bg = createBackground(this, W, H)

        const { platforms, platGroup, coins } = createPlatforms(this, W, H, TILE)
        this.coins = coins

        createAlienAnimations(this)
        this.ai = initAlienAI(this, platforms, platGroup, coins, TILE)
    }

    update(time, delta) {
        const dt = delta / 16
        scrollBackground(this.bg, dt)
        checkCoinCollection(this, this.coins, this.ai.player)
        updateAlienAI(this.ai, delta)
    }
}
