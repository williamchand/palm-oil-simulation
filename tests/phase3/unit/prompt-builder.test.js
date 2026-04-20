import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRequestBody,
  parseAiResponse
} from '../../../src/services/promptBuilder.js';

// Test fixture — minimal PerceptionData
const testPerception = {
  nearbyTrees: [
    { x: 12, y: 14, distanceFromDrone: 4.47, ripeness: 0.7, health: 0.85, row: 2, col: 3 }
  ],
  coverageStats: { scannedWaypoints: 3, totalWaypoints: 10, percentComplete: 30 },
  terrain: { currentAltitude: 45 },
  dronePosition: { x: 10, y: 10, waypointIndex: 3, waypointAction: 'scan' }
};

describe('buildSystemPrompt', () => {
  it('returns string containing drone role and plantation context', () => {
    const prompt = buildSystemPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.toLowerCase()).toContain('drone');
    expect(prompt.toLowerCase()).toContain('palm oil plantation');
  });

  it('mentions JSON output format with required fields', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('type');
    expect(prompt).toContain('reasoning');
    expect(prompt).toContain('confidence');
  });

  it('defines all three decision types per D-16', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('adjust_priority');
    expect(prompt).toContain('flag_anomaly');
    expect(prompt).toContain('modify_altitude');
  });
});

describe('buildUserPrompt', () => {
  it('returns string containing stringified perception data', () => {
    const prompt = buildUserPrompt(testPerception);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('waypointIndex');
    expect(prompt).toContain('"scannedWaypoints": 3');
  });

  it('references the current waypoint index', () => {
    const prompt = buildUserPrompt(testPerception);
    expect(prompt).toContain('3');
  });
});

describe('buildRequestBody', () => {
  it('returns object with messages array containing system and user messages', () => {
    const body = buildRequestBody(testPerception);
    expect(body).toHaveProperty('messages');
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');
  });

  it('uses temperature 0.3 per D-17', () => {
    const body = buildRequestBody(testPerception);
    expect(body.temperature).toBe(0.3);
  });

  it('includes max_tokens', () => {
    const body = buildRequestBody(testPerception);
    expect(body.max_tokens).toBe(256);
  });
});

describe('parseAiResponse', () => {
  it('parses valid JSON string and extracts AiDecision', () => {
    const raw = JSON.stringify({
      type: 'flag_anomaly',
      reasoning: 'Detected unhealthy trees',
      confidence: 0.85,
      parameters: { anomalyType: 'low_health', anomalyDescription: 'Cluster of stressed trees' }
    });
    const result = parseAiResponse(raw);
    expect(result).not.toBeNull();
    expect(result.type).toBe('flag_anomaly');
    expect(result.reasoning).toBe('Detected unhealthy trees');
    expect(result.confidence).toBe(0.85);
    expect(result.parameters.anomalyType).toBe('low_health');
  });

  it('extracts JSON embedded in surrounding text', () => {
    const raw = 'Here is my decision: {"type": "modify_altitude", "reasoning": "Need closer look", "confidence": 0.7, "parameters": {"altitudeChange": -3}}';
    const result = parseAiResponse(raw);
    expect(result).not.toBeNull();
    expect(result.type).toBe('modify_altitude');
    expect(result.parameters.altitudeChange).toBe(-3);
  });

  it('returns null for malformed JSON', () => {
    const result = parseAiResponse('this is not json at all');
    expect(result).toBeNull();
  });

  it('returns null for JSON missing required type field', () => {
    const raw = JSON.stringify({
      reasoning: 'Some reasoning',
      confidence: 0.5,
      parameters: {}
    });
    const result = parseAiResponse(raw);
    expect(result).toBeNull();
  });

  it('returns null for invalid type value', () => {
    const raw = JSON.stringify({
      type: 'invalid_type',
      reasoning: 'Some reasoning',
      confidence: 0.5,
      parameters: {}
    });
    const result = parseAiResponse(raw);
    expect(result).toBeNull();
  });

  it('returns null when confidence is out of range', () => {
    const raw = JSON.stringify({
      type: 'modify_altitude',
      reasoning: 'Reason',
      confidence: 1.5,
      parameters: {}
    });
    const result = parseAiResponse(raw);
    expect(result).toBeNull();
  });

  it('defaults parameters to empty object when missing', () => {
    const raw = JSON.stringify({
      type: 'modify_altitude',
      reasoning: 'Normal conditions',
      confidence: 0.6
    });
    const result = parseAiResponse(raw);
    expect(result).not.toBeNull();
    expect(result.parameters).toEqual({});
  });
});
