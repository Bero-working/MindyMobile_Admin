# ADR-027 — P5 triển khai UI và API trong cùng lượt

## Status

**Accepted — 02/11/2026 (Asia/Bangkok)**, theo chỉ thị trực tiếp “Viết luôn API luôn bỏ qua bước xác nhận UI”. Người dùng đã yêu cầu “Triển khai phase 5 đi, có UI rồi” và chọn “Chốt cả 5 đề xuất” từ design P5 mục 2.

## Decision

- Riêng P5 được triển khai UI và API thật trong cùng lượt, không dừng xin duyệt UI trước API. Giữ design Claude làm nguồn, giữ bộ kiểm tra chất lượng, E2E Maestro và nghiệm thu cuối; không tự ghi UI đã được duyệt hoặc phase Done.
- Chốt Q-P5-01–05: chỉ đổi người dạy khi SCHEDULED tương lai; nhập tiền thực nhận không điền sẵn; danh sách CASH dùng GET /manager/orders có filter server; dời buổi không đổi title; mở thẳng danh sách đơn thay bước chọn lớp.
- Q-CLASS-02/Q-PAY-01 tiếp tục phạm vi đã chốt: dạy thay theo buổi, đơn tiền mặt; không đổi mentor chính/meeting URL hoặc tạo Invoice/biên nhận.
- Dữ liệu/form P5 theo design cấp phase mục 8: RAM, không persist hoặc queue mutation; logout/đổi tài khoản xóa. Confirm CASH không dùng version/key; kết quả chưa rõ phải đọc trạng thái, không tự xác nhận lại.
- Source backend là căn cứ contract, không sửa backend. Mỗi bằng chứng phải tách unit/mock, HTTP simulation, API thật và native E2E.

## Quan hệ và giới hạn

Thay cổng UI trước API của ADR-009/016/017 **chỉ cho P5 và chỉ theo chỉ thị này**. Các file Accepted cũ giữ nguyên theo ADR-012; phase khác không thừa hưởng ngoại lệ. Các điều kiện còn lại và quyền nghiệm thu của người dùng giữ nguyên.

## BR/slice bị ảnh hưởng

P5-S1–S5; Q-P5-01–05 và lựa chọn nguồn đọc CASH. Không thay luật quyền server, thu đủ tiền, idempotency/version của mutation lịch hoặc bảo toàn lịch sử.
