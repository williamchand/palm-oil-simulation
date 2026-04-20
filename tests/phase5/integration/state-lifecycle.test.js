import { describe, it, expect } from 'vitest';
import { createSimulationState } from '../../../src/simulation/createSimulationState.js';
import { seedFromBounds } from '../../../src/types/selection.js';

/**
 * Helper: creates a NormalizedSelection for state lifecycle tests.
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
 * Helper: creates a minimal route with the given number of waypoints.
 */
function createMockRoute(numWaypoints) {
  const waypoints = [];
  for (let i = 0; i < numWaypoints; i++) {
    waypoints.push({
      index: i,
      x: i * 10,
      y: 0,
      lon: 101.5 + i * 0.0001,
      lat: 3.0,
      altitude: 15,
      action: 'scan'
    });
  }
  return { waypoints, totalDistance: numWaypoints * 10, estimatedDuration: numWaypoints * 2 };
}

describe('State Lifecycle Transitions', () => {
  it('idle → selected on setSelection', () => {
    const simState = createSimulationState();
    expect(simState.getState().phase).toBe('idle');

    simState.setSelection(createMockSelection());
    expect(simState.getState().phase).toBe('selected');
  });

  it('selected → generating → running → complete', () => {
    const simState = createSimulationState();
    simState.setSelection(createMockSelection());
    expect(simState.getState().phase).toBe('selected');

    simState.setPhase('generating');
    expect(simState.getState().phase).toBe('generating');

    simState.setPhase('running');
    expect(simState.getState().phase).toBe('running');

    simState.setPhase('complete');
    expect(simState.getState().phase).toBe('complete');
  });

  it('running → paused → running', () => {
    const simState = createSimulationState();
    simState.setSelection(createMockSelection());
    simState.setPhase('running');
    expect(simState.getState().phase).toBe('running');

    simState.setPhase('paused');
    expect(simState.getState().phase).toBe('paused');

    simState.setPhase('running');
    expect(simState.getState().phase).toBe('running');
  });

  it('coverage increases with waypoint progress', () => {
    const simState = createSimulationState();
    const route = createMockRoute(10);
    simState.setRoute(route);

    simState.setCurrentWaypoint(5);
    const state = simState.getState();
    // coverage = Math.round((5/10) * 100) = 50
    expect(state.coverage).toBe(50);
    expect(state.currentWaypointIndex).toBe(5);
  });

  it('subscriber receives all transitions', () => {
    const simState = createSimulationState();
    const phases = [];

    // subscribe immediately calls with current state
    simState.subscribe((state) => {
      phases.push(state.phase);
    });

    // Walk through lifecycle
    simState.setSelection(createMockSelection()); // → selected
    simState.setPhase('generating');               // → generating
    simState.setPhase('running');                   // → running
    simState.setPhase('complete');                  // → complete

    // phases[0] = 'idle' (immediate callback on subscribe)
    // phases[1] = 'selected' (setSelection auto-sets phase)
    // phases[2] = 'generating'
    // phases[3] = 'running'
    // phases[4] = 'complete'
    expect(phases).toEqual(['idle', 'selected', 'generating', 'running', 'complete']);
  });
});
