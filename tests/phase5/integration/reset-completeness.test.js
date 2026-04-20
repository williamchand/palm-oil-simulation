import { describe, it, expect } from 'vitest';
import { createSimulationState } from '../../../src/simulation/createSimulationState.js';
import { seedFromBounds } from '../../../src/types/selection.js';

/**
 * Helper: creates a NormalizedSelection for reset tests.
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
 * Helper: creates a minimal route for setting state.
 */
function createMockRoute() {
  return {
    waypoints: [
      { index: 0, x: 0, y: 0, lon: 101.5, lat: 3.0, altitude: 15, action: 'scan' },
      { index: 1, x: 10, y: 0, lon: 101.501, lat: 3.0, altitude: 15, action: 'scan' }
    ],
    totalDistance: 10,
    estimatedDuration: 2
  };
}

describe('Reset Completeness', () => {
  it('reset clears core fields', () => {
    const simState = createSimulationState();

    // Populate all core fields
    simState.setSelection(createMockSelection());
    simState.setPlantation({ trees: [{ x: 0, y: 0 }], bounds: {}, metadata: {} });
    simState.setRoute(createMockRoute());
    simState.setPhase('running');
    simState.setCoverage(50);
    simState.setCurrentWaypoint(1);
    simState.setError('test error');

    // Verify fields are set
    let state = simState.getState();
    expect(state.phase).toBe('running');
    expect(state.selection).not.toBeNull();
    expect(state.plantation).not.toBeNull();
    expect(state.route).not.toBeNull();
    expect(state.error).toBe('test error');

    // Reset
    simState.reset();
    state = simState.getState();

    // Verify all core fields cleared
    expect(state.phase).toBe('idle');
    expect(state.selection).toBeNull();
    expect(state.plantation).toBeNull();
    expect(state.route).toBeNull();
    expect(state.coverage).toBe(0);
    expect(state.currentWaypointIndex).toBe(0);
    expect(state.error).toBeNull();
  });

  it('reset clears AI fields', () => {
    const simState = createSimulationState();

    // Populate AI fields
    simState.addAiDecision(0, { type: 'modify_altitude', reasoning: 'test', confidence: 0.8, parameters: {} });
    simState.addReasoningEntry({ waypointIndex: 0, perception: {}, decision: {}, source: 'mock', latencyMs: 5, timestamp: Date.now() });
    simState.addAnomaly({ waypointIndex: 0, anomalyType: 'disease', description: 'test', confidence: 0.9 });
    simState.setAiStatus('active');

    // Verify AI fields are set
    let state = simState.getState();
    expect(state.aiDecisions.length).toBe(1);
    expect(state.reasoningLog.length).toBe(1);
    expect(state.anomalies.length).toBe(1);
    expect(state.aiStatus).toBe('active');

    // Reset
    simState.reset();
    state = simState.getState();

    // Verify all AI fields cleared
    expect(state.aiDecisions).toEqual([]);
    expect(state.reasoningLog).toEqual([]);
    expect(state.anomalies).toEqual([]);
    expect(state.aiStatus).toBe('idle');
  });

  it('reset notifies subscribers', () => {
    const simState = createSimulationState();
    simState.setPhase('running');

    const notifications = [];
    simState.subscribe((state) => {
      notifications.push(state.phase);
    });

    // notifications[0] = 'running' (immediate callback)
    simState.reset();
    // notifications[1] = 'idle' (from reset)

    expect(notifications).toEqual(['running', 'idle']);
  });

  it('state is usable after reset', () => {
    const simState = createSimulationState();

    // Populate and reset
    simState.setSelection(createMockSelection());
    simState.setPhase('running');
    simState.reset();

    // Use state again
    simState.setSelection(createMockSelection());
    expect(simState.getState().phase).toBe('selected');
    expect(simState.getState().selection).not.toBeNull();
  });
});
