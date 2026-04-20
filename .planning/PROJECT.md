# Gemma 4 Autonomous Drone Simulation Project

## What This Is

A browser-based simulation platform where an AI-powered drone autonomously surveys synthetic palm oil plantations. Users select an area on a CesiumJS globe, the system generates a deterministic plantation, and a Gemma 4-driven drone sweeps it with real-time fog-of-war visualization and structured AI reasoning display.

## Core Value

Zero manual control after area selection — fully autonomous AI-driven survey with transparent reasoning.

## Current State

**v1.0 shipped** — 2026-04-20
- 3,031 LOC (src), 2,625 LOC (tests), 145 tests passing
- Tech stack: Vite 5, CesiumJS, Three.js, Gemma 4 REST API
- 5 phases, 14 plans, 42 commits
- Demo-ready with mock AI fallback

## Requirements

### Validated

- ✓ Map-based area selection (CesiumJS rectangle) — v1.0
- ✓ Deterministic plantation generation (seeded PRNG) — v1.0
- ✓ Automated drone sweep (lawnmower pattern) — v1.0
- ✓ Terrain-aware altitude adjustment — v1.0
- ✓ AI perception system (spatial tree analysis) — v1.0
- ✓ AI decision-making (3 decision types) — v1.0
- ✓ Adaptive AI behavior — v1.0
- ✓ AI reasoning display (collapsible panel) — v1.0
- ✓ Fog-of-war heatmap visualization — v1.0
- ✓ Color-coded drone path trail — v1.0
- ✓ Auto-follow camera — v1.0
- ✓ Graceful degradation (mock fallback) — v1.0
- ✓ E2E integration testing (22 tests) — v1.0
- ✓ Performance within budget — v1.0

### Out of Scope

- Multi-drone support — architecture is N-ready but single drone for v1.0
- Route replanning based on AI decisions — planned but deferred
- Mobile app — web-first approach
- Offline mode — real-time is core value

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CesiumJS over ArcGIS | Free tier, better 3D integration | ✓ Good |
| Seeded PRNG (mulberry32) | Deterministic plantation generation | ✓ Good |
| Async fire-and-forget AI | Drone never blocks on inference | ✓ Good |
| Modal.com serverless GPU | A10G for Gemma 4 ≤4B params | — Pending (mock mode for demo) |
| Canvas fog-of-war heatmap | Cheaper than Three.js overlays | ✓ Good |
| Pub-sub state manager | Simple, no framework dependency | ✓ Good |

## Timeline

48 Hours (Weekend hackathon)

## Constraints

- 48-hour development timeline
- Must run as interactive web application
- Real-time visualization requirements
- Computational limitations on AI processing

---
*Last updated: 2026-04-20 after v1.0 milestone*