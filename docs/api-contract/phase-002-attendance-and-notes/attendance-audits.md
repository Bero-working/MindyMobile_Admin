# P2 — attendance-audits

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `GET /management/class-sessions/:id/attendance-audits`.

Filter enrollmentId/makeupPlacementId, pageSize=20. items{id,attendanceId,enrollmentId,entryType,makeupPlacementId,actor,oldStatus,newStatus,reason,occurredAt,action,version,recoveryAuditId,recoveryEvidence}. actor.displayName nullable. Chỉ trình bày dữ liệu thật; lookup tên từ roster riêng không chặn audit.
