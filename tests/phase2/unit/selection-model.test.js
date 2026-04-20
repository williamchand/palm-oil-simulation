import { describe, it, expect } from 'vitest';
import { normalizeSelection, validateBounds, seedFromBounds } from '../../../src/types/selection.js';

describe('seedFromBounds', () => {
  it('returns same value for identical bounds', () => {
    const bounds = { west: 101.5, south: 3.0, east: 101.6, north: 3.1 };
    const seed1 = seedFromBounds(bounds);
    const seed2 = seedFromBounds(bounds);
    expect(seed1).toBe(seed2);
    expect(typeof seed1).toBe('number');
  });

  it('returns different values for different bounds', () => {
    const bounds1 = { west: 101.5, south: 3.0, east: 101.6, north: 3.1 };
    const bounds2 = { west: 101.6, south: 3.1, east: 101.7, north: 3.2 };
    const seed1 = seedFromBounds(bounds1);
    const seed2 = seedFromBounds(bounds2);
    expect(seed1).not.toBe(seed2);
  });
});

describe('normalizeSelection', () => {
  it('calculates area correctly', () => {
    // Mock Cesium Rectangle with ~1km x 1km area near equator
    // At lat 3°, 0.01 degrees longitude ≈ 1.11 km, 0.01 degrees latitude ≈ 1.11 km
    const cesiumRectangle = {
      west: 101.5 * Math.PI / 180,
      south: 3.0 * Math.PI / 180,
      east: 101.51 * Math.PI / 180,
      north: 3.01 * Math.PI / 180
    };
    
    const normalized = normalizeSelection(cesiumRectangle);
    expect(normalized.areaKm2).toBeGreaterThan(1.0);
    expect(normalized.areaKm2).toBeLessThan(1.5);
  });

  it('converts radians to degrees and calculates center', () => {
    const cesiumRectangle = {
      west: 101.5 * Math.PI / 180,
      south: 3.0 * Math.PI / 180,
      east: 101.6 * Math.PI / 180,
      north: 3.1 * Math.PI / 180
    };
    
    const normalized = normalizeSelection(cesiumRectangle);
    expect(normalized.bounds.west).toBeCloseTo(101.5, 5);
    expect(normalized.bounds.south).toBeCloseTo(3.0, 5);
    expect(normalized.bounds.east).toBeCloseTo(101.6, 5);
    expect(normalized.bounds.north).toBeCloseTo(3.1, 5);
    expect(normalized.center.lon).toBeCloseTo(101.55, 5);
    expect(normalized.center.lat).toBeCloseTo(3.05, 5);
  });

  it('derives deterministic seed', () => {
    const cesiumRectangle = {
      west: 101.5 * Math.PI / 180,
      south: 3.0 * Math.PI / 180,
      east: 101.6 * Math.PI / 180,
      north: 3.1 * Math.PI / 180
    };
    
    const normalized = normalizeSelection(cesiumRectangle);
    expect(typeof normalized.seed).toBe('number');
    expect(normalized.seed).toBeGreaterThan(0);
  });
});

describe('validateBounds', () => {
  it('rejects when west > east', () => {
    const bounds = { west: 101.6, south: 3.0, east: 101.5, north: 3.1 };
    const result = validateBounds(bounds);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('longitude');
  });

  it('rejects when south > north', () => {
    const bounds = { west: 101.5, south: 3.1, east: 101.6, north: 3.0 };
    const result = validateBounds(bounds);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('latitude');
  });

  it('rejects when area > 25 km2', () => {
    // ~5.1km x 5.1km ≈ 26 km2 (exceeds limit)
    const bounds = { west: 101.5, south: 3.0, east: 101.546, north: 3.046 };
    const result = validateBounds(bounds);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('25 km2');
  });

  it('accepts valid 5 km2 selection', () => {
    // Roughly 2km x 2.5km ≈ 5 km2
    const bounds = { west: 101.5, south: 3.0, east: 101.518, north: 3.018 };
    const result = validateBounds(bounds);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });
});
