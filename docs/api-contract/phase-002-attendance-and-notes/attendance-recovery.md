# P2 — attendance-recovery

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `POST /management/class-sessions/:id/attendance/recover`.

Body expectedVersion/reason/evidenceNote/actualStartedAt/actualEndedAt/records[{enrollmentId,status:PRESENT|ABSENT,admissionBasis:PAID_BEFORE_START|CASH_LATE_ADMISSION}]. reason <=1000, evidence <=2000; records 1..1000 duy nhất; <=256 KiB. Backend kiểm bằng chứng và quan hệ payment, không tự dựng snapshot. Phân biệt ATTENDANCE_RECOVERY_RECORD_EXISTS/CLOCK_CONFLICT/EVIDENCE_INVALID và 413.
