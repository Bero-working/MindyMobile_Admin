# P3-S4 — Queue Manager

Ngày đối chiếu: 02/11/2026. [Contract chung](README.md) · [Nguồn nguyên bản](../legacy/2026-11-02-materials/README.md).

Route: `GET /manager/materials`.

Luôn có reviewStatus PENDING_REVIEW (mặc định)/APPROVED/REJECTED, page/pageSize; không query tất cả hoặc DRAFT. Không có search/class filter. DTO có courseUnitId/contentType filters nhưng không tự mở UI ngoài design. Total từ server, status chưa tải không gán 0. Lookup tên GET /manager/classes và /manager/mentors đủ trang, giữ RAM, không request từng hàng; lỗi lookup ẩn tên, không hiện UUID và không khóa list.

Lỗi, phiên, Origin, schema và uncertain theo contract chung. Bằng chứng từng nhánh được ghi riêng, không suy source thành runtime pass.
