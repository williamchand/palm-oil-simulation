/**
 * Tests for reasoning panel — formatReasoningEntry pure function.
 *
 * Since vitest runs in Node (not jsdom), we test the exported pure function
 * formatReasoningEntry which has no DOM dependencies.
 */

import { describe, it, expect } from 'vitest';
import { formatReasoningEntry } from '../../../src/app/reasoningPanel.js';

describe('formatReasoningEntry', () => {
  it('formats a full entry with perception, decision, and rationale', () => {
    /** @type {import('../../../src/types/ai.js').ReasoningEntry} */
    const entry = {
      waypointIndex: 5,
      perception: {
        nearbyTrees: [
          { x: 1, y: 2, distanceFromDrone: 5, ripeness: 0.7, health: 0.9, row: 0, col: 0 },
          { x: 3, y: 4, distanceFromDrone: 8, ripeness: 0.5, health: 0.3, row: 1, col: 1 },
          { x: 5, y: 6, distanceFromDrone: 12, ripeness: 0.8, health: 0.95, row: 2, col: 2 }
        ],
        coverageStats: { scannedWaypoints: 5, totalWaypoints: 20, percentComplete: 25 },
        terrain: { currentAltitude: 15 },
        dronePosition: { x: 100, y: 200, waypointIndex: 5, waypointAction: 'scan' }
      },
      decision: {
        type: 'flag_anomaly',
        reasoning: 'Detected unhealthy tree cluster requiring ground inspection.',
        confidence: 0.85,
        parameters: { anomalyType: 'low_health', anomalyDescription: '1 tree stressed' }
      },
      source: 'mock',
      latencyMs: 12,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    expect(result.waypointLabel).toBe('WP #5');
    expect(result.source).toBe('mock');
    expect(result.latency).toBe('12ms');
    expect(result.perception).toBe('3 trees nearby, 25% complete, alt 15m');
    expect(result.decision).toBe('flag_anomaly (85% confidence)');
    expect(result.rationale).toBe('Detected unhealthy tree cluster requiring ground inspection.');
    expect(result.isBoot).toBe(false);
  });

  it('formats entry with null decision as "No decision (sweep-only)"', () => {
    const entry = {
      waypointIndex: 3,
      perception: {
        nearbyTrees: [],
        coverageStats: { scannedWaypoints: 3, totalWaypoints: 10, percentComplete: 30 },
        terrain: { currentAltitude: 20 },
        dronePosition: { x: 50, y: 100, waypointIndex: 3, waypointAction: 'scan' }
      },
      decision: null,
      source: 'fallback',
      latencyMs: 0,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    expect(result.waypointLabel).toBe('WP #3');
    expect(result.source).toBe('fallback');
    expect(result.decision).toBe('No decision (sweep-only)');
    expect(result.rationale).toBe('');
    expect(result.isBoot).toBe(false);
  });

  it('formats boot message (waypointIndex === -1)', () => {
    const entry = {
      waypointIndex: -1,
      perception: null,
      decision: null,
      source: 'mock',
      latencyMs: 0,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    expect(result.isBoot).toBe(true);
    expect(result.waypointLabel).toBe('BOOT');
    expect(result.decision).toBe('System initialized in mock mode');
    expect(result.perception).toBe('');
    expect(result.rationale).toBe('');
  });

  it('formats boot message with api source', () => {
    const entry = {
      waypointIndex: -1,
      perception: null,
      decision: null,
      source: 'api',
      latencyMs: 0,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    expect(result.isBoot).toBe(true);
    expect(result.decision).toBe('System initialized in api mode');
    expect(result.source).toBe('api');
  });

  it('handles entry with zero confidence correctly', () => {
    const entry = {
      waypointIndex: 0,
      perception: {
        nearbyTrees: [{ x: 1, y: 1, distanceFromDrone: 2, ripeness: 0.5, health: 0.5, row: 0, col: 0 }],
        coverageStats: { scannedWaypoints: 0, totalWaypoints: 10, percentComplete: 0 },
        terrain: { currentAltitude: 0 },
        dronePosition: { x: 0, y: 0, waypointIndex: 0, waypointAction: 'scan' }
      },
      decision: {
        type: 'modify_altitude',
        reasoning: 'Adjusting altitude.',
        confidence: 0,
        parameters: { altitudeChange: -2 }
      },
      source: 'api',
      latencyMs: 150,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    expect(result.waypointLabel).toBe('WP #0');
    expect(result.perception).toBe('1 trees nearby, 0% complete, alt 0m');
    expect(result.decision).toBe('modify_altitude (0% confidence)');
    expect(result.latency).toBe('150ms');
    expect(result.source).toBe('api');
  });

  it('handles entry with null perception gracefully', () => {
    const entry = {
      waypointIndex: 7,
      perception: null,
      decision: {
        type: 'adjust_priority',
        reasoning: 'Reordering based on coverage.',
        confidence: 0.6,
        parameters: { priorityIndices: [8, 9, 10] }
      },
      source: 'mock',
      latencyMs: 5,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    expect(result.waypointLabel).toBe('WP #7');
    expect(result.perception).toBe('');
    expect(result.decision).toBe('adjust_priority (60% confidence)');
    expect(result.rationale).toBe('Reordering based on coverage.');
    expect(result.isBoot).toBe(false);
  });

  it('handles missing source gracefully', () => {
    const entry = {
      waypointIndex: 2,
      perception: null,
      decision: null,
      latencyMs: null,
      timestamp: Date.now()
    };

    const result = formatReasoningEntry(entry);

    // No waypointIndex -1, so not a boot
    expect(result.isBoot).toBe(false);
    expect(result.source).toBe('unknown');
    expect(result.latency).toBe('');
  });
});
