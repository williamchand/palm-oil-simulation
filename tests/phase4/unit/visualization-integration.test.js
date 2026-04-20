import { describe, it, expect } from 'vitest';

describe('visualization integration logic', () => {
  const trees = [
    { x: 100, y: 100, health: 0.9, ripeness: 0.7, row: 0, col: 0 },
    { x: 105, y: 100, health: 0.3, ripeness: 0.5, row: 0, col: 1 },
    { x: 200, y: 200, health: 0.8, ripeness: 0.6, row: 1, col: 0 },
    { x: 110, y: 110, health: 0.5, ripeness: 0.4, row: 1, col: 1 },
    { x: 500, y: 500, health: 0.9, ripeness: 0.9, row: 2, col: 0 }
  ];

  function filterNearbyTrees(allTrees, waypointX, waypointY, radius) {
    return allTrees.filter(tree => {
      const dx = tree.x - waypointX;
      const dy = tree.y - waypointY;
      return (dx * dx + dy * dy) <= radius * radius;
    });
  }

  it('returns only trees within 30m radius of waypoint', () => {
    const nearby = filterNearbyTrees(trees, 100, 100, 30);
    expect(nearby.length).toBe(3); // (100,100), (105,100), (110,110)
    expect(nearby.every(t => t.x <= 130 && t.y <= 130)).toBe(true);
  });

  it('returns empty array when no trees nearby', () => {
    const nearby = filterNearbyTrees(trees, 999, 999, 30);
    expect(nearby.length).toBe(0);
  });

  it('includes trees exactly at radius boundary', () => {
    // tree at (130, 100) is exactly 30m from (100, 100)
    const treesWithBoundary = [...trees, { x: 130, y: 100, health: 0.5, ripeness: 0.5, row: 3, col: 0 }];
    const nearby = filterNearbyTrees(treesWithBoundary, 100, 100, 30);
    expect(nearby.some(t => t.x === 130)).toBe(true);
  });

  it('anomaly matching by waypointIndex works correctly', () => {
    const anomalies = [
      { waypointIndex: 3, type: 'low_health', description: 'test' },
      { waypointIndex: 7, type: 'pest_cluster', description: 'test2' }
    ];
    const atWp3 = anomalies.filter(a => a.waypointIndex === 3);
    expect(atWp3.length).toBe(1);
    const atWp5 = anomalies.filter(a => a.waypointIndex === 5);
    expect(atWp5.length).toBe(0);
  });

  it('trail anomaly check detects anomaly at current waypoint', () => {
    const anomalies = [
      { waypointIndex: 5 },
      { waypointIndex: 10 }
    ];
    const hasAnomalyAt5 = anomalies.some(a => a.waypointIndex === 5);
    const hasAnomalyAt3 = anomalies.some(a => a.waypointIndex === 3);
    expect(hasAnomalyAt5).toBe(true);
    expect(hasAnomalyAt3).toBe(false);
  });
});
