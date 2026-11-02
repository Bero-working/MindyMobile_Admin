# P5 — Đầu vào design Claude trước triển khai UI

**Hiện hành 02/11/2026:** Đã triển khai UI/API 5/5 theo [ADR-027](../../adr/ADR-027-phase-5-direct-api-implementation.md); người dùng bỏ qua E2E theo [ADR-030](../../adr/ADR-030-phase-5-e2e-waiver.md). [Kết quả tích hợp/giới hạn](api-integration.md) · [Cách xem UI](ui-review.md). Chưa nghiệm thu hoặc Done. Mô tả chờ design/UI/API trong bản kế hoạch ban đầu bên dưới là lịch sử, không yêu cầu duyệt lại.

Ngày: 02/11/2026 (Asia/Bangkok). Đây là checklist bàn giao yêu cầu từ kế hoạch/BR/source, **không phải design nguồn**. Codex không tự tạo hoặc sửa file design Claude.

Người dùng đã yêu cầu “Triển khai phase 5” và trả lời “Giữ phạm vi này”: chỉ dạy thay theo buổi, dùng tên “đơn thanh toán tiền mặt”; không đổi mentor chính, sửa meeting URL hoặc xuất hóa đơn/biên nhận riêng. UI/API 0/5; chưa có bộ design tại thời điểm kiểm tra.

## Hồ sơ cần cung cấp

Design chung `docs/design/manager-operations-cash/design.md`, và `design.md` trong từng thư mục con:

- `substitute-assignment`
- `reschedule-session`
- `replacement-session`
- `cash-orders`
- `cash-order-detail`

## Nội dung cần design chốt

- Entry point Manager từ Home/lớp/context, route params, stack và Back thật; không animation/gesture chuyển màn.
- Bố cục, token spacing, vùng chạm, keyboard/focus, vi/en, light/dark, accessibility, reduced motion, testID.
- Mọi loading/empty/error/offline/no-permission/conflict/success phù hợp; ghi lý do trạng thái không áp dụng. Skeleton theo nội dung, feedback theo phần; offline không Retry.
- Lựa chọn ban đầu, thời điểm load lookup/candidate, phân trang/refresh/invalidation, dữ liệu chưa tải và null; không gọi detail từng hàng hoặc tự thêm filter server chưa hỗ trợ.
- Policy cache/draft P5: đề xuất chỉ RAM, không persist người mua/tài chính, logout/đổi account xóa; dirty Back/app-kill và dữ liệu đọc offline cần chỉ rõ. Không tự coi policy P2 là duyệt cho P5.
- Review thao tác lịch: reason/version/key, stale version, mất response, giữ intent, cập nhật quyền/lịch, không ghi đè lịch sử.
- S3 có hai mutation riêng: cancel thành công/create fail vẫn là buổi đã hủy. Leaf chain và classEndDate, không copy điểm danh/actual times; không gộp guest placement P4.
- CASH list hiện chỉ pagination, gồm đơn đóng; detail xác nhận toàn bộ tiền nguyên VND, expiresAt từ server. Confirm không có version/key; timeout phải kiểm trạng thái trước retry.
- Mỗi slice có test case ID/tiền điều kiện/thao tác/kỳ vọng cho luồng chính, quyền, lỗi, offline, concurrent update và timeout. Mapping coverage theo 5 tài liệu slice; không tự tạo số test đã pass.

## Trình tự tiếp theo

Đối chiếu đủ design/test case toàn phase và policy → UI test fail/mock pass → lint/typecheck/Jest/native review → người dùng approve UI toàn phase → contract/API TDD → E2E/nghiệm thu. Chỉ thị implement đã nhận, không cần xin lại chỉ thị đó khi đầu vào đủ. Phụ thuộc P4-S5 và Q-PLAT-01 vẫn kiểm trước các mốc tương ứng.

[Kế hoạch tổng](phase-005-manager-operations-cash.md) · [Danh mục slice](README.md).
