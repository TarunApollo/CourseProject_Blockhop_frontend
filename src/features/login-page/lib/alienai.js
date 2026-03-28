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

/**
 * Registers player animations. Safe to call multiple times — checks existence first.
 * @param {Phaser.Scene} scene
 */
export function createAlienAnimations(scene) {
    if (!scene.anims.exists('walk')) {
        scene.anims.create({
            key: 'walk',
            frames: scene.anims.generateFrameNames('player', {
                prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2,
            }),
            frameRate: 12, repeat: -1,
        })
    }
    if (!scene.anims.exists('jump'))
        scene.anims.create({ key: 'jump', frames: [{ key: 'player', frame: 'p1_jump' }], frameRate: 1 })
    if (!scene.anims.exists('idle'))
        scene.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 'p1_stand' }], frameRate: 1 })
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
        p0.x + (p0.cols / 2) * TILE, p0.y - 2, 'player'
    ).setOrigin(0.5, 1).setScale(0.75).setDepth(5).setCollideWorldBounds(true)

    player.body.setSize(
        player.displayWidth * 0.6,
        player.displayHeight * 0.9,
    )
    player.play('idle')

    // One-way collision: only land when clearly falling (vy > 10)
    scene.physics.add.collider(player, platGroup, null,
        (alien) => alien.body.velocity.y > 10, scene
    )

    // Waypoint script — strictly left to right
    const waypoints = [
        { x: p0.x + p0.cols * TILE - 30,                          action: 'walk',     pauseMs: 800 },
        { x: platforms[1].x + (platforms[1].cols / 2) * TILE,     action: 'jump',     pauseMs: 350 },
        { x: platforms[2].x + (platforms[2].cols / 2) * TILE,     action: 'jump',     pauseMs: 500, steps: 2, dir: 1 },
        { x: platforms[3].x + (platforms[3].cols / 2) * TILE,     action: 'jump',     pauseMs: 500, hops: 3 },
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

    switch (ai.aiState) {

        case 'pre_action':
            p.setVelocityX(0)
            p.play('idle', true)
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
                } else if (wp.hops) {
                    ai.hopCount = wp.hops
                    ai.aiState  = 'hopping'
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
                p.setVelocityX(dir * 120)
                p.play('walk', true)
            } else {
                p.setVelocityX(0)
                p.play('idle', true)
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
                p.setVelocityX(dir * 120)
                p.play('walk', true)
                if (Math.abs(p.body.velocity.x) > 0) {
                    ai.stepDist += Math.abs(p.body.velocity.x) * (delta / 1000)
                    if (ai.stepDist >= 40) { ai.stepDist = 0; ai.stepsLeft-- }
                }
            } else {
                p.setVelocityX(0)
                p.play('idle', true)
                p.setFlipX(wp.x < p.x)
                ai.aiState = 'jump'
            }
            break
        }

        case 'hopping':
            if (onGround && ai.hopCount > 0) {
                p.setVelocityY(-320)
                p.setVelocityX(0)
                p.play('jump', true)
                ai.hopCount--
                ai.aiState = 'hop_airborne'
            } else if (ai.hopCount <= 0 && onGround) {
                const wp = waypoints[ai.wpIdx]
                p.setFlipX(wp.x < p.x)
                ai.aiState = 'jump'
            }
            break

        case 'hop_airborne':
            p.setVelocityX(0)
            if (onGround) { p.play('idle', true); ai.aiTimer = 200; ai.aiState = 'hop_pause' }
            break

        case 'hop_pause':
            ai.aiTimer -= delta
            if (ai.aiTimer <= 0) ai.aiState = 'hopping'
            break

        case 'jump':
            if (onGround) {
                const wp = waypoints[ai.wpIdx]
                p.setFlipX(wp.x < p.x)
                p.setVelocityY(-520)
                p.setVelocityX(Phaser.Math.Clamp((wp.x - p.x) * 3, -200, 200))
                p.play('jump', true)
                ai.airborneTimer = 200
                ai.aiState = 'airborne'
            }
            break

        case 'airborne': {
            const wp = waypoints[ai.wpIdx]
            const dx = wp.x - p.x
            p.setVelocityX(Math.abs(dx) > 8 ? Phaser.Math.Clamp(dx * 3, -200, 200) : 0)
            p.setFlipX(dx < 0)
            ai.airborneTimer = Math.max(0, ai.airborneTimer - delta)
            if (onGround && ai.airborneTimer <= 0) {
                p.setVelocityX(0)
                p.play('idle', true)
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
                p.setVelocityX(180)
                p.setVelocityY(-380)
                p.play('jump', true)
                ai.aiState = 'respawning'
                scene.time.delayedCall(2000, () => p.setVisible(false))
                scene.time.delayedCall(3000, () => {
                    const p0 = platforms[0]
                    p.setCollideWorldBounds(true)
                    p.setPosition(p0.x + (p0.cols / 2) * TILE, p0.y - 2)
                    p.setVelocity(0, 0)
                    p.setVisible(true)
                    p.play('idle', true)
                    ai.wpIdx   = 0
                    ai.aiTimer = waypoints[0].pauseMs
                    ai.aiState = 'pre_action'
                    restoreCoins(scene, coins)
                })
            }
            break

        case 'respawning':
            break
    }
}