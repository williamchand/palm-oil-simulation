# Coding Conventions

**Analysis Date:** 2026-04-20

## Project State

This is a newly initiated project in **planning/setup phase** with no production source code deployed yet. Conventions are inferred from:
1. Project structure templates and guidelines in `create-prd.md` and `generate-tasks.md`
2. Planning documentation in `.planning/` directory
3. Established workflow patterns for AI-guided development
4. Technology stack documented in requirements (ArcGIS, Three.js, Gemma 4)

### Key Note
Actual source code conventions will be established during **Phase 1 (Project Setup)** when initial implementation begins.

---

## Naming Patterns

### Files

**Markdown Documentation:**
- PRD files: `prd-[feature-name].md` (lowercase, hyphenated)
  - Example: `prd-gemma4-autonomous-drone-simulation.md` (in `/tasks`)
- Task files: `tasks-[feature-name].md` (lowercase, hyphenated)
  - Example: `tasks-user-profile-editing.md` (in `/tasks`)
- Planning docs: `UPPERCASE.md` (in `.planning/` and subdirectories)
  - Examples: `PROJECT.md`, `STATE.md`, `REQUIREMENTS.md`, `ROADMAP.md`
- Phase documentation: Structured as `.planning/phases/[PHASE_NUMBER]/[DOC_TYPE].md`
  - Example: `.planning/phases/1_PROJECT_SETUP/PLAN.md`

**Future Source Code Convention (to be established):**
Based on technology stack requirements:
- TypeScript files: Likely `.ts` (Node backend) and `.tsx` (React/web components)
- HTML/CSS: `.html`, `.css` files expected for web UI
- Configuration files: `package.json`, `tsconfig.json`, `.eslintrc`, `.prettierrc` (typical for JS/TS projects)
- Test files: Likely `*.test.ts` or `*.spec.ts` format

### Functions

Not yet established (awaiting Phase 1 source code creation).

Expected pattern based on modern JavaScript/TypeScript conventions:
- camelCase for function names
- PascalCase for class/component names
- Descriptive, action-oriented names (e.g., `generatePlantation()`, `processAIDecision()`)

### Variables

Not yet established.

Expected pattern:
- camelCase for variable names
- UPPER_SNAKE_CASE for constants
- Descriptive names reflecting semantic meaning

### Types

Not yet established.

Expected pattern (TypeScript):
- PascalCase for type/interface names
- Descriptive names (e.g., `TreeData`, `DroneState`, `AIDecision`)

---

## Directory Organization

```
/Users/sanggusti/Workbench/local_development/palm-oil-simulation/
├── .planning/                    # Planning & documentation
│   ├── codebase/                # Codebase analysis docs (this location)
│   ├── phases/                  # Phase-specific plans and tracking
│   ├── PROJECT.md               # Project vision and overview
│   ├── STATE.md                 # Current project status
│   ├── REQUIREMENTS.md          # Detailed functional requirements
│   ├── ROADMAP.md               # 48-hour development roadmap
│   └── config.json              # Planning configuration
├── tasks/                       # PRD and task documentation
│   └── prd-gemma4-autonomous-drone-simulation.md  # Complete PRD
├── create-prd.md               # Template/guide for PRD generation
├── generate-tasks.md           # Template/guide for task generation
├── README.md                   # Repository overview and workflow
├── LICENSE                     # MIT License
└── .env                        # Environment variables (not committed)
```

---

## Documentation Patterns

### PRD Structure (see `create-prd.md` for template)

PRDs follow a standard structure in `/tasks/prd-[feature-name].md`:
1. **Product Title:** Clear, concise name
2. **Introduction/Overview:** Vision and goals
3. **Goals:** Primary goals and success metrics
4. **User Stories:** Persona-based requirements
5. **Functional Requirements:** Detailed requirement list (numbered 1.01, 1.02, etc.)
6. **Non-Goals (Out of Scope):** Clear boundaries
7. **Constraints/Timeline:** Project constraints and timeline
8. **Success Criteria:** Quantifiable acceptance criteria

**Example:** `tasks/prd-gemma4-autonomous-drone-simulation.md`

### Task List Structure (see `generate-tasks.md` for template)

Task lists follow structure in `/tasks/tasks-[feature-name].md`:
1. **Relevant Files:** List of files to create/modify with descriptions
2. **Parent Tasks:** High-level tasks (numbered 1.0, 2.0, 3.0, etc.)
3. **Sub-Tasks:** Detailed implementation steps (numbered 1.1, 1.2, 2.1, etc.)
4. **Task Tracking:** Checkboxes `- [ ]` / `- [x]` for completion tracking
5. **Notes:** Implementation guidance and warnings

**Task 0.0 Convention:** Always first task is creating a feature branch unless explicitly skipped

### Planning Phase Documentation

Located in `.planning/phases/[NUMBER]_[NAME]/`:
- **PLAN.md:** Phase objectives, tasks, deliverables, acceptance criteria
- **RESEARCH.md:** Investigation findings and recommendations
- **VERIFICATION.md:** Quality checks and completion verification

**Pattern Example:** `.planning/phases/1_PROJECT_SETUP/PLAN.md`

---

## Code Style & Formatting

### Not Yet Established

Source code linting and formatting tools will be configured during **Phase 1 Project Setup**.

**Expected tools** (based on modern JS/TS stack):
- **Linter:** ESLint (`.eslintrc` configuration)
- **Formatter:** Prettier (`.prettierrc` configuration)
- **Import sorting:** May use import-sort or eslint-plugin-import

**Configuration will be committed** to ensure consistent team development.

---

## Import Organization

Not yet established in source code.

**Expected pattern** (common TypeScript/React convention):
1. Third-party libraries (React, Three.js, ArcGIS SDK, etc.)
2. Local utility imports (`./utils`, `./helpers`)
3. Component/module imports (`./components`, `./services`)
4. Type imports (if using `import type`)
5. Side-effect imports (CSS, stylesheets)

---

## Error Handling

### Not Yet Established in Code

**Guidelines from requirements:**
- System must handle computational limitations gracefully (adaptive mode)
- Simulation must run continuously without crashes
- Performance must degrade gracefully when hitting ≤500ms latency constraints

**Expected patterns when implemented:**
- Try-catch blocks for async operations
- Graceful fallbacks for AI processing failures
- Error boundaries for React components (if using React)
- User-facing error messages in AI insights panel

---

## Logging

### Not Yet Established

**Expected approach** (based on requirements):
- Console logging for development
- Structured logs for AI decision tracing
- Display of AI reasoning in UI insights panel (`requirements.md` section 4.05)
- Performance metrics logging for latency tracking

---

## Comments & Documentation

### JSDoc/TSDoc

Not yet established.

**Expected pattern** for TypeScript files:
```typescript
/**
 * Describes what the function does
 * @param {type} paramName - Description
 * @returns {type} Description of return value
 */
```

### When to Comment

**Documentation already follows these principles:**
- Every PRD includes clarifying questions section (mandatory before implementation)
- Every task list includes detailed acceptance criteria
- Phase plans include explicit objectives, deliverables, and success metrics
- Rationale documented in planning docs, not inline code

---

## Testing Conventions

### Not Yet Established

**Will be configured during Phase 1** based on technology selections.

**Expected framework** (common for JS/TS):
- Jest (unit testing) or Vitest
- React Testing Library (for UI components, if applicable)
- Cypress or Playwright (for E2E testing)

**Test file locations:** Likely co-located with source files using `.test.ts` or `.spec.ts` naming

**Test organization:** Mirrors source structure for consistency

---

## Configuration Files

### Committed Configuration

Files committed to repository for consistency:
- `.prettierrc` - Formatting rules
- `.eslintrc` - Linting rules
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `.gitignore` - Files to exclude from version control

### Environment Configuration

**Location:** `.env` file (present but not committed)

**Contents:** Secret keys, API credentials (never committed)

**Required vars** (per requirements.md):
- ArcGIS API credentials
- Gemma 4 API access/credentials
- Any other third-party service keys

---

## Build & Development Scripts

### Package.json Scripts (to be established)

**Expected pattern:**
```json
{
  "scripts": {
    "dev": "Start development server with hot reload",
    "build": "Build for production",
    "test": "Run test suite",
    "test:watch": "Watch mode for tests",
    "test:coverage": "Generate coverage report",
    "lint": "Run ESLint",
    "lint:fix": "Fix linting issues",
    "format": "Run Prettier",
    "start": "Start production server"
  }
}
```

---

## Project-Specific Patterns

### AI-Guided Development Workflow

This project uses structured AI-guided development documented in `create-prd.md` and `generate-tasks.md`:

1. **PRD Generation:** User provides feature description → AI generates detailed PRD (with clarifying questions first)
2. **Task Generation:** PRD → AI breaks down into parent tasks → AI generates detailed sub-tasks
3. **Implementation:** Developer works task-by-task, marking completion with checkboxes
4. **Verification:** Each phase includes acceptance criteria and verification steps

### Phase-Based Development

Project follows 48-hour roadmap with numbered phases:
- Phase 1: Project Setup (4 hours)
- Phase 2-5: Feature implementation (to be planned)
- Each phase has explicit PLAN.md with deliverables and acceptance criteria

### Technology Stack Constraints

All code must integrate:
- **ArcGIS API for JavaScript** - Map interface and geospatial visualization
- **Three.js** - 3D drone visualization and plantation rendering
- **Gemma 4** - AI decision-making engine
- **Node.js/JavaScript** - Runtime environment (expected)
- **Real-time performance:** ≤500ms latency requirement for all visual updates

---

## Notable Conventions Absences

**Not established yet (awaiting Phase 1):**
- No source code files exist
- No linting/formatting tool configuration
- No test framework setup
- No CI/CD pipeline defined
- No git branching strategy documented (though PRD guidelines suggest feature branches)
- No deployment configuration
- No API endpoint naming conventions
- No database schema conventions (if applicable)

These will be established during Phase 1: Project Setup and documented then.

---

## Future Conventions Documentation

When Phase 1 implementation begins, conventions will be updated to reflect:
- Actual source code structure created
- Chosen testing framework and patterns
- Selected build tool and scripts
- ESLint/Prettier configurations
- Error handling implementations
- Logging patterns
- Code organization in action

---

*Convention analysis: 2026-04-20*
*Status: Project in planning phase - conventions framework established, awaiting source code*
