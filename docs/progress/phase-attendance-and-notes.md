# P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/7, API 0/7, slice hoàn chỉnh 0/7 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p2-attendance-and-notes). Ưu tiên P0.
Cổng còn chờ: Q-DATA-01, Q-OFF-01, Q-ATT-01, Q-PLAT-01.
ADR liên quan: ADR-004, ADR-006, ADR-007, ADR-008, ADR-009 — đều Proposed.
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

| Slice                         | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                                     |
| ----------------------------- | ---- | ---- | ---------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| P2-S1 — attendance-editor     | Todo | Todo | Chờ Claude | Chưa          | Bulk mọi trang/guest; finalize cảnh báo UNMARKED; conflict không ghi đè; offline chỉ sau chốt policy        |
| P2-S2 — teaching-note-editor  | Todo | Todo | Chờ Claude | Chưa          | Note version riêng; hạn sửa, nội dung/nextSteps và lỗi conflict đúng; không hứa offline note                |
| P2-S3 — incomplete-sessions   | Todo | Todo | Chờ Claude | Chưa          | Mặc định toàn backlog unresolved overdue theo API; không giới hạn tuần ngầm; không coi chưa start là ABSENT |
| P2-S4 — manager-attendance    | Todo | Todo | Chờ Claude | Chưa          | Hiện permission/totals server, regular/guest; phân biệt correction và recovery                              |
| P2-S5 — attendance-correction | Todo | Todo | Chờ Claude | Chưa          | Reason bắt buộc, record hiện hữu, conflict và audit; không giả Mentor hay đổi hạn                           |
| P2-S6 — attendance-recovery   | Todo | Todo | Chờ Claude | Chưa          | Insert-only, bằng chứng/actual times hợp lệ, body limit; không dựng snapshot lịch sử                        |
| P2-S7 — attendance-audits     | Todo | Todo | Chờ Claude | Chưa          | Phân trang/filter trong scope; chỉ trình bày audit thật, không tự dựng before/after                         |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
