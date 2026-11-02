# P2 — manager-attendance

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `GET /class-sessions/:id/context; GET /class-sessions/:id/attendance; GET /class-sessions/:id/attendance-candidates`.

Quyền và totals lấy attendance; tab chưa mở không preload note/audit. REGULAR và MAKEUP dùng đúng khóa; không tự xem UNMARKED là vắng.
