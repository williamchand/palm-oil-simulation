# Research: Phase 2 - Core Infrastructure

## Objective

Document the implementation guidance the planner needs for Phase 2, given the locked decision to replace ArcGIS with CesiumJS and build the first real selection → generation → 3D simulation loop.

## Key Findings

### 1. CesiumJS integration has bundler-specific setup requirements

- CesiumJS works with npm in browser bundlers, but it is not a drop-in replacement for ArcGIS.
- The app must set `window.CESIUM_BASE_URL` before importing Cesium modules and serve Cesium static assets (`Workers`, `ThirdParty`, `Assets`, `Widgets`) from a public path.
- Cesium widgets CSS must be imported explicitly.
- Cesium ion access tokens are the standard path for terrain and imagery-backed scenes.

**Planning implication:** Phase 2 needs an explicit setup task for Cesium runtime asset hosting and environment configuration, not just a dependency swap.

### 2. Rectangle selection should be represented as a domain object, not a raw viewer artifact

- Cesium's `Rectangle` type represents west/south/east/north bounds in radians.
- That type is useful for the viewer layer, but the rest of the app should consume a normalized selection object that is easy to serialize, hash, and reuse for deterministic generation.
- The current UI already separates selection from "Start Simulation", which matches the locked flow and simplifies confirmation-based scene rebuilds.

**Planning implication:** The phase should introduce a shared selection model with:
- normalized bounds
- derived center and size metadata
- a deterministic seed source derived from the confirmed rectangle

### 3. Deterministic plantation generation should be seeded from the confirmed extent

- Phase 2 does not need high biological realism yet; it needs repeatability and credible structure.
- A seeded generator can produce:
  - orderly row spacing
  - slight per-tree offsets
  - seeded ripeness and health starter values
- The generator should operate independently of Cesium so it can feed both the 3D scene and later overlay systems.

**Planning implication:** Treat world generation as its own module boundary instead of embedding generation logic inside the map or rendering layer.

### 4. Terrain-aware altitude introduces async sampling and fallback behavior

- Cesium terrain height sampling is asynchronous (`sampleTerrainMostDetailed` pattern) and should be isolated behind a terrain service/helper.
- Terrain-aware movement needs a fallback when detailed terrain is unavailable or slow:
  - use a default altitude offset above ellipsoid/ground estimate
  - continue rendering without blocking the whole loop
- Terrain sampling per-frame would be too expensive for a simple sweep pass.

**Planning implication:** Phase 2 should sample terrain at route or waypoint creation time, cache the results, and then animate against cached waypoints rather than querying terrain continuously during every render tick.

### 5. The existing Three.js scene is a good shell but needs a data-driven rebuild path

- `src/three/createDroneScene.js` currently owns scene setup and a placeholder animation loop.
- Phase 2 needs this to evolve into a controller that can:
  - accept generated plantation data
  - clear/rebuild scene contents for a newly confirmed selection
  - place a drone at the first sweep waypoint
  - animate through a deterministic path
- The current module can stay as the integration point, but scene content should be split into helpers once world generation arrives.

**Planning implication:** The phase should plan for scene lifecycle management, not just visual tweaks.

### 6. Shared state should stay lightweight and explicit

- The codebase currently uses plain JavaScript modules and direct composition from `createSimulationShell.js`.
- There is no established framework-level store, which is acceptable at this project size.
- A small simulation state module or evented controller is a better fit than pulling in a state library mid-hackathon.

**Planning implication:** Phase 2 should likely introduce a thin shared state/controller layer that coordinates:
- confirmed area selection
- generated plantation/world data
- drone route state
- simulation lifecycle (`idle`, `selected`, `ready`, `running`)

## Recommended Module Shape

The planner should strongly consider something close to this:

- `src/config/environment.js`
  - add Cesium token/base-url config
- `src/map/createMapPanel.js`
  - replace ArcGIS setup with Cesium viewer bootstrapping
- `src/map/selectionController.js`
  - bounding-box draw/confirm/cancel behavior
- `src/world/generatePlantation.js`
  - deterministic tree layout and seed values
- `src/world/seedFromSelection.js`
  - stable seed generation from confirmed bounds
- `src/simulation/createSimulationState.js`
  - shared state and lifecycle transitions
- `src/simulation/createSweepPath.js`
  - deterministic route generation across the plantation
- `src/simulation/sampleTerrainPath.js`
  - waypoint terrain sampling and altitude offsets
- `src/three/createDroneScene.js`
  - evolve into a scene controller that can rebuild from world data and animate the drone
- `src/app/createSimulationShell.js`
  - connect user actions, selection confirmation, generation, and start behavior

## Risks and Tradeoffs

### Cesium migration risk
- Replacing ArcGIS this early is viable, but only if the phase includes Cesium setup work explicitly.
- The project docs still mention ArcGIS in multiple places; planning should treat Cesium as the new source of truth for implementation, then later reconcile lingering doc references.

### Terrain complexity risk
- Terrain-aware altitude improves the demo feel, but it expands scope.
- Keeping altitude changes waypoint-based instead of fully dynamic is the best compromise for Phase 2.

### Performance risk
- Rebuilding the full 3D scene for the confirmed rectangle is aligned with the locked decision, but planners should still bound density or tree counts for large selections.
- Selection validation should likely reject overly large areas before world generation begins.

### Scope risk
- Phase 2 should not drift into live heatmaps, AI reasoning streams, or sophisticated crop analytics.
- Generate only the world state later phases need.

## Verification Guidance for Planning

The plan should include verification that proves:

1. Cesium boots correctly in the Vite app with configured assets and token handling
2. The user can define and confirm a rectangle selection
3. The same rectangle produces the same generated plantation on repeat runs
4. Confirming a selection rebuilds the Three.js scene from full-area world data
5. Pressing Start launches an automated sweep path
6. Drone altitude follows terrain-sampled waypoints instead of staying flat
7. Missing credentials or terrain failures degrade visibly instead of crashing the shell

## Validation Architecture

### Critical failure modes

- Cesium assets misconfigured, causing viewer startup failure
- Rectangle selection stored only in viewer-specific form, making generation/state reuse brittle
- Generation not seeded, causing inconsistent worlds for the same area
- Scene rebuild leaks prior objects or leaves stale selection state behind
- Terrain sampling blocks animation or makes the drone stall
- Selection size is unbounded, causing slow generation or unusable scenes

### What the future plan should validate

- Unit-level validation for seed generation and deterministic plantation output
- Integration validation from selection confirmation to scene rebuild
- Interaction validation for explicit start-before-motion flow
- Resilience validation for no-token or terrain-failure fallback behavior

## Reference Notes

- Cesium quickstart documents npm usage, explicit widgets CSS import, asset hosting, `CESIUM_BASE_URL`, and token-based terrain setup.
- Cesium `Rectangle` is the correct primitive for viewer-side extent handling, but downstream logic should not depend on raw viewer objects.
- Cesium terrain sampling is asynchronous and should be used in a cached, waypoint-oriented flow for this phase.
