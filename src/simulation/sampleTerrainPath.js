/**
 * @typedef {import('../types/route.js').Route} Route
 * @typedef {import('../types/route.js').Waypoint} Waypoint
 */

/**
 * Adjusts waypoint altitudes based on terrain heights.
 * Pure function for testability.
 * 
 * @param {Waypoint[]} waypoints - Original waypoints
 * @param {(number | null)[]} terrainHeights - Sampled terrain heights (null = failed)
 * @returns {Waypoint[]} - Waypoints with adjusted altitudes
 */
export function adjustAltitudesWithTerrain(waypoints, terrainHeights) {
  return waypoints.map((wp, index) => {
    const terrainHeight = terrainHeights[index];
    const validHeight = typeof terrainHeight === 'number' ? terrainHeight : 0;
    
    return {
      ...wp,
      altitude: wp.altitude + validHeight,
      terrainHeight: validHeight
    };
  });
}

/**
 * Samples terrain heights for route waypoints and adjusts altitudes.
 * Falls back to original altitudes on any failure (D-11 graceful degradation).
 * 
 * @param {import('cesium').Viewer | null} viewer - Cesium viewer for terrain sampling
 * @param {Route} route - Route with waypoints containing lon/lat
 * @returns {Promise<Route>} - Route with terrain-adjusted altitudes
 */
export async function sampleTerrainPath(viewer, route) {
  // Graceful fallback when viewer unavailable
  if (!viewer || !viewer.terrainProvider) {
    console.warn('Terrain sampling unavailable, using default altitudes');
    return route;
  }

  try {
    // Dynamic import to avoid Cesium dependency in tests
    const { Cartographic, sampleTerrainMostDetailed } = await import('cesium');
    
    // Convert waypoints to Cartographic positions
    const positions = route.waypoints.map(wp => 
      Cartographic.fromDegrees(wp.lon, wp.lat)
    );

    // Sample terrain heights
    const sampledPositions = await sampleTerrainMostDetailed(
      viewer.terrainProvider,
      positions
    );

    // Extract heights (may be undefined for some positions)
    const terrainHeights = sampledPositions.map(pos => 
      typeof pos.height === 'number' ? pos.height : null
    );

    // Adjust waypoint altitudes
    const adjustedWaypoints = adjustAltitudesWithTerrain(
      route.waypoints,
      terrainHeights
    );

    return {
      ...route,
      waypoints: adjustedWaypoints
    };
  } catch (error) {
    console.error('Terrain sampling failed, using default altitudes:', error);
    return route; // Graceful fallback
  }
}
