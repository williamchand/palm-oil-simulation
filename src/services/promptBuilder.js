/**
 * Prompt Builder — constructs system prompt, user prompt, request body, and parses AI responses.
 *
 * Pure functions, no DOM dependencies. Implements D-17 (temperature ~0.3), D-18 (system prompt + structured JSON).
 *
 * @module promptBuilder
 */

import { AI_DECISION_TYPES } from '../types/ai.js';

/**
 * Build the system prompt that defines the drone's role and expected JSON output format.
 * Per D-18: system prompt + structured JSON response format.
 *
 * @returns {string}
 */
export function buildSystemPrompt() {
  return `You are an AI-powered agricultural survey drone scanning a palm oil plantation.
Your task is to analyze environmental perception data and make autonomous decisions.

You MUST respond with valid JSON only. No other text.

Response format:
{
  "type": "adjust_priority" | "flag_anomaly" | "modify_altitude",
  "reasoning": "Brief explanation of your decision",
  "confidence": 0.0 to 1.0,
  "parameters": { ... decision-specific parameters ... }
}

Decision types:
1. "adjust_priority" — Reorder upcoming scan waypoints. Parameters: { "priorityIndices": [int, ...] }
2. "flag_anomaly" — Flag detected anomaly. Parameters: { "anomalyType": "low_health"|"pest_cluster"|"ripeness_gradient", "anomalyDescription": "..." }
3. "modify_altitude" — Change scan altitude. Parameters: { "altitudeChange": float (meters, positive=up, negative=down), range -5 to +10 }

Rules:
- Prioritize flagging anomalies when you detect clusters of unhealthy trees (health < 0.3)
- Suggest altitude changes when ripeness data is ambiguous (many trees with ripeness 0.4-0.6)
- Adjust priority when you detect a gradient suggesting nearby high-value areas
- If conditions are normal, use "modify_altitude" with altitudeChange: 0 and reasoning explaining normal conditions`;
}

/**
 * Build the user prompt containing the current perception data.
 *
 * @param {import('../types/ai.js').PerceptionData} perception
 * @returns {string}
 */
export function buildUserPrompt(perception) {
  return `Current perception at waypoint ${perception.dronePosition.waypointIndex}:
${JSON.stringify(perception, null, 2)}
Analyze this data and decide your next action.`;
}

/**
 * Build the full request body for the Gemma API.
 * Per D-17: temperature 0.3. Per D-18: system + user messages.
 *
 * @param {import('../types/ai.js').PerceptionData} perception
 * @returns {{ messages: Array<{role: string, content: string}>, temperature: number, max_tokens: number }}
 */
export function buildRequestBody(perception) {
  return {
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(perception) }
    ],
    temperature: 0.3,
    max_tokens: 256
  };
}

/**
 * Parse raw LLM response text into a validated AiDecision.
 * Handles both clean JSON and JSON embedded in surrounding text.
 * Validates type enum, confidence range, and required fields per T-03-02 mitigation.
 *
 * @param {string} rawText - Raw text from the API
 * @returns {import('../types/ai.js').AiDecision|null} Parsed decision or null if invalid
 */
export function parseAiResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  let parsed;

  // Try direct JSON.parse first
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Try to extract JSON from surrounding text
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  // Validate required fields
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  // Validate type is one of the allowed decision types (per D-16)
  if (!AI_DECISION_TYPES.includes(parsed.type)) {
    return null;
  }

  // Validate reasoning is a string
  if (typeof parsed.reasoning !== 'string') {
    return null;
  }

  // Validate confidence is a number in [0, 1]
  if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
    return null;
  }

  // Default parameters to empty object if missing
  const parameters = parsed.parameters && typeof parsed.parameters === 'object'
    ? parsed.parameters
    : {};

  return {
    type: parsed.type,
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    parameters
  };
}
