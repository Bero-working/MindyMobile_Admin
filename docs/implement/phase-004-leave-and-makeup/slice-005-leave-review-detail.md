# P4-S5 — leave-review-detail

Ngày tách kế hoạch: 02/11/2026 (Asia/Bangkok), sau chỉ thị triển khai và xác nhận đủ S1–S7. [Kế hoạch tổng](phase-004-leave-and-makeup.md) · [Design Claude](../../design/leave-and-makeup/leave-review-detail/design.md) · [Quyết định P4](../../adr/ADR-028-phase-4-leave-and-makeup-decisions.md).

Route `LeaveReviewDetail`, role `MANAGER`; phụ thuộc S4, P1-S7. Params định danh theo design, không mang version/status/lý do. Chỉ UI mock trong lượt này; API chưa được phép trước approve UI toàn phase.

## Task

- [x] Đọc design và test case, đối chiếu quy tắc chung, lựa chọn ban đầu và tải theo nhu cầu.
- [x] Viết UI trong `src/modules/leave/screens/DetailScreens.tsx`, dùng provider/mock RAM, primitives và vi/en/theme.
- [x] Nối route đúng role, entry point và các trạng thái loading/error/offline/denied/empty áp dụng.
- [x] Chạy test tự động P4; coverage thực tế và các giới hạn tại [kiểm chứng](ui-verification.md).
- [ ] Hoàn tất mapping/bằng chứng native mọi test case design, kể cả typography/font scale/accessibility.
- [ ] Người dùng approve UI toàn phase.
- [ ] Contract/schema/service/hook API TDD và backend thật sau duyệt UI.
- [ ] Maestro tích hợp/hồi quy và nghiệm thu.

## Test case nguồn

TC-P4-S5-01, TC-P4-S5-02, TC-P4-S5-03, TC-P4-S5-04, TC-P4-S5-05, TC-P4-S5-06, TC-P4-S5-07, TC-P4-S5-08, TC-P4-S5-09, TC-P4-S5-10, TC-P4-S5-11, TC-P4-S5-12, TC-P4-S5-13, TC-P4-S5-14, TC-P4-S5-15, TC-P4-S5-16, TC-P4-S5-17, TC-P4-S5-18, TC-P4-S5-19, TC-P4-S5-20, TC-P4-S5-21, TC-P4-S5-22, TC-P4-S5-23, TC-P4-S5-24, TC-P4-S5-25, TC-P4-S5-26, TC-P4-S5-27, TC-P4-S5-28, TC-P4-S5-29, TC-P4-S5-30, TC-P4-S5-31, TC-P4-S5-32, TC-P4-S5-33, TC-P4-S5-34.

Danh sách này là inventory từ design, không khẳng định mọi case đã có assertion độc lập hoặc native pass. Tra [mapping và bằng chứng](ui-verification.md); mọi case chưa ghi bằng chứng vẫn chưa được xác minh. Trạng thái và tiến độ chính tại [progress P4](../../progress/phase/phase-004-leave-and-makeup.md).
