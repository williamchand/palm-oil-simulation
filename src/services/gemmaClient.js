/**
 * Gemma API Client — REST client with mock fallback for Gemma 4 AI inference.
 *
 * Implements D-12 (Modal REST API), D-14 (graceful degradation), D-16 (3 decision types).
 * When no API URL is configured, returns contextually relevant mock decisions for demo.
 *
 * @module gemmaClient
 */

import { buildRequestBody, parseAiResponse } from './promptBuilder.js';

// Backward-compatible boot sequence (consumed by createSimulationShell.js)
// Will be removed in Plan 03-03 when the shell is updated.
const bootSequence = [
  {
    label: 'Boot',
    message: 'Loading simulation shell and validating environment variables.',
    detail: 'Phase 1 uses placeholder reasoning while the Gemma endpoint is not yet wired.'
  },
  {
    label: 'Map',
    message: 'Awaiting ArcGIS credentials before enabling live area selection.',
    detail: 'The map panel remains stable even when external services are unavailable.'
  },
  {
    label: 'Scene',
    message: 'Initializing WebGL scene for drone preview and camera framing.',
    detail: 'Three.js placeholder verifies rendering and future animation hooks.'
  }
];

/**
 * Generate a contextually relevant mock decision based on perception data.
 * Analyzes nearby tree health/ripeness to produce realistic-looking decisions for demo.
 *
 * @param {import('../types/ai.js').PerceptionData} perception
 * @returns {import('../types/ai.js').AiDecision}
 */
function generateMockDecision(perception) {
  const { nearbyTrees, coverageStats } = perception;

  // Check for unhealthy trees (health < 0.3) → flag_anomaly
  const unhealthyTrees = nearbyTrees.filter(t => t.health < 0.3);
  if (unhealthyTrees.length > 0) {
    return {
      type: 'flag_anomaly',
      reasoning: `Detected ${unhealthyTrees.length} tree(s) with health below 0.3 threshold at rows ${unhealthyTrees.map(t => t.row).join(', ')}. Flagging for ground inspection.`,
      confidence: 0.75,
      parameters: {
        anomalyType: 'low_health',
        anomalyDescription: `${unhealthyTrees.length} trees showing stress indicators within scan radius`
      }
    };
  }

  // Check for ambiguous ripeness (0.4-0.6) → modify_altitude (go lower)
  if (nearbyTrees.length > 0) {
    const ambiguousTrees = nearbyTrees.filter(t => t.ripeness >= 0.4 && t.ripeness <= 0.6);
    if (ambiguousTrees.length > nearbyTrees.length * 0.5) {
      return {
        type: 'modify_altitude',
        reasoning: `${ambiguousTrees.length} of ${nearbyTrees.length} trees have ambiguous ripeness (0.4-0.6). Lowering altitude for more precise scanning.`,
        confidence: 0.75,
        parameters: {
          altitudeChange: -3
        }
      };
    }
  }

  // High coverage → maintain course with adjust_priority
  if (coverageStats.percentComplete > 70) {
    return {
      type: 'adjust_priority',
      reasoning: `Survey ${coverageStats.percentComplete}% complete. Maintaining current priority order for remaining waypoints.`,
      confidence: 0.75,
      parameters: {
        priorityIndices: []
      }
    };
  }

  // Default: normal conditions
  return {
    type: 'modify_altitude',
    reasoning: 'Conditions normal, maintaining current altitude. Tree health and ripeness within expected ranges.',
    confidence: 0.75,
    parameters: {
      altitudeChange: 0
    }
  };
}

/**
 * Create a Gemma API client with automatic mock fallback.
 *
 * @param {Object} config - Environment config
 * @param {string} [config.gemmaApiUrl] - Modal REST API endpoint URL
 * @param {string} [config.gemmaApiKey] - API key for authentication
 * @returns {{ infer: (perception: import('../types/ai.js').PerceptionData) => Promise<import('../types/ai.js').AiResponse>, getMode: () => string, getBootSequence: () => Array }}
 */
export function createGemmaClient(config) {
  const apiUrl = config.gemmaApiUrl || '';
  const apiKey = config.gemmaApiKey || '';
  const mode = apiUrl ? 'api' : 'mock';

  return {
    /**
     * Get the current operating mode.
     * @returns {'api'|'mock'}
     */
    getMode() {
      return mode;
    },

    /**
     * Backward-compatible boot sequence for createSimulationShell.js.
     * Will be removed in Plan 03-03.
     * @returns {Array<{label: string, message: string, detail: string}>}
     */
    getBootSequence() {
      if (mode === 'api') {
        return [
          ...bootSequence,
          {
            label: 'AI',
            message: 'Gemma endpoint detected — AI decisions enabled.',
            detail: 'Real-time inference via Modal REST API.'
          }
        ];
      }
      return [...bootSequence];
    },

    /**
     * Run AI inference on perception data. Returns mock decisions when no API configured (D-14).
     *
     * @param {import('../types/ai.js').PerceptionData} perception
     * @returns {Promise<import('../types/ai.js').AiResponse>}
     */
    async infer(perception) {
      const startTime = Date.now();

      // Mock mode: generate contextually relevant decisions for demo
      if (mode === 'mock') {
        const decision = generateMockDecision(perception);
        return {
          success: true,
          decision,
          rawResponse: JSON.stringify(decision),
          latencyMs: Date.now() - startTime,
          source: 'mock'
        };
      }

      // API mode: send REST POST to Modal endpoint (D-12)
      try {
        const body = buildRequestBody(perception);
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000) // T-03-03: 5s timeout for DoS mitigation
        });

        const data = await response.json();

        // Handle various API response shapes (OpenAI-compatible, simple text, etc.)
        const text = data.choices?.[0]?.message?.content
          || data.text
          || data.response
          || (typeof data === 'string' ? data : JSON.stringify(data));

        const decision = parseAiResponse(text);
        const latencyMs = Date.now() - startTime;

        if (decision === null) {
          return {
            success: false,
            decision: null,
            rawResponse: text,
            latencyMs,
            source: 'api'
          };
        }

        return {
          success: true,
          decision,
          rawResponse: text,
          latencyMs,
          source: 'api'
        };
      } catch (error) {
        // D-14 graceful degradation: on any error, return fallback
        return {
          success: false,
          decision: null,
          rawResponse: error.message,
          latencyMs: Date.now() - startTime,
          source: 'fallback'
        };
      }
    }
  };
}

