# Phase 6 — Mentor Quiz

**Hiện hành API — 02/11/2026:** Đã tích hợp API thật S1–S3 theo chỉ thị “Tích hợp luôn api”, xem [bằng chứng](api-integration.md) và [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). API 3/3, chưa nghiệm thu. E2E/Maestro tiếp tục được miễn; các dòng “API 0/3/chờ duyệt UI trước API” trong lịch sử bên dưới đã được thay bằng chỉ thị này.

**Hiện hành 02/11/2026:** Đã nhận chỉ thị “triển khai phase 6” và chốt gói theo design; đã có mã UI mock 3 màn để review, API 0/3, chưa duyệt UI/nghiệm thu. Mặc định điểm 10, có xóa draft, form RAM và soạn offline/lưu online; xem [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md) và [hồ sơ UI](ui-review.md). E2E đã dừng và được miễn trong lượt này theo yêu cầu người dùng. Các ghi nhận “chưa có chỉ thị/design/code” bên dưới là lịch sử trước triển khai.

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Người dùng đã duyệt kế hoạch tổng ngày 02/11/2026 qua phản hồi “Duyệt”; đã tách 3 kế hoạch slice.** Đã triển khai mã UI mock 3/3; API 0/3, slice hoàn chỉnh 0/3.

- [Kế hoạch tổng](phase-006-mentor-quiz.md): phạm vi, khảo sát backend, quyền, trình tự UI/API và kiểm chứng.
- [Tiến độ và nhật ký](../../progress/phase/phase-006-mentor-quiz.md).
- [Baseline P6](../../implementation-plan.md#p6-mentor-quiz).
- [Mapping API khảo sát](../../api-contract/README.md#p6-s1).

Giữ 3 slice: `P6-S1 — quiz-list`, `P6-S2 — quiz-editor`, `P6-S3 — quiz-detail`. Q-P1-01 phần quiz/policy đã chốt theo ADR-031, design/test case Claude đã có; đang chờ duyệt UI. Không tự mở rộng sang Student làm bài, Manager quản lý quiz, ZIP hoặc dashboard điểm.

## Kế hoạch theo slice

1. [S1 — Danh sách quiz](slice-001-quiz-list.md).
2. [S2 — Soạn quiz](slice-002-quiz-editor.md).
3. [S3 — Chi tiết, công bố và lưu trữ](slice-003-quiz-detail.md).

Việc duyệt kế hoạch mở bước tách tài liệu theo ADR-017; code theo chỉ thị implement và các cổng ADR-009/016. Các câu hỏi được ghi còn mở trong kế hoạch không tự đóng từ lần duyệt này. Đã có design và module UI mock; chưa có contract/legacy snapshot hoặc API runtime P6. Command E2E dự kiến duy nhất là `npm run test:e2e:phase-6`; **chưa tồn tại**, chỉ tạo khi triển khai thật theo ADR-026.
