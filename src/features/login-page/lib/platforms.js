/**
 * platforms.js
 *
 * Draws platforms and coins for the login scene, and returns the physics
 * group + coin data so the caller can wire up colliders and check collection.
 *
 * Platform layout is derived from scene dimensions so it scales correctly
 * with any screen size.
 *
 * @param {Phaser.Scene} scene
 * @param {number} W     scene width
 * @param {number} H     scene height
 * @param {number} TILE  display size of one tile in px
 * @returns {{ platforms, platGroup, coins }}
 */
export function createPlatforms(scene, W, H, TILE) {
    const GROUND_Y = H * 0.78

    const platforms = [
        { x: W * 0.06, y: GROUND_Y,              cols: 5 },  // p0 — alien starts here
        { x: W * 0.28, y: GROUND_Y - TILE * 2.5, cols: 3 },  // p1 — coin
        { x: W * 0.50, y: GROUND_Y - TILE * 1.5, cols: 4 },  // p2 — coin
        { x: W * 0.73, y: GROUND_Y,              cols: 4 },  // p3 — no coin
    ]

    // Collects non-moving objects. Lack of gravity, ignore collision.
    const platGroup = scene.physics.add.staticGroup()

    platforms.forEach(({ x, y, cols }) => {
        // Visual tiles — frames 13/14/15 (zigzag single row)
        for (let col = 0; col < cols; col++) {
            const frame = col === 0 ? 13 : col === cols - 1 ? 15 : 14
            scene.add.image(x + col * TILE, y, 'tiles', frame)
                .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(3)
        }
        // Thin static physics body covering only the top surface
        const bodyW = cols * TILE
        const body  = scene.add.rectangle(x + bodyW / 2, y + 4, bodyW, 8)
        scene.physics.add.existing(body, true)
        body.body.checkCollision.down  = false
        body.body.checkCollision.left  = false
        body.body.checkCollision.right = false
        platGroup.add(body)
    })

    // Coins on p1 and p2
    const coins = platforms.slice(1, 3).map(({ x, y, cols }, i) => {
        const cx    = x + (cols / 2) * TILE
        const baseY = y - 52
        const sprite = scene.add.image(cx, baseY, 'coin').setScale(0.65).setDepth(4)
        scene.tweens.add({
            targets: sprite, scaleX: -0.65,
            duration: 400 + i * 30, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        })
        return { sprite, x: cx, y: baseY, collected: false }
    })

    return { platforms, platGroup, coins }
}

/**
 * Checks if the player has walked into any coin and collects it.
 * Collected coins fly upward, fade out, then respawn after 10 seconds.
 *
 * @param {Phaser.Scene} scene
 * @param {object[]}     coins   coin array returned by createPlatforms()
 * @param {Phaser.Physics.Arcade.Sprite} player
 */
export function checkCoinCollection(scene, coins, player) {
    coins.forEach(c => {
        if (c.collected) return
        if (Math.abs(player.x - c.x) < 40 && Math.abs(player.y - c.y) < 60) {
            c.collected = true
            scene.tweens.killTweensOf(c.sprite)
            scene.tweens.add({
                targets: c.sprite, y: c.sprite.y - 50, alpha: 0,
                duration: 350, ease: 'Cubic.Out',
                onComplete: () => {
                    scene.time.delayedCall(10000, () => {
                        c.collected = false
                        c.sprite.setVisible(true).setAlpha(1).setY(c.y).setScale(0.65)
                        scene.tweens.add({
                            targets: c.sprite, scaleX: -0.65,
                            duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
                        })
                    })
                },
            })
        }
    })
}

/**
 * Restores all collected coins immediately — call on alien respawn.
 *
 * @param {Phaser.Scene} scene
 * @param {object[]}     coins
 */
export function restoreCoins(scene, coins) {
    coins.forEach(c => {
        if (!c.collected) return
        c.collected = false
        c.sprite.setVisible(true).setAlpha(1).setY(c.y).setScale(0.65)
        scene.tweens.add({
            targets: c.sprite, scaleX: -0.65,
            duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        })
    })
}