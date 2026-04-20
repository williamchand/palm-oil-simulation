import { describe, it, expect } from 'vitest';
import { createGemmaClient } from '../../../src/services/gemmaClient.js';

// Test perception fixtures
const normalPerception = {
  nearbyTrees: [
    { x: 12, y: 14, distanceFromDrone: 4.47, ripeness: 0.7, health: 0.85, row: 2, col: 3 },
    { x: 18, y: 20, distanceFromDrone: 8.1, ripeness: 0.6, health: 0.9, row: 3, col: 4 }
  ],
  coverageStats: { scannedWaypoints: 3, totalWaypoints: 10, percentComplete: 30 },
  terrain: { currentAltitude: 45 },
  dronePosition: { x: 10, y: 10, waypointIndex: 3, waypointAction: 'scan' }
};

const lowHealthPerception = {
  nearbyTrees: [
    { x: 12, y: 14, distanceFromDrone: 4.47, ripeness: 0.5, health: 0.2, row: 2, col: 3 },
    { x: 18, y: 20, distanceFromDrone: 8.1, ripeness: 0.5, health: 0.15, row: 3, col: 4 }
  ],
  coverageStats: { scannedWaypoints: 5, totalWaypoints: 10, percentComplete: 50 },
  terrain: { currentAltitude: 45 },
  dronePosition: { x: 10, y: 10, waypointIndex: 5, waypointAction: 'scan' }
};

describe('createGemmaClient', () => {
  describe('getMode()', () => {
    it('returns "mock" when no API URL configured', () => {
      const client = createGemmaClient({});
      expect(client.getMode()).toBe('mock');
    });

    it('returns "api" when API URL is configured', () => {
      const client = createGemmaClient({ gemmaApiUrl: 'http://test.example.com/v1/chat' });
      expect(client.getMode()).toBe('api');
    });
  });

  describe('getBootSequence() backward compatibility', () => {
    it('returns an array of boot sequence objects', () => {
      const client = createGemmaClient({});
      const seq = client.getBootSequence();
      expect(Array.isArray(seq)).toBe(true);
      expect(seq.length).toBeGreaterThan(0);
      expect(seq[0]).toHaveProperty('label');
      expect(seq[0]).toHaveProperty('message');
    });
  });

  describe('mock infer()', () => {
    it('returns valid AiResponse structure with source="mock"', async () => {
      const client = createGemmaClient({});
      const response = await client.infer(normalPerception);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('decision');
      expect(response).toHaveProperty('rawResponse');
      expect(response).toHaveProperty('latencyMs');
      expect(response).toHaveProperty('source', 'mock');
    });

    it('returns valid AiDecision with required fields', async () => {
      const client = createGemmaClient({});
      const response = await client.infer(normalPerception);

      const { decision } = response;
      expect(decision).not.toBeNull();
      expect(['adjust_priority', 'flag_anomaly', 'modify_altitude']).toContain(decision.type);
      expect(typeof decision.reasoning).toBe('string');
      expect(decision.reasoning.length).toBeGreaterThan(0);
      expect(typeof decision.confidence).toBe('number');
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(decision).toHaveProperty('parameters');
    });

    it('returns flag_anomaly when trees have low health', async () => {
      const client = createGemmaClient({});
      const response = await client.infer(lowHealthPerception);

      expect(response.decision.type).toBe('flag_anomaly');
      expect(response.decision.parameters).toHaveProperty('anomalyType', 'low_health');
    });

    it('returns modify_altitude for normal conditions', async () => {
      const client = createGemmaClient({});
      const response = await client.infer(normalPerception);

      // Normal trees (health > 0.3, ripeness not ambiguous) → modify_altitude
      expect(response.decision.type).toBe('modify_altitude');
    });

    it('includes latencyMs >= 0 in response', async () => {
      const client = createGemmaClient({});
      const response = await client.infer(normalPerception);

      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
});
