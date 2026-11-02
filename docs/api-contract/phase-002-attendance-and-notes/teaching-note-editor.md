# P2 — teaching-note-editor

[Contract chung](README.md) · [Snapshot](../legacy/2026-11-02-attendance/README.md).

Routes (sau prefix API_URL): `GET/PUT /class-sessions/:id/teaching-notes`.

PUT cần Origin trong allowlist cấu hình. expectedVersion là version note (0 khi null), content <=10000, nextSteps <=5000; Idempotency-Key UUID v4. Response sessionId/version/note{content,nextSteps,version,updatedAt,...}. TEACHING_VERSION_CONFLICT khác TEACHING_NOTE_WINDOW_CLOSED/TEACHING_NOTE_STATE_CONFLICT. Không mở note editor Manager.
