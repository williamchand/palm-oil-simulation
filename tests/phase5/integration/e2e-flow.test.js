import { describe, it, expect } from 'vitest';
import { createSimulationState } from '../../../src/simulation/createSimulationState.js';
import { generatePlantation } from '../../../src/world/generatePlantation.js';
import { createSweepPath } from '../../../src/simulation/createSweepPath.js';
import { createAiWaypointLoop } from '../../../src/simulation/aiWaypointLoop.js';
import { buildPerception } from '../../../src/services/perceptionBuilder.js';
import { applyDecision } from '../../../src/services/decisionEngine.js';
import { seedFromBounds } from '../../../src/types/selection.js';

/**
 * Helper: creates a NormalizedSelection matching the format from normalizeSelection().
 * Uses seedFromBounds to compute the actual deterministic seed.
 */
function createMockSelection() {
  const bounds = { west: 101.5, south: 3.0, east: 101.51, north: 3.01 };
  const seed = seedFromBounds(bounds);
  return {
    bounds,
    center: { lon: 101.505, lat: 3.005 },
    size: { widthKm: 1.11, heightKm: 1.11 },
    areaKm2: 1.23,
    seed
  };
}

/**
 * Helper: creates a mock gemmaClient that returns a successful modify_altitude decision.
 */
function createMockGemmaClient() {
  return {
    infer: async () => ({
      success: true,
      decision: {
        type: 'modify_altitude',
        reasoning: 'test',
        confidence: 0.8,
        parameters: { altitudeChange: -2 }
      },
      rawResponse: '{"type":"modify_altitude"}',
      latencyMs: 10,
      source: 'mock'
    }),
    getMode: () => 'mock',
    getBootSequence: () => []
  };
}

describe('E2E Pipeline Integration', () => {
  it('full pipeline executes without error', async () => {
    // 1. Create state and set selection
    const simState = createSimulationState();
    const selection = createMockSelection();
    simState.setSelection(selection);
    expect(simState.getState().phase).toBe('selected');

    // 2. Generate plantation
    const plantation = generatePlantation(selection);
    expect(plantation.trees.length).toBeGreaterThan(0);
    simState.setPlantation(plantation);

    // 3. Create sweep path
    const route = createSweepPath(plantation);
    expect(route.waypoints.length).toBeGreaterThan(0);
    simState.setRoute(route);

    // 4. Start running
    simState.setPhase('running');
    expect(simState.getState().phase).toBe('running');

    // 5. Create AI waypoint loop with mock client
    const mockClient = createMockGemmaClient();
    const aiLoop = createAiWaypointLoop(mockClient, simState);

    // 6. Iterate first 5 scan waypoints
    const scanWaypoints = route.waypoints.filter(wp => wp.action === 'scan');
    const toProcess = scanWaypoints.slice(0, 5);
    for (let i = 0; i < toProcess.length; i++) {
      const wp = toProcess[i];
      await aiLoop.onWaypoint(wp, plantation, route, wp.index);
    }

    // 7. Verify AI results
    const state = simState.getState();
    expect(state.reasoningLog.length).toBeGreaterThan(0);
    expect(aiLoop.getStats().totalInferences).toBeGreaterThan(0);

    // 8. Complete
    simState.setPhase('complete');
    expect(simState.getState().phase).toBe('complete');
  });

  it('plantation is deterministic — same selection produces identical output', () => {
    const selection = createMockSelection();
    const plantation1 = generatePlantation(selection);
    const plantation2 = generatePlantation(selection);

    // Deep-compare first 10 trees
    const count = Math.min(10, plantation1.trees.length);
    for (let i = 0; i < count; i++) {
      expect(plantation1.trees[i].x).toBe(plantation2.trees[i].x);
      expect(plantation1.trees[i].y).toBe(plantation2.trees[i].y);
      expect(plantation1.trees[i].ripeness).toBe(plantation2.trees[i].ripeness);
      expect(plantation1.trees[i].health).toBe(plantation2.trees[i].health);
    }

    expect(plantation1.trees.length).toBe(plantation2.trees.length);
  });

  it('sweep path covers plantation dimensions', () => {
    const selection = createMockSelection();
    const plantation = generatePlantation(selection);
    const route = createSweepPath(plantation);

    const widthMeters = plantation.metadata.cols * plantation.metadata.spacing;
    const heightMeters = plantation.metadata.rows * plantation.metadata.spacing;

    // First waypoint near (0,0)
    const firstWp = route.waypoints[0];
    expect(firstWp.x).toBeCloseTo(0, 0);
    expect(firstWp.y).toBeCloseTo(0, 0);

    // Last waypoint near (widthMeters, heightMeters)
    const lastWp = route.waypoints[route.waypoints.length - 1];
    // Last waypoint should be at one edge (x = 0 or widthMeters) and near heightMeters
    expect(lastWp.y).toBeCloseTo(heightMeters, -1); // within ~10m

    // Verify route has both 'scan' and 'turn'/'transit' action types
    const actions = new Set(route.waypoints.map(wp => wp.action));
    expect(actions.has('scan')).toBe(true);
    expect(actions.has('turn') || actions.has('transit')).toBe(true);
  });
});
