# Phase 4: Visualization Layer — Context

## Prior Phase Decisions Carried Forward
- D-01: CesiumJS for map, Three.js for 3D (Phase 2)
- D-07: Scene rebuilds from plantation data (Phase 2)
- D-08: Clear before rebuild pattern (Phase 2)
- D-13: Async per-waypoint AI integration (Phase 3)
- D-16: 3 AI decision types — priority, anomaly, altitude (Phase 3)
- D-19: Collapsible reasoning panel (Phase 3) — already implemented

## Decisions

### D-21: Canvas Texture Heatmap
- **Choice:** Render heatmap as a CanvasTexture overlay on the ground plane
- **Rationale:** createDroneScene already uses CanvasTexture for ground grid; consistent pattern; low complexity for hackathon
- **Data:** Combined tree health + ripeness — health shows disease zones (red), ripeness shows harvest readiness (green-to-orange gradient)
- **Update:** Progressive reveal (fog-of-war) — only show data for scanned areas, unscanned stays dark

### D-22: BufferGeometry Drone Path Trail
- **Choice:** Three.js Line with BufferGeometry that grows as drone moves
- **Rationale:** Lightweight, simple API, can color-code segments
- **Segments:** scan=blue (#38bdf8), turn=gray (#64748b), anomaly=red (#ef4444)
- **History:** Show full path (no fade) for demo impact

### D-23: Instanced Scan Point Markers
- **Choice:** Small instanced spheres at scan waypoints
- **Rationale:** Reuses instancing pattern from plantationMesh.js; consistent with existing approach
- **Color:** Matches segment color (blue for normal, red if anomaly flagged)

### D-24: Fog-of-War Coverage
- **Choice:** Unscanned areas rendered dark/muted, scanned areas lit with heatmap colors
- **Rationale:** Dramatic demo effect — audience sees the plantation "revealed" as drone scans; ties naturally into heatmap update
- **Implementation:** Heatmap canvas starts fully dark, painted as waypoints are completed

### D-25: Throttled Heatmap Updates
- **Choice:** Heatmap canvas repaints max 1x/second; instanced trees already performant
- **Rationale:** Canvas texture upload is the main cost; 1Hz is sufficient for visual smoothness; trees already use InstancedMesh

### D-26: Auto-Follow Camera
- **Choice:** Camera smoothly lerps to follow drone during simulation
- **Rationale:** Keeps action visible for judges; no user input needed (zero manual control requirement)
- **Smooth:** Lerp factor ~0.02 per frame for cinematic feel

## Technical Constraints
- Three.js scene already set up in `src/three/createDroneScene.js`
- Plantation mesh uses instancing in `src/three/helpers/plantationMesh.js`
- Scene builder in `src/three/helpers/sceneBuilder.js`
- AI reasoning panel already built in Phase 3 (`src/app/reasoningPanel.js`)
- Simulation state has `currentWaypointIndex`, `anomalies`, `coverage`
- Drone position set via `sceneController.setDronePosition(x, z, altitude)`

## Out of Scope
- OrbitControls (user camera control) — auto-follow only for demo
- Post-processing effects (bloom, SSAO)
- Tree LOD (instancing already handles performance)
- Map-side visualization (CesiumJS overlays) — 3D panel only
