---
phase: 04-visualization-layer
plan: "01"
subsystem: three-visualization
tags: [heatmap, path-trail, camera, fog-of-war, three.js]
dependency_graph:
  requires: [src/three/helpers/sceneBuilder.js, src/three/helpers/plantationMesh.js]
  provides: [src/three/helpers/heatmapOverlay.js, src/three/helpers/pathTrail.js]
  affects: [src/three/createDroneScene.js]
tech_stack:
  added: []
  patterns: [canvas-based-heatmap, buffer-geometry-trail, instanced-markers, lerp-camera]
key_files:
  created:
    - src/three/helpers/heatmapOverlay.js
    - src/three/helpers/pathTrail.js
    - tests/phase4/unit/heatmap-overlay.test.js
    - tests/phase4/unit/path-trail.test.js
  modified:
    - src/three/createDroneScene.js
    - tests/phase2/unit/scene-controller.test.js
decisions:
  - "D-21: Canvas-based heatmap with health/ripeness color coding (red/yellow/green thresholds)"
  - "D-22: BufferGeometry line trail with pre-allocated 10K-point buffer and vertex colors"
  - "D-23: InstancedMesh sphere markers (max 2000) for scan waypoints"
  - "D-24: Fog-of-war starts fully dark, reveals via radial gradient on scan"
  - "D-25: 1Hz throttle on heatmap updates via Date.now() check"
  - "D-26: Camera auto-follow with lerp factor 0.02 per frame"
metrics:
  duration: "236s"
  completed: "2026-04-20T13:37:21Z"
  tasks_completed: 2
  tasks_total: 2
  tests_added: 12
  tests_total: 118
  files_created: 4
  files_modified: 2
---

# Phase 4 Plan 01: Heatmap, Path Trail & Camera Summary

Canvas-based fog-of-war heatmap with health-color tree dots, BufferGeometry path trail with color-coded segments and instanced scan markers, auto-follow lerp camera integrated into scene controller.

## What Was Built

### heatmapOverlay.js
- `createHeatmapOverlay(plantationData)` factory creating canvas-based fog-of-war overlay
- Canvas starts fully dark (rgba 0,0,0,1); `reveal()` paints radial gradient to lift fog
- Trees within 30m scan radius get colored dots: red (health<0.4), yellow (<0.7), green (≥0.7)
- Alpha modulated by ripeness (0.5 + ripeness×0.5)
- Anomalies rendered as red highlight circles
- Canvas capped at 512×512 pixels (T-04-01 DoS mitigation)
- 1Hz throttle via Date.now() delta check (D-25, T-04-01)
- `getHealthColor()` pure function exported for testing

### pathTrail.js
- `createPathTrail()` factory creating growing line trail + instanced scan markers
- Pre-allocated Float32Array buffers: 10K points × 3 for position + color (T-04-02)
- Color coding: scan=blue (#38bdf8), turn/transit=gray (#64748b), anomaly=red (#ef4444)
- InstancedMesh scan markers: SphereGeometry(0.15), max 2000 (T-04-03)
- Anomaly markers colored red via `setColorAt`
- `getSegmentColor()` pure function exported for testing

### createDroneScene.js Extensions
- `addTrailPoint(x, z, altitude, action, isAnomaly)` — delegates to pathTrail, enables auto-follow
- `revealHeatmap(waypointX, waypointY, trees, anomalies)` — delegates to heatmapOverlay
- `resetVisualization()` — disposes heatmap + trail, disables auto-follow
- Auto-follow camera: lerps at 0.02/frame toward drone with offset (8, 6, 10)
- `rebuild()` now creates/disposes heatmap overlay and path trail per plantation

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `8e2109b` | Create heatmapOverlay.js, pathTrail.js, and 12 unit tests |
| 2 | `1ee5ef2` | Integrate visualization into scene controller with auto-follow camera |

## Test Results

- 118/118 tests passing (106 existing + 12 new)
- 7 heatmap color tests: threshold boundaries, ripeness alpha modulation
- 5 trail color tests: action types, anomaly override

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated scene-controller test mocks for new imports**
- **Found during:** Task 2
- **Issue:** Existing `scene-controller.test.js` mocked Three.js without `Vector3`, and lacked mocks for new `heatmapOverlay.js` and `pathTrail.js` imports
- **Fix:** Added `Vector3` to Three.js mock, added `MeshBasicMaterial` mock, added mocks for heatmapOverlay and pathTrail helper modules
- **Files modified:** `tests/phase2/unit/scene-controller.test.js`
- **Commit:** `1ee5ef2`

## Verification

1. ✅ `npx vitest run` — 118/118 tests pass
2. ✅ `npx vite build` — 1448 modules, built in 5.02s
3. ✅ Exports verified: `createHeatmapOverlay`, `getHealthColor`, `createPathTrail`, `getSegmentColor`
4. ✅ New methods verified: `addTrailPoint`, `revealHeatmap`, `resetVisualization` on scene controller

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-04-01 (DoS: canvas) | Canvas capped 512×512, 1Hz throttle | ✅ |
| T-04-02 (DoS: trail buffer) | Pre-allocated 10K-point buffer with capacity guard | ✅ |
| T-04-03 (DoS: markers) | InstancedMesh capped at 2000 with capacity guard | ✅ |
| T-04-04 (Tampering) | Accepted — local simulation data only | ✅ |

## Self-Check: PASSED
