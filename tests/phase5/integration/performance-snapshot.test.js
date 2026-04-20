import { describe, it, expect } from 'vitest';
import { createSimulationState } from '../../../src/simulation/createSimulationState.js';
import { generatePlantation } from '../../../src/world/generatePlantation.js';
import { createSweepPath } from '../../../src/simulation/createSweepPath.js';
import { createAiWaypointLoop } from '../../../src/simulation/aiWaypointLoop.js';
import { buildPerception } from '../../../src/services/perceptionBuilder.js';
import { seedFromBounds } from '../../../src/types/selection.js';

/**
 * Helper: creates a NormalizedSelection for performance tests.
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
 * Helper: creates a mock gemmaClient with instant responses.
 */
function createFastMockGemmaClient() {
  return {
    infer: async () => ({
      success: true,
      decision: { type: 'modify_altitude', reasoning: 'perf test', confidence: 0.7, parameters: { altitudeChange: -1 } },
      rawResponse: '{}',
      latencyMs: 1,
      source: 'mock'
    }),
    getMode: () => 'mock',
    getBootSequence: () => []
  };
}

describe('Performance Snapshot', () => {
  it('plantation generation completes in under 200ms for ~1km² area', () => {
    const selection = createMockSelection();

    const start = performance.now();
    const plantation = generatePlantation(selection);
    const elapsed = performance.now() - start;

    expect(plantation.trees.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(200);
  });

  it('sweep path generation completes in under 100ms', () => {
    const selection = createMockSelection();
    const plantation = generatePlantation(selection);

    const start = performance.now();
    const route = createSweepPath(plantation);
    const elapsed = performance.now() - start;

    expect(route.waypoints.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });

  it('perception builder processes 10 waypoints in under 50ms', () => {
    const selection = createMockSelection();
    const plantation = generatePlantation(selection);
    const route = createSweepPath(plantation);

    const scanWaypoints = route.waypoints.filter(wp => wp.action === 'scan').slice(0, 10);
    expect(scanWaypoints.length).toBe(10);

    const start = performance.now();
    for (const wp of scanWaypoints) {
      buildPerception(wp, plantation, route, wp.index);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('full pipeline (generate + sweep + 5 AI inferences) under 500ms', async () => {
    const selection = createMockSelection();
    const mockClient = createFastMockGemmaClient();

    const start = performance.now();

    // Generate plantation
    const plantation = generatePlantation(selection);

    // Create sweep path
    const route = createSweepPath(plantation);

    // Run 5 AI inferences
    const simState = createSimulationState();
    simState.setSelection(selection);
    simState.setPlantation(plantation);
    simState.setRoute(route);
    simState.setPhase('running');

    const aiLoop = createAiWaypointLoop(mockClient, simState);
    const scanWaypoints = route.waypoints.filter(wp => wp.action === 'scan').slice(0, 5);

    for (const wp of scanWaypoints) {
      await aiLoop.onWaypoint(wp, plantation, route, wp.index);
    }

    const elapsed = performance.now() - start;

    expect(aiLoop.getStats().totalInferences).toBe(5);
    expect(elapsed).toBeLessThan(500);
  });
});
