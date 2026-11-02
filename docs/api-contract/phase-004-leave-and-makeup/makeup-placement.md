# S7 — Place, cancel and reassign

`GET /management/student-schedule-conflicts/:conflictId/makeup-candidates; POST .../:conflictId/makeup-placement; POST /management/makeup-placements/:placementId/cancel`

Candidates are paged and expose session.version/remainingCapacity/effectiveMentor. Place body expectedVersion=conflict version, targetSessionId, expectedTargetVersion=session version, contentMatchConfirmed:true, reason. Response placement/conflictVersion/targetSessionVersion; show placement.targetSession then reload queue. Cancel expectedVersion=placement version plus reason; response MakeupPlacementDto CANCELLED then reload. Every mutation has Idempotency-Key. Reassignment requires cancel then a fresh queue and candidate read; no fabricated conflict mutation response.

See [common contract and verification](README.md) and the linked backend snapshot.
