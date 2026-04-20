# Phase 2: Core Infrastructure (Hours 5-16) - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the core interactive infrastructure behind the current shell: map-based area selection, deterministic plantation generation, a Three.js world tied to the selected area, and basic automated drone movement. AI reasoning depth, rich overlays, and final visualization polish stay in later phases.

</domain>

<decisions>
## Implementation Decisions

### Mapping foundation
- **D-01:** CesiumJS replaces ArcGIS as the geospatial foundation for the rest of the project, not just Phase 2.
- **D-02:** Area selection should use a draggable rectangle/bounding box interaction on the Cesium map.
- **D-03:** The flow keeps an explicit **Start Simulation** button after selection rather than auto-starting movement immediately.

### Plantation generation
- **D-04:** The plantation should read visually as organized palm plantation rows with slight natural variation, not a perfect grid and not a loose organic forest.
- **D-05:** Generation must be deterministic for the same selected area on every run.
- **D-06:** Phase 2 generation should output tree positions plus basic ripeness and health seed values for later visualization and AI phases.

### Map and 3D synchronization
- **D-07:** Once the user confirms a selected rectangle, the 3D scene should rebuild from the full selected area rather than a simplified slice.
- **D-08:** The 3D scene should update after selection confirmation, not continuously while the user is dragging or resizing the selection.

### Drone baseline behavior
- **D-09:** Before Gemma-driven autonomy exists, the drone should follow a predictable sweep pattern across the generated plantation.
- **D-10:** After the user presses **Start Simulation**, movement remains fully automated with no direct steering controls.
- **D-11:** Even in this early phase, the drone should vary altitude with terrain rather than stay at a fixed height.

### the agent's Discretion
- Exact Cesium camera defaults and map styling
- Internal state container and event flow between Cesium, world generation, and Three.js
- Exact sweep-path algorithm, so long as it reads as predictable coverage
- Terrain sampling implementation details and performance safeguards

</decisions>

<specifics>
## Specific Ideas

- "refactor arcgis to CesiumJS"
- The area-selection flow should still feel deliberate: select area first, then explicitly start the simulation.
- The demo should feel like a real plantation system, not an abstract sandbox, so orderly rows and terrain-aware flight matter early.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and goals
- `.planning/PROJECT.md` — Project vision, success criteria, and the overall digital twin objective
- `.planning/REQUIREMENTS.md` — Functional requirements for area selection, world generation, drone simulation, and responsiveness constraints
- `.planning/ROADMAP.md` — Phase 2 scope boundary, deliverables, and success criteria
- `tasks/prd-gemma4-autonomous-drone-simulation.md` — Product framing, user stories, and non-goals for the demo

### Existing implementation baseline
- `.planning/phases/1_PROJECT_SETUP/1-01-SUMMARY.md` — What Phase 1 already established in the runnable shell
- `.planning/phases/1_PROJECT_SETUP/1-UAT.md` — Verified user-facing behavior of the current scaffold

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/createSimulationShell.js`: already defines the main shell layout, control buttons, and phase handoff points for map and 3D behavior
- `src/map/createMapPanel.js`: current map bootstrapping boundary; this is the natural replacement point for swapping ArcGIS to CesiumJS
- `src/three/createDroneScene.js`: existing Three.js initialization and animation loop provide the starting point for terrain-aware scene rebuilding and drone motion
- `src/config/environment.js`: current environment-loading entry point for future Cesium configuration
- `src/services/gemmaClient.js`: placeholder service boundary that later phases can connect to without changing Phase 2 scope

### Established Patterns
- Plain JavaScript ES modules with small feature-focused files
- UI composition happens from `src/app/createSimulationShell.js`, with subsystem setup delegated to dedicated modules
- External integrations are guarded so missing credentials degrade visibly instead of crashing the shell
- The current UX already separates **selection/setup** from **Start Simulation**, which aligns with the chosen Phase 2 flow

### Integration Points
- Replace `src/map/createMapPanel.js` with a Cesium-based controller that emits confirmed area selections
- Extend `src/three/createDroneScene.js` so the scene can rebuild from generated world data and drive sweep-path movement
- Thread shared phase state through the shell so Cesium selection, generated plantation data, and drone movement stay synchronized

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 02-core-infrastructure-hours-5-16*
*Context gathered: 2026-04-20*
