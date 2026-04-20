import { describe, it, expect, vi } from 'vitest';
import { createAiWaypointLoop } from '../../../src/simulation/aiWaypointLoop.js';

/**
 * Helper: creates a mock Gemma client that returns a configurable response.
 */
function createMockGemmaClient(inferResult) {
  let inferCallCount = 0;
  let lastPerception = null;
  return {
    infer: async (perception) => {
      inferCallCount++;
      lastPerception = perception;
      return inferResult;
    },
    getMode: () => 'mock',
    getBootSequence: () => [],
    getInferCallCount: () => inferCallCount,
    getLastPerception: () => lastPerception
  };
}

/**
 * Helper: creates a mock Gemma client that throws on infer.
 */
function createFailingGemmaClient() {
  let inferCallCount = 0;
  return {
    infer: async () => {
      inferCallCount++;
      throw new Error('Network timeout');
    },
    getMode: () => 'mock',
    getBootSequence: () => [],
    getInferCallCount: () => inferCallCount
  };
}

/**
 * Helper: creates a mock simulation state tracker.
 */
function createMockSimState() {
  const aiDecisions = [];
  const reasoningLog = [];
  const anomalies = [];
  let aiStatus = 'idle';
  return {
    addAiDecision: (idx, dec) => aiDecisions.push({ waypointIndex: idx, decision: dec }),
    addReasoningEntry: (entry) => reasoningLog.push(entry),
    addAnomaly: (a) => anomalies.push(a),
    setAiStatus: (s) => { aiStatus = s; },
    getAiDecisions: () => aiDecisions,
    getReasoningLog: () => reasoningLog,
    getAnomalies: () => anomalies,
    getAiStatus: () => aiStatus
  };
}

/**
 * Helper: creates a mock plantation with trees.
 */
function createMockPlantation() {
  return {
    trees: [
      { x: 10, y: 10, ripeness: 0.8, health: 0.9, row: 0, col: 0 },
      { x: 15, y: 15, ripeness: 0.5, health: 0.2, row: 0, col: 1 },
      { x: 20, y: 20, ripeness: 0.3, health: 0.7, row: 1, col: 0 }
    ],
    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    config: { seed: 42 }
  };
}

/**
 * Helper: creates a mock route with mixed waypoint actions.
 */
function createMockRoute(count = 8) {
  const waypoints = [];
  const actions = ['scan', 'turn', 'transit', 'scan', 'scan', 'turn', 'scan', 'transit'];
  for (let i = 0; i < count; i++) {
    waypoints.push({
      index: i,
      x: i * 20,
      y: 0,
      lon: 101 + i * 0.001,
      lat: 2 + i * 0.001,
      altitude: 15,
      action: actions[i % actions.length]
    });
  }
  return {
    waypoints,
    totalDistance: count * 20,
    estimatedDuration: count * 10
  };
}

describe('aiWaypointLoop — createAiWaypointLoop', () => {
  it('returns controller with onWaypoint, stop, getStats', () => {
    const client = createMockGemmaClient({ success: true, decision: null, rawResponse: null, latencyMs: 5, source: 'mock' });
    const simState = createMockSimState();
    const loop = createAiWaypointLoop(client, simState);

    expect(loop).toHaveProperty('onWaypoint');
    expect(loop).toHaveProperty('stop');
    expect(loop).toHaveProperty('getStats');
    expect(typeof loop.onWaypoint).toBe('function');
    expect(typeof loop.stop).toBe('function');
    expect(typeof loop.getStats).toBe('function');
  });

  describe('onWaypoint with scan action', () => {
    it('triggers perception→infer→apply chain for scan waypoints', async () => {
      const decision = {
        type: 'modify_altitude',
        reasoning: 'Lower altitude',
        confidence: 0.8,
        parameters: { altitudeChange: -3 }
      };
      const client = createMockGemmaClient({
        success: true,
        decision,
        rawResponse: JSON.stringify(decision),
        latencyMs: 10,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // First scan waypoint (index 0) — triggers inference, stores pending
      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);

      // Infer was called
      expect(client.getInferCallCount()).toBe(1);
      // Reasoning entry stored
      expect(simState.getReasoningLog()).toHaveLength(1);
    });

    it('calls client.infer with the perception result', async () => {
      const client = createMockGemmaClient({
        success: true,
        decision: null,
        rawResponse: null,
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);

      const perception = client.getLastPerception();
      expect(perception).toHaveProperty('nearbyTrees');
      expect(perception).toHaveProperty('coverageStats');
      expect(perception).toHaveProperty('terrain');
      expect(perception).toHaveProperty('dronePosition');
    });
  });

  describe('onWaypoint skips non-scan actions', () => {
    it('does NOT trigger inference for turn waypoints', async () => {
      const client = createMockGemmaClient({
        success: true,
        decision: null,
        rawResponse: null,
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // Waypoint 1 is 'turn'
      await loop.onWaypoint(route.waypoints[1], plantation, route, 1);

      expect(client.getInferCallCount()).toBe(0);
    });

    it('does NOT trigger inference for transit waypoints', async () => {
      const client = createMockGemmaClient({
        success: true,
        decision: null,
        rawResponse: null,
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // Waypoint 2 is 'transit'
      await loop.onWaypoint(route.waypoints[2], plantation, route, 2);

      expect(client.getInferCallCount()).toBe(0);
    });
  });

  describe('decision application and state tracking', () => {
    it('stores reasoning entry in simState via addReasoningEntry', async () => {
      const decision = {
        type: 'modify_altitude',
        reasoning: 'Test',
        confidence: 0.7,
        parameters: { altitudeChange: 0 }
      };
      const client = createMockGemmaClient({
        success: true,
        decision,
        rawResponse: JSON.stringify(decision),
        latencyMs: 15,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);

      const log = simState.getReasoningLog();
      expect(log).toHaveLength(1);
      expect(log[0].waypointIndex).toBe(0);
      expect(log[0].decision).toBe(decision);
      expect(log[0].source).toBe('mock');
      expect(log[0]).toHaveProperty('perception');
      expect(log[0]).toHaveProperty('latencyMs');
      expect(log[0]).toHaveProperty('timestamp');
    });

    it('stores anomaly in simState when decision is flag_anomaly (applied at next waypoint)', async () => {
      const anomalyDecision = {
        type: 'flag_anomaly',
        reasoning: 'Unhealthy trees detected',
        confidence: 0.85,
        parameters: {
          anomalyType: 'low_health',
          anomalyDescription: 'Trees stressed'
        }
      };
      const client = createMockGemmaClient({
        success: true,
        decision: anomalyDecision,
        rawResponse: JSON.stringify(anomalyDecision),
        latencyMs: 8,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // First scan: inference runs, pending decision stored
      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);
      expect(simState.getAnomalies()).toHaveLength(0); // Not yet applied

      // Next scan waypoint (index 3): pending decision applied
      await loop.onWaypoint(route.waypoints[3], plantation, route, 3);
      expect(simState.getAnomalies()).toHaveLength(1);
      expect(simState.getAnomalies()[0].anomalyType).toBe('low_health');
    });

    it('applies pending decision from waypoint N at waypoint N+1', async () => {
      const altDecision = {
        type: 'modify_altitude',
        reasoning: 'Lower',
        confidence: 0.8,
        parameters: { altitudeChange: -5 }
      };
      const client = createMockGemmaClient({
        success: true,
        decision: altDecision,
        rawResponse: JSON.stringify(altDecision),
        latencyMs: 10,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // Scan at index 0 — infer and store pending
      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);
      // aiDecisions not yet populated (pending, not applied)
      expect(simState.getAiDecisions()).toHaveLength(0);

      // Next scan at index 3 — apply pending, then infer again
      await loop.onWaypoint(route.waypoints[3], plantation, route, 3);
      // Now aiDecision should be recorded
      expect(simState.getAiDecisions()).toHaveLength(1);
    });
  });

  describe('graceful degradation', () => {
    it('when infer returns success=false, no pending decision is stored', async () => {
      const client = createMockGemmaClient({
        success: false,
        decision: null,
        rawResponse: 'error',
        latencyMs: 100,
        source: 'fallback'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);
      // Next waypoint should not apply any decision
      await loop.onWaypoint(route.waypoints[3], plantation, route, 3);

      expect(simState.getAiDecisions()).toHaveLength(0);
      expect(simState.getAiStatus()).toBe('degraded');
    });

    it('when infer throws, drone continues and reasoning entry is still logged', async () => {
      const client = createFailingGemmaClient();
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // Should not throw
      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);

      expect(simState.getReasoningLog()).toHaveLength(1);
      expect(simState.getReasoningLog()[0].decision).toBeNull();
      expect(simState.getReasoningLog()[0].source).toBe('fallback');
      expect(simState.getAiStatus()).toBe('degraded');
    });
  });

  describe('non-blocking behavior', () => {
    it('onWaypoint returns a Promise (fire-and-forget)', () => {
      const client = createMockGemmaClient({
        success: true,
        decision: null,
        rawResponse: null,
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      const result = loop.onWaypoint(route.waypoints[0], plantation, route, 0);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('stop', () => {
    it('prevents further inference calls', async () => {
      const client = createMockGemmaClient({
        success: true,
        decision: { type: 'modify_altitude', reasoning: 'Test', confidence: 0.5, parameters: { altitudeChange: 0 } },
        rawResponse: '{}',
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      loop.stop();
      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);

      expect(client.getInferCallCount()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('returns stats with totalInferences, successfulInferences, failedInferences, anomaliesFound', async () => {
      const decision = {
        type: 'flag_anomaly',
        reasoning: 'Anomaly',
        confidence: 0.8,
        parameters: { anomalyType: 'low_health', anomalyDescription: 'Stressed' }
      };
      const client = createMockGemmaClient({
        success: true,
        decision,
        rawResponse: JSON.stringify(decision),
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);
      const route = createMockRoute();
      const plantation = createMockPlantation();

      // First scan
      await loop.onWaypoint(route.waypoints[0], plantation, route, 0);
      // Second scan (applies pending anomaly from first)
      await loop.onWaypoint(route.waypoints[3], plantation, route, 3);

      const stats = loop.getStats();
      expect(stats.totalInferences).toBe(2);
      expect(stats.successfulInferences).toBe(2);
      expect(stats.failedInferences).toBe(0);
      expect(stats.anomaliesFound).toBe(1);
    });

    it('returns a copy (not a reference)', () => {
      const client = createMockGemmaClient({
        success: true,
        decision: null,
        rawResponse: null,
        latencyMs: 5,
        source: 'mock'
      });
      const simState = createMockSimState();
      const loop = createAiWaypointLoop(client, simState);

      const stats1 = loop.getStats();
      stats1.totalInferences = 999;
      const stats2 = loop.getStats();
      expect(stats2.totalInferences).toBe(0);
    });
  });
});
