# Gemma 4 Autonomous Drone Simulation

Phase 1 scaffold for a browser-based palm plantation simulation that combines:

- **ArcGIS** for map-driven area selection
- **Three.js** for a live 3D drone preview
- **Gemma 4 integration hooks** for future autonomous reasoning

The current implementation establishes the development environment, project structure, and an initial UI shell with map, scene, and reasoning panels.

## Current status

Phase 1 is implemented as a setup milestone:

- Vite-based development workflow
- Initial dashboard layout and controls
- Guarded ArcGIS initialization behind `VITE_ARCGIS_API_KEY`
- Three.js placeholder drone scene to verify WebGL rendering
- Gemma endpoint configuration boundary for later AI integration phases

## Project structure

```text
.
├── assets/                  Static design assets used by the UI shell
├── docs/                    Reserved for supporting documentation artifacts
├── public/                  Static public assets served by Vite
├── src/
│   ├── app/                 UI shell composition
│   ├── config/              Environment and runtime config
│   ├── map/                 ArcGIS setup and placeholder behavior
│   ├── services/            Future AI/service integration boundaries
│   ├── styles/              Global application styles
│   └── three/               Three.js scene setup
└── .planning/               GSD planning, roadmap, and execution artifacts
```

## Requirements

- Node.js 18+
- npm
- Optional ArcGIS API key for a live basemap
- Optional Gemma API URL/key for later phases

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you have:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_ARCGIS_API_KEY` | No | Enables the live ArcGIS map view |
| `VITE_GEMMA_API_URL` | No | Reserved endpoint for future Gemma integration |
| `VITE_GEMMA_API_KEY` | No | Reserved auth key for future Gemma integration |

If `VITE_ARCGIS_API_KEY` is missing, the app shows a stable placeholder panel instead of failing.

## Getting started

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Available scripts

- `npm run dev` — start the local development server with hot reload
- `npm run build` — create a production build
- `npm run preview` — preview the production build locally

## What Phase 1 delivers

1. Development environment and scripts
2. Core folder structure
3. Initial HTML/CSS/JS scaffolding
4. UI wireframe with map, 3D, and AI reasoning placeholders
5. Safe setup path for future ArcGIS and Gemma integration

## Next implementation targets

- Phase 2: area selection and plantation generation
- Phase 3: Gemma-powered drone reasoning
- Phase 4: real-time visualization overlays
- Phase 5: end-to-end integration and demo hardening

