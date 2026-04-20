# Codebase Structure

**Analysis Date:** 2026-04-20

## Directory Layout

```
palm-oil-simulation/
├── src/                           # Main application source code
│   ├── index.ts                   # Application entry point
│   ├── main.html                  # Main HTML template
│   ├── core/                      # Core orchestration and infrastructure
│   │   ├── SimulationOrchestrator.ts
│   │   ├── SimulationLoop.ts
│   │   ├── EventDispatcher.ts
│   │   ├── Logger.ts
│   │   └── PerformanceMonitor.ts
│   ├── ui/                        # User interface components
│   │   ├── MapInterface.ts        # ArcGIS map controller
│   │   ├── ControlPanel.ts        # Start/stop/reset buttons
│   │   ├── InsightsPanel.ts       # AI reasoning display
│   │   ├── StatisticsPanel.ts     # Real-time metrics
│   │   └── styles/                # UI styling
│   ├── visualization/             # Visualization and rendering
│   │   ├── VisualizationManager.ts
│   │   ├── ThreeDViewer.ts        # Three.js canvas and scene
│   │   ├── MapVisualization.ts    # Heatmap, path, scan points
│   │   ├── DronePathRenderer.ts   # Polyline path visualization
│   │   ├── HeatmapRenderer.ts     # Real-time ripeness/health heatmap
│   │   └── CoverageRenderer.ts    # Coverage area highlighting
│   ├── world/                     # World state and entities
│   │   ├── World.ts               # World state manager
│   │   ├── Plantation.ts          # Plantation data structure
│   │   ├── Tree.ts                # Individual tree entity
│   │   ├── PlantationGenerator.ts # Procedural generation engine
│   │   ├── SpatialIndex.ts        # Quadtree or grid for spatial queries
│   │   └── Constants.ts           # World-related constants
│   ├── simulation/                # Simulation engine
│   │   ├── SimulationEngine.ts    # Main simulation state machine
│   │   ├── CommandExecutor.ts     # Execute AI-generated commands
│   │   ├── CommandQueue.ts        # Queue and prioritize commands
│   │   └── PhysicsEngine.ts       # Movement and collision handling
│   ├── entities/                  # Game entities
│   │   ├── Drone.ts               # Drone entity, position, state
│   │   ├── Perception.ts          # Drone perception system
│   │   └── Model.ts               # Three.js drone model
│   ├── ai/                        # AI and decision-making
│   │   ├── GemmaDecisionEngine.ts # Gemma 4 integration
│   │   ├── PromptConstructor.ts   # Build perception -> prompt
│   │   ├── ResponseParser.ts      # Parse Gemma 4 output
│   │   ├── ReasoningCapture.ts    # Capture and format reasoning
│   │   ├── FallbackBehavior.ts    # Fallback when AI fails
│   │   └── PerformanceAdaptation.ts # Simplify AI under load
│   ├── utils/                     # Shared utilities
│   │   ├── Math.ts                # Vector, distance calculations
│   │   ├── Algorithms.ts          # Pathfinding, spatial queries
│   │   ├── Config.ts              # Application configuration
│   │   └── Types.ts               # TypeScript interfaces/types
│   └── assets/                    # Static assets
│       ├── models/                # 3D models (drone, trees)
│       ├── textures/              # Textures for 3D rendering
│       └── icons/                 # UI icons

├── public/                        # Static files served to browser
│   ├── index.html                 # Main HTML file
│   └── favicon.ico
├── dist/                          # Build output (generated)
├── .planning/                     # Project planning documents
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   ├── codebase/                  # Codebase analysis documents
│   │   ├── ARCHITECTURE.md
│   │   └── STRUCTURE.md
│   └── phases/
│       └── 1_PROJECT_SETUP/
├── tasks/                         # Task/PRD documents
│   └── prd-gemma4-autonomous-drone-simulation.md
├── package.json                   # Node.js dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
├── .gitignore
├── .env                           # Environment variables (not committed)
├── README.md
└── LICENSE
```

## Directory Purposes

**src/**
- Purpose: All application source code
- Contains: TypeScript/JavaScript implementation of all features
- Key files: Entry point (`index.ts`), core orchestration, UI, world, AI, visualization

**src/core/**
- Purpose: Core infrastructure and orchestration logic
- Contains: Event dispatcher, simulation loop controller, performance monitor, logger
- Key files: `SimulationOrchestrator.ts` (main coordinator), `EventDispatcher.ts` (inter-layer messaging)

**src/ui/**
- Purpose: User interface and user interaction handling
- Contains: ArcGIS map interface, control buttons, info panels
- Key files: `MapInterface.ts` (area selection), `InsightsPanel.ts` (AI reasoning display)

**src/visualization/**
- Purpose: Real-time visualization rendering across all displays
- Contains: Three.js 3D viewer, ArcGIS overlays, heatmap, path visualization
- Key files: `ThreeDViewer.ts` (3D environment), `HeatmapRenderer.ts` (ripeness visualization)

**src/world/**
- Purpose: World state management and spatial data structures
- Contains: Plantation data, tree entities, spatial indexing
- Key files: `World.ts` (state manager), `PlantationGenerator.ts` (procedural generation), `SpatialIndex.ts` (proximity queries)

**src/simulation/**
- Purpose: Simulation engine and command execution
- Contains: Command queuing, validation, execution logic
- Key files: `SimulationEngine.ts` (state machine), `CommandExecutor.ts` (apply commands to world)

**src/entities/**
- Purpose: Game entity definitions (drone, trees)
- Contains: Drone state and behavior, perception system, 3D models
- Key files: `Drone.ts` (drone state), `Perception.ts` (what drone sees)

**src/ai/**
- Purpose: AI decision-making via Gemma 4
- Contains: Gemma 4 integration, prompt construction, fallback strategies
- Key files: `GemmaDecisionEngine.ts` (main AI loop), `PromptConstructor.ts` (perception → prompt)

**src/utils/**
- Purpose: Reusable utility functions and shared types
- Contains: Math functions, algorithms, constants, TypeScript interfaces
- Key files: `Types.ts` (shared interfaces), `Config.ts` (tunable parameters)

**src/assets/**
- Purpose: Static 3D models, textures, icons
- Contains: Drone 3D model, tree models, UI icons
- Key files: Organized by type (models/, textures/, icons/)

**public/**
- Purpose: Static files served directly to the browser
- Contains: main `index.html` entry point, favicon
- Key files: `index.html` (loads webpack bundle)

**dist/** (generated)
- Purpose: Built and bundled application ready for deployment
- Contains: Minified JavaScript, HTML, assets
- Generated: By build script, not committed to git

**.planning/**
- Purpose: Project planning and architecture documentation
- Contains: Requirements, roadmap, phase plans, codebase analysis
- Key files: `.md` documents for project coordination

## Key File Locations

**Entry Points:**
- `src/index.ts`: Application initialization (imports all major systems, wires event handlers)
- `public/index.html`: HTML entry point (loads webpack bundle, provides root DOM elements)

**Configuration:**
- `package.json`: Dependencies, build scripts, project metadata
- `tsconfig.json`: TypeScript compiler configuration
- `webpack.config.js`: Build and bundling configuration
- `src/utils/Config.ts`: Runtime application configuration (simulation parameters, thresholds)

**Core Logic:**
- `src/core/SimulationOrchestrator.ts`: Main coordinator (orchestrates phases: setup → generation → simulation loop → cleanup)
- `src/world/PlantationGenerator.ts`: Procedural world generation (trees with ripeness/health)
- `src/ai/GemmaDecisionEngine.ts`: Gemma 4 integration and decision loop
- `src/visualization/VisualizationManager.ts`: Coordinates all visual updates

**Testing:**
- Will be co-located: `src/**/*.test.ts` (Jest or Vitest)
- Test utilities: `src/testing/` or `tests/` directory (fixtures, mocks)

## Naming Conventions

**Files:**
- Controllers/Managers: `ComponentController.ts`, `ComponentManager.ts` (e.g., `MapInterface.ts`, `VisualizationManager.ts`)
- Engines/Processors: `ComponentEngine.ts` (e.g., `SimulationEngine.ts`, `GemmaDecisionEngine.ts`)
- Utilities: `component.ts` lowercase (e.g., `config.ts`, `math.ts`)
- Types/Interfaces: `Types.ts` or `types.ts` (exported interfaces with PascalCase names)
- Test files: `component.test.ts` or `component.spec.ts` (co-located with source)

**Directories:**
- Functional areas (lowercase): `ui/`, `world/`, `ai/`, `visualization/`, `simulation/`
- Shared: `core/`, `utils/`, `assets/`
- Infrastructure: `.planning/`, `public/`, `dist/`

**TypeScript/JavaScript:**
- Classes: PascalCase (`Drone`, `PlantationGenerator`, `GemmaDecisionEngine`)
- Functions: camelCase (`calculateDistance`, `generateTree`, `executeCommand`)
- Constants: UPPER_SNAKE_CASE (`MAX_AREA_SIZE`, `AI_TIMEOUT_MS`)
- Interfaces: PascalCase with `I` prefix or just PascalCase (`IWorld`, `DroneState`)
- Variables: camelCase (`dronePosition`, `treeList`, `isSimulationRunning`)

## Where to Add New Code

**New Feature (e.g., "Add tree disease detection"):**
- Primary code: `src/world/Tree.ts` (add disease detection logic), `src/ai/PromptConstructor.ts` (include disease in perception)
- Visualization: `src/visualization/HeatmapRenderer.ts` (render disease status)
- Tests: `src/world/Tree.test.ts`, `src/ai/PromptConstructor.test.ts`

**New Component/Module (e.g., "Add weather system"):**
- Implementation: Create `src/world/Weather.ts` (weather state) and `src/world/WeatherGenerator.ts` (generation)
- Integration: Wire into `src/core/SimulationOrchestrator.ts` (initialize during setup)
- Visualization: `src/visualization/WeatherRenderer.ts` if needs visual representation

**Utilities/Helpers:**
- Shared helpers: `src/utils/` (e.g., `src/utils/Math.ts` for distance calculations)
- Component-specific helpers: Co-locate with component (e.g., `src/world/SpatialIndex.ts` for world queries)

**UI Elements:**
- New panels/controls: `src/ui/NewPanel.ts`
- Styling: `src/ui/styles/newpanel.css` (organized by component)
- Integration: Register in `src/ui/ControlPanel.ts` or main layout

**AI/Decision Logic:**
- Fallback behaviors: `src/ai/FallbackBehavior.ts`
- New reasoning types: Extend `src/ai/PromptConstructor.ts`
- Post-processing responses: `src/ai/ResponseParser.ts`

## Special Directories

**src/assets/models/**
- Purpose: 3D models for drone and trees (likely `.gltf`, `.obj`, or `.fbx` format)
- Generated: No (hand-crafted or downloaded)
- Committed: Yes, but large files may use Git LFS

**src/assets/textures/**
- Purpose: Textures for 3D models
- Generated: No (hand-created or sourced)
- Committed: Yes, but large files may use Git LFS

**.planning/phases/**
- Purpose: Phase-specific planning documents
- Generated: Incrementally as project progresses
- Committed: Yes (project tracking)

**dist/** (Build output)
- Purpose: Compiled and bundled application
- Generated: Yes (by build script)
- Committed: No (in `.gitignore`)

**node_modules/** (Dependencies)
- Purpose: Installed npm packages
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

## Build and Development Workflow

**Development:**
```bash
npm install          # Install dependencies (runs once)
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript, bundle with webpack
```

**Testing:**
```bash
npm test             # Run all tests (Jest/Vitest)
npm run test:watch   # Watch mode for development
npm run coverage     # Generate coverage reports
```

**Production Build:**
```bash
npm run build:prod   # Production optimized build
```

Expected outputs:
- TypeScript compiled to JavaScript in `dist/`
- Assets bundled and optimized
- HTML entry point copied to `dist/`
- Ready to serve from static host

---

## Current Project State

**Status:** Pre-implementation (planning phase)

This structure is **planned for the implementation phase**. Currently, the repository contains:
- `.planning/` directory with project documentation
- `README.md` and LICENSE
- `tasks/` directory with PRD

**Implementation will create the `src/` directory structure** starting with Phase 1 (Project Setup), following this layout exactly.

*Structure analysis: 2026-04-20*
