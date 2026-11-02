# P4 API contract — 02/11/2026

User instruction: “Triển khai api cho phase 4 đi”. This authorizes integration of the existing S1–S7 UI. No backend behavior changes.

Paths below are relative to the configured `/api/v1` base URL. Source of truth: [immutable backend snapshot](../legacy/2026-11-02-leave/README.md), controllers, DTOs and services. Runtime schemas: `src/modules/leave/services/schemas.ts`; adapter: `leaveService.ts`.

Cookie requests use withCredentials, existing auth restore/expiry callbacks, single-flight refresh and account/role activity guards. No bearer tokens, persisted data or offline mutation queue. Mentor-only operations are preview/slots/create/withdraw; management operations require Manager. IDs and input DTOs are validated before sending. No Origin guard is declared on the P4 controllers.

All six mutations use UUID Idempotency-Key. Network loss, HTTP 408/5xx, malformed successful response and mismatched mutation resources are uncertain. The hook retains the original key/body/version until a definitive response; explicit retry only. Keys are cryptographic UUID v4 in live mode; deterministic keys are restricted to mock mode. Read POST errors are ordinary read errors. 401 refreshes once; 403 hides forbidden data; 404 clears missing data; error code/requestId are preserved. RAM state resets on account/source replacement.

| Slice | Endpoints |
| --- | --- |
| [S1 — Mentor leave list](mentor-leave-list.md) | `GET /mentor/leave-requests` |
| [S2 — Preview, slots and create](leave-plan-editor.md) | `POST /mentor/leave-requests/preview; POST /mentor/leave-requests/makeup-slots; POST /mentor/leave-requests` |
| [S3 — Mentor detail and withdrawal](mentor-leave-detail.md) | `GET /mentor/leave-requests/:requestId; POST /mentor/leave-requests/:requestId/withdraw` |
| [S4 — Manager review queue](leave-review-queue.md) | `GET /management/mentor-leave-requests` |
| [S5 — Manager review and decision](leave-review-detail.md) | `GET /management/mentor-leave-requests/:requestId; POST .../:requestId/approve; POST .../:requestId/reject` |
| [S6 — Student conflict queue](makeup-conflicts.md) | `GET /management/student-schedule-conflicts` |
| [S7 — Place, cancel and reassign](makeup-placement.md) | `GET /management/student-schedule-conflicts/:conflictId/makeup-candidates; POST .../:conflictId/makeup-placement; POST /management/makeup-placements/:placementId/cancel` |

## Evidence

- `scripts/verify-leave-api.cjs`: PASS against configured live API on fresh P4-only mentors, classes and paid student enrollment. Covers selectors, preview/slots, create/replay, both details, withdraw/reject/approve/replay, source cancellation, terminal-state conflict, filtered list and role denial. Also covers actual backlog/candidates/place/replay/cancel/replay/reassign after late enrollment creates a conflict.
- `scripts/verify-leave-simulation.cjs`: PASS with actual TypeScript adapter and Axios over Postman HTTP simulation. Covers response loss after commit and same-key replay with one commit, changed-body key rejection, HTTP 409, HTML 503 and denied. Synthetic model derived from the snapshot; not proof of server fault handling.
- Unit/API/UI regression results and native limitations: [integration report](../../implement/phase-004-leave-and-makeup/api-integration.md).
- No Maestro/native E2E in this turn. Existing phase-4 E2E runner still targets the old explicit mock review flow; do not report it as an integrated API run. It needs a live fixture/native flow when E2E is requested again.
