# S6 — Student conflict queue

`GET /management/student-schedule-conflicts`

Query page/pageSize/classId/status. No status means server OPEN + MAKEUP_ASSIGNED. Map sourceSession, student.displayName, conflictingIntervals, makeupPlacementId, makeupPlacementVersion separately from conflict version. Source has no class name: resolve through GET /manager/classes. Mentor class labels use GET /mentor/classes.

See [common contract and verification](README.md) and the linked backend snapshot.
