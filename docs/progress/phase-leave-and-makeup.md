# P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/7, API 0/7, slice hoàn chỉnh 0/7 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p4-leave-and-makeup). Ưu tiên P0.
Cổng còn chờ: Q-LEAVE-01, Q-MAKEUP-01; hai slice placement chưa chốt P0.
ADR liên quan: ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 — đều Proposed.
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

| Slice                           | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                                   |
| ------------------------------- | ---- | ---- | ---------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| P4-S1 — mentor-leave-list       | Todo | Todo | Chờ Claude | Chưa          | Chỉ own requests; EXPIRED không được hiện là PENDING có thể duyệt                                         |
| P4-S2 — leave-plan-editor       | Todo | Todo | Chờ Claude | Chưa          | Ngày lịch/ca/notice đúng; preview cũ bị kiểm lại; đủ sourceVersions/mapping                               |
| P4-S3 — mentor-leave-detail     | Todo | Todo | Chờ Claude | Chưa          | Withdraw có lý do/version/key; đổi trạng thái đồng thời không bị ghi đè                                   |
| P4-S4 — leave-review-queue      | Todo | Todo | Chờ Claude | Chưa          | Lọc/phân trang đúng trạng thái; không hứa SLA hoặc push P0                                                |
| P4-S5 — leave-review-detail     | Todo | Todo | Chờ Claude | Chưa          | Reason/acknowledgment/version; approve source/replacement và lịch cập nhật; conflict không báo thành công |
| P4-S6 — makeup-conflicts        | Todo | Todo | Chờ Claude | Chưa          | Phân biệt replacement/placement; không tự coi conflict là ABSENT; giữ NEEDS_REASSIGNMENT                  |
| P4-S7 — makeup-placement-editor | Todo | Todo | Chờ Claude | Chưa          | Candidate đúng chương/còn chỗ; xác nhận nội dung/lý do/version/key; guest credit một lần                  |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
