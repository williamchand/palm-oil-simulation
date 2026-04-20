import { describe, it, expect } from 'vitest';
import { getSegmentColor } from '../../../src/three/helpers/pathTrail.js';

describe('getSegmentColor', () => {
  it('returns blue for scan action without anomaly', () => {
    const color = getSegmentColor('scan', false);
    expect(color.r).toBeCloseTo(0.22, 2);
    expect(color.g).toBeCloseTo(0.74, 2);
    expect(color.b).toBeCloseTo(0.97, 2);
  });

  it('returns gray for turn action without anomaly', () => {
    const color = getSegmentColor('turn', false);
    expect(color.r).toBeCloseTo(0.39, 2);
    expect(color.g).toBeCloseTo(0.45, 2);
    expect(color.b).toBeCloseTo(0.53, 2);
  });

  it('returns gray for transit action without anomaly', () => {
    const color = getSegmentColor('transit', false);
    expect(color.r).toBeCloseTo(0.39, 2);
    expect(color.g).toBeCloseTo(0.45, 2);
    expect(color.b).toBeCloseTo(0.53, 2);
  });

  it('returns red for scan action with anomaly (anomaly overrides)', () => {
    const color = getSegmentColor('scan', true);
    expect(color.r).toBeCloseTo(1, 2);
    expect(color.g).toBeCloseTo(0.27, 2);
    expect(color.b).toBeCloseTo(0.27, 2);
  });

  it('returns red for turn action with anomaly (anomaly overrides)', () => {
    const color = getSegmentColor('turn', true);
    expect(color.r).toBeCloseTo(1, 2);
    expect(color.g).toBeCloseTo(0.27, 2);
    expect(color.b).toBeCloseTo(0.27, 2);
  });
});
