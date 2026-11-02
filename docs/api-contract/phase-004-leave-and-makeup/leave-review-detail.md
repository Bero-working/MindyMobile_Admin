# S5 — Manager review and decision

`GET /management/mentor-leave-requests/:requestId; POST .../:requestId/approve; POST .../:requestId/reject`

Detail must include sourcesCurrent, studentConflicts and numeric studentConflictCount. Missing fields are invalid response, never defaulted to safe approval. Approve expectedVersion/reason/acknowledgeStudentConflicts:false; reject expectedVersion/reason. Required Idempotency-Key. Approve returns nested request/replacements/classExtensions/studentConflictCount; reject returns LeaveRequestDto. Preserve source stale and conflict errors; reload before a new decision.

See [common contract and verification](README.md) and the linked backend snapshot.
