/**
 * @typedef {import('../types/selection.js').NormalizedSelection} NormalizedSelection
 * @typedef {import('../types/plantation.js').PlantationData} PlantationData
 * @typedef {import('../types/route.js').Route} Route
 */

/**
 * @typedef {'idle'|'selecting'|'selected'|'generating'|'ready'|'running'|'paused'|'complete'} SimulationPhase
 */

/**
 * @typedef {Object} SimulationState
 * @property {SimulationPhase} phase
 * @property {NormalizedSelection | null} selection
 * @property {PlantationData | null} plantation
 * @property {Route | null} route
 * @property {number} coverage - 0-100 percentage
 * @property {number} currentWaypointIndex
 * @property {string | null} error
 */

/**
 * Creates a shared simulation state manager with subscription support.
 * 
 * @returns {{
 *   getState: () => SimulationState,
 *   setPhase: (phase: SimulationPhase) => void,
 *   setSelection: (selection: NormalizedSelection | null) => void,
 *   setPlantation: (plantation: PlantationData | null) => void,
 *   setRoute: (route: Route | null) => void,
 *   setCoverage: (coverage: number) => void,
 *   setCurrentWaypoint: (index: number) => void,
 *   setError: (error: string | null) => void,
 *   subscribe: (callback: (state: SimulationState) => void) => () => void,
 *   reset: () => void
 * }}
 */
export function createSimulationState() {
  /** @type {SimulationState} */
  let state = {
    phase: 'idle',
    selection: null,
    plantation: null,
    route: null,
    coverage: 0,
    currentWaypointIndex: 0,
    error: null,
    aiDecisions: [],
    reasoningLog: [],
    anomalies: [],
    aiStatus: 'idle'
  };

  /** @type {Set<(state: SimulationState) => void>} */
  const listeners = new Set();

  function notify() {
    const snapshot = { ...state };
    listeners.forEach(callback => callback(snapshot));
  }

  function getState() {
    return { ...state };
  }

  function setPhase(phase) {
    state.phase = phase;
    notify();
  }

  function setSelection(selection) {
    state.selection = selection;
    if (selection) {
      state.phase = 'selected';
    }
    notify();
  }

  function setPlantation(plantation) {
    state.plantation = plantation;
    notify();
  }

  function setRoute(route) {
    state.route = route;
    notify();
  }

  function setCoverage(coverage) {
    state.coverage = Math.min(100, Math.max(0, coverage));
    notify();
  }

  function setCurrentWaypoint(index) {
    state.currentWaypointIndex = index;
    // Calculate coverage based on waypoint progress
    if (state.route && state.route.waypoints.length > 0) {
      const progress = (index / state.route.waypoints.length) * 100;
      state.coverage = Math.round(progress);
    }
    notify();
  }

  function setError(error) {
    state.error = error;
    notify();
  }

  function subscribe(callback) {
    listeners.add(callback);
    // Immediately call with current state
    callback({ ...state });
    // Return unsubscribe function
    return () => listeners.delete(callback);
  }

  function reset() {
    state = {
      phase: 'idle',
      selection: null,
      plantation: null,
      route: null,
      coverage: 0,
      currentWaypointIndex: 0,
      error: null,
      aiDecisions: [],
      reasoningLog: [],
      anomalies: [],
      aiStatus: 'idle'
    };
    notify();
  }

  function addAiDecision(waypointIndex, decision) {
    state.aiDecisions = [...state.aiDecisions, { waypointIndex, decision, timestamp: Date.now() }];
    notify();
  }

  function addReasoningEntry(entry) {
    state.reasoningLog = [...state.reasoningLog, entry];
    notify();
  }

  function addAnomaly(anomaly) {
    state.anomalies = [...state.anomalies, { ...anomaly, timestamp: Date.now() }];
    notify();
  }

  function setAiStatus(status) {
    state.aiStatus = status;
    notify();
  }

  return {
    getState,
    setPhase,
    setSelection,
    setPlantation,
    setRoute,
    setCoverage,
    setCurrentWaypoint,
    setError,
    subscribe,
    reset,
    addAiDecision,
    addReasoningEntry,
    addAnomaly,
    setAiStatus
  };
}
