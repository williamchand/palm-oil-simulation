---
phase: 2
slug: core-infrastructure-hours-5-16
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run tests/phase2/unit` |
| **Full suite command** | `npx vitest run tests/phase2` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/phase2/unit`
- **After every plan wave:** Run `npx vitest run tests/phase2`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | Area selection infrastructure | — | Invalid or oversized selections fail safely without crashing | integration | `npx vitest run tests/phase2/unit/selection-model.test.js` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | Deterministic plantation generation | — | Same confirmed bounds produce same seed output | unit | `npx vitest run tests/phase2/unit/generate-plantation.test.js` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 1 | Scene rebuild from confirmed area | — | Stale scene objects are cleared before rebuilding | integration | `npx vitest run tests/phase2/unit/scene-controller.test.js` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 2 | Sweep-path movement and terrain altitude | — | Terrain sampling failures degrade to fallback altitude instead of blocking animation | unit | `npx vitest run tests/phase2/unit/terrain-path.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase2/unit/selection-model.test.js` — selection normalization and bounds validation coverage
- [ ] `tests/phase2/unit/generate-plantation.test.js` — deterministic generation and seed-value checks
- [ ] `tests/phase2/unit/scene-controller.test.js` — scene rebuild lifecycle and stale object cleanup
- [ ] `tests/phase2/unit/terrain-path.test.js` — terrain sampling fallback and waypoint altitude coverage
- [ ] `vitest.config.js` — project test configuration
- [ ] `npm install -D vitest` — framework install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Draw and confirm a Cesium rectangle | User can select an area on the map | Drag and globe interaction require browser verification | Run `npm run dev`, draw a rectangle, confirm it, and verify the Start button enables only after confirmation |
| Full-area rebuild of the 3D scene | System generates plantation based on selected area | Visual rebuild credibility is easiest to assess interactively | Confirm a rectangle, start generation, and verify the 3D panel rebuilds from the new selection rather than keeping stale scene content |
| Terrain-aware drone sweep | Drone can be placed and moved in 3D space | Altitude variation is a visual behavior | Start the simulation and confirm the drone follows a sweep pattern with visible altitude changes rather than a flat path |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
