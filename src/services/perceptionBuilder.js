/**
 * Perception Builder — builds structured perception JSON from drone position + plantation data.
 *
 * Pure function, no DOM dependencies. Given a waypoint, plantation, and route context,
 * produces the PerceptionData that the AI prompt builder consumes.
 *
 * @module perceptionBuilder
 */

import { SCAN_RADIUS, MAX_NEARBY_TREES } from '../types/ai.js';

/**
 * Calculate Euclidean distance between two 2D points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Build perception data for the AI from the drone's current position and environment.
 *
 * @param {import('../types/route.js').Waypoint} waypoint - Current drone waypoint
 * @param {import('../types/plantation.js').PlantationData} plantation - Plantation data with trees
 * @param {import('../types/route.js').Route} route - Full route for coverage stats
 * @param {number} currentWaypointIndex - Index of current waypoint in the route
 * @returns {import('../types/ai.js').PerceptionData}
 */
export function buildPerception(waypoint, plantation, route, currentWaypointIndex) {
  // Find nearby trees within scan radius
  const nearbyTrees = [];

  for (const tree of plantation.trees) {
    const dist = distance(waypoint.x, waypoint.y, tree.x, tree.y);
    if (dist <= SCAN_RADIUS) {
      nearbyTrees.push({
        x: tree.x,
        y: tree.y,
        distanceFromDrone: dist,
        ripeness: tree.ripeness,
        health: tree.health,
        row: tree.row,
        col: tree.col
      });
    }
  }

  // Sort by distance ascending (closest first)
  nearbyTrees.sort((a, b) => a.distanceFromDrone - b.distanceFromDrone);

  // Cap at MAX_NEARBY_TREES to avoid overwhelming the prompt
  const cappedTrees = nearbyTrees.slice(0, MAX_NEARBY_TREES);

  // Build coverage stats
  const totalWaypoints = route.waypoints.length;
  const coverageStats = {
    scannedWaypoints: currentWaypointIndex,
    totalWaypoints,
    percentComplete: Math.round((currentWaypointIndex / totalWaypoints) * 100)
  };

  // Build terrain info
  const terrain = {
    currentAltitude: waypoint.altitude
  };

  // Build drone position
  const dronePosition = {
    x: waypoint.x,
    y: waypoint.y,
    waypointIndex: waypoint.index,
    waypointAction: waypoint.action
  };

  return {
    nearbyTrees: cappedTrees,
    coverageStats,
    terrain,
    dronePosition
  };
}
