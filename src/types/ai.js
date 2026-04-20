/**
 * AI Type Contracts for Gemma 4 Autonomous Drone Decision-Making
 *
 * Pure type documentation — no DOM dependencies.
 * All typedefs consumed by perceptionBuilder, promptBuilder, and gemmaClient.
 */

/**
 * @typedef {Object} NearbyTree
 * @property {number} x - Local X in meters
 * @property {number} y - Local Y in meters
 * @property {number} distanceFromDrone - Distance in meters
 * @property {number} ripeness - 0-1
 * @property {number} health - 0-1
 * @property {number} row
 * @property {number} col
 */

/**
 * @typedef {Object} PerceptionData
 * @property {NearbyTree[]} nearbyTrees - Trees within scan radius, sorted by distance
 * @property {{ scannedWaypoints: number, totalWaypoints: number, percentComplete: number }} coverageStats
 * @property {{ currentAltitude: number }} terrain
 * @property {{ x: number, y: number, waypointIndex: number, waypointAction: string }} dronePosition
 */

/**
 * @typedef {'adjust_priority'|'flag_anomaly'|'modify_altitude'} AiDecisionType
 */

/**
 * @typedef {Object} AiDecision
 * @property {AiDecisionType} type - One of the 3 scoped decision types (per D-16)
 * @property {string} reasoning - Human-readable explanation
 * @property {number} confidence - 0-1 confidence score
 * @property {Object} parameters - Decision-specific parameters
 * @property {number} [parameters.altitudeChange] - Delta meters for modify_altitude
 * @property {string} [parameters.anomalyType] - 'low_health'|'pest_cluster'|'ripeness_gradient' for flag_anomaly
 * @property {string} [parameters.anomalyDescription] - Description for flag_anomaly
 * @property {number[]} [parameters.priorityIndices] - Reordered waypoint indices for adjust_priority
 */

/**
 * @typedef {Object} AiResponse
 * @property {boolean} success - Whether inference succeeded
 * @property {AiDecision|null} decision - Parsed decision or null on failure
 * @property {string|null} rawResponse - Raw text from API (for debugging)
 * @property {number} latencyMs - Inference time in milliseconds
 * @property {string} source - 'api'|'mock'|'fallback'
 */

/**
 * @typedef {Object} ReasoningEntry
 * @property {number} waypointIndex - Which waypoint this reasoning is for
 * @property {PerceptionData} perception - What the drone "saw"
 * @property {AiDecision|null} decision - What the AI decided
 * @property {string} source - 'api'|'mock'|'fallback'
 * @property {number} latencyMs
 * @property {number} timestamp - Date.now()
 */

/** Scan radius in meters for nearby tree detection */
export const SCAN_RADIUS = 30;

/** Maximum number of nearby trees to include in perception (to limit prompt size) */
export const MAX_NEARBY_TREES = 20;

/** Valid AI decision types per D-16 */
export const AI_DECISION_TYPES = ['adjust_priority', 'flag_anomaly', 'modify_altitude'];
