# ADR-030 — Bỏ qua E2E trong lượt hoàn thiện P5

## Status

**Accepted — 02/11/2026 (Asia/Bangkok)**, theo chỉ thị trực tiếp: “Bỏ qua test e2e, triển khai hoàn thiện phase 5”.

## Decision

Hoàn thiện UI/API P5 và kiểm tra lint, format, TypeScript, Jest và API thật; không tiếp tục chạy E2E trong lượt này. Lượt Maestro trước đó lỗi khởi tạo Android instrumentation, chưa chạy flow; ghi là **failed to start**, không đổi thành pass. Android Debug build đã thành công ở lượt chạy lại; build không thay bằng chứng E2E.

Giữ flow/runner `npm run test:e2e:phase-5` để sử dụng khi có yêu cầu sau này. Việc triển khai xong không đồng nghĩa người dùng đã nghiệm thu, không tự đánh dấu Done/đã duyệt UI. Phần UI/API được báo cáo cùng bằng chứng thực tế và giới hạn.

## Quan hệ

Riêng lượt hoàn thiện P5 này miễn cổng phải chạy E2E của ADR-009/020/025/026. Không sửa các file Accepted cũ; không áp miễn trừ sang phase khác. ADR-027 tiếp tục cho phép P5 triển khai API mà không chờ xác nhận UI riêng.
