# P2 — attendance-correction

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `PUT /class-sessions/:id/attendance; POST /class-sessions/:id/finalize`.

Correction chỉ record hiện hữu; reason 1..1000 bắt buộc cho Manager. Không insert hoặc sửa hạn. Manager finalize thêm reason và actualEndedAt có timezone; expectedVersion phiên hiện hành. Ghi audit backend, invalidate session/context/queue/Home/audit.
