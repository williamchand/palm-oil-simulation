/**
 * @typedef {import('../types/plantation.js').PlantationData} PlantationData
 * @typedef {import('../types/route.js').Waypoint} Waypoint
 * @typedef {import('../types/route.js').Route} Route
 */

const DEFAULT_ALTITUDE = 15; // meters above ground (middle of 12-20m range)
const SCAN_ROW_SPACING = 20; // meters between scan passes
const DRONE_SPEED = 5; // meters per second

/**
 * Creates a deterministic sweep path across a plantation.
 * Uses a lawnmower/boustrophedon pattern for full coverage.
 * 
 * @param {PlantationData} plantationData - Generated plantation data
 * @param {Object} options - Optional configuration
 * @param {number} [options.altitude=15] - Flight altitude in meters
 * @param {number} [options.rowSpacing=20] - Spacing between scan rows in meters
 * @returns {Route}
 */
export function createSweepPath(plantationData, options = {}) {
  const altitude = options.altitude ?? DEFAULT_ALTITUDE;
  const rowSpacing = options.rowSpacing ?? SCAN_ROW_SPACING;
  
  const widthMeters = plantationData.metadata.cols * plantationData.metadata.spacing;
  const heightMeters = plantationData.metadata.rows * plantationData.metadata.spacing;
  
  // Calculate geographic offset for terrain sampling
  const bounds = plantationData.bounds;
  const lonPerMeter = (bounds.east - bounds.west) / widthMeters;
  const latPerMeter = (bounds.north - bounds.south) / heightMeters;
  
  /** @type {Waypoint[]} */
  const waypoints = [];
  let waypointIndex = 0;
  let totalDistance = 0;
  let lastX = 0;
  let lastY = 0;
  
  // Number of sweep rows - ensure we cover the full height
  const numRows = Math.ceil(heightMeters / rowSpacing) + 1;
  
  for (let row = 0; row < numRows; row++) {
    const y = Math.min(row * rowSpacing, heightMeters);
    const isEvenRow = row % 2 === 0;
    
    // Start and end X for this row (alternate direction for efficiency)
    const startX = isEvenRow ? 0 : widthMeters;
    const endX = isEvenRow ? widthMeters : 0;
    
    // Add waypoint at start of row
    waypoints.push({
      index: waypointIndex++,
      x: startX,
      y: y,
      lon: bounds.west + startX * lonPerMeter,
      lat: bounds.south + y * latPerMeter,
      altitude: altitude,
      action: row === 0 ? 'transit' : 'turn'
    });
    
    if (waypointIndex > 1) {
      totalDistance += Math.sqrt(
        Math.pow(startX - lastX, 2) + Math.pow(y - lastY, 2)
      );
    }
    lastX = startX;
    lastY = y;
    
    // Add scan waypoints along the row
    const scanInterval = 30; // meters between scan points
    const numScans = Math.floor(widthMeters / scanInterval);
    
    for (let scan = 1; scan <= numScans; scan++) {
      const progress = scan / (numScans + 1);
      const scanX = isEvenRow 
        ? startX + progress * (endX - startX)
        : startX + progress * (endX - startX);
      
      waypoints.push({
        index: waypointIndex++,
        x: scanX,
        y: y,
        lon: bounds.west + scanX * lonPerMeter,
        lat: bounds.south + y * latPerMeter,
        altitude: altitude,
        action: 'scan'
      });
      
      totalDistance += Math.abs(scanX - lastX);
      lastX = scanX;
    }
    
    // Add waypoint at end of row
    waypoints.push({
      index: waypointIndex++,
      x: endX,
      y: y,
      lon: bounds.west + endX * lonPerMeter,
      lat: bounds.south + y * latPerMeter,
      altitude: altitude,
      action: 'scan'
    });
    
    totalDistance += Math.abs(endX - lastX);
    lastX = endX;
    lastY = y;
  }
  
  const estimatedDuration = totalDistance / DRONE_SPEED;
  
  return {
    waypoints,
    totalDistance,
    estimatedDuration
  };
}
