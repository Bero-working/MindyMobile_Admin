# P1 — Mentor xem lịch/lớp → Manager theo dõi lớp

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/7, API 0/7, slice hoàn chỉnh 0/7 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p1-teaching-workspace). Ưu tiên P0.
Cổng còn chờ: Q-CLASS-01, Q-CLASS-02, Q-DESIGN-01.
ADR liên quan: ADR-004, ADR-005, ADR-008, ADR-009 — đều Proposed.
Chưa có design, chưa duyệt UI, chưa tích hợp/nghiệm thu.

## Các mốc

| Mốc                        | Trạng thái | Ngày thực hiện | Ai làm/duyệt | Test / lint / typecheck               | Commit/PR | Ghi chú / BR-ADR                         |
| -------------------------- | ---------- | -------------- | ------------ | ------------------------------------- | --------- | ---------------------------------------- |
| Design toàn phase (Claude) | Todo       | —              | Claude       | Chưa có test case/design để đối chiếu | —         | Chưa có file; Codex không viết/sửa       |
| UI toàn phase (TDD)        | Todo       | —              | Codex        | Chưa chạy                             | —         | Mock rõ ràng, tất cả trạng thái/quyền    |
| Người dùng duyệt UI        | Todo       | —              | Người dùng   | Chưa có kết quả để duyệt              | —         | Cổng bắt buộc trước API                  |
| API toàn phase (TDD)       | Todo       | —              | Codex        | Chưa chạy                             | —         | Chưa có contract từng UI/legacy snapshot |
| Cleanup + lint + test      | Todo       | —              | Codex        | Chưa chạy                             | —         | ESLint 0 error/0 warning, tsc, Jest      |
| Nghiệm thu phase           | Todo       | —              | Người dùng   | Chưa kiểm thử thiết bị/nghiệm thu     | —         | Chưa được đánh dấu Done                  |

## Slice

| Slice                        | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                |
| ---------------------------- | ---- | ---- | ---------- | ------------- | -------------------------------------------------------------------------------------- |
| P1-S1 — mentor-schedule      | Todo | Todo | Chờ Claude | Chưa          | Đúng timezone, phân trang/khoảng, phân biệt PRIMARY/SUBSTITUTE                         |
| P1-S2 — mentor-classes       | Todo | Todo | Chờ Claude | Chưa          | Chỉ lớp được giao; thể hiện scope CLASS/SESSION từ server                              |
| P1-S3 — mentor-class-detail  | Todo | Todo | Chờ Claude | Chưa          | Capabilities kiểm soát action; không dựng người dạy legacy; không mở khóa chương       |
| P1-S4 — session-context      | Todo | Todo | Chờ Claude | Chưa          | Dùng context thật và version; mất assignment bị chặn; meeting edit chưa trong baseline |
| P1-S5 — mentor-students      | Todo | Todo | Chờ Claude | Chưa          | Không gọi roster CLASS với scope SESSION; trạng thái payment chỉ đọc                   |
| P1-S6 — manager-classes      | Todo | Todo | Chờ Claude | Chưa          | Không có tạo lớp/Admin action hoặc branch selector                                     |
| P1-S7 — manager-class-detail | Todo | Todo | Chờ Claude | Chưa          | Phân biệt route đọc và route vận hành; roster đúng quyền, trạng thái hủy rõ            |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
