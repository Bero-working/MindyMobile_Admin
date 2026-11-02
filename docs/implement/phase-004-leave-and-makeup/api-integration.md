# P4 API integration — 02/11/2026

Implemented by direct user instruction “Triển khai api cho phase 4 đi”, authorizing the API stage for the existing S1–S7 UI. Keep previous UI/API gate notes as history; no new approval required for this work. No backend source changes.

## Changes

- Added validated production LeaveSource and runtime schemas for all seven slices. Wired real source in AuthApp; explicit mock/injected sources remain supported.
- Cookie auth, one shared refresh, expired session callbacks, in-flight identity/role guard and runtime response/resource checks.
- Server notice/slots/source versions; paginated list/detail/conflict/candidate reads; Manager stale-source and conflict prerequisites are required, not fabricated.
- Distinct conflict, placement and target-session versions. Approval wrapper and placement/cancellation response shapes follow backend DTOs. Refresh queue after placement changes.
- UUID v4 live keys, RAM-only immutable retry intents, explicit same-key replay after uncertain writes. Read-only POST never treated as a committed write.
- Immutable backend snapshot with SHA-256, contracts for S1–S7, local simulation and live verification scripts. Verification creates only fresh dedicated fixtures and stores local credentials/dataset under ignored .maestro files.

## Verification

- Live `node scripts/verify-leave-api.cjs`: PASS. New dedicated Mentor/classes/student, source class and equivalent receiving class. Preview/slots/create/replay, Mentor and Manager detail, withdraw/reject/approve/replay, source CANCELLED, terminal-state error, filtered list, role denial, actual late-enrollment conflict, candidates/place/replay/cancel/replay/reassign. No existing teaching class modified. Test fixtures remain identifiable by P4 API names.
- Postman CLI 1.77.0 local simulation on port 4634 plus actual mobile adapter/Axios: PASS. Create and placement responses delayed after commit; explicit replay returns success with one commit per intent; changed body/same key rejected. Also checked 409, HTML 503, denied and read-only POST failure.
- Final P4 Jest: **3 suites, 36/36 tests PASS**, including 17 API cases plus UI/model. Tests cover concurrent single-flight refresh, expiry without retry, session identity loss, offline, invalid input, exact DTO/body and role boundaries.
- Targeted ESLint: **PASS, 0 warnings** for P4 source, AuthApp integration, new tests, scripts and stand-in. Targeted Prettier: PASS. `npm run lint:type-check`: PASS.
- Full Jest run: 33/34 suites, 352/353 tests passed; first P1 UI cold-start test exceeded the default find timeout. Isolated rerun of the entire `teaching-ui.test.tsx`: **33/33 PASS**. No unrelated test edits made.
- `npm run lint`: ESLint stage PASS; full Prettier stage reported formatting in two pre-existing operations files (`src/modules/operations/provider.tsx`, `src/modules/operations/screens/SessionScreens.tsx`) and the generated P4 local dataset. Added P4 dataset to .gitignore; targeted formatting passes. Those operations files were not changed by this task. Full lint is not claimed as passing.

## Limits

No Android/iOS build or Maestro run in this turn. The latest user direction recorded in `../phases-003-005-verification.md` defers E2E until requested. The existing P4 runner is still UI mock only; update native flow/dataset wiring before an integrated E2E claim. This is API integration evidence, not phase acceptance. No commit/PR created.
