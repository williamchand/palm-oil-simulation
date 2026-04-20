import { describe, it, expect } from 'vitest';
import { buildPerception } from '../../../src/services/perceptionBuilder.js';
import { SCAN_RADIUS } from '../../../src/types/ai.js';

// Test fixtures
const makeTree = (x, y, ripeness = 0.5, health = 0.8, row = 0, col = 0) => ({
  x, y, ripeness, health, row, col
});

const makeWaypoint = (x, y, index = 0, action = 'scan', altitude = 50) => ({
  index, x, y, lon: 101.6, lat: 3.1, altitude, action
});

const makeRoute = (waypointCount = 10) => ({
  waypoints: Array.from({ length: waypointCount }, (_, i) => makeWaypoint(i * 10, 0, i)),
  totalDistance: waypointCount * 10,
  estimatedDuration: waypointCount * 5
});

const makePlantation = (trees) => ({
  trees,
  bounds: { west: 101.6, south: 3.1, east: 101.61, north: 3.11 },
  metadata: { rows: 10, cols: 10, spacing: 9, treeCount: trees.length }
});

describe('SCAN_RADIUS constant', () => {
  it('exports SCAN_RADIUS equal to 30', () => {
    expect(SCAN_RADIUS).toBe(30);
  });
});

describe('buildPerception', () => {
  it('returns only trees within scan radius', () => {
    const trees = [
      makeTree(50, 50),   // distance 0 from drone at (50,50)
      makeTree(55, 50),   // distance 5
      makeTree(75, 50),   // distance 25
      makeTree(100, 100), // distance ~70.7, outside 30m
      makeTree(200, 200)  // way outside
    ];
    const waypoint = makeWaypoint(50, 50, 3, 'scan', 45);
    const route = makeRoute(10);
    const plantation = makePlantation(trees);

    const result = buildPerception(waypoint, plantation, route, 3);

    expect(result.nearbyTrees).toHaveLength(3);
    // The tree at (100,100) and (200,200) should not be included
    expect(result.nearbyTrees.every(t => t.distanceFromDrone <= SCAN_RADIUS)).toBe(true);
  });

  it('returns correct PerceptionData structure', () => {
    const trees = [makeTree(15, 15, 0.6, 0.9, 1, 1)];
    const waypoint = makeWaypoint(15, 15, 2, 'scan', 45);
    const route = makeRoute(10);
    const plantation = makePlantation(trees);

    const result = buildPerception(waypoint, plantation, route, 2);

    // Check top-level keys
    expect(result).toHaveProperty('nearbyTrees');
    expect(result).toHaveProperty('coverageStats');
    expect(result).toHaveProperty('terrain');
    expect(result).toHaveProperty('dronePosition');

    // Check coverageStats structure
    expect(result.coverageStats).toEqual({
      scannedWaypoints: 2,
      totalWaypoints: 10,
      percentComplete: 20
    });

    // Check terrain
    expect(result.terrain).toEqual({ currentAltitude: 45 });

    // Check dronePosition
    expect(result.dronePosition).toEqual({
      x: 15,
      y: 15,
      waypointIndex: 2,
      waypointAction: 'scan'
    });
  });

  it('nearbyTrees entries have correct shape', () => {
    const trees = [makeTree(12, 14, 0.7, 0.85, 2, 3)];
    const waypoint = makeWaypoint(10, 10, 0, 'scan', 50);
    const route = makeRoute(5);
    const plantation = makePlantation(trees);

    const result = buildPerception(waypoint, plantation, route, 0);

    expect(result.nearbyTrees).toHaveLength(1);
    const nt = result.nearbyTrees[0];
    expect(nt).toHaveProperty('x', 12);
    expect(nt).toHaveProperty('y', 14);
    expect(nt).toHaveProperty('distanceFromDrone');
    expect(nt.distanceFromDrone).toBeCloseTo(Math.sqrt(4 + 16), 5);
    expect(nt).toHaveProperty('ripeness', 0.7);
    expect(nt).toHaveProperty('health', 0.85);
    expect(nt).toHaveProperty('row', 2);
    expect(nt).toHaveProperty('col', 3);
  });

  it('nearbyTrees are sorted by distance (closest first)', () => {
    const trees = [
      makeTree(60, 50, 0.5, 0.5, 0, 0), // distance 10
      makeTree(52, 50, 0.5, 0.5, 0, 1), // distance 2
      makeTree(55, 50, 0.5, 0.5, 0, 2), // distance 5
    ];
    const waypoint = makeWaypoint(50, 50, 0, 'scan', 50);
    const route = makeRoute(5);
    const plantation = makePlantation(trees);

    const result = buildPerception(waypoint, plantation, route, 0);

    expect(result.nearbyTrees).toHaveLength(3);
    expect(result.nearbyTrees[0].distanceFromDrone).toBeLessThanOrEqual(result.nearbyTrees[1].distanceFromDrone);
    expect(result.nearbyTrees[1].distanceFromDrone).toBeLessThanOrEqual(result.nearbyTrees[2].distanceFromDrone);
    // Closest should be at (52,50)
    expect(result.nearbyTrees[0].x).toBe(52);
  });

  it('returns empty nearbyTrees for empty plantation', () => {
    const waypoint = makeWaypoint(50, 50, 0, 'scan', 50);
    const route = makeRoute(5);
    const plantation = makePlantation([]);

    const result = buildPerception(waypoint, plantation, route, 0);

    expect(result.nearbyTrees).toEqual([]);
    expect(result.coverageStats.totalWaypoints).toBe(5);
  });

  it('coverageStats correctly calculates from currentWaypointIndex / total', () => {
    const trees = [];
    const waypoint = makeWaypoint(0, 0, 7, 'scan', 50);
    const route = makeRoute(10);
    const plantation = makePlantation(trees);

    const result = buildPerception(waypoint, plantation, route, 7);

    expect(result.coverageStats).toEqual({
      scannedWaypoints: 7,
      totalWaypoints: 10,
      percentComplete: 70
    });
  });

  it('caps nearby trees at 20', () => {
    // Create 30 trees all within radius
    const trees = Array.from({ length: 30 }, (_, i) =>
      makeTree(50 + (i % 5), 50 + Math.floor(i / 5), 0.5, 0.5, i, 0)
    );
    const waypoint = makeWaypoint(50, 50, 0, 'scan', 50);
    const route = makeRoute(5);
    const plantation = makePlantation(trees);

    const result = buildPerception(waypoint, plantation, route, 0);

    expect(result.nearbyTrees.length).toBeLessThanOrEqual(20);
  });
});
