const bootSequence = [
  {
    label: 'Boot',
    message: 'Loading simulation shell and validating environment variables.',
    detail: 'Phase 1 uses placeholder reasoning while the Gemma endpoint is not yet wired.'
  },
  {
    label: 'Map',
    message: 'Awaiting ArcGIS credentials before enabling live area selection.',
    detail: 'The map panel remains stable even when external services are unavailable.'
  },
  {
    label: 'Scene',
    message: 'Initializing WebGL scene for drone preview and camera framing.',
    detail: 'Three.js placeholder verifies rendering and future animation hooks.'
  }
];

export function createGemmaClient(config) {
  const hasEndpoint = Boolean(config.gemmaApiUrl);

  return {
    getBootSequence() {
      if (hasEndpoint) {
        return [
          ...bootSequence,
          {
            label: 'AI',
            message: 'Gemma endpoint detected and reserved for later phase integration.',
            detail: 'Phase 1 only stores the configuration boundary.'
          }
        ];
      }

      return bootSequence;
    },
    getStartSequence() {
      return [
        {
          label: 'Scan',
          message: 'Simulation started with placeholder exploration route.',
          detail: 'Future phases will replace this with Gemma-powered navigation.'
        },
        {
          label: 'Safety',
          message: 'Maintaining phase-safe mode while integrations are incomplete.',
          detail: 'UI remains responsive without requiring external services.'
        },
        {
          label: 'Telemetry',
          message: 'Ready to stream future crop analysis and pathfinding events.',
          detail: 'Reasoning panel layout is already sized for live updates.'
        }
      ];
    },
    getPauseSequence() {
      return [
        {
          label: 'Hold',
          message: 'Simulation paused and awaiting the next command.',
          detail: 'This placeholder flow mirrors the eventual operator controls.'
        }
      ];
    }
  };
}

