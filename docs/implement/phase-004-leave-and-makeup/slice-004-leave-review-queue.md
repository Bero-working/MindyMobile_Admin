# P4-S4 — leave-review-queue

Ngày tách kế hoạch: 02/11/2026 (Asia/Bangkok), sau chỉ thị triển khai và xác nhận đủ S1–S7. [Kế hoạch tổng](phase-004-leave-and-makeup.md) · [Design Claude](../../design/leave-and-makeup/leave-review-queue/design.md) · [Quyết định P4](../../adr/ADR-028-phase-4-leave-and-makeup-decisions.md).

Route `LeaveReviewQueue`, role `MANAGER`; phụ thuộc P0-S1. Params định danh theo design, không mang version/status/lý do. Chỉ UI mock trong lượt này; API chưa được phép trước approve UI toàn phase.

## Task

- [x] Đọc design và test case, đối chiếu quy tắc chung, lựa chọn ban đầu và tải theo nhu cầu.
- [x] Viết UI trong `src/modules/leave/screens/ListScreens.tsx`, dùng provider/mock RAM, primitives và vi/en/theme.
- [x] Nối route đúng role, entry point và các trạng thái loading/error/offline/denied/empty áp dụng.
- [x] Chạy test tự động P4; coverage thực tế và các giới hạn tại [kiểm chứng](ui-verification.md).
- [ ] Hoàn tất mapping/bằng chứng native mọi test case design, kể cả typography/font scale/accessibility.
- [ ] Người dùng approve UI toàn phase.
- [ ] Contract/schema/service/hook API TDD và backend thật sau duyệt UI.
- [ ] Maestro tích hợp/hồi quy và nghiệm thu.

## Test case nguồn

TC-P4-S4-01, TC-P4-S4-02, TC-P4-S4-03, TC-P4-S4-04, TC-P4-S4-05, TC-P4-S4-06, TC-P4-S4-07, TC-P4-S4-08, TC-P4-S4-09, TC-P4-S4-10, TC-P4-S4-11, TC-P4-S4-12, TC-P4-S4-13, TC-P4-S4-14, TC-P4-S4-15, TC-P4-S4-16, TC-P4-S4-17, TC-P4-S4-18, TC-P4-S4-19, TC-P4-S4-20, TC-P4-S4-21, TC-P4-S4-22, TC-P4-S4-23.

Danh sách này là inventory từ design, không khẳng định mọi case đã có assertion độc lập hoặc native pass. Tra [mapping và bằng chứng](ui-verification.md); mọi case chưa ghi bằng chứng vẫn chưa được xác minh. Trạng thái và tiến độ chính tại [progress P4](../../progress/phase/phase-004-leave-and-makeup.md).
