# P4-S2 — leave-plan-editor

Ngày tách kế hoạch: 02/11/2026 (Asia/Bangkok), sau chỉ thị triển khai và xác nhận đủ S1–S7. [Kế hoạch tổng](phase-004-leave-and-makeup.md) · [Design Claude](../../design/leave-and-makeup/leave-plan-editor/design.md) · [Quyết định P4](../../adr/ADR-028-phase-4-leave-and-makeup-decisions.md).

Route `LeavePlanEditor`, role `MENTOR`; phụ thuộc S1, P1-S1. Params định danh theo design, không mang version/status/lý do. Chỉ UI mock trong lượt này; API chưa được phép trước approve UI toàn phase.

## Task

- [x] Đọc design và test case, đối chiếu quy tắc chung, lựa chọn ban đầu và tải theo nhu cầu.
- [x] Viết UI trong `src/modules/leave/screens/LeavePlanEditorScreen.tsx`, dùng provider/mock RAM, primitives và vi/en/theme.
- [x] Nối route đúng role, entry point và các trạng thái loading/error/offline/denied/empty áp dụng.
- [x] Chạy test tự động P4; coverage thực tế và các giới hạn tại [kiểm chứng](ui-verification.md).
- [ ] Hoàn tất mapping/bằng chứng native mọi test case design, kể cả typography/font scale/accessibility.
- [ ] Người dùng approve UI toàn phase.
- [ ] Contract/schema/service/hook API TDD và backend thật sau duyệt UI.
- [ ] Maestro tích hợp/hồi quy và nghiệm thu.

## Test case nguồn

TC-P4-S2-01, TC-P4-S2-02, TC-P4-S2-03, TC-P4-S2-04, TC-P4-S2-05, TC-P4-S2-06, TC-P4-S2-07, TC-P4-S2-08, TC-P4-S2-09, TC-P4-S2-10, TC-P4-S2-11, TC-P4-S2-12, TC-P4-S2-13, TC-P4-S2-14, TC-P4-S2-15, TC-P4-S2-16, TC-P4-S2-17, TC-P4-S2-18, TC-P4-S2-19, TC-P4-S2-20, TC-P4-S2-21, TC-P4-S2-22, TC-P4-S2-23, TC-P4-S2-24, TC-P4-S2-25, TC-P4-S2-26, TC-P4-S2-27, TC-P4-S2-28, TC-P4-S2-29, TC-P4-S2-30, TC-P4-S2-31, TC-P4-S2-32, TC-P4-S2-33, TC-P4-S2-34, TC-P4-S2-35, TC-P4-S2-36, TC-P4-S2-37, TC-P4-S2-38, TC-P4-S2-39, TC-P4-S2-40, TC-P4-S2-41, TC-P4-S2-42, TC-P4-S2-43, TC-P4-S2-44, TC-P4-S2-45.

Danh sách này là inventory từ design, không khẳng định mọi case đã có assertion độc lập hoặc native pass. Tra [mapping và bằng chứng](ui-verification.md); mọi case chưa ghi bằng chứng vẫn chưa được xác minh. Trạng thái và tiến độ chính tại [progress P4](../../progress/phase/phase-004-leave-and-makeup.md).
