# P0 — Nền tảng → đăng nhập → đúng workspace

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/4, API 0/4, slice hoàn chỉnh 0/4 (0%).**
[Phạm vi/kế hoạch](../implementation-plan.md#p0-foundation-auth). Ưu tiên P0.
Cổng còn chờ: Q-ENV-01, Q-PLAT-01, Q-DESIGN-01, Q-THEME-01; ADR Auth chưa tạo.
ADR liên quan: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-007, ADR-009 — đều Proposed.
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

| Slice                 | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                         |
| --------------------- | ---- | ---- | ---------- | ------------- | ------------------------------------------------------------------------------- |
| P0-S1 — bootstrap     | Todo | Todo | Chờ Claude | Chưa          | Không mở workspace bằng role cache; có loading/offline/expired                  |
| P0-S2 — login         | Todo | Todo | Chờ Claude | Chưa          | Sai thông tin/khóa tài khoản không vào workspace; cookie được kiểm chứng native |
| P0-S3 — access-denied | Todo | Todo | Chờ Claude | Chưa          | ADMIN/STUDENT không được vào workspace; không vòng lặp điều hướng               |
| P0-S4 — settings      | Todo | Todo | Chờ Claude | Chưa          | vi/en/theme; logout không để lộ dữ liệu tài khoản trước; draft policy chờ chốt  |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
