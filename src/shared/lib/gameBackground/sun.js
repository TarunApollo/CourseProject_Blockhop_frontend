// This file contains the code for drawing the sun in the game background.

/**
 * This function draws the sun using the provided graphics context.
 * It creates a layered sun with a glowing effect and rays extending outward.
 * @param {object} graphics - The graphics context used for drawing.
 * @returns {void}
 * @throws {TypeError} Thrown when `graphics` is not a valid Phaser graphics object.
 * @requires Phaser.GameObjects.Graphics
 */
export function drawSun(graphics) {
  if (!graphics || typeof graphics.fillStyle !== 'function' || typeof graphics.fillCircle !== 'function') {
    throw new TypeError('Invalid graphics object provided for drawing the sun.')
  }
  graphics.fillStyle(0xfde047, 0.12).fillCircle(0, 0, 56)
  graphics.fillStyle(0xfde047, 0.22).fillCircle(0, 0, 42)
  graphics.fillStyle(0xfef08a, 1).fillCircle(0, 0, 28)

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    graphics.fillStyle(0xfde047, 0.95).fillTriangle(
      Math.cos(angle) * 32,
      Math.sin(angle) * 32,
      Math.cos(angle + 0.22) * 50,
      Math.sin(angle + 0.22) * 50,
      Math.cos(angle - 0.22) * 50,
      Math.sin(angle - 0.22) * 50,
    )
  }
}
