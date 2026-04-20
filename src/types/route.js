/**
 * @typedef {Object} Waypoint
 * @property {number} index - Sequential waypoint index
 * @property {number} x - Local X position in meters
 * @property {number} y - Local Y position in meters  
 * @property {number} lon - Longitude in degrees (for terrain sampling)
 * @property {number} lat - Latitude in degrees (for terrain sampling)
 * @property {number} altitude - Meters above ground
 * @property {'scan'|'turn'|'transit'} action - What the drone does at this waypoint
 */

/**
 * @typedef {Object} Route
 * @property {Waypoint[]} waypoints - Ordered list of waypoints
 * @property {number} totalDistance - Total route distance in meters
 * @property {number} estimatedDuration - Estimated flight time in seconds
 */

/**
 * Validates a route object has required structure.
 * 
 * @param {any} route
 * @returns {{valid: boolean, error: string | null}}
 */
export function isValidRoute(route) {
  if (!route || typeof route !== 'object') {
    return { valid: false, error: 'Route must be an object' };
  }
  
  if (!Array.isArray(route.waypoints)) {
    return { valid: false, error: 'Route must have waypoints array' };
  }
  
  if (route.waypoints.length === 0) {
    return { valid: false, error: 'Route must have at least one waypoint' };
  }
  
  for (let i = 0; i < route.waypoints.length; i++) {
    const wp = route.waypoints[i];
    if (typeof wp.x !== 'number' || typeof wp.y !== 'number') {
      return { valid: false, error: `Waypoint ${i} missing x/y coordinates` };
    }
    if (typeof wp.altitude !== 'number' || wp.altitude < 0) {
      return { valid: false, error: `Waypoint ${i} has invalid altitude` };
    }
    if (!['scan', 'turn', 'transit'].includes(wp.action)) {
      return { valid: false, error: `Waypoint ${i} has invalid action: ${wp.action}` };
    }
  }
  
  if (typeof route.totalDistance !== 'number' || route.totalDistance < 0) {
    return { valid: false, error: 'Route must have valid totalDistance' };
  }
  
  return { valid: true, error: null };
}

/**
 * Creates an empty route with default values.
 * 
 * @returns {Route}
 */
export function createEmptyRoute() {
  return {
    waypoints: [],
    totalDistance: 0,
    estimatedDuration: 0
  };
}
