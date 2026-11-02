# Phase 3 — Material Review

**Hiện hành 02/11/2026:** đã triển khai UI/API trực tiếp theo [ADR-029](../../adr/ADR-029-phase-3-direct-api-implementation.md); không chờ duyệt UI riêng theo chỉ thị mới. Đã có design Claude; phạm vi chat ưu tiên: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối. Xem [hồ sơ triển khai và kiểm chứng](api-integration.md). E2E dừng theo yêu cầu người dùng, chưa nghiệm thu. Các trạng thái chờ trong bản kế hoạch ban đầu bên dưới được giữ để truy vết.

Ngày lập: **02/11/2026 (Asia/Bangkok)**.

[Kế hoạch tổng](phase-003-material-review.md) · [Tiến độ và cổng triển khai](../../progress/phase/phase-003-material-review.md) · [Baseline P3](../../implementation-plan.md#p3-material-review) · [Mapping API khảo sát](../../api-contract/README.md#p3-s1).

**02/11/2026 — đã nhận chỉ thị “Triển khai phase 3” và tách 6 kế hoạch slice.** Q-MAT-01 đã chốt: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối (approve đồng thời công bố). Chưa có design Claude P3/test case nên chưa bắt đầu UI theo ADR-009; policy dữ liệu/offline còn chờ. UI 0/6, API 0/6, slice hoàn chỉnh 0/6.

Phạm vi gồm `P3-S1 — mentor-materials`, `P3-S2 — material-editor`, `P3-S3 — mentor-material-detail`, `P3-S4 — material-review-queue`, `P3-S5 — material-review-detail`, `P3-S6 — material-preview`.

Trình tự: duyệt tổng → tách kế hoạch slice; đủ design/test case Claude và có chỉ thị implement → UI mock toàn phase → người dùng approve UI → contract/API → cleanup và E2E Maestro toàn phase/hồi quy → người dùng nghiệm thu. Chi tiết task, câu hỏi, upload/preview, tải dữ liệu và ma trận kiểm chứng nằm trong kế hoạch tổng.

## Kế hoạch theo slice

- [P3-S1 — Danh sách tài liệu Mentor](slice-001-mentor-materials.md)
- [P3-S2 — Tạo/sửa draft và upload](slice-002-material-editor.md)
- [P3-S3 — Chi tiết và gửi duyệt của Mentor](slice-003-mentor-material-detail.md)
- [P3-S4 — Hàng chờ duyệt của Manager](slice-004-material-review-queue.md)
- [P3-S5 — Chi tiết và quyết định duyệt của Manager](slice-005-material-review-detail.md)
- [P3-S6 — Preview nội dung và file riêng tư](slice-006-material-preview.md)
