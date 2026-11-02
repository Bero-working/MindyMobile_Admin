# P5 — Cách xem phần đã triển khai

02/11/2026: đã nối UI và API thật 5 slice theo [ADR-027](../../adr/ADR-027-phase-5-direct-api-implementation.md). Không còn chờ xác nhận UI riêng; [E2E được bỏ qua theo yêu cầu](e2e.md).

- Đăng nhập MANAGER: Trang chủ → Đơn tiền mặt → chọn/tìm mã đơn → chi tiết → nhập số tiền đã nhận sau khi đọc lại đơn. Chỉ dùng đơn test khi kiểm thao tác thu tiền.
- Quản lý lớp → lớp → tab Buổi học → chi tiết buổi → Tổng quan → Điều phối buổi học. Buổi SCHEDULED tương lai có dạy thay/dời/hủy; buổi đang diễn ra chỉ hủy; buổi đã hủy có tạo thay thế; COMPLETED không có nhóm thao tác.
- Dạy thay yêu cầu chọn mentor và lý do; dời buổi chỉ sửa ngày/giờ với lý do; tạo replacement là bước riêng sau hủy, ngày/giờ mới để trống và giữ thời lượng cũ.
- Development review hiện có có thể mở dữ liệu mock trong RAM; màn P5 hiện nhãn UI mock và menu scenario rõ ràng. Đăng nhập thật dùng source HTTP, không fallback fixture khi server lỗi. Không dùng kết quả mock làm bằng chứng API.

Không có tính năng Invoice/biên nhận, thu một phần, đổi mentor chính hoặc sửa meeting URL. Vi/en và theme dùng namespace operations/token chung. Chưa ghi nhận visual QA native hoàn chỉnh; [kiểm chứng/giới hạn](api-integration.md).
