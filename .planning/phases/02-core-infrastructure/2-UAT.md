---
status: partial
phase: 02-core-infrastructure
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md
started: 2026-04-20T14:26:27Z
updated: 2026-04-20T14:40:25Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `npm run dev`. Open the Vite URL in your browser. The page loads without console errors, shows the simulation shell with map area and 3D viewport.
result: pass

### 2. CesiumJS Map Renders
expected: A CesiumJS globe/map is visible in the map panel. You can rotate, zoom, and pan the globe. If no Cesium Ion token is configured, a fallback message appears instead (graceful degradation).
result: issue
reported: "The fallback message appears, but Cesium Initialization keeps failing. I've generated the Cesium ION tokens many times and even enabled whole permissions"
severity: major

### 3. Rectangle Area Selection
expected: You can draw a rectangle on the CesiumJS map to define a plantation area. The selection shows coordinates and a computed seed value. You can confirm or reset the selection.
result: blocked
blocked_by: prior-phase
reason: "CesiumJS not loading (Test 2 issue)"

### 4. Deterministic Plantation Generation
expected: After confirming a selection, a plantation is generated. Resetting and re-confirming the exact same area produces an identical plantation (same tree count, same positions).
result: blocked
blocked_by: prior-phase
reason: "CesiumJS not loading (Test 2 issue) — cannot confirm selection"

### 5. 3D Scene with Tree Meshes
expected: After confirming selection, the Three.js 3D viewport shows instanced tree meshes representing the generated plantation. Trees are distributed across the selected area.
result: issue
reported: "there is 3d simulation, but can't add plantation"
severity: major

### 6. Drone Sweep Animation
expected: After plantation generates, clicking Start begins drone animation. The drone follows a lawnmower (boustrophedon) sweep pattern across the plantation area, moving waypoint to waypoint.
result: blocked
blocked_by: prior-phase
reason: "Plantation can't be added (Test 5 issue)"

### 7. Simulation Controls
expected: Start, Stop, and Reset buttons work correctly. Start begins the sweep, Stop pauses it, Reset clears the scene and returns to area selection state.
result: issue
reported: "Start and Stop can't be clicked. Reset can be clicked"
severity: major

## Summary

total: 7
passed: 1
issues: 3
pending: 0
skipped: 0
blocked: 3

## Gaps

- truth: "CesiumJS globe/map is visible in the map panel with valid Ion token"
  status: failed
  reason: "User reported: The fallback message appears, but Cesium Initialization keeps failing. I've generated the Cesium ION tokens many times and even enabled whole permissions"
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Three.js 3D viewport shows instanced tree meshes after confirming selection"
  status: failed
  reason: "User reported: there is 3d simulation, but can't add plantation"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Start, Stop, and Reset buttons all work correctly for simulation control"
  status: failed
  reason: "User reported: Start and Stop can't be clicked. Reset can be clicked"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
