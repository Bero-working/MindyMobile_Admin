# P4-S3 — mentor-leave-detail

Ngày tách kế hoạch: 02/11/2026 (Asia/Bangkok), sau chỉ thị triển khai và xác nhận đủ S1–S7. [Kế hoạch tổng](phase-004-leave-and-makeup.md) · [Design Claude](../../design/leave-and-makeup/mentor-leave-detail/design.md) · [Quyết định P4](../../adr/ADR-028-phase-4-leave-and-makeup-decisions.md).

Route `MentorLeaveDetail`, role `MENTOR`; phụ thuộc S1. Params định danh theo design, không mang version/status/lý do. Chỉ UI mock trong lượt này; API chưa được phép trước approve UI toàn phase.

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

TC-P4-S3-01, TC-P4-S3-02, TC-P4-S3-03, TC-P4-S3-04, TC-P4-S3-05, TC-P4-S3-06, TC-P4-S3-07, TC-P4-S3-08, TC-P4-S3-09, TC-P4-S3-10, TC-P4-S3-11, TC-P4-S3-12, TC-P4-S3-13, TC-P4-S3-14, TC-P4-S3-15, TC-P4-S3-16, TC-P4-S3-17, TC-P4-S3-18, TC-P4-S3-19, TC-P4-S3-20, TC-P4-S3-21, TC-P4-S3-22, TC-P4-S3-23, TC-P4-S3-24, TC-P4-S3-25, TC-P4-S3-26, TC-P4-S3-27, TC-P4-S3-28.

Danh sách này là inventory từ design, không khẳng định mọi case đã có assertion độc lập hoặc native pass. Tra [mapping và bằng chứng](ui-verification.md); mọi case chưa ghi bằng chứng vẫn chưa được xác minh. Trạng thái và tiến độ chính tại [progress P4](../../progress/phase/phase-004-leave-and-makeup.md).
