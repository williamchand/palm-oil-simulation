import { createSeededRandom } from './seedRandom.js';

/**
 * @typedef {import('../types/plantation.js').PlantationData} PlantationData
 * @typedef {import('../types/selection.js').NormalizedSelection} NormalizedSelection
 */

const TREE_SPACING_METERS = 9; // 8-10m range, use middle
const POSITION_VARIATION = 0.5; // ±0.5m natural offset

/**
 * Generates a deterministic plantation layout from a normalized selection.
 * 
 * @param {NormalizedSelection} selection - Normalized selection with bounds and seed
 * @returns {PlantationData} - Generated plantation with trees, bounds, and metadata
 */
export function generatePlantation(selection) {
  const random = createSeededRandom(selection.seed);
  
  const widthMeters = selection.size.widthKm * 1000;
  const heightMeters = selection.size.heightKm * 1000;
  
  const cols = Math.floor(widthMeters / TREE_SPACING_METERS);
  const rows = Math.floor(heightMeters / TREE_SPACING_METERS);
  
  const trees = [];
  
  // Generate base ripeness and health noise maps for clustering
  const ripenessBase = random.next();
  const healthBase = random.next();
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Base grid position
      const baseX = col * TREE_SPACING_METERS;
      const baseY = row * TREE_SPACING_METERS;
      
      // Add natural variation (±0.5m)
      const offsetX = random.range(-POSITION_VARIATION, POSITION_VARIATION);
      const offsetY = random.range(-POSITION_VARIATION, POSITION_VARIATION);
      
      // Clustered ripeness: base value + position-influenced noise + random component
      const positionFactor = Math.sin(row * 0.3) * Math.cos(col * 0.3);
      const ripeness = Math.max(0, Math.min(1, 
        ripenessBase * 0.3 + 
        positionFactor * 0.3 + 
        random.next() * 0.4
      ));
      
      // Clustered health: similar approach with different pattern
      const healthFactor = Math.cos(row * 0.2 + col * 0.2);
      const health = Math.max(0, Math.min(1,
        healthBase * 0.4 +
        healthFactor * 0.3 +
        random.next() * 0.3
      ));
      
      trees.push({
        x: baseX + offsetX,
        y: baseY + offsetY,
        ripeness,
        health,
        row,
        col
      });
    }
  }
  
  return {
    trees,
    bounds: selection.bounds,
    metadata: {
      rows,
      cols,
      spacing: TREE_SPACING_METERS,
      treeCount: trees.length
    }
  };
}
