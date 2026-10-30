# P3 — Mentor tải tài liệu → Manager duyệt/công bố

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/6, API 0/6, slice hoàn chỉnh 0/6 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p3-material-review). Ưu tiên P0.
Cổng còn chờ: Q-MAT-01, Q-ENV-01.
ADR liên quan: ADR-003, ADR-004, ADR-005, ADR-007, ADR-009 — đều Proposed.
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

| Slice                          | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                                  |
| ------------------------------ | ---- | ---- | ---------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| P3-S1 — mentor-materials       | Todo | Todo | Chờ Claude | Chưa          | Scope CLASS/SESSION đúng; không có release unit route                                                    |
| P3-S2 — material-editor        | Todo | Todo | Chờ Claude | Chưa          | Không submit file chưa READY; revision conflict; loại nội dung chờ Q-MAT-01                              |
| P3-S3 — mentor-material-detail | Todo | Todo | Chờ Claude | Chưa          | REJECTED phải edit về DRAFT trước submit; sau firstApprovedAt không tự sửa như draft cũ                  |
| P3-S4 — material-review-queue  | Todo | Todo | Chờ Claude | Chưa          | Queue theo trạng thái/revision; không lấy tổng từ một trang                                              |
| P3-S5 — material-review-detail | Todo | Todo | Chờ Claude | Chưa          | Reject có lý do; approve đồng thời công bố; xem tác động tài liệu dùng chung; edit/unpublish chờ phạm vi |
| P3-S6 — material-preview       | Todo | Todo | Chờ Claude | Chưa          | Xin URL theo scope khi cần; hết hạn xin lại; storage upload/download không dùng cookie BE                |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
