# P3-S1 — Danh sách Mentor

Ngày đối chiếu: 02/11/2026. [Contract chung](README.md) · [Nguồn nguyên bản](../legacy/2026-11-02-materials/README.md).

Route: `GET /mentor/classes/:classId/units/:unitId/materials`.

page/pageSize; reviewStatus tùy chọn và contentType theo DTO. Không lọc local một trang để suy tổng; response giữ thứ tự server. Backend chỉ trả published content và own never-approved submissions đúng class scope. ClassUnit route không phải courseUnitId. Lookup lớp/chương qua teaching service, cần authorMaterials từ capabilities và courseUnitId từ unit.

Lỗi, phiên, Origin, schema và uncertain theo contract chung. Bằng chứng từng nhánh được ghi riêng, không suy source thành runtime pass.
