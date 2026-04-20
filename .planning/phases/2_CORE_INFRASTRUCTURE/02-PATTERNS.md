# Phase 2: Core Infrastructure - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 11 new/modified files
**Analogs found:** 10 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/config/environment.js` | config | N/A | `src/config/environment.js` | exact (extension) |
| `src/map/createMapPanel.js` | component | event-driven | `src/map/createMapPanel.js` | exact (replacement) |
| `src/map/selectionController.js` | controller | event-driven | `src/map/createMapPanel.js` | role-match |
| `src/world/generatePlantation.js` | service | transform | `src/services/gemmaClient.js` | role-match |
| `src/world/seedFromSelection.js` | utility | transform | `src/config/environment.js` | partial |
| `src/simulation/createSimulationState.js` | store | event-driven | `src/services/gemmaClient.js` | role-match |
| `src/simulation/createSweepPath.js` | service | transform | `src/services/gemmaClient.js` | role-match |
| `src/simulation/sampleTerrainPath.js` | service | async-request | `src/map/createMapPanel.js` | role-match |
| `src/three/createDroneScene.js` | component | event-driven | `src/three/createDroneScene.js` | exact (extension) |
| `src/app/createSimulationShell.js` | component | event-driven | `src/app/createSimulationShell.js` | exact (extension) |
| `src/three/helpers/sceneBuilder.js` | utility | transform | `src/three/createDroneScene.js` | role-match |

## Pattern Assignments

### `src/config/environment.js` (config, N/A)

**Analog:** `src/config/environment.js`

**Current implementation** (lines 1-8):
```javascript
export function getEnvironmentConfig() {
  return {
    arcgisApiKey: import.meta.env.VITE_ARCGIS_API_KEY?.trim() ?? '',
    gemmaApiUrl: import.meta.env.VITE_GEMMA_API_URL?.trim() ?? '',
    gemmaApiKey: import.meta.env.VITE_GEMMA_API_KEY?.trim() ?? ''
  };
}
```

**Pattern to extend:**
- Add `cesiumToken` field following same pattern: `import.meta.env.VITE_CESIUM_TOKEN?.trim() ?? ''`
- Add `cesiumBaseUrl` field if needed for asset hosting override
- Keep function signature unchanged so existing consumers don't break
- Maintain defensive chaining with `?.trim() ?? ''` for all env vars

---

### `src/map/createMapPanel.js` (component, event-driven)

**Analog:** `src/map/createMapPanel.js`

**Module loading pattern** (lines 1-13):
```javascript
async function loadArcGisModules() {
  const [arcgisConfigModule, MapModule, MapViewModule] = await Promise.all([
    import('@arcgis/core/config.js'),
    import('@arcgis/core/Map.js'),
    import('@arcgis/core/views/MapView.js')
  ]);

  return {
    arcgisConfig: arcgisConfigModule.default,
    ArcGisMap: MapModule.default,
    MapView: MapViewModule.default
  };
}
```

**Cesium replacement should follow:**
- Same async function wrapper for dynamic imports
- Use Promise.all for parallel loading when multiple modules needed
- Return destructured object with named exports for clean usage below
- CesiumJS: `import { Viewer, Rectangle, Cartographic } from 'cesium'`

**Error-safe placeholder pattern** (lines 15-23):
```javascript
function createMessage(title, description) {
  const wrapper = document.createElement('div');
  wrapper.className = 'map-placeholder';
  wrapper.innerHTML = `
    <strong>${title}</strong>
    <p>${description}</p>
  `;
  return wrapper;
}
```

**Reuse for Cesium:**
- Same approach for missing token
- Same approach for initialization failure
- Keep `map-placeholder` CSS class (already styled in main.css)

**Graceful degradation pattern** (lines 25-34):
```javascript
export async function createMapPanel(container, config) {
  if (!config.arcgisApiKey) {
    container.appendChild(
      createMessage(
        'ArcGIS key required',
        'Add VITE_ARCGIS_API_KEY to initialize the live basemap. The layout is ready for Phase 2 area selection work.'
      )
    );
    return;
  }
```

**Apply to Cesium:**
- Check `config.cesiumToken` instead
- Early return pattern keeps rest of code clean
- Message should reference `VITE_CESIUM_TOKEN` instead

**Try/catch with fallback UI** (lines 36-64):
```javascript
  try {
    const { arcgisConfig, ArcGisMap, MapView } = await loadArcGisModules();
    arcgisConfig.apiKey = config.arcgisApiKey;

    const map = new ArcGisMap({
      basemap: 'topo-vector'
    });

    const view = new MapView({
      container,
      map,
      center: [101.6869, 3.139],
      zoom: 11,
      ui: {
        components: ['zoom', 'compass']
      }
    });

    await view.when();
  } catch (error) {
    console.error('Unable to initialize ArcGIS map', error);
    container.replaceChildren(
      createMessage(
        'ArcGIS initialization failed',
        'Check the API key and network access. The panel stays mounted so the rest of the UI can continue working.'
      )
    );
  }
```

**Cesium equivalent:**
- Use `Ion.defaultAccessToken = config.cesiumToken;` before creating viewer
- Create `new Viewer(container, { ... })` with terrain, imagery, UI config
- Same center [101.6869, 3.139] for Malaysia plantation location
- Wrap in try/catch with same console.error + graceful UI replacement
- Keep container mounted so shell layout stays intact

**Key Cesium-specific additions:**
- Set `window.CESIUM_BASE_URL` before imports (required for Vite)
- Return viewer reference for selection controller hookup
- Import Cesium widgets CSS in main.js

---

### `src/map/selectionController.js` (controller, event-driven)

**Analog:** `src/map/createMapPanel.js` (initialization + error handling patterns)

**Module export pattern:**
```javascript
export async function createMapPanel(container, config) {
  // ...initialization
  return view; // or relevant reference
}
```

**Apply to selection:**
- Export `createSelectionController(viewer, callbacks)`
- Return object with `{ enable, disable, getSelection, clear }` methods
- Use callback pattern for `onConfirm(selection)` and `onCancel()`

**Error handling:**
- Same try/catch console.error pattern
- Graceful no-op if viewer is unavailable

---

### `src/world/generatePlantation.js` (service, transform)

**Analog:** `src/services/gemmaClient.js`

**Service factory pattern** (lines 19-66):
```javascript
export function createGemmaClient(config) {
  const hasEndpoint = Boolean(config.gemmaApiUrl);

  return {
    getBootSequence() {
      if (hasEndpoint) {
        return [
          ...bootSequence,
          { label: 'AI', message: '...', detail: '...' }
        ];
      }
      return bootSequence;
    },
    getStartSequence() {
      return [ /* array of objects */ ];
    },
    getPauseSequence() {
      return [ /* array of objects */ ];
    }
  };
}
```

**Apply to plantation generator:**
```javascript
export function generatePlantation(selectionBounds, seed) {
  // deterministic generation logic
  
  return {
    trees: [ /* array of tree objects */ ],
    bounds: selectionBounds,
    metadata: { treeCount, rows, spacing }
  };
}
```

**Pattern principles:**
- Pure function approach (input → output, no side effects)
- Return structured object with named properties
- Keep generation logic isolated from rendering concerns

---

### `src/world/seedFromSelection.js` (utility, transform)

**Analog:** `src/config/environment.js` (simple utility pattern)

**Simple export function:**
```javascript
export function getEnvironmentConfig() {
  return { /* computed object */ };
}
```

**Apply to seed generator:**
```javascript
export function seedFromSelection(bounds) {
  // hash bounds to deterministic seed
  return hashValue;
}
```

**Pattern:**
- Single export function
- Pure computation
- Return primitive value (number for seed)

---

### `src/simulation/createSimulationState.js` (store, event-driven)

**Analog:** `src/services/gemmaClient.js` (state container pattern)

**State container pattern** (lines 1-66):
```javascript
const bootSequence = [ /* constant data */ ];

export function createGemmaClient(config) {
  const hasEndpoint = Boolean(config.gemmaApiUrl);

  return {
    getBootSequence() { /* ... */ },
    getStartSequence() { /* ... */ },
    getPauseSequence() { /* ... */ }
  };
}
```

**Apply to simulation state:**
```javascript
export function createSimulationState() {
  let state = {
    phase: 'idle',
    selection: null,
    world: null,
    route: null
  };

  const listeners = [];

  return {
    getState() { return { ...state }; },
    setSelection(selection) { 
      state.selection = selection;
      notify();
    },
    setWorld(world) {
      state.world = world;
      notify();
    },
    subscribe(callback) {
      listeners.push(callback);
      return () => { /* unsubscribe */ };
    }
  };
}
```

**Pattern principles:**
- Closure-based private state
- Return object with public methods
- Event emitter pattern with subscribe/notify

---

### `src/simulation/createSweepPath.js` (service, transform)

**Analog:** `src/services/gemmaClient.js` (deterministic sequence generation)

**Deterministic sequence pattern** (lines 1-17):
```javascript
const bootSequence = [
  {
    label: 'Boot',
    message: 'Loading simulation shell and validating environment variables.',
    detail: 'Phase 1 uses placeholder reasoning while the Gemma endpoint is not yet wired.'
  },
  // ... more entries
];
```

**Apply to sweep path:**
```javascript
export function createSweepPath(world, startPosition) {
  const waypoints = [];
  
  // Generate waypoints in sweep pattern
  // Use world.bounds, world.trees for coverage
  
  return waypoints.map((wp, index) => ({
    index,
    position: wp.position,
    altitude: wp.altitude, // will be terrain-adjusted
    action: wp.action // 'scan', 'turn', etc.
  }));
}
```

**Pattern:**
- Return array of structured objects
- Each object has consistent shape
- Deterministic ordering

---

### `src/simulation/sampleTerrainPath.js` (service, async-request)

**Analog:** `src/map/createMapPanel.js` (async initialization pattern)

**Async operation with fallback** (lines 36-64):
```javascript
  try {
    const { arcgisConfig, ArcGisMap, MapView } = await loadArcGisModules();
    // ... setup
    await view.when();
  } catch (error) {
    console.error('Unable to initialize ArcGIS map', error);
    // ... fallback UI
  }
```

**Apply to terrain sampling:**
```javascript
export async function sampleTerrainPath(viewer, waypoints) {
  try {
    const positions = waypoints.map(wp => 
      Cartographic.fromDegrees(wp.lon, wp.lat)
    );
    
    const sampledPositions = await sampleTerrainMostDetailed(
      viewer.terrainProvider,
      positions
    );
    
    return waypoints.map((wp, i) => ({
      ...wp,
      altitude: sampledPositions[i].height + DEFAULT_OFFSET
    }));
  } catch (error) {
    console.error('Terrain sampling failed, using default altitude', error);
    return waypoints.map(wp => ({
      ...wp,
      altitude: DEFAULT_ALTITUDE
    }));
  }
}
```

**Pattern:**
- Async function with await
- Try/catch with console.error
- Fallback value on error
- Return same structure regardless of success/failure

---

### `src/three/createDroneScene.js` (component, event-driven)

**Analog:** `src/three/createDroneScene.js`

**Current initialization pattern** (lines 1-15):
```javascript
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  WebGLRenderer
} from 'three';
```

**Keep this pattern:**
- Named imports from 'three'
- All imports at top
- Alphabetically sorted for readability

**Helper function pattern** (lines 17-46):
```javascript
function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  // ... procedural texture generation
  
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(6, 6);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}
```

**Extend with:**
- `createPlantationMesh(worldData)` helper
- `createDrone()` can stay as-is (lines 48-66)
- Keep helper functions above main export

**Main export signature** (lines 68-120):
```javascript
export function createDroneScene(container) {
  const scene = new Scene();
  scene.background = new Color('#07111f');

  const width = container.clientWidth || 640;
  const height = container.clientHeight || 360;

  const camera = new PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(3, 2.8, 4.2);
  camera.lookAt(0, 0.8, 0);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // ... scene setup
  
  const animate = () => {
    drone.rotation.y += 0.01;
    drone.position.x = Math.sin(performance.now() * 0.001) * 0.35;
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  };

  animate();

  const resizeObserver = new ResizeObserver(([entry]) => {
    const nextWidth = entry.contentRect.width;
    const nextHeight = entry.contentRect.height;

    renderer.setSize(nextWidth, nextHeight);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
  });

  resizeObserver.observe(container);
}
```

**Extend to return controller:**
```javascript
export function createDroneScene(container) {
  // ... existing setup ...
  
  let animationActive = true;
  
  const animate = () => {
    if (!animationActive) return;
    // ... existing animation logic ...
    window.requestAnimationFrame(animate);
  };
  
  animate();
  
  return {
    rebuild(worldData) {
      // clear old scene objects
      // add new plantation mesh
      // reset drone position
    },
    startAnimation(route) {
      // begin sweep path animation
    },
    stop() {
      animationActive = false;
    }
  };
}
```

**ResizeObserver pattern:**
- Keep as-is for responsive canvas
- One of the few modern APIs used in codebase

---

### `src/app/createSimulationShell.js` (component, event-driven)

**Analog:** `src/app/createSimulationShell.js`

**Import pattern** (lines 1-5):
```javascript
import plantationGridUrl from '../../assets/plantation-grid.svg?url';
import { getEnvironmentConfig } from '../config/environment.js';
import { createGemmaClient } from '../services/gemmaClient.js';
import { createMapPanel } from '../map/createMapPanel.js';
import { createDroneScene } from '../three/createDroneScene.js';
```

**Add imports for Phase 2:**
- `import { createSelectionController } from '../map/selectionController.js';`
- `import { createSimulationState } from '../simulation/createSimulationState.js';`
- `import { generatePlantation } from '../world/generatePlantation.js';`
- `import { createSweepPath } from '../simulation/createSweepPath.js';`

**Template string markup pattern** (lines 7-109):
```javascript
function buildShellMarkup(config) {
  const arcgisState = config.arcgisApiKey ? 'Configured' : 'Pending API key';
  const gemmaState = config.gemmaApiUrl ? 'Configured' : 'Placeholder mode';

  return `
    <div class="shell">
      <!-- nested HTML structure -->
    </div>
  `;
}
```

**Update for Cesium:**
- Replace `arcgisState` with `cesiumState`
- Update status card labels from "ArcGIS" to "CesiumJS"
- Keep same ternary pattern for state checks

**Helper function pattern** (lines 111-125):
```javascript
function appendReasoning(logNode, entries) {
  logNode.replaceChildren();

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'reasoning-log__item';
    item.innerHTML = `
      <span>${entry.label}</span>
      <strong>${entry.message}</strong>
      <small>${entry.detail}</small>
    `;
    logNode.appendChild(item);
  });
}
```

**Keep this pattern:**
- Small focused functions above main export
- Use `replaceChildren()` for clean DOM updates
- Template literals for markup generation

**Event wiring pattern** (lines 127-157):
```javascript
function wireControls(root, logNode, gemmaClient) {
  const status = root.querySelector('#simulation-status');
  const sceneState = root.querySelector('#scene-state');

  const states = {
    start: { status: 'Running', sceneState: '...', log: [...] },
    stop: { status: 'Paused', sceneState: '...', log: [...] },
    reset: { status: 'Idle', sceneState: '...', log: [...] }
  };

  root.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextState = states[button.dataset.action];
      status.textContent = nextState.status;
      sceneState.textContent = nextState.sceneState;
      appendReasoning(logNode, nextState.log);
    });
  });
}
```

**Extend for Phase 2:**
- Keep data-action attribute pattern
- Add selection confirmation handler
- Wire "Start Simulation" to world generation + scene rebuild
- Update states to reflect new flow (idle → selected → ready → running)

**Main export composition** (lines 159-171):
```javascript
export function createSimulationShell(root) {
  const config = getEnvironmentConfig();
  const gemmaClient = createGemmaClient(config);

  root.innerHTML = buildShellMarkup(config);

  const reasoningLog = root.querySelector('#reasoning-log');
  appendReasoning(reasoningLog, gemmaClient.getBootSequence());

  createMapPanel(root.querySelector('#map-panel'), config);
  createDroneScene(root.querySelector('#scene-panel'));
  wireControls(root, reasoningLog, gemmaClient);
}
```

**Phase 2 extension:**
```javascript
export function createSimulationShell(root) {
  const config = getEnvironmentConfig();
  const gemmaClient = createGemmaClient(config);
  const simulationState = createSimulationState();

  root.innerHTML = buildShellMarkup(config);

  const reasoningLog = root.querySelector('#reasoning-log');
  appendReasoning(reasoningLog, gemmaClient.getBootSequence());

  const viewer = await createMapPanel(root.querySelector('#map-panel'), config);
  const sceneController = createDroneScene(root.querySelector('#scene-panel'));
  
  if (viewer) {
    createSelectionController(viewer, {
      onConfirm: (selection) => {
        simulationState.setSelection(selection);
        // enable Start Simulation button
      }
    });
  }
  
  wireControls(root, reasoningLog, gemmaClient, simulationState, sceneController);
}
```

**Key patterns to preserve:**
- Composition from top-level shell function
- Query selectors for panel containers
- Pass dependencies explicitly (no global state)
- Graceful degradation (if viewer unavailable, rest still works)

---

### `src/three/helpers/sceneBuilder.js` (utility, transform)

**Analog:** `src/three/createDroneScene.js` (helper functions)

**Helper function extraction pattern** (lines 17-66):
```javascript
function createGroundTexture() {
  // ... isolated procedural generation
  return texture;
}

function createDrone() {
  const group = new Group();
  // ... mesh assembly
  return group;
}
```

**Apply to scene builder:**
```javascript
export function createPlantationMesh(worldData) {
  const group = new Group();
  
  worldData.trees.forEach(tree => {
    const trunk = new Mesh(/* ... */);
    const crown = new Mesh(/* ... */);
    group.add(trunk, crown);
  });
  
  return group;
}

export function createTerrainMesh(bounds) {
  const geometry = new PlaneGeometry(/* ... */);
  const material = new MeshStandardMaterial(/* ... */);
  return new Mesh(geometry, material);
}
```

**Pattern:**
- Export individual helper functions
- Each returns a Three.js object (Group, Mesh, Texture, etc.)
- Keep rendering logic separate from business logic

---

## Shared Patterns

### Module Structure
**Source:** All existing modules
**Apply to:** All Phase 2 files

```javascript
// 1. Imports at top (external, then internal)
import { ExternalLib } from 'external-package';
import { internalHelper } from '../utils/helper.js';

// 2. Constants and helper functions
const CONSTANT_VALUE = 42;

function helperFunction(input) {
  return output;
}

// 3. Main export(s)
export function mainFunction(params) {
  // implementation
  return result;
}
```

### Error Handling
**Source:** `src/map/createMapPanel.js` (lines 36-64)
**Apply to:** All async operations, external integrations

```javascript
try {
  // risky operation
  await externalCall();
} catch (error) {
  console.error('Descriptive error context', error);
  // graceful fallback
  return fallbackValue;
}
```

**Principles:**
- Console.error with context, not just error
- Always provide fallback value or UI
- Don't let external failures crash the shell

### Configuration Guard
**Source:** `src/map/createMapPanel.js` (lines 26-34), `src/app/createSimulationShell.js` (lines 8-9)
**Apply to:** Cesium initialization, future API integrations

```javascript
export async function createComponent(container, config) {
  if (!config.requiredKey) {
    container.appendChild(
      createMessage(
        'Title',
        'User-facing description with env var name.'
      )
    );
    return;
  }
  
  // proceed with initialization
}
```

**Principles:**
- Check config early, return early
- Show helpful message with exact env var name
- Keep container mounted (don't remove from DOM)

### DOM Update Pattern
**Source:** `src/app/createSimulationShell.js` (lines 112-125)
**Apply to:** Reasoning log, status updates, dynamic UI

```javascript
function updateElement(node, newData) {
  node.replaceChildren(); // clear efficiently
  
  newData.forEach(item => {
    const element = document.createElement('li');
    element.className = 'appropriate-class';
    element.innerHTML = `<template>${item.data}</template>`;
    node.appendChild(element);
  });
}
```

**Principles:**
- Use `replaceChildren()` not `innerHTML = ''`
- Template literals for markup
- Keep class names semantic

### Responsive Canvas
**Source:** `src/three/createDroneScene.js` (lines 110-119)
**Apply to:** Three.js scene, any canvas-based rendering

```javascript
const resizeObserver = new ResizeObserver(([entry]) => {
  const nextWidth = entry.contentRect.width;
  const nextHeight = entry.contentRect.height;

  renderer.setSize(nextWidth, nextHeight);
  camera.aspect = nextWidth / nextHeight;
  camera.updateProjectionMatrix();
});

resizeObserver.observe(container);
```

**Principles:**
- Use ResizeObserver, not window resize events
- Update renderer, camera aspect, and projection matrix
- Modern API acceptable for this use case

### Import Patterns
**Source:** All files
**Apply to:** All Phase 2 files

```javascript
// 1. External packages
import { Thing } from 'external-package';

// 2. Three.js (alphabetically sorted, one per line for clarity)
import {
  AmbientLight,
  BoxGeometry,
  Mesh
} from 'three';

// 3. Internal modules (relative paths with .js extension)
import { helper } from '../utils/helper.js';
import { config } from './config.js';

// 4. Assets (Vite url imports)
import imageUrl from '../../assets/image.svg?url';
```

---

## No Analog Found

Files with no close match in the codebase:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | - | - | All Phase 2 files have established patterns to follow |

---

## CSS Patterns

### Existing Classes to Reuse
**Source:** `src/styles/main.css`

**Panel structure** (lines 148-183):
- `.panel` — container with border, backdrop blur, shadow
- `.panel__header` — flex header with title and badge
- `.panel__surface` — main content area, flex-grows
- `.panel__footer` — stats or info footer

**Status elements** (lines 100-141):
- `.status-card` — grid item for status displays
- `.badge`, `.badge--accent`, `.badge--muted` — status indicators

**Messaging** (lines 231-250):
- `.map-placeholder` — error/empty state display (already styled, reuse for Cesium errors)

**Colors and spacing:**
- Dark theme: `#020817` background, `#e2e8f0` text
- Accent: `#38bdf8` (cyan), `#22c55e` (green)
- Border: `rgba(148, 163, 184, 0.16)`
- Spacing: `0.75rem`, `1rem`, `1.25rem` standard increments

**No new CSS needed for Phase 2** — all UI patterns already styled.

---

## Metadata

**Analog search scope:** 
- `src/app/`
- `src/map/`
- `src/three/`
- `src/config/`
- `src/services/`
- `src/styles/`

**Files scanned:** 6 existing source files
**Pattern extraction date:** 2026-04-20

**Key findings:**
1. Vanilla JS with ES modules — no framework overhead
2. Graceful degradation for all external dependencies
3. Factory function pattern for all components (not classes)
4. Error handling with console.error + fallback UI
5. ResizeObserver for responsive canvas (modern API acceptable)
6. Template literals for markup generation
7. Data-action attributes for event delegation
8. All styles pre-defined, no new CSS needed for Phase 2
