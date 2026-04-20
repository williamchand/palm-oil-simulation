import plantationGridUrl from '../../assets/plantation-grid.svg?url';
import { getEnvironmentConfig } from '../config/environment.js';
import { createGemmaClient } from '../services/gemmaClient.js';
import { createMapPanel } from '../map/createMapPanel.js';
import { createSelectionController } from '../map/selectionController.js';
import { createDroneScene } from '../three/createDroneScene.js';
import { createSimulationState } from '../simulation/createSimulationState.js';
import { generatePlantation } from '../world/generatePlantation.js';
import { createSweepPath } from '../simulation/createSweepPath.js';
import { sampleTerrainPath } from '../simulation/sampleTerrainPath.js';

function buildShellMarkup(config) {
  const cesiumState = config.cesiumToken ? 'Configured' : 'Pending token';
  const gemmaState = config.gemmaApiUrl ? 'Configured' : 'Placeholder mode';

  return `
    <div class="shell">
      <header class="shell__header">
        <div>
          <p class="eyebrow">Phase 2 Core Infrastructure</p>
          <h1>Gemma 4 Autonomous Drone Simulation</h1>
          <p class="shell__subtitle">
            Area selection, plantation generation, and automated sweep path.
          </p>
        </div>
        <div class="shell__controls" role="group" aria-label="Simulation controls">
          <button type="button" data-action="start" disabled>Start Simulation</button>
          <button type="button" class="button--secondary" data-action="stop" disabled>Stop</button>
          <button type="button" class="button--ghost" data-action="reset">Reset</button>
        </div>
      </header>

      <section class="status-grid" aria-label="System status">
        <article class="status-card">
          <span>Status</span>
          <strong id="simulation-status">Idle</strong>
          <small id="status-detail">Draw a rectangle on the map to select plantation area.</small>
        </article>
        <article class="status-card">
          <span>Cesium</span>
          <strong>${cesiumState}</strong>
          <small>${config.cesiumToken ? 'Map and terrain ready.' : 'Set VITE_CESIUM_ION_TOKEN to enable.'}</small>
        </article>
        <article class="status-card">
          <span>Selection</span>
          <strong id="selection-status">None</strong>
          <small id="selection-detail">No area selected</small>
        </article>
        <article class="status-card">
          <span>Coverage</span>
          <strong id="coverage-status">0%</strong>
          <small id="coverage-detail">Awaiting simulation start</small>
        </article>
      </section>

      <main class="workspace">
        <section class="panel panel--map" aria-labelledby="map-panel-title">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Geospatial Workspace</p>
              <h2 id="map-panel-title">Map and plantation selection</h2>
            </div>
            <span class="badge" id="map-badge">${cesiumState}</span>
          </div>
          <div id="map-panel" class="panel__surface panel__surface--map" role="img" aria-label="Map workspace"></div>
          <div class="panel__footer">
            <img src="${plantationGridUrl}" alt="" aria-hidden="true" />
            <div>
              <strong id="map-instruction">Draw Selection</strong>
              <p id="map-instruction-detail">Click and drag on the map to define the plantation boundary.</p>
            </div>
          </div>
        </section>

        <section class="panel panel--three" aria-labelledby="scene-panel-title">
          <div class="panel__header">
            <div>
              <p class="eyebrow">3D Simulation</p>
              <h2 id="scene-panel-title">Drone world preview</h2>
            </div>
            <span class="badge badge--accent">Three.js ready</span>
          </div>
          <div id="scene-panel" class="panel__surface panel__surface--scene"></div>
          <div class="panel__footer panel__footer--stats">
            <div>
              <strong id="scene-state">Awaiting selection</strong>
              <p id="scene-detail">Select an area to generate the plantation.</p>
            </div>
            <dl>
              <div>
                <dt>Trees</dt>
                <dd id="tree-count">0</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd id="coverage-display">0%</dd>
              </div>
            </dl>
          </div>
        </section>

        <aside class="panel panel--reasoning" aria-labelledby="reasoning-panel-title">
          <div class="panel__header">
            <div>
              <p class="eyebrow">AI Reasoning</p>
              <h2 id="reasoning-panel-title">Decision log</h2>
            </div>
            <span class="badge badge--muted">Placeholder mode</span>
          </div>
          <ol id="reasoning-log" class="reasoning-log" aria-live="polite"></ol>
        </aside>
      </main>
    </div>
  `;
}

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

export function createSimulationShell(root) {
  const config = getEnvironmentConfig();
  const gemmaClient = createGemmaClient(config);
  const simState = createSimulationState();

  root.innerHTML = buildShellMarkup(config);

  // DOM references
  const reasoningLog = root.querySelector('#reasoning-log');
  const startBtn = root.querySelector('[data-action="start"]');
  const stopBtn = root.querySelector('[data-action="stop"]');
  const resetBtn = root.querySelector('[data-action="reset"]');
  const statusEl = root.querySelector('#simulation-status');
  const statusDetail = root.querySelector('#status-detail');
  const selectionStatus = root.querySelector('#selection-status');
  const selectionDetail = root.querySelector('#selection-detail');
  const coverageStatus = root.querySelector('#coverage-status');
  const coverageDetail = root.querySelector('#coverage-detail');
  const sceneState = root.querySelector('#scene-state');
  const sceneDetail = root.querySelector('#scene-detail');
  const treeCount = root.querySelector('#tree-count');
  const coverageDisplay = root.querySelector('#coverage-display');
  const mapInstruction = root.querySelector('#map-instruction');
  const mapInstructionDetail = root.querySelector('#map-instruction-detail');

  appendReasoning(reasoningLog, gemmaClient.getBootSequence());

  // Initialize scene controller
  const sceneController = createDroneScene(root.querySelector('#scene-panel'));

  // Initialize map and selection
  let viewer = null;
  let selectionController = null;
  let animationFrameId = null;

  createMapPanel(root.querySelector('#map-panel'), config).then(result => {
    viewer = result.viewer;
    if (viewer) {
      selectionController = createSelectionController(viewer, {
        onConfirm: (selection) => {
          simState.setSelection(selection);
          appendReasoning(reasoningLog, [
            { label: 'Selection', message: `Area confirmed: ${selection.areaKm2.toFixed(2)} km²`, detail: `Seed: ${selection.seed}` }
          ]);
        },
        onError: (error) => {
          simState.setError(error);
          appendReasoning(reasoningLog, [
            { label: 'Error', message: error, detail: 'Please select a smaller area.' }
          ]);
        }
      });
      selectionController.enable();
    }
  });

  // State subscription for UI updates
  simState.subscribe((state) => {
    // Update status display
    statusEl.textContent = state.phase.charAt(0).toUpperCase() + state.phase.slice(1);
    
    // Update button states
    startBtn.disabled = state.phase !== 'selected' && state.phase !== 'ready';
    stopBtn.disabled = state.phase !== 'running';

    // Update selection display
    if (state.selection) {
      selectionStatus.textContent = `${state.selection.areaKm2.toFixed(2)} km²`;
      selectionDetail.textContent = `${state.selection.size.widthKm.toFixed(1)} × ${state.selection.size.heightKm.toFixed(1)} km`;
      mapInstruction.textContent = 'Area Confirmed';
      mapInstructionDetail.textContent = 'Press Start Simulation to begin drone sweep.';
    } else {
      selectionStatus.textContent = 'None';
      selectionDetail.textContent = 'No area selected';
      mapInstruction.textContent = 'Draw Selection';
      mapInstructionDetail.textContent = 'Click and drag on the map to define the plantation boundary.';
    }

    // Update coverage display
    coverageStatus.textContent = `${state.coverage}%`;
    coverageDisplay.textContent = `${state.coverage}%`;
    
    if (state.phase === 'running') {
      coverageDetail.textContent = `Waypoint ${state.currentWaypointIndex + 1} of ${state.route?.waypoints.length || 0}`;
      statusDetail.textContent = 'Drone scanning plantation...';
    } else if (state.phase === 'complete') {
      coverageDetail.textContent = 'Scan complete';
      statusDetail.textContent = 'Plantation scan finished.';
    }

    // Update tree count
    if (state.plantation) {
      treeCount.textContent = state.plantation.metadata.treeCount.toLocaleString();
      sceneState.textContent = 'Plantation loaded';
      sceneDetail.textContent = `${state.plantation.metadata.rows} rows × ${state.plantation.metadata.cols} columns`;
    }

    // Update scene state text based on phase
    if (state.phase === 'generating') {
      sceneState.textContent = 'Generating...';
      sceneDetail.textContent = 'Creating plantation layout...';
    } else if (state.phase === 'running') {
      sceneState.textContent = 'Scanning';
      sceneDetail.textContent = 'Autonomous sweep in progress';
    }
  });

  // Drone animation along route
  function animateDrone(route, onComplete) {
    let waypointIndex = 0;
    let progress = 0;
    const speed = 0.5; // Units per frame

    function tick() {
      if (simState.getState().phase !== 'running') {
        return;
      }

      const waypoints = route.waypoints;
      if (waypointIndex >= waypoints.length - 1) {
        simState.setPhase('complete');
        onComplete?.();
        return;
      }

      const current = waypoints[waypointIndex];
      const next = waypoints[waypointIndex + 1];
      
      // Interpolate position
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      progress += speed / Math.max(distance, 1);
      
      if (progress >= 1) {
        waypointIndex++;
        progress = 0;
        simState.setCurrentWaypoint(waypointIndex);
      }

      const x = current.x + dx * progress;
      const y = current.y + dy * progress;
      const altitude = current.altitude + (next.altitude - current.altitude) * progress;
      
      sceneController.setDronePosition(x, y, altitude);

      animationFrameId = requestAnimationFrame(tick);
    }

    tick();
  }

  // Wire controls
  startBtn.addEventListener('click', async () => {
    const state = simState.getState();
    if (!state.selection) return;

    simState.setPhase('generating');
    appendReasoning(reasoningLog, [
      { label: 'Generate', message: 'Creating plantation layout...', detail: `Seed: ${state.selection.seed}` }
    ]);

    // Generate plantation
    const plantation = generatePlantation(state.selection);
    simState.setPlantation(plantation);
    
    // Rebuild scene
    sceneController.rebuild(plantation);
    
    appendReasoning(reasoningLog, [
      { label: 'Scene', message: `${plantation.metadata.treeCount} trees rendered`, detail: 'Calculating sweep path...' }
    ]);

    // Generate route
    let route = createSweepPath(plantation);
    
    // Sample terrain (async)
    if (viewer) {
      route = await sampleTerrainPath(viewer, route);
    }
    
    simState.setRoute(route);
    simState.setPhase('running');

    appendReasoning(reasoningLog, [
      { label: 'Flight', message: `${route.waypoints.length} waypoints`, detail: `Est. duration: ${Math.round(route.estimatedDuration)}s` },
      { label: 'Start', message: 'Autonomous sweep initiated', detail: 'Drone following terrain-aware path' }
    ]);

    // Start animation
    animateDrone(route, () => {
      appendReasoning(reasoningLog, [
        { label: 'Complete', message: 'Plantation scan finished', detail: `Coverage: ${simState.getState().coverage}%` }
      ]);
    });
  });

  stopBtn.addEventListener('click', () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    simState.setPhase('paused');
    appendReasoning(reasoningLog, [
      { label: 'Pause', message: 'Simulation paused', detail: 'Press Start to resume' }
    ]);
  });

  resetBtn.addEventListener('click', () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    simState.reset();
    if (selectionController) {
      selectionController.clear();
    }
    sceneController.rebuild(null); // Clear scene
    appendReasoning(reasoningLog, gemmaClient.getBootSequence());
  });
}

