# P8 — Mentor trao đổi → nhận thông báo/push đúng quyền

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/3, API 0/3, slice hoàn chỉnh 0/3 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p8-chat-notifications). Ưu tiên P1.
Cổng còn chờ: Q-P1-01; API chat/notifications/push hiện không cho MANAGER.
ADR liên quan: ADR-004, ADR-005, ADR-007, ADR-009 — đều Proposed.
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

| Slice                       | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                          |
| --------------------------- | ---- | ---- | ---------- | ------------- | ------------------------------------------------------------------------------------------------ |
| P8-S1 — conversations       | Todo | Todo | Chờ Claude | Chưa          | Chỉ dùng role được endpoint cấp; chưa hứa Manager chat hoặc chat staff nội bộ                    |
| P8-S2 — conversation-detail | Todo | Todo | Chờ Claude | Chưa          | Quyền/cursor/reconnect/idempotence cần đối chiếu HTTP/socket trước implement                     |
| P8-S3 — notifications       | Todo | Todo | Chờ Claude | Chưa          | Xin quyền đúng lúc; token/installation/logout và deep link được kiểm chứng; không mở cho Manager |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
