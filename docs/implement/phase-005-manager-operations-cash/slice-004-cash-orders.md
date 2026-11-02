# P5-S4 — Danh sách đơn thanh toán tiền mặt

**Hiện hành 02/11/2026:** UI/API slice đã triển khai. Đã có design Claude tương ứng, người dùng chốt Q-P5-01–05 và cho làm API cùng lượt (ADR-027). E2E bỏ qua theo ADR-030; [bằng chứng và giới hạn](api-integration.md). Checklist dưới đây là tiêu chí đối chiếu từng nhánh, không phải tuyên bố mọi case design đã pass native. Các ghi nhận “chờ design/chưa code” của bản tách ban đầu là lịch sử.

Ngày tách: 02/11/2026 (Asia/Bangkok), theo chỉ thị “Triển khai phase 5”. Người dùng chốt tên “đơn thanh toán tiền mặt”, không xuất hóa đơn/biên nhận riêng. **Chờ design Claude/test case trước code. UI/API chưa triển khai.**

## Phạm vi và đầu vào

BR-PAY-01/05; UC-MG-09. Phụ thuộc P0-S1. [Kế hoạch tổng](phase-005-manager-operations-cash.md), [bàn giao design](design-handoff.md).

Design đích chưa có: `docs/design/manager-operations-cash/cash-orders/design.md`. Order/PaymentTransaction hiện hữu, không tạo thực thể Invoice hoặc thêm chức năng tạo đơn.

## Checklist UI TDD sau khi có design

- [ ] Entry point Manager, mặc định tất cả đơn CASH trang 1; gồm đơn cần xử lý và trạng thái đóng.
- [ ] Không thêm filter status/search/ngày hoặc tổng pending giả: endpoint hiện chỉ nhận pagination. Không lọc một trang rồi gọi là toàn bộ lịch sử.
- [ ] Load more đúng trang, không trùng request; lỗi giữ hàng cũ và retry trang lỗi. Dữ liệu chưa tải khác empty/0; số tổng lấy đúng meta server.
- [ ] Chỉ mở detail orderId được chọn; không gọi detail từng hàng để trang trí. Quay lại sau confirm refresh phần danh sách liên quan.
- [ ] Loading/empty/error/offline/no-permission, vi/en/light/dark/a11y/Back theo design. Quyết định cache dữ liệu người mua/tài chính phải được chốt trước code persistence.
- [ ] UI test fail → mock pass từ test case Claude; không HTTP/thao tác thu tiền tại bước UI.

## API sau duyệt UI toàn phase

- [ ] Contract/schema/service/hook `GET /manager/cash-orders`, phân trang và status/nullability thực tế; không bịa query endpoint chưa hỗ trợ.
- [ ] Account/role/page query key; response cũ không ghi đè tài khoản/resource mới; 401/403 che/xóa dữ liệu theo auth boundary.
- [ ] Không persist/log thông tin người mua/số tiền khi policy chưa duyệt; không suy enrollment/payment thành công từ list cache.

## Kiểm chứng

Coverage cần design: nhiều trang đủ trạng thái, empty, load-more/refresh fail, offline cache đúng query, đổi account, role Mentor/Admin bị chặn và về list sau S5. Chưa có test hoặc kết quả chạy; E2E dùng dataset CASH thử và command tổng P5 khi triển khai.
