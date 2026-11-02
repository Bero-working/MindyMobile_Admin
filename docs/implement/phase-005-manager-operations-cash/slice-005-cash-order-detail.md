# P5-S5 — Xác nhận đủ tiền mặt

**Hiện hành 02/11/2026:** UI/API slice đã triển khai. Đã có design Claude tương ứng, người dùng chốt Q-P5-01–05 và cho làm API cùng lượt (ADR-027). E2E bỏ qua theo ADR-030; [bằng chứng và giới hạn](api-integration.md). Checklist dưới đây là tiêu chí đối chiếu từng nhánh, không phải tuyên bố mọi case design đã pass native. Các ghi nhận “chờ design/chưa code” của bản tách ban đầu là lịch sử.

Ngày tách: 02/11/2026 (Asia/Bangkok), theo chỉ thị “Triển khai phase 5”. Người dùng chốt tên “đơn thanh toán tiền mặt”, không xuất hóa đơn/biên nhận riêng. **Chờ design Claude/test case trước code. UI/API chưa triển khai.**

## Phạm vi và đầu vào

BR-PAY-01–04/06; UC-MG-09. Phụ thuộc P5-S4. [Kế hoạch tổng](phase-005-manager-operations-cash.md), [bàn giao design](design-handoff.md).

Design đích chưa có: `docs/design/manager-operations-cash/cash-order-detail/design.md`. Chỉ Manager hợp lệ xác nhận, không yêu cầu phụ trách lớp. Không thu một phần/trả góp hoặc tạo enrollment/invoice tại client.

## Checklist UI TDD sau khi có design

- [ ] Đọc đúng orderId, người mua/lớp/tổng/hạn/trạng thái và quyền; chưa xác nhận khi mở. Form amount/confirmation cụ thể chờ Claude.
- [ ] Số tiền nguyên VND, 1..MAX_SAFE_INTEGER, bằng toàn bộ totalAmount; không float hoặc suy hạn 48 giờ từ thời điểm mở màn. expiresAt/status server là căn cứ.
- [ ] Review rõ người/đơn/số tiền, thao tác chỉ online; double tap khóa khi đang gửi, không optimistic success hoặc queue khi reconnect.
- [ ] Mất response hiển thị kết quả chưa rõ và đọc lại đơn trước quyết định retry; không mặc định chưa thu hoặc tự confirm lần nữa.
- [ ] Phân biệt sai số tiền/phương thức, đơn đóng/hết hạn, hold không hợp lệ, lớp hủy, mất quyền và lỗi mạng. PAID là dữ liệu server, không sinh giao dịch giả.
- [ ] UI test fail → mock pass; loading/error/offline/denied/success, vi/en/theme/a11y/keyboard/Back theo design, không lưu thông tin tài chính xuống thiết bị khi chưa chốt policy.

## API sau duyệt UI toàn phase

- [ ] Contract/schema/service/hook `GET /manager/orders/:orderId` và `POST /manager/cash-orders/:orderId/confirm`; kiểm CASH/paymentType trước action.
- [ ] ConfirmCashDto chỉ receivedAmount; **không có expectedVersion hoặc Idempotency-Key**. Không áp máy móc intent/version của mutation lịch.
- [ ] Kiểm CASH_CONFIRMATION_INVALID, CASH_ORDER_CLOSED, CASH_HOLD_INVALID và auth/error envelope thực. Đơn đã PAID đối chiếu behavior server, không suy timeout là quyền thu lại.
- [ ] Sau response/refetch thành công invalidate detail/list/enrollment chịu ảnh hưởng; client không tự đặt payment SUCCEEDED/enrollment ACTIVE.

## Kiểm chứng

Coverage cần design: đúng/thiếu/thừa tiền, số thập phân/quá giới hạn, đơn PAYOS, PAID/CLOSED/expired, hold hết hạn, lớp hủy, confirm đồng thời/timeout và mất quyền/offline. Dataset mutation riêng, không dùng giao dịch thật; E2E Manager từ S4 tới confirm/PAID/lịch sử và hồi quy enrollment liên quan. Chưa có test hoặc kết quả chạy; command tổng P5 tạo sau khi triển khai.
