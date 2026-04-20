# ROADMAP: Gemma 4 Autonomous Drone Simulation

## Project Timeline: 48 Hours

### Phase 1: Project Setup (Hours 1-4)
**Duration:** 4 hours
**Objective:** Establish development environment and basic project structure

**Tasks:**
- Set up project repository and directory structure
- Install and configure required dependencies (ArcGIS API, Three.js, Gemma 4 integration)
- Create basic HTML/CSS/JS scaffolding
- Set up development environment for rapid iteration
- Create basic wireframes for UI components

**Deliverables:**
- Working development environment
- Basic project structure established
- Initial UI mockup with map placeholder

**Success Criteria:**
- Dev environment functional and accessible
- Dependencies properly installed
- Basic UI renders without errors

---

### Phase 2: Core Infrastructure (Hours 5-16)
**Duration:** 12 hours
**Objective:** Build the foundational components of the system
**Goal:** CesiumJS-based area selection, deterministic plantation generation, 3D scene rebuild, and automated terrain-aware drone sweep

**Requirements:** AREA_SELECTION, PROC_GEN, DRONE_SIM, DETERMINISTIC, TERRAIN, INTER_COMPONENT

**Plans:** 6 plans

Plans:
- [x] 02-01-PLAN.md — Wave 0: Test infrastructure and type contracts
- [x] 02-02-PLAN.md — CesiumJS integration and rectangle selection (D-01, D-02)
- [x] 02-03-PLAN.md — Deterministic plantation generation (D-04, D-05, D-06)
- [x] 02-04-PLAN.md — 3D scene rebuild from confirmed selection (D-07, D-08)
- [x] 02-05-PLAN.md — Sweep path and terrain-aware altitude (D-09, D-11)
- [x] 02-06-PLAN.md — Full integration and human verification (D-03, D-10)

**Tasks:**
- Replace ArcGIS with CesiumJS map interface with draggable rectangle selection
- Develop deterministic procedural plantation generation with seeded random
- Implement 3D scene rebuild from confirmed selection with instanced tree meshes
- Create sweep path generator and terrain sampling service
- Wire all components through shared simulation state

**Deliverables:**
- Functional CesiumJS map with rectangle area selection
- Deterministic procedural plantation generator
- 3D scene controller with rebuild capability
- Terrain-aware automated sweep path
- Integrated simulation flow with graceful degradation

**Success Criteria:**
- User can draw and confirm rectangle selection on CesiumJS map
- Same selection always generates identical plantation (deterministic)
- 3D scene rebuilds from full-area plantation data after confirmation
- Drone follows predictable sweep pattern with terrain-aware altitude
- Missing credentials show graceful fallback (no crash)

---

### Phase 3: AI Integration (Hours 17-32)
**Duration:** 16 hours
**Objective:** Integrate Gemma 4 AI for autonomous drone decision-making
**Goal:** AI-powered autonomous drone decisions at each scan waypoint with structured reasoning display

**Requirements:** AI_PERCEPTION, AI_DECISION, AI_ADAPTIVE, AI_DISPLAY

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — AI types, perception builder, prompt engineering, Gemma API client with mock fallback
- [x] 03-02-PLAN.md — Decision engine, simulation state AI extension, async per-waypoint AI loop
- [x] 03-03-PLAN.md — Reasoning panel UI, shell integration, human verification

**Tasks:**
- Integrate Gemma 4 model for AI processing
- Develop AI perception system for drone environment
- Create AI decision-making algorithm for drone navigation
- Implement adaptive AI behavior based on environmental input
- Develop system for AI reasoning display

**Deliverables:**
- Gemma 4 integration for decision-making
- Environmental perception system
- Autonomous navigation algorithm
- AI reasoning display system

**Success Criteria:**
- AI can process environmental data
- Drone makes autonomous decisions based on perception
- AI reasoning is captured and available for display
- Adaptive behavior implemented (changes based on inputs)

---

### Phase 4: Visualization Layer (Hours 33-42)
**Duration:** 10 hours
**Objective:** Implement real-time visualization of AI activities and results
**Goal:** Real-time fog-of-war heatmap, color-coded drone path trail, instanced scan markers, and auto-follow camera

**Requirements:** VIZ_HEATMAP, VIZ_PATH, VIZ_COVERAGE, VIZ_CAMERA, VIZ_PERF

**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Heatmap overlay, path trail, scan markers, auto-follow camera (D-21, D-22, D-23, D-24, D-25, D-26)
- [ ] 04-02-PLAN.md — Shell integration, performance verification, human verification

**Tasks:**
- Implement real-time heatmap visualization for ripeness/disease
- Create live display of drone path and scan points
- Implement coverage area highlighting with fog-of-war
- Add auto-follow camera with smooth lerp
- Optimize visualization performance

**Deliverables:**
- Real-time canvas-based heatmap with fog-of-war reveal
- Live drone path trail (BufferGeometry) with color-coded segments
- Instanced scan point markers
- Auto-follow camera with lerp tracking
- Optimized rendering (<500ms updates, 1Hz heatmap throttle)

**Success Criteria:**
- Heatmap updates in real-time based on AI analysis
- Drone path clearly visible and updated continuously
- Coverage visualization works smoothly with progressive reveal
- Auto-follow camera tracks drone for demo impact
- Visualizations maintain performance standards (<500ms updates)

---

### Phase 5: Integration & Testing (Hours 43-48)
**Duration:** 6 hours
**Objective:** Integrate all components and conduct comprehensive testing

**Tasks:**
- Full system integration of all components
- End-to-end testing of complete workflow
- Performance optimization and bottleneck resolution
- Bug fixes and stability improvements
- Demo preparation and rehearsal

**Deliverables:**
- Fully integrated system
- Comprehensive testing results
- Performance optimizations implemented
- Stable demo-ready application
- Documentation for demo presentation

**Success Criteria:**
- Complete workflow functions end-to-end
- System performs reliably under demo conditions
- Performance meets defined requirements
- Application stable with minimal bugs
- Ready for presentation to judges/audience

---

## Risk Mitigation Strategies
- **Phase 1 Extension Risk:** If Phase 1 takes longer than 4 hours, reduce time allocated to non-critical features in later phases
- **AI Integration Risk:** Have pre-built mock AI responses ready in case Gemma 4 integration faces unexpected issues
- **Performance Risk:** Implement scalable visualization options that can be reduced under performance pressure
- **Hardware Limitations:** Design system to work on standard demo hardware without requiring specialized equipment