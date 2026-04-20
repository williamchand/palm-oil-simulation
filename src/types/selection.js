/**
 * @typedef {Object} SelectionBounds
 * @property {number} west - Western longitude in degrees
 * @property {number} south - Southern latitude in degrees
 * @property {number} east - Eastern longitude in degrees
 * @property {number} north - Northern latitude in degrees
 */

/**
 * @typedef {Object} NormalizedSelection
 * @property {SelectionBounds} bounds
 * @property {{lon: number, lat: number}} center
 * @property {{widthKm: number, heightKm: number}} size
 * @property {number} areaKm2
 * @property {number} seed - Deterministic seed derived from bounds
 */

/**
 * Normalize a Cesium Rectangle to a standardized selection format
 * @param {*} cesiumRectangle - Cesium Rectangle object with bounds in radians
 * @returns {NormalizedSelection}
 */
export function normalizeSelection(cesiumRectangle) {
  // Convert radians to degrees
  const bounds = {
    west: cesiumRectangle.west * 180 / Math.PI,
    south: cesiumRectangle.south * 180 / Math.PI,
    east: cesiumRectangle.east * 180 / Math.PI,
    north: cesiumRectangle.north * 180 / Math.PI
  };

  // Calculate center
  const center = {
    lon: (bounds.west + bounds.east) / 2,
    lat: (bounds.south + bounds.north) / 2
  };

  // Calculate size using Haversine approximation
  // At the equator, 1 degree longitude ≈ 111 km, adjusted by cos(latitude)
  // 1 degree latitude ≈ 111 km everywhere
  const widthKm = (bounds.east - bounds.west) * 111 * Math.cos(center.lat * Math.PI / 180);
  const heightKm = (bounds.north - bounds.south) * 111;

  const size = { widthKm, heightKm };
  const areaKm2 = widthKm * heightKm;

  // Generate deterministic seed
  const seed = seedFromBounds(bounds);

  return {
    bounds,
    center,
    size,
    areaKm2,
    seed
  };
}

/**
 * Validate selection bounds
 * @param {SelectionBounds} bounds
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateBounds(bounds) {
  // Check for inverted longitude
  if (bounds.west > bounds.east) {
    return { valid: false, error: 'Inverted longitude bounds' };
  }

  // Check for inverted latitude
  if (bounds.south > bounds.north) {
    return { valid: false, error: 'Inverted latitude bounds' };
  }

  // Calculate area (same formula as normalizeSelection)
  const centerLat = (bounds.south + bounds.north) / 2;
  const widthKm = (bounds.east - bounds.west) * 111 * Math.cos(centerLat * Math.PI / 180);
  const heightKm = (bounds.north - bounds.south) * 111;
  const areaKm2 = widthKm * heightKm;

  // Check area limit
  if (areaKm2 > 25) {
    return { valid: false, error: 'Area exceeds 25 km2 limit' };
  }

  return { valid: true, error: null };
}

/**
 * Generate deterministic seed from bounds
 * @param {SelectionBounds} bounds
 * @returns {number}
 */
export function seedFromBounds(bounds) {
  // Simple hash: combine coordinates scaled to integers
  // Use Math.abs to ensure positive, then bitwise OR to convert to 32-bit int
  return Math.abs(
    (bounds.west * 1e6 + bounds.south * 1e6 + bounds.east * 1e6 + bounds.north * 1e6) | 0
  );
}
