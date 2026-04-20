import { describe, it, expect, vi } from 'vitest';
import { sampleTerrainPath, adjustAltitudesWithTerrain } from '../../../src/simulation/sampleTerrainPath.js';

describe('adjustAltitudesWithTerrain', () => {
  it('adds terrain height to waypoint altitude', () => {
    const waypoints = [
      { index: 0, x: 0, y: 0, lon: 101.6, lat: 3.1, altitude: 15, action: 'scan' }
    ];
    const terrainHeights = [10]; // 10m terrain elevation
    
    const result = adjustAltitudesWithTerrain(waypoints, terrainHeights);
    
    expect(result[0].altitude).toBe(25); // 15m flight + 10m terrain
    expect(result[0].terrainHeight).toBe(10);
  });

  it('preserves waypoint order and actions', () => {
    const waypoints = [
      { index: 0, x: 0, y: 0, lon: 101.6, lat: 3.1, altitude: 15, action: 'transit' },
      { index: 1, x: 100, y: 0, lon: 101.61, lat: 3.1, altitude: 15, action: 'scan' },
      { index: 2, x: 100, y: 50, lon: 101.61, lat: 3.105, altitude: 15, action: 'turn' }
    ];
    const terrainHeights = [5, 8, 12];
    
    const result = adjustAltitudesWithTerrain(waypoints, terrainHeights);
    
    expect(result.length).toBe(3);
    expect(result[0].action).toBe('transit');
    expect(result[1].action).toBe('scan');
    expect(result[2].action).toBe('turn');
    expect(result[0].index).toBe(0);
    expect(result[2].index).toBe(2);
  });

  it('falls back to original altitude when terrain height is null', () => {
    const waypoints = [
      { index: 0, x: 0, y: 0, lon: 101.6, lat: 3.1, altitude: 15, action: 'scan' }
    ];
    const terrainHeights = [null]; // Terrain sampling failed
    
    const result = adjustAltitudesWithTerrain(waypoints, terrainHeights);
    
    expect(result[0].altitude).toBe(15); // Original altitude preserved
    expect(result[0].terrainHeight).toBe(0);
  });
});

describe('sampleTerrainPath', () => {
  it('returns original route when viewer is null', async () => {
    const route = {
      waypoints: [{ index: 0, x: 0, y: 0, lon: 101.6, lat: 3.1, altitude: 15, action: 'scan' }],
      totalDistance: 100,
      estimatedDuration: 20
    };
    
    const result = await sampleTerrainPath(null, route);
    
    expect(result.waypoints[0].altitude).toBe(15);
    expect(result.totalDistance).toBe(100);
  });
});
