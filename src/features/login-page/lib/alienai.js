/**
 * alienAI.js
 *
 * AI state machine for the decorative alien on the login screen.
 * The alien follows a fixed waypoint script: walk, jump across platforms,
 * collect coins, then fall off and respawn.
 *
 * Usage:
 *   // In create():
 *   const ai = initAlienAI(scene, player, platforms, coins, TILE)
 *
 *   // In update():
 *   updateAlienAI(ai, delta)
 */

import Phaser from 'phaser'
import { restoreCoins } from './platforms.js'

const LOGIN_PLAYER_TEXTURE_KEY = 'login_player'
const LOGIN_PLAYER_SKINS = ['beige', 'green', 'pink', 'purple', 'yellow']
const WALK_SPEED = 180
const JUMP_SPEED = 520
const LOW_JUMP_SPEED = 460
const JUMP_TRACKING_SPEED = 280
const JUMP_TRACKING_FORCE = 4
const FALL_OFF_SPEED = 240
const FALL_RECOVERY_OFFSET = 220

function randomSkin(exceptSkin = null) {
    const choices = LOGIN_PLAYER_SKINS.filter((skin) => skin !== exceptSkin)
    return Phaser.Math.RND.pick(choices.length > 0 ? choices : LOGIN_PLAYER_SKINS)
}

function animationKey(kind, skin) {
    return `login_${skin}_${kind}`
}

function playAlienAnimation(player, kind) {
    player.play(animationKey(kind, player.loginSkin), true)
}

/**
 * Registers player animations. Safe to call multiple times — checks existence first.
 * @param {Phaser.Scene} scene
 */
export function createAlienAnimations(scene) {
    for (const skin of LOGIN_PLAYER_SKINS) {
        if (!scene.anims.exists(animationKey('walk', skin))) {
            scene.anims.create({
                key: animationKey('walk', skin),
                frames: [
                    { key: LOGIN_PLAYER_TEXTURE_KEY, frame: `character_${skin}_walk_a` },
                    { key: LOGIN_PLAYER_TEXTURE_KEY, frame: `character_${skin}_walk_b` },
                ],
                frameRate: 12, repeat: -1,
            })
        }
        if (!scene.anims.exists(animationKey('jump', skin)))
            scene.anims.create({ key: animationKey('jump', skin), frames: [{ key: LOGIN_PLAYER_TEXTURE_KEY, frame: `character_${skin}_jump` }], frameRate: 1 })
        if (!scene.anims.exists(animationKey('idle', skin)))
            scene.anims.create({ key: animationKey('idle', skin), frames: [{ key: LOGIN_PLAYER_TEXTURE_KEY, frame: `character_${skin}_idle` }], frameRate: 1 })
    }
}

/**
 * Initialises the alien sprite and returns the AI state object.
 *
 * @param {Phaser.Scene}   scene
 * @param {object[]}       platforms   returned by createPlatforms()
 * @param {object}         platGroup   returned by createPlatforms()
 * @param {object[]}       coins       returned by createPlatforms()
 * @param {number}         TILE
 * @returns {object}  ai state — pass to updateAlienAI() every frame
 */
export function initAlienAI(scene, platforms, platGroup, coins, TILE) {
    const p0 = platforms[0]

    const player = scene.physics.add.sprite(
        p0.x + (p0.cols / 2) * TILE, p0.y - 2, LOGIN_PLAYER_TEXTURE_KEY
    ).setOrigin(0.5, 1).setScale(0.75).setDepth(5).setCollideWorldBounds(true)

    player.loginSkin = randomSkin()
    player.body.setSize(
        player.displayWidth * 0.6,
        player.displayHeight * 0.9,
    )
    playAlienAnimation(player, 'idle')

    // One-way collision: only land when clearly falling (vy > 10)
    scene.physics.add.collider(player, platGroup, null,
        (alien) => alien.body.velocity.y > 10, scene
    )

    // Waypoint script — strictly left to right
    const waypoints = [
        { x: p0.x + p0.cols * TILE - 30,                          action: 'walk',     pauseMs: 800 },
        { x: platforms[1].x + (platforms[1].cols / 2) * TILE,     action: 'jump',     pauseMs: 350 },
        { x: platforms[2].x + (platforms[2].cols / 2) * TILE,     action: 'jump',     pauseMs: 500, steps: 2, dir: 1, jumpSpeed: LOW_JUMP_SPEED },
        { x: platforms[3].x + (platforms[3].cols / 2) * TILE,     action: 'jump',     pauseMs: 500, jumpSpeed: LOW_JUMP_SPEED },
        { x: platforms[3].x + (platforms[3].cols / 2) * TILE,     action: 'fall_off', pauseMs: 600 },
    ]

    return {
        scene,
        player,
        platforms,
        coins,
        waypoints,
        TILE,
        wpIdx:         0,
        aiState:       'pre_action',
        aiTimer:       waypoints[0].pauseMs,
        airborneTimer: 0,
        hopCount:      0,
        stepsLeft:     0,
        stepDir:       1,
        stepDist:      0,
    }
}

/**
 * Advances the AI by one frame. Call from scene's update().
 *
 * @param {object} ai     state object returned by initAlienAI()
 * @param {number} delta  ms since last frame
 */
export function updateAlienAI(ai, delta) {
    const { scene, player: p, waypoints, platforms, coins, TILE } = ai
    const onGround = p.body.blocked.down

    if (ai.aiState !== 'respawning' && p.y > scene.scale.height + FALL_RECOVERY_OFFSET) {
        respawnAlien(ai)
        return
    }

    switch (ai.aiState) {

        case 'pre_action':
            p.setVelocityX(0)
            playAlienAnimation(p, 'idle')
            ai.aiTimer -= delta
            if (ai.aiTimer <= 0) {
                const wp = waypoints[ai.wpIdx]
                if (wp.action === 'walk')          ai.aiState = 'walk'
                else if (wp.action === 'fall_off') ai.aiState = 'fall_off'
                else if (wp.steps) {
                    ai.stepsLeft = wp.steps
                    ai.stepDir   = wp.dir ?? 1
                    ai.stepDist  = 0
                    ai.aiState   = 'steps_before_jump'
                } else {
                    p.setFlipX(wp.x < p.x)
                    ai.aiState = 'jump'
                }
            }
            break

        case 'walk': {
            const wp  = waypoints[ai.wpIdx]
            const dx  = wp.x - p.x
            const dir = dx > 0 ? 1 : -1
            p.setFlipX(dir < 0)
            if (Math.abs(dx) > 6) {
                p.setVelocityX(dir * WALK_SPEED)
                playAlienAnimation(p, 'walk')
            } else {
                p.setVelocityX(0)
                playAlienAnimation(p, 'idle')
                ai.wpIdx++
                const next = waypoints[ai.wpIdx]
                p.setFlipX(next.x < p.x)
                ai.aiTimer = next.pauseMs
                ai.aiState = 'pre_action'
            }
            break
        }

        case 'steps_before_jump': {
            const wp  = waypoints[ai.wpIdx]
            const dir = ai.stepDir
            p.setFlipX(dir < 0)
            if (ai.stepsLeft > 0) {
                p.setVelocityX(dir * WALK_SPEED)
                playAlienAnimation(p, 'walk')
                if (Math.abs(p.body.velocity.x) > 0) {
                    ai.stepDist += Math.abs(p.body.velocity.x) * (delta / 1000)
                    if (ai.stepDist >= 40) { ai.stepDist = 0; ai.stepsLeft-- }
                }
            } else {
                p.setVelocityX(0)
                playAlienAnimation(p, 'idle')
                p.setFlipX(wp.x < p.x)
                ai.aiState = 'jump'
            }
            break
        }

        case 'jump':
            if (onGround) {
                const wp = waypoints[ai.wpIdx]
                p.setFlipX(wp.x < p.x)
                p.setVelocityY(-(wp.jumpSpeed ?? JUMP_SPEED))
                p.setVelocityX(Phaser.Math.Clamp((wp.x - p.x) * JUMP_TRACKING_FORCE, -JUMP_TRACKING_SPEED, JUMP_TRACKING_SPEED))
                playAlienAnimation(p, 'jump')
                ai.airborneTimer = 200
                ai.aiState = 'airborne'
            }
            break

        case 'airborne': {
            const wp = waypoints[ai.wpIdx]
            const dx = wp.x - p.x
            p.setVelocityX(Math.abs(dx) > 8 ? Phaser.Math.Clamp(dx * JUMP_TRACKING_FORCE, -JUMP_TRACKING_SPEED, JUMP_TRACKING_SPEED) : 0)
            p.setFlipX(dx < 0)
            ai.airborneTimer = Math.max(0, ai.airborneTimer - delta)
            if (onGround && ai.airborneTimer <= 0) {
                p.setVelocityX(0)
                playAlienAnimation(p, 'idle')
                ai.wpIdx++
                if (ai.wpIdx >= waypoints.length) ai.wpIdx = 0
                const next = waypoints[ai.wpIdx]
                ai.aiTimer = next.pauseMs
                ai.aiState = 'pre_action'
            }
            break
        }

        case 'fall_off':
            if (onGround) {
                p.setCollideWorldBounds(false)
                p.setVelocityX(FALL_OFF_SPEED)
                p.setVelocityY(-380)
                playAlienAnimation(p, 'jump')
                ai.aiState = 'respawning'
                scene.time.delayedCall(2000, () => p.setVisible(false))
                scene.time.delayedCall(3000, () => {
                    respawnAlien(ai)
                })
            }
            break

        case 'respawning':
            break
    }
}

function respawnAlien(ai) {
    const { scene, player: p, platforms, coins, TILE, waypoints } = ai
    const p0 = platforms[0]

    p.setCollideWorldBounds(true)
    p.setPosition(p0.x + (p0.cols / 2) * TILE, p0.y - 2)
    p.setVelocity(0, 0)
    p.loginSkin = randomSkin(p.loginSkin)
    p.setVisible(true)
    playAlienAnimation(p, 'idle')
    ai.wpIdx = 0
    ai.aiTimer = waypoints[0].pauseMs
    ai.aiState = 'pre_action'
    restoreCoins(scene, coins)
}
