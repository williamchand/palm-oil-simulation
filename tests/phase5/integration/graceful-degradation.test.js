import { describe, it, expect } from 'vitest';
import { createSimulationState } from '../../../src/simulation/createSimulationState.js';
import { generatePlantation } from '../../../src/world/generatePlantation.js';
import { createSweepPath } from '../../../src/simulation/createSweepPath.js';
import { createAiWaypointLoop } from '../../../src/simulation/aiWaypointLoop.js';
import { applyDecision } from '../../../src/services/decisionEngine.js';
import { seedFromBounds } from '../../../src/types/selection.js';

/**
 * Helper: creates a NormalizedSelection for degradation tests.
 */
function createMockSelection() {
  const bounds = { west: 101.5, south: 3.0, east: 101.51, north: 3.01 };
  return {
    bounds,
    center: { lon: 101.505, lat: 3.005 },
    size: { widthKm: 1.11, heightKm: 1.11 },
    areaKm2: 1.23,
    seed: seedFromBounds(bounds)
  };
}

/**
 * Helper: creates a failing gemmaClient that throws on infer.
 */
function createFailingGemmaClient() {
  return {
    infer: async () => { throw new Error('Network timeout'); },
    getMode: () => 'mock',
    getBootSequence: () => []
  };
}

/**
 * Helper: sets up a full simulation (state + plantation + route) for AI loop testing.
 */
function setupSimulation() {
  const simState = createSimulationState();
  const selection = createMockSelection();
  simState.setSelection(selection);
  const plantation = generatePlantation(selection);
  simState.setPlantation(plantation);
  const route = createSweepPath(plantation);
  simState.setRoute(route);
  simState.setPhase('running');
  return { simState, plantation, route };
}

/**
 * Helper: get the first N scan waypoints from a route.
 */
function getScanWaypoints(route, count) {
  return route.waypoints.filter(wp => wp.action === 'scan').slice(0, count);
}

describe('Graceful Degradation', () => {
  it('AI failure does not crash AI waypoint loop', async () => {
    const { simState, plantation, route } = setupSimulation();
    const failingClient = createFailingGemmaClient();
    const aiLoop = createAiWaypointLoop(failingClient, simState);

    const scanWps = getScanWaypoints(route, 3);

    // All should resolve without throwing
    for (const wp of scanWps) {
      await aiLoop.onWaypoint(wp, plantation, route, wp.index);
    }

    const stats = aiLoop.getStats();
    expect(stats.failedInferences).toBe(3);
    expect(stats.successfulInferences).toBe(0);
  });

  it('reasoning log records fallback entries on failure', async () => {
    const { simState, plantation, route } = setupSimulation();
    const failingClient = createFailingGemmaClient();
    const aiLoop = createAiWaypointLoop(failingClient, simState);

    const scanWps = getScanWaypoints(route, 2);
    for (const wp of scanWps) {
      await aiLoop.onWaypoint(wp, plantation, route, wp.index);
    }

    const log = simState.getState().reasoningLog;
    expect(log.length).toBe(2);
    for (const entry of log) {
      expect(entry.source).toBe('fallback');
      expect(entry.decision).toBeNull();
    }
  });

  it('aiStatus set to degraded on failure', async () => {
    const { simState, plantation, route } = setupSimulation();
    const failingClient = createFailingGemmaClient();
    const aiLoop = createAiWaypointLoop(failingClient, simState);

    const scanWps = getScanWaypoints(route, 1);
    await aiLoop.onWaypoint(scanWps[0], plantation, route, scanWps[0].index);

    expect(simState.getState().aiStatus).toBe('degraded');
  });

  it('mixed success/failure — partial results kept', async () => {
    const { simState, plantation, route } = setupSimulation();

    let callCount = 0;
    const mixedClient = {
      infer: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            success: true,
            decision: { type: 'modify_altitude', reasoning: 'ok', confidence: 0.9, parameters: { altitudeChange: -1 } },
            rawResponse: '{}',
            latencyMs: 5,
            source: 'mock'
          };
        }
        throw new Error('Intermittent failure');
      },
      getMode: () => 'mock',
      getBootSequence: () => []
    };

    const aiLoop = createAiWaypointLoop(mixedClient, simState);
    const scanWps = getScanWaypoints(route, 2);

    for (const wp of scanWps) {
      await aiLoop.onWaypoint(wp, plantation, route, wp.index);
    }

    const stats = aiLoop.getStats();
    expect(stats.successfulInferences).toBe(1);
    expect(stats.failedInferences).toBe(1);

    const log = simState.getState().reasoningLog;
    expect(log.length).toBe(2);
    // First entry has a decision (success), second has null (failure)
    expect(log[0].decision).not.toBeNull();
    expect(log[1].decision).toBeNull();
  });

  it('null decision from AI is a no-op in applyDecision', () => {
    const { route } = setupSimulation();
    const result = applyDecision(null, route, 0);
    expect(result.applied).toBe(false);
  });

  it('invalid decision type is a no-op in applyDecision', () => {
    const { route } = setupSimulation();
    const result = applyDecision(
      { type: 'invalid_type', reasoning: '', confidence: 0, parameters: {} },
      route,
      0
    );
    expect(result.applied).toBe(false);
  });
});
