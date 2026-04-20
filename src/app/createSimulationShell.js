import plantationGridUrl from '../../assets/plantation-grid.svg?url';
import { getEnvironmentConfig } from '../config/environment.js';
import { createGemmaClient } from '../services/gemmaClient.js';
import { createMapPanel } from '../map/createMapPanel.js';
import { createDroneScene } from '../three/createDroneScene.js';

function buildShellMarkup(config) {
  const arcgisState = config.arcgisApiKey ? 'Configured' : 'Pending API key';
  const gemmaState = config.gemmaApiUrl ? 'Configured' : 'Placeholder mode';

  return `
    <div class="shell">
      <header class="shell__header">
        <div>
          <p class="eyebrow">Phase 1 Project Setup</p>
          <h1>Gemma 4 Autonomous Drone Simulation</h1>
          <p class="shell__subtitle">
            Initial map, 3D, and AI reasoning scaffold for rapid hackathon iteration.
          </p>
        </div>
        <div class="shell__controls" role="group" aria-label="Simulation controls">
          <button type="button" data-action="start">Start Simulation</button>
          <button type="button" class="button--secondary" data-action="stop">Stop</button>
          <button type="button" class="button--ghost" data-action="reset">Reset</button>
        </div>
      </header>

      <section class="status-grid" aria-label="System status">
        <article class="status-card">
          <span>Status</span>
          <strong id="simulation-status">Idle</strong>
          <small>Ready for environment setup and UI iteration.</small>
        </article>
        <article class="status-card">
          <span>ArcGIS</span>
          <strong>${arcgisState}</strong>
          <small>${config.arcgisApiKey ? 'Map view can initialize.' : 'Set VITE_ARCGIS_API_KEY to enable live mapping.'}</small>
        </article>
        <article class="status-card">
          <span>Gemma</span>
          <strong>${gemmaState}</strong>
          <small>${config.gemmaApiUrl ? 'AI endpoint detected for later phases.' : 'Boot messages will use local placeholder reasoning.'}</small>
        </article>
        <article class="status-card">
          <span>Target Latency</span>
          <strong>&le; 500ms</strong>
          <small>Phase 1 prepares the shell and instrumentation hooks.</small>
        </article>
      </section>

      <main class="workspace">
        <section class="panel panel--map" aria-labelledby="map-panel-title">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Geospatial Workspace</p>
              <h2 id="map-panel-title">Map and plantation selection</h2>
            </div>
            <span class="badge">${arcgisState}</span>
          </div>
          <div id="map-panel" class="panel__surface panel__surface--map" role="img" aria-label="Map workspace"></div>
          <div class="panel__footer">
            <img src="${plantationGridUrl}" alt="" aria-hidden="true" />
            <div>
              <strong>Phase 2 hook</strong>
              <p>Area selection and procedural plantation generation will attach here.</p>
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
              <strong id="scene-state">Rotor warmup</strong>
              <p>Simple scene verifies WebGL rendering in development.</p>
            </div>
            <dl>
              <div>
                <dt>Altitude</dt>
                <dd>12m</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd>0%</dd>
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

function wireControls(root, logNode, gemmaClient) {
  const status = root.querySelector('#simulation-status');
  const sceneState = root.querySelector('#scene-state');

  const states = {
    start: {
      status: 'Running',
      sceneState: 'Autonomous scan engaged',
      log: gemmaClient.getStartSequence()
    },
    stop: {
      status: 'Paused',
      sceneState: 'Hover hold',
      log: gemmaClient.getPauseSequence()
    },
    reset: {
      status: 'Idle',
      sceneState: 'Rotor warmup',
      log: gemmaClient.getBootSequence()
    }
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

