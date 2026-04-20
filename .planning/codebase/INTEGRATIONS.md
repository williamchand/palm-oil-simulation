# External Integrations

**Analysis Date:** 2026-04-20

## Current Implementation Status

**Note:** This project is in planning phase with no active implementation. All integrations below are **planned** and documented in requirements (`.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `tasks/prd-gemma4-autonomous-drone-simulation.md`). None are currently implemented.

---

## APIs & External Services

### Geospatial & Mapping

**ArcGIS JavaScript API:**
- **Purpose:** Provides map interface, tile rendering, area selection capabilities, visualization of drone path and heatmaps
- **Status:** Planned for Phase 2 (Core Infrastructure)
- **Implementation File:** TBD (`src/components/map.js` or similar)
- **Client/SDK:** `@arcgis/core` npm package
- **Auth:** API key or token (stored in environment variable - specifics TBD)
- **Requirements:**
  - Support for custom drawing tools (bounding box selection)
  - Real-time polyline rendering for drone path
  - Heatmap overlay capability
  - Multiple layer support (base map + visualization layers)
  - Performance: update visualizations within 500ms

---

### AI & Model Services

**Gemma 4 Model:**
- **Purpose:** Autonomous drone decision-making, environmental perception, pathfinding algorithm, crop analysis reasoning
- **Status:** Planned for Phase 3 (AI Integration, Hours 17-32)
- **Integration Approach:** TBD (documented in `.planning/phases/1_PROJECT_SETUP/RESEARCH.md`)
  - Option 1: Local model deployment (edge AI)
  - Option 2: Cloud API endpoint
  - Option 3: Hybrid approach
- **Auth:** API key or model access token (TBD)
- **Requirements:**
  - Real-time inference capability
  - Response time: ≤500ms for decision-making
  - Perception input: tree status data (ripeness, health), drone location
  - Output: Movement commands, reasoning text
  - Fallback mode: Reduced complexity when computational limits detected
- **Performance Constraints:**
  - System must auto-scale AI complexity to maintain real-time performance
  - May run in reduced mode on limited hardware
  - Adaptive inference optimization required

---

## Data Storage

### Local Storage

**Browser Local Storage / Session Storage:**
- **Purpose:** Cache simulation state, user selections, session history
- **Implementation:** JavaScript localStorage API
- **Data:** Selected area coordinates, plantation configuration, simulation progress
- **No external database required for demo version**

### Simulation State Management

**In-Memory State:**
- **Purpose:** Runtime state for drone position, plantation tree data, scan history
- **Method:** JavaScript objects/arrays (no persistent external storage)
- **Scope:** Single simulation session only

---

## File Storage

**Status:** Local filesystem only (for development assets)

**Asset Types:**
- 3D models (drone, trees) - TBD format (glTF, OBJ, procedurally generated)
- Textures and materials
- UI icons and images
- Configuration files

**Storage Location:** `assets/` directory (to be created in Phase 1)

---

## Caching

**Status:** None externally required

**Client-Side Caching:**
- Browser cache for static assets (CSS, JS bundles)
- ArcGIS map tiles cached by browser
- WebGL shader caching (automatic)

---

## Authentication & Identity

**Status:** None required for initial demo

**Potential Future Needs:**
- ArcGIS API authentication (may require developer account)
- Gemma 4 API authentication (depends on deployment model)
- No user authentication for demo version

---

## Monitoring & Observability

### Error Tracking

**Status:** Not planned for Phase 1-5

**Fallback Approach:**
- Browser console logging for development
- User-visible error messages for critical failures
- Performance monitoring via JavaScript timing API

### Logs

**Approach:**
- Console logging during development (configurable verbosity)
- In-application event logging for demo replay (potential future feature)
- No centralized logging service planned

**What to Log:**
- AI reasoning process (for display in UI)
- Simulation milestones
- Performance metrics
- Error conditions

---

## CI/CD & Deployment

### Hosting

**Status:** TBD - Planned for Phase 5 (Integration & Testing)

**Options Under Consideration:**
- Static hosting (GitHub Pages, Netlify, Vercel) - Most likely
- Serverless functions (AWS Lambda, Vercel Functions) - If backend needed
- Simple Node.js server - If required for Gemma 4 integration

**Deployment Trigger:**
- Manual deployment from main branch
- Production build optimization for demo

### CI Pipeline

**Status:** Not implemented

**Potential Setup (if needed):**
- Basic build verification on commits
- No automated testing initially (test framework TBD)
- Build artifact generation for deployment

---

## Environment Configuration

### Required Environment Variables

**Critical (to be documented in `.env`):**
```
ARCGIS_API_KEY=<key_or_url>
GEMMA_4_API_KEY=<key_or_endpoint>
SIMULATION_MODE=<development|production>
```

**Optional:**
```
LOG_LEVEL=<debug|info|warn|error>
PERFORMANCE_DEBUG=<true|false>
```

### Secrets Location

- `.env` file in project root (NOT committed to git)
- `.env.example` file with placeholder values (for documentation)
- Environment variables passed at runtime

---

## Webhooks & Callbacks

**Status:** Not applicable for this demonstration

**No Incoming Webhooks:**
- Single-user interactive application
- No external event triggers required

**No Outgoing Webhooks:**
- No external system notifications planned
- All data remains within the application scope

---

## Real-Time Communication

**Status:** TBD

**Potential Need:**
- WebSocket connections if Gemma 4 is cloud-based with streaming responses
- Server-Sent Events (SSE) if used for live updates
- Standard HTTP for simple request-response pattern

**Current Assumption:**
- Synchronous HTTP requests with async/await
- No persistent websocket requirement unless cloud Gemma 4 demands it

---

## Data Flow

### Map Area Selection → Simulation Start
1. User draws bounding box on ArcGIS map
2. Coordinates captured and validated
3. Procedural generation triggered with coordinates as seed
4. Plantation world generated (deterministic, in-memory)

### Simulation Loop (Real-Time)
1. Drone perception system reads nearby trees (ripeness, health)
2. Environmental data formatted as prompt/input for Gemma 4
3. Gemma 4 processes and returns decision (movement, reasoning)
4. Drone executes command and updates position
5. Scan data recorded (for heatmap)
6. UI updated with new path, heatmap, reasoning (≤500ms target)
7. Loop continues until plantation fully scanned

### Visualization
1. ArcGIS map layer: Drone path polyline, scan points, coverage areas
2. Three.js viewport: 3D drone model, plantation visualization
3. Info panel: AI reasoning text, statistics

---

## Integration Complexity Assessment

**High Complexity:**
- ArcGIS + Three.js coordination (multiple coordinate systems)
- Real-time synchronization between 2D map and 3D view
- Gemma 4 inference timing and fallback handling

**Moderate Complexity:**
- Procedural world generation (noise algorithms)
- Spatial indexing for tree proximity queries

**Low Complexity:**
- UI state management
- Basic asset loading

---

## Planned vs. Implemented

| Component | Status | Implementation Phase |
|-----------|--------|----------------------|
| ArcGIS Map Interface | Planned | Phase 2 |
| Three.js 3D Viewport | Planned | Phase 2 |
| Procedural Plantation Generator | Planned | Phase 2 |
| Gemma 4 Integration | Planned | Phase 3 |
| Real-time Heatmap Visualization | Planned | Phase 4 |
| AI Reasoning Display | Planned | Phase 4 |
| Performance Monitoring | Planned | Phase 5 |
| Deployment Setup | Planned | Phase 5 |

---

## Known Integration Challenges

**From Planning Documents:**

1. **ArcGIS Complexity** - Decision needed on which ArcGIS API version and whether to use REST or JavaScript API
   - Documented in: `.planning/phases/1_PROJECT_SETUP/RESEARCH.md`

2. **Gemma 4 Access** - Unclear if Gemma 4 will be available as cloud API or requires local deployment
   - Documented in: `.planning/phases/1_PROJECT_SETUP/RESEARCH.md`

3. **Performance Optimization** - System must reduce AI complexity automatically when computational limits detected
   - Documented in: `tasks/prd-gemma4-autonomous-drone-simulation.md` (Requirement 5.01-5.04)

4. **Coordinate System Translation** - ArcGIS (lat/long) ↔ Three.js (cartesian) ↔ Procedural world (grid-based)
   - Documented in: `.planning/REQUIREMENTS.md`

5. **Real-Time Constraint** - All visual updates must occur within 500ms
   - Documented in: `tasks/prd-gemma4-autonomous-drone-simulation.md` (Success Metrics)

---

## Security Considerations

**No Security Implementation Required for Demo:**
- Single-user, local-only application
- No data persistence or external API calls requiring authentication security

**Potential Future Concerns:**
- ArcGIS API key protection (use environment variables)
- Gemma 4 API key protection (use environment variables)
- Rate limiting if cloud APIs are used

---

*Integration audit: 2026-04-20*
*Status: Project in planning phase - integrations to be implemented starting Phase 2*
