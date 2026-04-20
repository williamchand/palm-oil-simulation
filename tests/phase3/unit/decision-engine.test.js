import { describe, it, expect } from 'vitest';
import { applyDecision } from '../../../src/services/decisionEngine.js';

/**
 * Helper: creates a mock route with N waypoints at given altitude.
 */
function createMockRoute(count = 10, altitude = 15) {
  const waypoints = [];
  for (let i = 0; i < count; i++) {
    waypoints.push({
      index: i,
      x: i * 20,
      y: 0,
      lon: 101 + i * 0.001,
      lat: 2 + i * 0.001,
      altitude,
      action: i % 3 === 0 ? 'scan' : i % 3 === 1 ? 'turn' : 'transit'
    });
  }
  return {
    waypoints,
    totalDistance: count * 20,
    estimatedDuration: count * 10
  };
}

describe('decisionEngine — applyDecision', () => {
  describe('modify_altitude', () => {
    it('increases altitude of waypoints after currentIndex by altitudeChange', () => {
      const route = createMockRoute(10, 15);
      const decision = {
        type: 'modify_altitude',
        reasoning: 'Need lower scan for ambiguous ripeness',
        confidence: 0.8,
        parameters: { altitudeChange: 5 }
      };
      const result = applyDecision(decision, route, 3);

      expect(result.applied).toBe(true);
      expect(result.type).toBe('modify_altitude');
      // Waypoints 0-3 should be unchanged
      expect(route.waypoints[0].altitude).toBe(15);
      expect(route.waypoints[3].altitude).toBe(15);
      // Waypoints 4-9 should be 20
      for (let i = 4; i < 10; i++) {
        expect(route.waypoints[i].altitude).toBe(20);
      }
    });

    it('clamps altitude to range [5, 50] — never below 5m', () => {
      const route = createMockRoute(5, 8);
      const decision = {
        type: 'modify_altitude',
        reasoning: 'Lower',
        confidence: 0.7,
        parameters: { altitudeChange: -10 }
      };
      const result = applyDecision(decision, route, 0);

      expect(result.applied).toBe(true);
      for (let i = 1; i < 5; i++) {
        expect(route.waypoints[i].altitude).toBeGreaterThanOrEqual(5);
      }
    });

    it('clamps altitude to range [5, 50] — never above 50m', () => {
      const route = createMockRoute(5, 45);
      const decision = {
        type: 'modify_altitude',
        reasoning: 'Higher',
        confidence: 0.7,
        parameters: { altitudeChange: 20 }
      };
      const result = applyDecision(decision, route, 0);

      expect(result.applied).toBe(true);
      for (let i = 1; i < 5; i++) {
        expect(route.waypoints[i].altitude).toBeLessThanOrEqual(50);
      }
    });

    it('returns altitudesBefore and altitudesAfter arrays', () => {
      const route = createMockRoute(5, 15);
      const decision = {
        type: 'modify_altitude',
        reasoning: 'Test',
        confidence: 0.8,
        parameters: { altitudeChange: 3 }
      };
      const result = applyDecision(decision, route, 1);

      expect(result.altitudesBefore).toEqual([15, 15, 15]);
      expect(result.altitudesAfter).toEqual([18, 18, 18]);
    });
  });

  describe('flag_anomaly', () => {
    it('returns anomaly object with waypointIndex, anomalyType, description, confidence', () => {
      const route = createMockRoute(5, 15);
      const decision = {
        type: 'flag_anomaly',
        reasoning: 'Detected unhealthy trees',
        confidence: 0.9,
        parameters: {
          anomalyType: 'low_health',
          anomalyDescription: '3 trees showing stress'
        }
      };
      const result = applyDecision(decision, route, 2);

      expect(result.applied).toBe(true);
      expect(result.type).toBe('flag_anomaly');
      expect(result.anomaly).toEqual({
        waypointIndex: 2,
        anomalyType: 'low_health',
        description: '3 trees showing stress',
        confidence: 0.9
      });
    });

    it('does NOT modify route waypoints', () => {
      const route = createMockRoute(5, 15);
      const originalAltitudes = route.waypoints.map(w => w.altitude);
      const decision = {
        type: 'flag_anomaly',
        reasoning: 'Anomaly detected',
        confidence: 0.75,
        parameters: {
          anomalyType: 'pest_cluster',
          anomalyDescription: 'Pest cluster found'
        }
      };
      applyDecision(decision, route, 2);

      const afterAltitudes = route.waypoints.map(w => w.altitude);
      expect(afterAltitudes).toEqual(originalAltitudes);
    });

    it('uses reasoning as description when anomalyDescription is missing', () => {
      const route = createMockRoute(5, 15);
      const decision = {
        type: 'flag_anomaly',
        reasoning: 'Something looks wrong here',
        confidence: 0.6,
        parameters: { anomalyType: 'unknown' }
      };
      const result = applyDecision(decision, route, 1);

      expect(result.anomaly.description).toBe('Something looks wrong here');
    });
  });

  describe('adjust_priority', () => {
    it('reorders upcoming waypoints according to priorityIndices', () => {
      const route = createMockRoute(8, 15);
      // Current at 3, upcoming are indices 4,5,6,7
      const decision = {
        type: 'adjust_priority',
        reasoning: 'Reorder for efficiency',
        confidence: 0.7,
        parameters: { priorityIndices: [6, 4, 5, 7] }
      };
      // Capture original X positions of upcoming waypoints
      const origX4 = route.waypoints[4].x;
      const origX5 = route.waypoints[5].x;
      const origX6 = route.waypoints[6].x;
      const origX7 = route.waypoints[7].x;

      const result = applyDecision(decision, route, 3);

      expect(result.applied).toBe(true);
      expect(result.type).toBe('adjust_priority');
      // After reorder: position 4 should have original wp6's data
      expect(route.waypoints[4].x).toBe(origX6);
      expect(route.waypoints[5].x).toBe(origX4);
      expect(route.waypoints[6].x).toBe(origX5);
      expect(route.waypoints[7].x).toBe(origX7);
    });

    it('with empty priorityIndices is a no-op (does not crash)', () => {
      const route = createMockRoute(5, 15);
      const originalWaypoints = route.waypoints.map(w => ({ ...w }));
      const decision = {
        type: 'adjust_priority',
        reasoning: 'No changes needed',
        confidence: 0.5,
        parameters: { priorityIndices: [] }
      };
      const result = applyDecision(decision, route, 2);

      expect(result.applied).toBe(true);
      expect(result.type).toBe('adjust_priority');
      // Waypoints unchanged
      for (let i = 0; i < 5; i++) {
        expect(route.waypoints[i].x).toBe(originalWaypoints[i].x);
      }
    });

    it('with invalid (non-array) priorityIndices is a no-op', () => {
      const route = createMockRoute(5, 15);
      const decision = {
        type: 'adjust_priority',
        reasoning: 'Bad data',
        confidence: 0.3,
        parameters: { priorityIndices: 'not-an-array' }
      };
      const result = applyDecision(decision, route, 2);

      expect(result.applied).toBe(true);
      expect(result.type).toBe('adjust_priority');
    });
  });

  describe('graceful degradation', () => {
    it('null decision returns { applied: false }', () => {
      const route = createMockRoute(5, 15);
      const result = applyDecision(null, route, 2);

      expect(result.applied).toBe(false);
    });

    it('unknown decision type returns { applied: false }', () => {
      const route = createMockRoute(5, 15);
      const decision = {
        type: 'unknown_type',
        reasoning: 'Test',
        confidence: 0.5,
        parameters: {}
      };
      const result = applyDecision(decision, route, 2);

      expect(result.applied).toBe(false);
    });
  });
});
