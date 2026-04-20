# Architecture

**Analysis Date:** 2026-04-20

## Pattern Overview

**Overall:** Layered event-driven architecture with clear separation between UI, simulation engine, and AI decision-making.

The system follows a **three-tier layered pattern** with decoupled components communicating through events and message passing:

1. **UI/Visualization Tier** - User interaction and real-time visualization
2. **Simulation/World Tier** - World state, physics, and spatial queries
3. **AI/Decision Tier** - Autonomous decision-making and reasoning

**Key Characteristics:**
- Component-based architecture with event-driven communication
- Strict separation of concerns (rendering, simulation, AI decision-making)
- Client-side processing with performance degradation strategy
- Real-time update loop synchronization across all layers
- Deterministic procedural world generation for reproducibility

## Layers

**User Interface & Visualization Layer:**
- Purpose: Display real-time state and interact with the system
- Location: Will be in `src/ui/` and `src/visualization/`
- Contains: ArcGIS map interface, Three.js 3D viewer, insights panel, controls
- Depends on: Simulation state, visualization updates, event dispatcher
- Used by: Users, judges (demo audience)
- Update frequency: ≤500ms latency requirement

**Simulation & World State Layer:**
- Purpose: Maintain world state, manage entities, handle spatial queries
- Location: Will be in `src/world/` and `src/simulation/`
- Contains: Plantation generator, tree entities, drone position/state, perception system
- Depends on: Procedural generation algorithms, spatial indexing
- Used by: AI decision system, visualization layer
- State management: Mutable world state updated by AI commands and procedural generation

**AI Decision & Reasoning Layer:**
- Purpose: Process environment data and generate autonomous decisions via Gemma 4
- Location: Will be in `src/ai/`
- Contains: AI decision loop, prompt construction, command execution, reasoning capture
- Depends on: World state queries, Gemma 4 model, performance monitoring
- Used by: Simulation orchestrator
- Processing: Async decision cycles with fallback strategies for performance constraints

**Infrastructure & Coordination Layer:**
- Purpose: Orchestrate communication between layers, manage the simulation loop
- Location: Will be in `src/core/` or `src/services/`
- Contains: Event dispatcher, simulation tick manager, performance monitor, command queue
- Depends on: All other layers
- Used by: All layers
- Responsibilities: Timing synchronization, inter-layer messaging, performance adaptation

## Data Flow

**Simulation Lifecycle:**

1. **Initialization Phase:**
   - User selects area on ArcGIS map (coordinates captured)
   - Simulation engine validates area size
   - Procedural generator creates plantation with deterministic seed (coordinates-based)
   - Drone initialized at starting position in Three.js environment
   - Visualization layer loads world view with initial state

2. **Main Simulation Loop** (continuous, ≤500ms per cycle):
   - Drone perceives nearby trees (spatial query from world)
   - AI decision system formats perception data into prompt
   - Gemma 4 generates reasoning and movement command
   - Command executed (drone moves, updates position/state)
   - World state updated with new scan points, tree analysis
   - Visualization updates in real-time:
     - Drone path polyline on map
     - Heatmap reflects analyzed tree ripeness/health
     - Scan points marked
     - Coverage area highlighted
     - AI reasoning displayed in insights panel
   - Performance monitor evaluates response time, adjusts AI complexity if needed
   - Loop continues until coverage criteria met

3. **Termination:**
   - All plantation adequately scanned (coverage threshold reached)
   - Simulation stops, final results visualized

**State Management:**

- **Authoritative State:** World state (tree positions, ripeness, health, drone position) maintained by simulation engine
- **Visualization State:** Derived from world state, updated on each simulation tick
- **AI State:** Current decision context, previous reasoning, perception data (ephemeral, used per decision cycle)
- **Performance State:** Computational load metrics used to determine AI simplification

## Key Abstractions

**World/Plantation:**
- Purpose: Represents the synthetic environment, contains all tree entities with attributes
- Examples: `src/world/World.ts`, `src/world/Tree.ts`, `src/world/Plantation.ts`
- Pattern: Spatial partitioning for efficient proximity queries (quadtree or grid-based indexing expected)
- Attributes: position (lat/lon), ripeness (0-100), health (healthy/diseased), scanned state

**Drone Agent:**
- Purpose: Represents the autonomous agent with position, perception capability, movement
- Examples: `src/entities/Drone.ts`, `src/ai/DronePerception.ts`
- Pattern: State machine (initializing → active → idle) with perception and navigation
- Capabilities: Move forward/backward, turn, scan nearby trees, read sensors

**AI Decision Engine:**
- Purpose: Interface to Gemma 4 model for autonomous decision-making
- Examples: `src/ai/GemmaDecisionEngine.ts`, `src/ai/PromptConstructor.ts`
- Pattern: Async request-response with fallback strategies
- Input: Environmental perception (nearby trees, current position, coverage state)
- Output: Movement command (direction, distance) with reasoning explanation

**Command Queue & Executor:**
- Purpose: Serialize AI decisions into executable simulation commands
- Examples: `src/core/CommandQueue.ts`, `src/simulation/CommandExecutor.ts`
- Pattern: Queue-based execution with validation before world state mutation
- Commands: move_forward, turn_left, turn_right, scan_trees, idle

**Visualization Manager:**
- Purpose: Coordinate all visual updates across ArcGIS and Three.js
- Examples: `src/visualization/VisualizationManager.ts`, `src/ui/MapController.ts`, `src/ui/ThreeDViewer.ts`
- Pattern: Observer/subscriber pattern for state changes
- Updates: Drone path, heatmap, scan points, coverage area, AI insights

## Entry Points

**Application Bootstrap:**
- Location: `src/index.ts` or `src/main.ts` (entry point)
- Triggers: Page load in browser
- Responsibilities: Initialize all major systems (map, 3D viewer, simulation engine), wire event handlers

**Map Area Selection:**
- Location: `src/ui/MapInterface.ts` (ArcGIS interface handler)
- Triggers: User draws bounding box on map
- Responsibilities: Capture coordinates, validate area, emit `area_selected` event

**Simulation Start:**
- Location: `src/core/SimulationOrchestrator.ts`
- Triggers: User clicks "Start Simulation" button (or area validated)
- Responsibilities: Generate world, initialize drone, begin simulation loop

**Simulation Loop:**
- Location: `src/core/SimulationLoop.ts` (likely using `requestAnimationFrame` or `setInterval`)
- Triggers: Continuous callback (~60fps or controlled by performance monitor)
- Responsibilities: Coordinate AI decision, world update, visualization refresh each tick

## Error Handling

**Strategy:** Layered error recovery with graceful degradation

**Patterns:**

- **AI Decision Failures:** If Gemma 4 call fails or times out, use fallback behavior (patrol random nearby area, continue scanning)
- **Performance Degradation:** Monitor response time; if exceeding 500ms budget, reduce AI complexity (shorter perception range, simplified prompt)
- **World Generation Errors:** Validate area size before generation; fail-safe defaults for tree distribution if noise generation fails
- **Rendering Errors:** Three.js canvas fallback to 2D map-only view if WebGL unavailable
- **Communication Errors:** Retry logic for Gemma 4 API calls; implement queuing for missed updates

## Cross-Cutting Concerns

**Logging:** 
- Framework: Console/structured logging to browser console and in-memory buffer
- Strategy: Log all major state transitions, AI decisions, and performance metrics
- Implementation: Centralized logger in `src/core/Logger.ts`, used across all layers

**Validation:**
- Area size constraints validated before simulation start
- Command validation before execution (drone can only move within world bounds)
- Perception data validation (no negative ripeness values, etc.)

**Authentication:**
- Not required for demo; all interactions local to browser
- Future: Would add authentication for production (if connecting to backend services)

---

## Current Project State

**Status:** Pre-implementation (planning phase)

This document describes the **intended architecture** based on requirements. No source code has been written yet. Implementation will begin with Phase 1 (Project Setup) and proceed through:

1. Phase 1: Project Setup (4 hours) - Directory structure, dependencies, basic scaffolding
2. Phase 2: Core Infrastructure (12 hours) - Map, world generation, drone model
3. Phase 3: AI Integration (16 hours) - Gemma 4 integration, decision engine
4. Phase 4: Visualization (10 hours) - Real-time updates, heatmaps, insights
5. Phase 5: Integration & Testing (6 hours) - System integration, optimization

All file paths referenced above are **planned locations** for the implementation phase.

*Architecture analysis: 2026-04-20*
