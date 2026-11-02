# P4-S1 — mentor-leave-list

Ngày tách kế hoạch: 02/11/2026 (Asia/Bangkok), sau chỉ thị triển khai và xác nhận đủ S1–S7. [Kế hoạch tổng](phase-004-leave-and-makeup.md) · [Design Claude](../../design/leave-and-makeup/mentor-leave-list/design.md) · [Quyết định P4](../../adr/ADR-028-phase-4-leave-and-makeup-decisions.md).

Route `MentorLeaveList`, role `MENTOR`; phụ thuộc P0-S1. Params định danh theo design, không mang version/status/lý do. Chỉ UI mock trong lượt này; API chưa được phép trước approve UI toàn phase.

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

TC-P4-S1-01, TC-P4-S1-02, TC-P4-S1-03, TC-P4-S1-04, TC-P4-S1-05, TC-P4-S1-06, TC-P4-S1-07, TC-P4-S1-08, TC-P4-S1-09, TC-P4-S1-10, TC-P4-S1-11, TC-P4-S1-12, TC-P4-S1-13, TC-P4-S1-14, TC-P4-S1-15, TC-P4-S1-16, TC-P4-S1-17, TC-P4-S1-18, TC-P4-S1-19, TC-P4-S1-20, TC-P4-S1-21, TC-P4-S1-22.

Danh sách này là inventory từ design, không khẳng định mọi case đã có assertion độc lập hoặc native pass. Tra [mapping và bằng chứng](ui-verification.md); mọi case chưa ghi bằng chứng vẫn chưa được xác minh. Trạng thái và tiến độ chính tại [progress P4](../../progress/phase/phase-004-leave-and-makeup.md).
