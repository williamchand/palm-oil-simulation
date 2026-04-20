/**
 * Decision Engine — applies AI decisions to simulation state and route.
 *
 * Handles three decision types per D-16:
 * - modify_altitude: adjust upcoming waypoint altitudes (clamped [5, 50]m per T-03-05)
 * - flag_anomaly: extract anomaly data without modifying route
 * - adjust_priority: reorder upcoming waypoints (never past ones per T-03-07)
 *
 * @module decisionEngine
 */

/**
 * @typedef {import('../types/ai.js').AiDecision} AiDecision
 * @typedef {import('../types/route.js').Route} Route
 */

const MIN_ALTITUDE = 5;
const MAX_ALTITUDE = 50;

/** Valid decision types per D-16 */
const VALID_TYPES = ['adjust_priority', 'flag_anomaly', 'modify_altitude'];

/**
 * Applies an AI decision to the current simulation state.
 *
 * @param {AiDecision|null} decision
 * @param {Route} route - Current route (will be mutated for altitude/priority changes)
 * @param {number} currentWaypointIndex - Current position in route
 * @returns {{ applied: boolean, type?: string, anomaly?: object, altitudesBefore?: number[], altitudesAfter?: number[] }}
 */
export function applyDecision(decision, route, currentWaypointIndex) {
  // Graceful degradation: null or invalid decisions are no-ops (D-14)
  if (!decision || !VALID_TYPES.includes(decision.type)) {
    return { applied: false };
  }

  switch (decision.type) {
    case 'modify_altitude':
      return applyModifyAltitude(decision, route, currentWaypointIndex);
    case 'flag_anomaly':
      return applyFlagAnomaly(decision, currentWaypointIndex);
    case 'adjust_priority':
      return applyAdjustPriority(decision, route, currentWaypointIndex);
    default:
      return { applied: false };
  }
}

/**
 * Modify altitude of all waypoints AFTER currentWaypointIndex.
 * Altitude is clamped to [MIN_ALTITUDE, MAX_ALTITUDE] per T-03-05.
 */
function applyModifyAltitude(decision, route, currentWaypointIndex) {
  const altitudeChange = decision.parameters?.altitudeChange ?? 0;
  const upcoming = route.waypoints.slice(currentWaypointIndex + 1);

  const altitudesBefore = upcoming.map(wp => wp.altitude);

  for (const wp of upcoming) {
    wp.altitude = Math.max(MIN_ALTITUDE, Math.min(MAX_ALTITUDE, wp.altitude + altitudeChange));
  }

  const altitudesAfter = upcoming.map(wp => wp.altitude);

  return {
    applied: true,
    type: 'modify_altitude',
    altitudesBefore,
    altitudesAfter
  };
}

/**
 * Flag an anomaly — extract anomaly data from decision parameters.
 * Does NOT modify route waypoints.
 */
function applyFlagAnomaly(decision, currentWaypointIndex) {
  return {
    applied: true,
    type: 'flag_anomaly',
    anomaly: {
      waypointIndex: currentWaypointIndex,
      anomalyType: decision.parameters?.anomalyType || 'unknown',
      description: decision.parameters?.anomalyDescription || decision.reasoning,
      confidence: decision.confidence
    }
  };
}

/**
 * Adjust priority by reordering upcoming waypoints.
 * Only reorders waypoints AFTER currentWaypointIndex (T-03-07).
 * priorityIndices maps original indices to new order.
 */
function applyAdjustPriority(decision, route, currentWaypointIndex) {
  const priorityIndices = decision.parameters?.priorityIndices;

  // No-op if priorityIndices is not a valid non-empty array
  if (!Array.isArray(priorityIndices) || priorityIndices.length === 0) {
    return { applied: true, type: 'adjust_priority' };
  }

  const upcomingStart = currentWaypointIndex + 1;
  const upcoming = route.waypoints.slice(upcomingStart);

  // Build a map of original index → waypoint data for upcoming waypoints
  const indexToWaypoint = new Map();
  for (const wp of upcoming) {
    indexToWaypoint.set(wp.index, { ...wp });
  }

  // Reorder: place waypoints in priorityIndices order, keeping others in place
  const reordered = [];
  const usedIndices = new Set();

  // First pass: place waypoints that appear in priorityIndices in order
  for (const idx of priorityIndices) {
    if (indexToWaypoint.has(idx)) {
      reordered.push(indexToWaypoint.get(idx));
      usedIndices.add(idx);
    }
  }

  // Second pass: append remaining waypoints that weren't in priorityIndices
  for (const wp of upcoming) {
    if (!usedIndices.has(wp.index)) {
      reordered.push({ ...wp });
    }
  }

  // Apply reordered waypoints back to route, re-indexing sequentially
  for (let i = 0; i < reordered.length; i++) {
    const routeIdx = upcomingStart + i;
    route.waypoints[routeIdx] = {
      ...reordered[i],
      index: routeIdx
    };
  }

  return { applied: true, type: 'adjust_priority' };
}
