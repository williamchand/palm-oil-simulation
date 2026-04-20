import { describe, it, expect } from 'vitest';
import { createSimulationState } from '../../../src/simulation/createSimulationState.js';

describe('createSimulationState — AI extensions', () => {
  describe('initial state', () => {
    it('includes aiDecisions as empty array', () => {
      const state = createSimulationState();
      expect(state.getState().aiDecisions).toEqual([]);
    });

    it('includes reasoningLog as empty array', () => {
      const state = createSimulationState();
      expect(state.getState().reasoningLog).toEqual([]);
    });

    it('includes anomalies as empty array', () => {
      const state = createSimulationState();
      expect(state.getState().anomalies).toEqual([]);
    });

    it('includes aiStatus as idle', () => {
      const state = createSimulationState();
      expect(state.getState().aiStatus).toBe('idle');
    });
  });

  describe('addAiDecision', () => {
    it('appends to aiDecisions array', () => {
      const state = createSimulationState();
      const decision = { type: 'modify_altitude', reasoning: 'test', confidence: 0.8, parameters: {} };
      state.addAiDecision(3, decision);

      const s = state.getState();
      expect(s.aiDecisions).toHaveLength(1);
      expect(s.aiDecisions[0].waypointIndex).toBe(3);
      expect(s.aiDecisions[0].decision).toBe(decision);
      expect(s.aiDecisions[0].timestamp).toBeTypeOf('number');
    });

    it('notifies subscribers', () => {
      const state = createSimulationState();
      let notified = false;
      // subscribe fires immediately, then again on change
      let callCount = 0;
      state.subscribe(() => {
        callCount++;
        if (callCount > 1) notified = true;
      });

      state.addAiDecision(0, { type: 'flag_anomaly', reasoning: '', confidence: 0, parameters: {} });
      expect(notified).toBe(true);
    });
  });

  describe('addReasoningEntry', () => {
    it('appends to reasoningLog array', () => {
      const state = createSimulationState();
      const entry = {
        waypointIndex: 5,
        perception: {},
        decision: null,
        source: 'mock',
        latencyMs: 12,
        timestamp: Date.now()
      };
      state.addReasoningEntry(entry);

      const s = state.getState();
      expect(s.reasoningLog).toHaveLength(1);
      expect(s.reasoningLog[0]).toEqual(entry);
    });

    it('notifies subscribers', () => {
      const state = createSimulationState();
      let callCount = 0;
      state.subscribe(() => { callCount++; });
      state.addReasoningEntry({ waypointIndex: 0, perception: {}, decision: null, source: 'mock', latencyMs: 0, timestamp: 0 });
      expect(callCount).toBe(2); // 1 immediate + 1 from addReasoningEntry
    });
  });

  describe('addAnomaly', () => {
    it('appends to anomalies array with timestamp', () => {
      const state = createSimulationState();
      const anomaly = { waypointIndex: 2, anomalyType: 'low_health', description: 'Stressed trees', confidence: 0.9 };
      state.addAnomaly(anomaly);

      const s = state.getState();
      expect(s.anomalies).toHaveLength(1);
      expect(s.anomalies[0].waypointIndex).toBe(2);
      expect(s.anomalies[0].anomalyType).toBe('low_health');
      expect(s.anomalies[0].description).toBe('Stressed trees');
      expect(s.anomalies[0].confidence).toBe(0.9);
      expect(s.anomalies[0].timestamp).toBeTypeOf('number');
    });

    it('notifies subscribers', () => {
      const state = createSimulationState();
      let callCount = 0;
      state.subscribe(() => { callCount++; });
      state.addAnomaly({ waypointIndex: 0, anomalyType: 'pest', description: '', confidence: 0.5 });
      expect(callCount).toBe(2);
    });
  });

  describe('setAiStatus', () => {
    it('updates aiStatus string', () => {
      const state = createSimulationState();
      state.setAiStatus('inferring');
      expect(state.getState().aiStatus).toBe('inferring');
    });

    it('notifies subscribers', () => {
      const state = createSimulationState();
      let callCount = 0;
      state.subscribe(() => { callCount++; });
      state.setAiStatus('active');
      expect(callCount).toBe(2);
    });
  });

  describe('reset', () => {
    it('clears all AI fields back to initial values', () => {
      const state = createSimulationState();
      state.addAiDecision(0, { type: 'modify_altitude', reasoning: '', confidence: 0, parameters: {} });
      state.addReasoningEntry({ waypointIndex: 0, perception: {}, decision: null, source: 'mock', latencyMs: 0, timestamp: 0 });
      state.addAnomaly({ waypointIndex: 0, anomalyType: 'test', description: '', confidence: 0 });
      state.setAiStatus('active');

      state.reset();

      const s = state.getState();
      expect(s.aiDecisions).toEqual([]);
      expect(s.reasoningLog).toEqual([]);
      expect(s.anomalies).toEqual([]);
      expect(s.aiStatus).toBe('idle');
    });
  });

  describe('existing behavior preserved', () => {
    it('setPhase still works', () => {
      const state = createSimulationState();
      state.setPhase('running');
      expect(state.getState().phase).toBe('running');
    });

    it('setRoute still works', () => {
      const state = createSimulationState();
      const route = { waypoints: [], totalDistance: 0, estimatedDuration: 0 };
      state.setRoute(route);
      expect(state.getState().route).toEqual(route);
    });

    it('subscribe receives snapshot with AI fields', () => {
      const state = createSimulationState();
      let received = null;
      state.subscribe(s => { received = s; });
      expect(received).toHaveProperty('aiDecisions');
      expect(received).toHaveProperty('reasoningLog');
      expect(received).toHaveProperty('anomalies');
      expect(received).toHaveProperty('aiStatus');
    });
  });
});
