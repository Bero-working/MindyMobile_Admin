# P2 — incomplete-sessions

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `GET /management/class-sessions/incomplete`.

Không from/to mặc định: toàn backlog unresolved overdue. Filter classId/issue OVERDUE_NOT_STARTED hoặc STARTED_NOT_FINALIZED. items{session,issue,deadlineExpired}, page/pageSize/total/asOf/timeZone. Tên lớp/filter lookup bằng danh sách lớp được API Manager cho phép khi mở backlog, đọc đủ trang; không request mỗi hàng.
