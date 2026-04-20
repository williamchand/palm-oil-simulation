import { describe, it, expect } from 'vitest';
import { createSweepPath } from '../../../src/simulation/createSweepPath.js';

describe('createSweepPath', () => {
  const mockPlantation = {
    bounds: {
      west: 101.6,
      south: 3.1,
      east: 101.61,
      north: 3.11
    },
    metadata: {
      rows: 100,
      cols: 100,
      spacing: 9,
      treeCount: 10000
    }
  };

  it('generates route with waypoints', () => {
    const route = createSweepPath(mockPlantation);
    
    expect(route.waypoints).toBeDefined();
    expect(Array.isArray(route.waypoints)).toBe(true);
    expect(route.waypoints.length).toBeGreaterThan(0);
  });

  it('includes required waypoint fields', () => {
    const route = createSweepPath(mockPlantation);
    const wp = route.waypoints[0];
    
    expect(typeof wp.index).toBe('number');
    expect(typeof wp.x).toBe('number');
    expect(typeof wp.y).toBe('number');
    expect(typeof wp.lon).toBe('number');
    expect(typeof wp.lat).toBe('number');
    expect(typeof wp.altitude).toBe('number');
    expect(['scan', 'turn', 'transit'].includes(wp.action)).toBe(true);
  });

  it('covers full plantation width and height', () => {
    const route = createSweepPath(mockPlantation);
    const widthMeters = mockPlantation.metadata.cols * mockPlantation.metadata.spacing;
    const heightMeters = mockPlantation.metadata.rows * mockPlantation.metadata.spacing;
    
    const xCoords = route.waypoints.map(wp => wp.x);
    const yCoords = route.waypoints.map(wp => wp.y);
    
    expect(Math.min(...xCoords)).toBeLessThanOrEqual(1);
    expect(Math.max(...xCoords)).toBeGreaterThanOrEqual(widthMeters - 1);
    expect(Math.min(...yCoords)).toBeLessThanOrEqual(1);
    expect(Math.max(...yCoords)).toBeGreaterThanOrEqual(heightMeters - 1);
  });

  it('is deterministic for same plantation', () => {
    const route1 = createSweepPath(mockPlantation);
    const route2 = createSweepPath(mockPlantation);
    
    expect(route1.waypoints.length).toBe(route2.waypoints.length);
    expect(route1.totalDistance).toBe(route2.totalDistance);
    expect(route1.waypoints[0].x).toBe(route2.waypoints[0].x);
    expect(route1.waypoints[0].y).toBe(route2.waypoints[0].y);
  });

  it('calculates totalDistance and estimatedDuration', () => {
    const route = createSweepPath(mockPlantation);
    
    expect(typeof route.totalDistance).toBe('number');
    expect(route.totalDistance).toBeGreaterThan(0);
    expect(typeof route.estimatedDuration).toBe('number');
    expect(route.estimatedDuration).toBeGreaterThan(0);
  });
});
