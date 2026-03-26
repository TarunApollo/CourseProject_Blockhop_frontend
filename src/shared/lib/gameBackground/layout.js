// This file contains the layout calculations for the game background layers based on the screen dimensions.

/**
 * This function calculates the layout properties for the game background
 * layers based on the screen dimensions.
 * @param {number} screenWidth - The width of the screen.
 * @param {number} screenHeight - The height of the screen.
 * @throws {TypeError} Thrown when `screenWidth` or `screenHeight` is not a valid number.
 * @returns {object} An object containing the layout properties for each background layer.
 */
export function getBackgroundLayout(screenWidth, screenHeight) {
  if (typeof screenWidth !== 'number' || typeof screenHeight !== 'number' 
    || screenWidth <= 0 || screenHeight <= 0) {
    throw new TypeError('Invalid screen dimensions provided.')
  }

  return {
    screenWidth,
    skyH: Math.round(screenHeight * 0.55),
    cloudsY: Math.round(screenHeight * 0.25),
    cloudsH: Math.round(screenHeight * 0.3),
    treesY: Math.round(screenHeight * 0.5),
    treesH: Math.round(screenHeight * 0.35),
    grassY: Math.round(screenHeight * 0.78),
    grassH: Math.round(screenHeight * 0.2),
  }
}
