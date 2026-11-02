# P3-S2 — Nháp và upload

Ngày đối chiếu: 02/11/2026. [Contract chung](README.md) · [Nguồn nguyên bản](../legacy/2026-11-02-materials/README.md).

Route: `POST /mentor/classes/:classId/units/:unitId/materials; PATCH /mentor/classes/:classId/materials/:materialId`.

Create: contentType FILE/VIDEO/ARTICLE, title (1–250), description nullable (≤5000); FILE/VIDEO cần fileId READY; ARTICLE dùng contentText ≤48 KiB UTF-8 (canonical HTML cũng bị giới hạn). PATCH gửi expectedRevision và trường đổi, không gửi contentType/availableAt/sessionId/sortOrder/attachments ngoài phạm vi. POST /files/upload-intents có courseUnitId/classId/classUnitId/originalFilename/declaredMimeType/declaredSizeBytes; response fileId/uploadUrl/requiredHeaders/uploadUrlExpiresAt/intentExpiresAt. PUT streaming tới storage, đúng requiredHeaders, không cookie/Origin; POST /files/:fileId/complete body {} → 202 PROCESSING hoặc 200 READY; GET /files/:fileId chờ READY/FAILED. Client MIME suy từ allowlist extension, 25 MiB thường/200 MiB MP4, không ZIP/URL ngoài. Poll chỉ foreground/focus; không tạo intent tự động theo vòng retry. File tạm dọn khi unmount.

Lỗi, phiên, Origin, schema và uncertain theo contract chung. Bằng chứng từng nhánh được ghi riêng, không suy source thành runtime pass.
