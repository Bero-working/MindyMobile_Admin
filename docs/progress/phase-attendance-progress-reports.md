# P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/2, API 0/2, slice hoàn chỉnh 0/2 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p7-attendance-progress-reports). Ưu tiên P1.
Cổng còn chờ: Q-P1-01; dashboard doanh thu/tổng hợp mới cần contract và ADR riêng.
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

| Slice                             | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                     |
| --------------------------------- | ---- | ---- | ---------- | ------------- | ------------------------------------------------------------------------------------------- |
| P7-S1 — mentor-attendance-report  | Todo | Todo | Chờ Claude | Chưa          | null khác 0, UNTRACKED, credit/makeupPending đúng; Mentor thay không được báo cáo CLASS     |
| P7-S2 — manager-attendance-report | Todo | Todo | Chờ Claude | Chưa          | Công thức server, phân trang/scope, không tự tính toàn bộ bằng một trang; KPI thêm chờ chốt |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
