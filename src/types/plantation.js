/**
 * @typedef {Object} Tree
 * @property {number} x - Local X position in meters
 * @property {number} y - Local Y position in meters
 * @property {number} ripeness - 0-1 seed value
 * @property {number} health - 0-1 seed value
 * @property {number} row - Row index
 * @property {number} col - Column index
 */

/**
 * @typedef {Object} PlantationData
 * @property {Tree[]} trees
 * @property {import('./selection.js').SelectionBounds} bounds
 * @property {{rows: number, cols: number, spacing: number, treeCount: number}} metadata
 */

/**
 * Validate plantation data structure
 * @param {*} data
 * @returns {boolean}
 */
export function isValidPlantation(data) {
  return false;
}
