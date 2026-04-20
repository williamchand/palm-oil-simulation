import { describe, it, expect } from 'vitest';
import { getHealthColor } from '../../../src/three/helpers/heatmapOverlay.js';

describe('getHealthColor', () => {
  it('returns red with high alpha for low health high ripeness (0.2, 0.8)', () => {
    const color = getHealthColor(0.2, 0.8);
    expect(color.r).toBe(239);
    expect(color.g).toBe(68);
    expect(color.b).toBe(68);
    expect(color.a).toBeCloseTo(0.9, 5);
  });

  it('returns yellow with medium alpha for mid health mid ripeness (0.5, 0.6)', () => {
    const color = getHealthColor(0.5, 0.6);
    expect(color.r).toBe(234);
    expect(color.g).toBe(179);
    expect(color.b).toBe(8);
    expect(color.a).toBeCloseTo(0.8, 5);
  });

  it('returns green with low-mid alpha for high health low ripeness (0.9, 0.3)', () => {
    const color = getHealthColor(0.9, 0.3);
    expect(color.r).toBe(34);
    expect(color.g).toBe(197);
    expect(color.b).toBe(94);
    expect(color.a).toBeCloseTo(0.65, 5);
  });

  it('returns red with minimum alpha for zero health and ripeness', () => {
    const color = getHealthColor(0.0, 0.0);
    expect(color.r).toBe(239);
    expect(color.g).toBe(68);
    expect(color.b).toBe(68);
    expect(color.a).toBeCloseTo(0.5, 5);
  });

  it('returns green with maximum alpha for perfect health and ripeness', () => {
    const color = getHealthColor(1.0, 1.0);
    expect(color.r).toBe(34);
    expect(color.g).toBe(197);
    expect(color.b).toBe(94);
    expect(color.a).toBeCloseTo(1.0, 5);
  });

  it('returns yellow at boundary health=0.4 (not < 0.4)', () => {
    const color = getHealthColor(0.4, 0.5);
    expect(color.r).toBe(234);
    expect(color.g).toBe(179);
    expect(color.b).toBe(8);
    expect(color.a).toBeCloseTo(0.75, 5);
  });

  it('returns green at boundary health=0.7 (>= 0.7)', () => {
    const color = getHealthColor(0.7, 0.5);
    expect(color.r).toBe(34);
    expect(color.g).toBe(197);
    expect(color.b).toBe(94);
    expect(color.a).toBeCloseTo(0.75, 5);
  });
});
