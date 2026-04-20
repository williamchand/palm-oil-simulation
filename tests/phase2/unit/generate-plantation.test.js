import { describe, it, expect } from 'vitest';
import { generatePlantation } from '../../../src/world/generatePlantation.js';

const testSelection = {
  bounds: { west: 101.6, south: 3.1, east: 101.61, north: 3.11 },
  center: { lon: 101.605, lat: 3.105 },
  size: { widthKm: 1.1, heightKm: 1.1 },
  areaKm2: 1.21,
  seed: 12345
};

describe('generatePlantation', () => {
  it('produces same output for same seed', () => {
    const result1 = generatePlantation(testSelection);
    const result2 = generatePlantation(testSelection);
    expect(result1.trees.length).toBe(result2.trees.length);
    expect(result1.trees[0].x).toBe(result2.trees[0].x);
    expect(result1.trees[0].ripeness).toBe(result2.trees[0].ripeness);
  });

  it('generates trees in row pattern with 9m spacing', () => {
    const result = generatePlantation(testSelection);
    expect(result.metadata.spacing).toBe(9);
    // Check that row indices exist and are sequential
    const rows = [...new Set(result.trees.map(t => t.row))].sort((a, b) => a - b);
    expect(rows[0]).toBe(0);
    expect(rows[rows.length - 1]).toBe(result.metadata.rows - 1);
  });

  it('assigns ripeness values between 0-1', () => {
    const result = generatePlantation(testSelection);
    result.trees.forEach(tree => {
      expect(tree.ripeness).toBeGreaterThanOrEqual(0);
      expect(tree.ripeness).toBeLessThanOrEqual(1);
    });
  });

  it('assigns health values between 0-1', () => {
    const result = generatePlantation(testSelection);
    result.trees.forEach(tree => {
      expect(tree.health).toBeGreaterThanOrEqual(0);
      expect(tree.health).toBeLessThanOrEqual(1);
    });
  });

  it('includes natural variation in tree positions', () => {
    const result = generatePlantation(testSelection);
    const spacing = result.metadata.spacing;
    // At least some trees should not be exactly on grid
    const hasVariation = result.trees.some(tree => {
      const expectedX = tree.col * spacing;
      const expectedY = tree.row * spacing;
      return Math.abs(tree.x - expectedX) > 0.01 || Math.abs(tree.y - expectedY) > 0.01;
    });
    expect(hasVariation).toBe(true);
  });
});
