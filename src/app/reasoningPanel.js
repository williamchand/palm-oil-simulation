/**
 * Reasoning Panel — collapsible AI reasoning display component.
 *
 * Renders structured AI entries (perception → decision → rationale) from simState.
 * Subscribes to simState.reasoningLog for live updates.
 * Panel is collapsible via toggle button (D-19).
 * Uses textContent for AI reasoning text to prevent XSS (T-03-08).
 *
 * @module reasoningPanel
 */

/**
 * @typedef {import('../types/ai.js').ReasoningEntry} ReasoningEntry
 */

/** Status badge configuration keyed by aiStatus value */
const STATUS_MAP = {
  idle:      { text: 'AI Idle',      cls: 'badge--muted' },
  active:    { text: 'AI Active',    cls: 'badge--accent' },
  inferring: { text: 'Inferring...', cls: 'badge--accent' },
  mock:      { text: 'Mock Mode',    cls: 'badge--muted' },
  degraded:  { text: 'Degraded',     cls: 'badge--warning' },
  off:       { text: 'AI Off',       cls: 'badge--muted' }
};

/**
 * Format a ReasoningEntry into a structured object for display.
 * Pure function — no DOM dependencies, safe for Node testing.
 *
 * @param {ReasoningEntry} entry
 * @returns {{ waypointLabel: string, source: string, latency: string, perception: string, decision: string, rationale: string, isBoot: boolean }}
 */
export function formatReasoningEntry(entry) {
  const isBoot = entry.waypointIndex === -1;

  if (isBoot) {
    return {
      waypointLabel: 'BOOT',
      source: entry.source || 'system',
      latency: '',
      perception: '',
      decision: `System initialized in ${entry.source || 'unknown'} mode`,
      rationale: '',
      isBoot: true
    };
  }

  // Perception line
  let perception = '';
  if (entry.perception) {
    const p = entry.perception;
    const treeCount = p.nearbyTrees ? p.nearbyTrees.length : 0;
    const pctComplete = p.coverageStats ? p.coverageStats.percentComplete : 0;
    const altitude = p.terrain ? p.terrain.currentAltitude : 0;
    perception = `${treeCount} trees nearby, ${pctComplete}% complete, alt ${altitude}m`;
  }

  // Decision line
  let decision = 'No decision (sweep-only)';
  if (entry.decision) {
    const d = entry.decision;
    const confidencePct = Math.round((d.confidence || 0) * 100);
    decision = `${d.type} (${confidencePct}% confidence)`;
  }

  // Rationale line
  const rationale = entry.decision && entry.decision.reasoning
    ? entry.decision.reasoning
    : '';

  return {
    waypointLabel: `WP #${entry.waypointIndex}`,
    source: entry.source || 'unknown',
    latency: entry.latencyMs != null ? `${entry.latencyMs}ms` : '',
    perception,
    decision,
    rationale,
    isBoot: false
  };
}

/**
 * Creates a reasoning panel controller that renders structured AI output.
 * Subscribes to simState for live updates. Panel is collapsible per D-19.
 *
 * @param {HTMLElement} panelElement - The aside.panel--reasoning element
 * @param {object} simState - Simulation state manager
 * @returns {{ destroy: () => void }}
 */
export function createReasoningPanel(panelElement, simState) {
  const headerEl = panelElement.querySelector('.panel__header');
  const logEl = panelElement.querySelector('#reasoning-log');
  const badgeEl = panelElement.querySelector('.badge');

  // --- Collapsible toggle (D-19) ---
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'reasoning-toggle';
  toggleBtn.setAttribute('aria-expanded', 'true');
  toggleBtn.setAttribute('aria-controls', 'reasoning-log');
  toggleBtn.textContent = '\u25BC'; // ▼
  headerEl.appendChild(toggleBtn);

  function handleToggle() {
    const isCollapsed = panelElement.classList.toggle('panel--collapsed');
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    toggleBtn.textContent = isCollapsed ? '\u25B6' : '\u25BC'; // ▶ or ▼
  }
  toggleBtn.addEventListener('click', handleToggle);

  // --- Tracking ---
  let lastRenderedCount = 0;
  let lastAiStatus = '';

  /**
   * Render a single ReasoningEntry to a DOM <li> element.
   * Uses textContent (not innerHTML) for AI-generated text to prevent XSS (T-03-08).
   *
   * @param {ReasoningEntry} entry
   * @returns {HTMLLIElement}
   */
  function renderEntry(entry) {
    const formatted = formatReasoningEntry(entry);
    const li = document.createElement('li');
    li.className = 'reasoning-entry';

    // Header row: waypoint, source badge, latency
    const header = document.createElement('div');
    header.className = 'reasoning-entry__header';

    const wpSpan = document.createElement('span');
    wpSpan.className = 'reasoning-entry__waypoint';
    wpSpan.textContent = formatted.waypointLabel;
    header.appendChild(wpSpan);

    const srcSpan = document.createElement('span');
    srcSpan.className = `reasoning-entry__source reasoning-entry__source--${formatted.source}`;
    srcSpan.textContent = formatted.source;
    header.appendChild(srcSpan);

    if (formatted.latency) {
      const latSpan = document.createElement('span');
      latSpan.className = 'reasoning-entry__latency';
      latSpan.textContent = formatted.latency;
      header.appendChild(latSpan);
    }

    li.appendChild(header);

    // Boot message — simplified display
    if (formatted.isBoot) {
      const bootDiv = document.createElement('div');
      bootDiv.className = 'reasoning-entry__decision';
      const strong = document.createElement('strong');
      strong.textContent = 'Status: ';
      bootDiv.appendChild(strong);
      bootDiv.appendChild(document.createTextNode(formatted.decision));
      li.appendChild(bootDiv);
      return li;
    }

    // Perception
    if (formatted.perception) {
      const percDiv = document.createElement('div');
      percDiv.className = 'reasoning-entry__perception';
      const pStrong = document.createElement('strong');
      pStrong.textContent = 'Perception: ';
      percDiv.appendChild(pStrong);
      percDiv.appendChild(document.createTextNode(formatted.perception));
      li.appendChild(percDiv);
    }

    // Decision
    const decDiv = document.createElement('div');
    decDiv.className = 'reasoning-entry__decision';
    const dStrong = document.createElement('strong');
    dStrong.textContent = 'Decision: ';
    decDiv.appendChild(dStrong);
    decDiv.appendChild(document.createTextNode(formatted.decision));
    li.appendChild(decDiv);

    // Rationale
    if (formatted.rationale) {
      const ratDiv = document.createElement('div');
      ratDiv.className = 'reasoning-entry__rationale';
      const rStrong = document.createElement('strong');
      rStrong.textContent = 'Rationale: ';
      ratDiv.appendChild(rStrong);
      ratDiv.appendChild(document.createTextNode(formatted.rationale));
      li.appendChild(ratDiv);
    }

    return li;
  }

  /**
   * Update badge display based on aiStatus value.
   * @param {string} status
   */
  function updateBadge(status) {
    if (!badgeEl || status === lastAiStatus) return;
    lastAiStatus = status;
    const cfg = STATUS_MAP[status] || STATUS_MAP.idle;
    badgeEl.textContent = cfg.text;
    // Remove all badge variant classes, then apply correct one
    badgeEl.className = `badge ${cfg.cls}`;
  }

  // --- State subscription ---
  const unsubscribe = simState.subscribe((state) => {
    // Update badge
    updateBadge(state.aiStatus);

    // Render new reasoning entries (append only)
    const entries = state.reasoningLog || [];
    if (entries.length > lastRenderedCount) {
      const newEntries = entries.slice(lastRenderedCount);
      for (const entry of newEntries) {
        logEl.appendChild(renderEntry(entry));
      }
      lastRenderedCount = entries.length;

      // Auto-scroll to bottom
      logEl.scrollTop = logEl.scrollHeight;

      // Auto-expand if collapsed when first AI entry arrives
      if (panelElement.classList.contains('panel--collapsed')) {
        panelElement.classList.remove('panel--collapsed');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.textContent = '\u25BC'; // ▼
      }
    }
  });

  /**
   * Clear rendered entries and reset counter (for reset flows).
   */
  function clear() {
    logEl.replaceChildren();
    lastRenderedCount = 0;
  }

  // Expose clear on the panel element for shell access
  panelElement._reasoningPanel = { clear };

  return {
    destroy() {
      unsubscribe();
      toggleBtn.removeEventListener('click', handleToggle);
    }
  };
}
