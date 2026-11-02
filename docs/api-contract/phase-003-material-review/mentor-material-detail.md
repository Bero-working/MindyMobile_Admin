# P3-S3 — Detail và submit

Ngày đối chiếu: 02/11/2026. [Contract chung](README.md) · [Nguồn nguyên bản](../legacy/2026-11-02-materials/README.md).

Route: `GET /mentor/classes/:classId/materials/:materialId; POST /mentor/classes/:classId/materials/:materialId/submit`.

Submit body {expectedRevision}; response detail. DRAFT → PENDING_REVIEW, cùng pending revision retry không đổi state. REJECTED cần PATCH về DRAFT trước submit. firstApprovedAt khác null khóa sửa Mentor; canEdit server vẫn bắt buộc. Không DELETE mobile trong phạm vi người dùng chốt của chat này.

Lỗi, phiên, Origin, schema và uncertain theo contract chung. Bằng chứng từng nhánh được ghi riêng, không suy source thành runtime pass.
