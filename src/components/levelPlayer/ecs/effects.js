/**
 * Spawn a fire-and-forget particle burst at (x, y).
 *
 * The emitter auto-destroys after `duration` ms / `stopAfter` particles —
 * no manual cleanup needed by the caller.
 *
 * @param {Phaser.Scene}    scene
 * @param {number}          x
 * @param {number}          y
 * @param {string}          texture  texture key (e.g. "tiles", "slime_normal")
 * @param {string|number}   frame    frame name or index within the texture
 * @param {object}          [config] optional overrides for any emitter property
 */
export function burstEffect(scene, x, y, texture, frame, config = {}) {
  scene.add.particles(x, y, texture, {
    frame,
    quantity: 8,
    speed: { min: 80, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.4, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 400,
    lifespan: 500,
    duration: 50,
    stopAfter: 8,
    ...config,
  });
}
