/**
 * AI Waypoint Loop — async per-waypoint AI integration controller.
 *
 * Orchestrates perception→inference→apply cycle at each scan waypoint.
 * Non-blocking: drone animation continues while inference runs (D-13).
 * Graceful degradation: inference failures logged but don't crash (D-14).
 * N-ready: each instance is independent with its own state (D-20).
 *
 * @module aiWaypointLoop
 */

import { buildPerception } from '../services/perceptionBuilder.js';
import { applyDecision } from '../services/decisionEngine.js';

/**
 * Creates an async AI integration controller for per-waypoint inference.
 * Non-blocking: drone animation continues while inference runs.
 * Results are applied at the next waypoint (per D-13).
 *
 * @param {object} gemmaClient - Client from createGemmaClient()
 * @param {object} simState - Simulation state manager
 * @returns {{ onWaypoint: (waypoint: object, plantation: object, route: object, currentIndex: number) => Promise<void>, stop: () => void, getStats: () => object }}
 */
export function createAiWaypointLoop(gemmaClient, simState) {
  let stopped = false;
  let pendingDecision = null;
  const stats = {
    totalInferences: 0,
    successfulInferences: 0,
    failedInferences: 0,
    anomaliesFound: 0
  };

  /**
   * Process a waypoint: apply any pending decision, then trigger inference if scan.
   * Returns a Promise — caller can fire-and-forget for non-blocking behavior.
   *
   * @param {import('../types/route.js').Waypoint} waypoint
   * @param {import('../types/plantation.js').PlantationData} plantation
   * @param {import('../types/route.js').Route} route
   * @param {number} currentWaypointIndex
   * @returns {Promise<void>}
   */
  async function onWaypoint(waypoint, plantation, route, currentWaypointIndex) {
    // 1. Apply pending decision from PREVIOUS waypoint (D-13: apply at next waypoint)
    if (pendingDecision !== null) {
      const result = applyDecision(pendingDecision, route, currentWaypointIndex);
      if (result.applied && result.type === 'flag_anomaly' && result.anomaly) {
        simState.addAnomaly(result.anomaly);
        stats.anomaliesFound++;
      }
      if (result.applied) {
        simState.addAiDecision(currentWaypointIndex, pendingDecision);
      }
      pendingDecision = null;
    }

    // 2. Only trigger new inference at 'scan' waypoints; skip if stopped
    if (waypoint.action !== 'scan' || stopped) {
      return;
    }

    // 3. Build perception
    simState.setAiStatus('inferring');
    const perception = buildPerception(waypoint, plantation, route, currentWaypointIndex);

    // 4. Call AI inference (async, non-blocking)
    try {
      const response = await gemmaClient.infer(perception);
      stats.totalInferences++;

      if (response.success && response.decision) {
        stats.successfulInferences++;
        pendingDecision = response.decision; // Will be applied at NEXT waypoint
        simState.setAiStatus('active');
      } else {
        stats.failedInferences++;
        pendingDecision = null;
        simState.setAiStatus('degraded');
      }

      // 5. Store reasoning entry
      simState.addReasoningEntry({
        waypointIndex: waypoint.index,
        perception,
        decision: response.decision,
        source: response.source,
        latencyMs: response.latencyMs,
        timestamp: Date.now()
      });
    } catch (error) {
      // Graceful degradation per D-14 — log and continue
      stats.totalInferences++;
      stats.failedInferences++;
      pendingDecision = null;
      simState.setAiStatus('degraded');

      simState.addReasoningEntry({
        waypointIndex: waypoint.index,
        perception,
        decision: null,
        source: 'fallback',
        latencyMs: 0,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Stop the AI loop — prevents further inference calls and clears pending decision.
   */
  function stop() {
    stopped = true;
    pendingDecision = null;
    simState.setAiStatus('off');
  }

  /**
   * Get current statistics (returns a copy, not a reference).
   * @returns {{ totalInferences: number, successfulInferences: number, failedInferences: number, anomaliesFound: number }}
   */
  function getStats() {
    return { ...stats };
  }

  return { onWaypoint, stop, getStats };
}
