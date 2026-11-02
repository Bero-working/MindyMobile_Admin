# P2 — attendance-editor

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `GET /class-sessions/:id/attendance-candidates; GET /class-sessions/:id/attendance; POST /class-sessions/:id/start; PUT /class-sessions/:id/attendance; PUT /class-sessions/:id/attendance/bulk; POST /class-sessions/:id/attendance/sync-roster; POST /class-sessions/:id/finalize`.

Mark body records[{enrollmentId,status}], guestRecords[{makeupPlacementId,status}], mỗi nhóm <=100; records luôn gửi kể cả guest-only. Bulk checked=true/false tác động toàn snapshot, không chỉ trang đã tải. Finalize chuyển UNMARKED thành ABSENT. Response session/totals/changedEnrollmentIds/changedMakeupPlacementIds.
