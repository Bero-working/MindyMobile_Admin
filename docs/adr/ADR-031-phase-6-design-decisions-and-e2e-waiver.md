# ADR-031 — Phạm vi design và bỏ qua E2E trong lượt triển khai P6

## Status

**Accepted — 02/11/2026 (Asia/Bangkok).** Nguồn: người dùng yêu cầu “triển khai phase 6”, chọn “Chốt gói theo design” cho câu hỏi đã liệt kê các thay đổi, rồi chỉ thị “Không cần test e2e” và “Tiếp tục”.

## Decision

- Chỉ Mentor, entry từ chi tiết lớp/buổi, không thêm tile Trang chủ; purpose TEST/HOMEWORK. Thang điểm mặc định 10 khi tạo, không đổi purpose/thang điểm sau tạo theo API.
- Thêm xóa draft có xác nhận vào S3, không tăng số slice. Publish/archive giữ revision và quyền server; không mở Student/results/ZIP/Manager authoring.
- Cache/form chỉ RAM, không persist/log câu hỏi/đáp án. Cho soạn offline nhưng chỉ ghi khi online; không queue/replay tự động. Logout/đổi tài khoản xóa qua identity boundary.
- Giữ xử lý revision, mất response và biểu diễn điểm chính xác theo kế hoạch đã duyệt. Các đề xuất khác trong design không được tự mở rộng thành quyền ghi đè conflict hoặc tự retry create khi không xác định chắc chắn kết quả.
- Hiển thị dữ liệu quiz theo scope server khi tích hợp; DTO không có createdBy nên không dựng bộ lọc chủ sở hữu. Đây là ngoại lệ riêng quiz cho phần “draft người khác” của BR-TEACH-02; không mở quyền roster/tiền hoặc nới scope buổi, không áp dụng sang tài liệu/nghiệp vụ khác.
- Không chạy thêm E2E trong lượt P6 này. Dừng Maestro đang chạy, giữ báo cáo lần trước là fail/interrupted, không ghi pass. Tiếp tục lint/typecheck/Jest và ghi nhận build/ảnh đã có; không lấy chúng thay bằng chứng E2E.
- Giữ quy trình UI mock trước, người dùng duyệt UI toàn phase trước contract/API. Chỉ thị miễn E2E không duyệt UI hoặc nghiệm thu phase.

## Quan hệ

Bổ sung ADR-005/008 cho phạm vi quiz; thay đề xuất xóa draft ngoài baseline, mặc định điểm 100 và che/khóa form offline trong kế hoạch P6 bằng gói đã chốt. Riêng lượt P6 này miễn cổng chạy E2E của ADR-009/020/025/026; không sửa ADR Accepted cũ hoặc áp miễn trừ sang phase khác. Giữ ADR-016/017 và các cổng UI/API/nghiệm thu.

## Truy vết

[Kế hoạch P6](../implement/phase-006-mentor-quiz/phase-006-mentor-quiz.md), [review UI](../implement/phase-006-mentor-quiz/ui-review.md), [tiến độ](../progress/phase/phase-006-mentor-quiz.md). Không sửa design nguồn Claude.
