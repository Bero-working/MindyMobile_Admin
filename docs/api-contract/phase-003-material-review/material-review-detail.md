# P3-S5 — Approve/reject

Ngày đối chiếu: 02/11/2026. [Contract chung](README.md) · [Nguồn nguyên bản](../legacy/2026-11-02-materials/README.md).

Route: `GET /manager/materials/:materialId; POST /manager/materials/:materialId/approve; POST /manager/materials/:materialId/reject`.

Approve body {expectedRevision}; reject thêm reason trim, không trắng, ≤2000. Approve đồng thời đặt publishedAt, revision không tăng. EDIT tăng revision và mất hiệu lực approval/publication cũ. Material dùng chung CourseUnit nên confirmation nêu tác động nhiều lớp, không bịa số lớp. Không authoring/publish/unpublish mobile theo phạm vi chat. Retry review an toàn chỉ cùng body/revision; không tự dùng revision mới khi dialog mở.

Lỗi, phiên, Origin, schema và uncertain theo contract chung. Bằng chứng từng nhánh được ghi riêng, không suy source thành runtime pass.
