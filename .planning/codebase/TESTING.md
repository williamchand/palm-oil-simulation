# Testing Patterns

**Analysis Date:** 2026-04-20

## Project State

This is a newly initiated project in **planning/setup phase** with no production source code or testing infrastructure deployed yet. Testing strategy and patterns will be established during **Phase 1 (Project Setup)**.

---

## Test Framework

### Current Status

**Not Yet Configured**

No test framework, runner, or assertion library currently installed or configured.

### Expected Configuration (Phase 1)

Based on modern JavaScript/TypeScript practices for the technology stack:

**Test Runner (options):**
- **Jest** - Most common for JavaScript/TypeScript projects
- **Vitest** - Faster, more modern alternative with excellent TypeScript support
- Config location: `jest.config.js` or `vitest.config.ts`

**Assertion Library:**
- Jest includes built-in assertions
- May add: Chai, Expect.js, or similar if needed

**DOM Testing (for UI components):**
- React Testing Library (if using React framework)
- Enzyme (alternative)
- DOM testing utilities from Vue/Svelte if applicable

**E2E Testing:**
- Cypress or Playwright (for full integration testing)
- Will test drone simulation, ArcGIS integration, Three.js rendering

### Run Commands (to be established)

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run end-to-end tests (if configured)
```

---

## Test File Organization

### Location Pattern (to be established)

Two possible conventions will be chosen in Phase 1:

**Option 1: Co-located Tests** (Recommended for this project)
```
src/
├── components/
│   ├── MapInterface.tsx
│   ├── MapInterface.test.tsx
│   ├── DroneVisualizer.tsx
│   └── DroneVisualizer.test.tsx
├── services/
│   ├── plantationGenerator.ts
│   ├── plantationGenerator.test.ts
│   ├── aiProcessor.ts
│   └── aiProcessor.test.ts
└── utils/
    ├── geometryHelpers.ts
    └── geometryHelpers.test.ts
```

**Option 2: Separate Test Directory**
```
src/
├── components/...
├── services/...
└── utils/...
tests/
├── components/...
├── services/...
└── utils/...
```

**Naming Convention:**
- Unit tests: `[FileName].test.ts` or `[FileName].spec.ts`
- Integration tests: `[Feature].integration.test.ts`
- E2E tests: `[Scenario].e2e.test.ts`

---

## Test Types by Component

### Unit Tests

**Scope:**
- Individual functions and utilities
- Standalone business logic (AI decision calculation, plantation generation)
- Data transformation and validation

**Expected coverage areas:**
- Procedural plantation generation (`generatePlantation()` function)
- Tree attribute assignment (ripeness, health status)
- AI decision formatting for Gemma 4
- Coordinate/geometry calculations
- Error handling for edge cases

**Pattern (Jest/Vitest syntax):**
```typescript
describe('plantationGenerator', () => {
  it('should generate deterministic plantation for same seed', () => {
    const area = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const result1 = generatePlantation(area, 'seed-123');
    const result2 = generatePlantation(area, 'seed-123');
    
    expect(result1).toEqual(result2);
  });

  it('should assign ripeness values using clustering algorithm', () => {
    const plantation = generatePlantation({ /* ... */ });
    const ripenessBySector = groupBy(plantation.trees, t => t.ripeness);
    
    expect(ripenessBySector).toHaveProperty('ripe');
    expect(ripenessBySector).toHaveProperty('under-ripe');
  });
});
```

### Integration Tests

**Scope:**
- Drone simulation + Gemma 4 AI interaction
- ArcGIS visualization + simulation data flow
- Three.js rendering + simulation state updates
- Plantation generation + drone pathfinding

**Expected coverage areas:**
- Complete simulation cycle from area selection to drone movement
- AI request/response handling with latency constraints
- Visualization updates triggered by simulation events
- State management across components

**Pattern:**
```typescript
describe('DroneSimulation Integration', () => {
  it('should complete one cycle within 500ms latency requirement', async () => {
    const start = performance.now();
    const nextState = await droneSimulationCycle(currentState);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(500);
    expect(nextState.position).not.toEqual(currentState.position);
  });

  it('should send correct data format to Gemma 4', async () => {
    const mockGemmaAPI = jest.fn().mockResolvedValue(aiResponse);
    const state = await droneSimulationCycle(
      currentState,
      { aiProcessor: mockGemmaAPI }
    );
    
    expect(mockGemmaAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        nearbyTrees: expect.any(Array),
        currentPosition: expect.any(Object),
      })
    );
  });
});
```

### E2E / User Story Tests

**Scope:**
- Complete user workflows (select area → run simulation → view results)
- Cross-browser compatibility
- Real-time visualization during simulation
- UI responsiveness under load

**Tools:** Cypress or Playwright

**Pattern:**
```typescript
describe('User Story: Run Autonomous Drone Simulation', () => {
  it('should allow user to select area and start simulation', () => {
    cy.visit('/');
    cy.get('[data-testid="map-container"]').should('be.visible');
    
    // Draw bounding box
    cy.get('[data-testid="map-container"]')
      .click(100, 100)
      .click(200, 200);
    
    // Start simulation
    cy.get('button').contains('Start Simulation').click();
    
    // Verify simulation running
    cy.get('[data-testid="drone-position"]').should('not.be.empty');
    cy.get('[data-testid="ai-insights"]').should('contain', 'analyzing');
  });
});
```

---

## Test Data & Fixtures

### Fixtures Location (to be established)

Likely location:
```
tests/
├── fixtures/
│   ├── plantationData.ts      # Sample plantation generations
│   ├── aiResponses.ts         # Sample Gemma 4 responses
│   ├── geoData.ts             # Sample geographic coordinates
│   └── droneStates.ts         # Sample drone simulation states
└── factories/
    ├── plantationFactory.ts    # Factory for test plantations
    ├── droneStateFactory.ts    # Factory for drone states
    └── aiResponseFactory.ts    # Factory for AI responses
```

### Factory Pattern Example

```typescript
// tests/factories/plantationFactory.ts
export function createTestPlantation(overrides?: Partial<Plantation>) {
  const defaults: Plantation = {
    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    trees: [
      { id: 1, x: 10, y: 10, ripeness: 'ripe', health: 'healthy' },
      { id: 2, x: 20, y: 20, ripeness: 'under-ripe', health: 'healthy' },
    ],
  };
  
  return { ...defaults, ...overrides };
}

// Usage in tests
it('should handle plantation with disease trees', () => {
  const plantation = createTestPlantation({
    trees: [
      { id: 1, x: 10, y: 10, ripeness: 'ripe', health: 'diseased' },
    ],
  });
  
  const health = analyzePlantationHealth(plantation);
  expect(health.diseasedCount).toBe(1);
});
```

---

## Mocking Strategy

### What to Mock

**External Services:**
- Gemma 4 AI API (for unit tests and isolated component tests)
- ArcGIS API (for component testing without full map initialization)
- Network requests (all calls to external APIs)

**Heavy Dependencies:**
- Three.js rendering (can mock for logic tests, but need real tests for render)
- WebGL context (for isolated unit tests)

### What NOT to Mock

**Core Logic:**
- Plantation generation algorithm (test the real implementation)
- Drone pathfinding logic
- Coordinate transformation calculations
- AI decision formatting

**Critical Integration Points:**
- Full E2E tests should use real Gemma 4 API (limited, controlled calls)
- Visualization integration tests should render actual Three.js scenes (with mocked data)

### Mocking Pattern

```typescript
// Mock Gemma 4 API for unit tests
const mockGemmaAPI = jest.fn().mockResolvedValue({
  decision: 'move_forward',
  reasoning: 'Testing move command',
  nextPosition: { x: 15, y: 10, z: 5 },
});

// Mock ArcGIS map
const mockMap = {
  add: jest.fn(),
  remove: jest.fn(),
  graphics: { add: jest.fn(), removeAll: jest.fn() },
};

// Usage
const result = await droneSimulationStep(state, {
  aiAPI: mockGemmaAPI,
  arcgisMap: mockMap,
});
```

---

## Coverage Requirements

### Current Status

**None enforced yet** - Project in planning phase

### Expected Coverage Targets (Phase 1 decisions)

**Likely Requirements:**
- **Critical business logic:** 90%+ coverage (plantation generation, AI processing)
- **Components:** 75%+ coverage (at minimum critical path)
- **Utilities:** 85%+ coverage
- **Overall target:** 75-80% for project acceptance

### Coverage Reporting

```bash
npm run test:coverage      # Generate coverage report
npm run test:coverage -- --watch  # Watch mode with coverage
```

**Coverage reports location (to be established):**
```
coverage/
├── lcov.info             # LCOV format for CI integration
├── lcov-report/index.html # HTML report
└── coverage-summary.json
```

---

## Performance & Latency Testing

### Critical Testing Area

**Per requirements.md (section 4.06):**
- System must update all visualization elements within ≤500ms of AI decisions
- Simulation must start within ≤3 seconds after area selection

### Test Pattern

```typescript
describe('Performance Requirements', () => {
  it('should process AI decision within 500ms', async () => {
    const plantation = createTestPlantation();
    const droneState = createInitialDroneState(plantation);
    
    const startTime = performance.now();
    const decision = await requestAIDecision(droneState, plantation);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(500);
  });

  it('should start simulation within 3 seconds of area selection', async () => {
    const startTime = performance.now();
    const simulationReady = await initializeSimulation(selectedArea);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(3000);
    expect(simulationReady.state).toBe('running');
  });

  it('should update visualization within 500ms of simulation state change', async () => {
    const mockVisualization = jest.fn().mockResolvedValue(true);
    
    const startTime = performance.now();
    await updateVisualization(newState, { render: mockVisualization });
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(500);
  });
});
```

---

## Verification Entry Points

### Phase 1 Acceptance Criteria Verification

**Test entry points for Phase 1 completion** (from `.planning/phases/1_PROJECT_SETUP/PLAN.md`):

```bash
# Verify project structure created
npm test -- projects/structure.test.ts

# Verify dependencies importable
npm test -- setup/dependencies.test.ts

# Verify HTML renders without errors
npm test -- ui/htmlStructure.test.ts

# Verify CSS layout positioning
npm test -- ui/cssLayout.test.ts

# Verify wireframe components visible
npm test -- ui/wireframe.test.ts

# Verify development server works
npm run dev &
# Manual: Navigate to localhost and verify hot reload

# Run complete Phase 1 verification
npm run test:phase1
```

### Common Verification Commands

```bash
# Run specific test file
npm test -- src/services/plantationGenerator.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="plantation"

# Run with coverage
npm test -- --coverage

# Debug mode
npm test -- --detectOpenHandles

# Run single test
npm test -- src/services/plantationGenerator.test.ts -t "should generate deterministic"
```

---

## Testing Best Practices (to be Enforced)

### Async Testing Pattern

```typescript
// Good: Using async/await
it('should handle async AI processing', async () => {
  const result = await processAIDecision(state);
  expect(result.decision).toBeDefined();
});

// Good: Using done callback (if not using async)
it('should handle async AI processing', (done) => {
  processAIDecision(state).then((result) => {
    expect(result.decision).toBeDefined();
    done();
  });
});

// Bad: Not waiting for async completion
it('should handle async AI processing', () => {
  processAIDecision(state).then((result) => {
    expect(result.decision).toBeDefined(); // May not execute
  });
});
```

### Error Testing Pattern

```typescript
describe('Error Handling', () => {
  it('should handle plantation generation with invalid bounds', () => {
    expect(() => {
      generatePlantation({ minX: 100, minY: 100, maxX: 50, maxY: 50 });
    }).toThrow('Invalid bounds: min must be less than max');
  });

  it('should gracefully handle AI API failure', async () => {
    const failingAI = jest.fn().mockRejectedValue(new Error('API timeout'));
    
    const result = await droneSimulationWithFallback(state, { aiAPI: failingAI });
    
    expect(result.mode).toBe('simplified');
    expect(result.drone).toBeDefined();
  });
});
```

### Test Organization Best Practices

1. **One assertion per simple test** (or logically related assertions)
2. **Descriptive test names** - Should read like documentation
3. **Arrange-Act-Assert pattern** - Setup → Execute → Verify
4. **Use beforeEach/afterEach** for common setup/teardown
5. **Avoid test interdependencies** - Each test must be independently runnable

---

## Missing Test Infrastructure

**Current gaps (to be addressed Phase 1):**
- [ ] No test framework installed
- [ ] No test configuration files (jest.config.js, etc.)
- [ ] No example tests written
- [ ] No CI/CD test pipeline
- [ ] No performance testing harness
- [ ] No accessibility testing setup
- [ ] No visual regression testing
- [ ] No API contract testing (for Gemma 4 integration)

---

## Integration with Phase 1 Setup

### Testing Setup Tasks (anticipated Phase 1.2 or 1.3)

1. **Install testing dependencies**
   ```bash
   npm install --save-dev jest @types/jest
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   npm install --save-dev cypress
   ```

2. **Create jest.config.js**
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
     collectCoverageFrom: ['src/**/*.ts?(x)', '!src/**/*.d.ts'],
     setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
   };
   ```

3. **Create test utilities and setup files**
   - `tests/setup.ts` - Global test configuration
   - `tests/mocks/` - Reusable mocks
   - `tests/fixtures/` - Test data

4. **Create example tests** for each major component
   - Plantation generation tests
   - Drone simulation tests
   - ArcGIS integration tests
   - Three.js rendering tests

---

## Future Testing Improvements

**Post-Phase 1 considerations:**
- Visual regression testing with Percy or similar
- Load testing for real-time visualization (many trees, frequent updates)
- A/B testing framework for UI changes
- Analytics testing to verify event tracking
- Performance budgets for JavaScript bundle size
- Accessibility testing (axe-core, WAVE)
- Security testing for input validation

---

*Testing analysis: 2026-04-20*
*Status: Project in planning phase - testing framework to be established Phase 1*
