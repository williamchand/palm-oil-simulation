# Phase 3: AI Integration — Context

## Prior Phase Decisions Carried Forward
- D-01: CesiumJS replaces ArcGIS (Phase 2)
- D-03: Graceful degradation pattern for missing credentials
- D-05: Deterministic procedural generation (seeded)
- D-09: Automated lawnmower sweep pattern
- D-10: Drone follows sweep path with waypoint navigation
- D-11: Pub-sub state manager (`createSimulationState.js`)

## Decisions

### D-12: AI Backend Architecture — Modal.com + Gemma 4
- **Choice:** Deploy Gemma 4 (≤4B parameters) on Modal.com serverless GPU (A10G)
- **Rationale:** User has Modal compute credits; A10G handles 4B model with fast inference (~100-500ms); serverless scales to multiple drones
- **Frontend impact:** REST API via `fetch()` to Modal HTTP endpoint; existing `VITE_GEMMA_API_URL` / `VITE_GEMMA_API_KEY` env vars used
- **Phase 3 scope:** Mock the Modal endpoint locally (same REST interface); actual Modal deployment is separate infra work

### D-13: Async Per-Waypoint AI Integration
- **Choice:** Drone follows sweep path continuously; at each waypoint, sends perception data to Gemma; AI response applied at next waypoint
- **Rationale:** Decouples drone animation from AI latency; simulation never blocks on inference; natural decision cadence
- **Implication:** AI can adjust waypoint priority, flag anomalies, modify altitude — but drone keeps moving

### D-14: Graceful Degradation to Sweep-Only
- **Choice:** When Modal endpoint unavailable or errors, drone continues on the sweep path without AI adjustments
- **Rationale:** Consistent with D-03 pattern; hackathon demo must work even without API; sweep path is already functional

### D-15: Structured Perception Input
- **Choice:** Perception data is structured JSON: nearby trees (position, health/ripeness), coverage statistics, terrain info
- **Rationale:** Structured data → reliable prompt engineering; simulation state already tracks tree data; avoids vision/pixel processing

### D-16: Scoped AI Decision Types
- **Choice:** Gemma can make 3 types of decisions: (1) adjust waypoint priority/order, (2) flag anomalies for reporting, (3) modify scan altitude
- **Rationale:** Scoped decisions are demonstrable in a demo; avoids full path replanning complexity; each type is visually distinct

### D-17: Semi-Deterministic AI Behavior
- **Choice:** Temperature ~0.3 for LLM inference; same perception → similar but not identical decisions
- **Rationale:** Low temperature for consistency in demo; slight variation makes AI feel alive; reproducible enough for debugging

### D-18: System Prompt + Structured JSON Output
- **Choice:** System prompt defines drone role/capabilities; responses are structured JSON with `decision`, `reasoning`, `confidence` fields
- **Rationale:** Structured output is parseable for both execution (apply decisions) and display (show reasoning); system prompt sets behavioral bounds

### D-19: Reasoning Display — Collapsible Panel
- **Choice:** Collapsible side panel showing: current perception summary → AI decision → rationale, updated per waypoint
- **Rationale:** Matches per-waypoint decision cadence (D-13); collapsible keeps 3D view unobstructed; structured display matches JSON output (D-18)

### D-20: Single Drone, N-Ready Architecture
- **Choice:** Demo runs 1 drone; code architecture supports multiple drones (each with own perception/inference cycle)
- **Rationale:** Single drone keeps demo focused and debuggable; Modal's serverless scaling naturally supports parallel inference for N drones

## Technical Constraints
- Frontend-only application (no custom backend) — Modal endpoint is the only server-side component
- Existing simulation loop in `createSimulationShell.js` orchestrates all phases
- Pub-sub state via `createSimulationState.js` for cross-component communication
- `src/services/gemmaClient.js` is current placeholder — will be replaced with real API client
- `src/config/environment.js` already exports `gemmaApiUrl` and `gemmaApiKey`

## Out of Scope
- Modal.com deployment/infrastructure (separate task)
- Multi-drone simultaneous operation (architecture only, not demo behavior)
- Computer vision / image-based perception (structured data only)
- Training or fine-tuning the Gemma model
