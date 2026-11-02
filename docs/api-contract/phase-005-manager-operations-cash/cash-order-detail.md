# P5-S5 — Xác nhận CASH

[Quy ước chung](README.md). GET /manager/orders/:orderId: OrderDto + student + payment/confirmedBy; details chứa id/classId/courseTitle/className/priceAmount/quantity/totalAmount. CASH/PENDING chưa hết hạn mới có action. PAYOS/đơn đóng/hết hạn không thu.

Bấm action phải GET lại; trạng thái/tổng/hạn đổi thì cập nhật detail, không mở sheet. Form số tiền trống, số nguyên an toàn, **bằng toàn bộ totalAmount**; không tự điền, không thu một phần, không optimistic success.

POST /manager/cash-orders/:orderId/confirm; body **chỉ {receivedAmount}**. Không expectedVersion, không Idempotency-Key. Server idempotent theo trạng thái/payment transaction. Response OrderDto PAID không có collector/student; adapter không tự gán người thu. Sau mọi 200 luôn GET detail: cùng actor → success; Manager khác → cảnh báo không nhận là mình thu; chưa đọc được collector → hiển thị PAID theo response và cho tải lại collector.

Timeout/5xx/malformed mutation response: chưa rõ, khóa số tiền, đọc lại trước. PAID thì không gửi thêm; PENDING còn hạn mới cho người dùng bấm Gửi lại cùng số tiền; đọc lỗi chỉ Kiểm tra lại; expired/cancelled đóng sheet. Không auto-resend.

409 CASH_ORDER_CLOSED/CASH_HOLD_INVALID/CASH_CONFIRMATION_INVALID phải GET lại. Closed còn PENDING không đoán nguyên nhân; hold invalid không tự sửa status; amount invalid còn PENDING xóa số nhập; PAID mismatched cảnh báo hỗ trợ. Không dựng flow hoàn tiền/hóa đơn/biên nhận. Refresh lỗi khóa action; 403/404 xóa dữ liệu/form. Thành công hoặc reconcile PAID invalidate list/detail/roster cache liên quan.
