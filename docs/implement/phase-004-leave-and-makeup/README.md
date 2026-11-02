**Hiện hành 02/11/2026 — đã nối API thật S1–S7 theo yêu cầu “Triển khai api cho phase 4 đi”.** API 7/7 đã tích hợp; chưa nghiệm thu phase hoặc xác nhận native E2E. Live lifecycle và placement/replay/cancel/reassign trên fixture riêng pass; HTTP simulation pass mất phản hồi sau commit. [Hồ sơ tích hợp](api-integration.md). Các trạng thái 0/7/chờ duyệt API phía dưới là lịch sử trước lượt này.

# Phase 4 — Leave and Makeup

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Đã lập kế hoạch tổng, chờ người dùng duyệt.** UI 0/7, API 0/7, slice hoàn chỉnh 0/7; chưa triển khai code.

- [Kế hoạch tổng phase 4](phase-004-leave-and-makeup.md): phạm vi, phụ thuộc, cổng duyệt, tải dữ liệu, mapping API và kiểm chứng.
- [Tiến độ và nhật ký](../../progress/phase/phase-004-leave-and-makeup.md).
- [Baseline P4](../../implementation-plan.md#p4-leave-and-makeup) và [câu hỏi nghiệp vụ](../../business-rules.md).
- [Mapping API hiện có](../../api-contract/README.md#p4-s1).

Giữ 7 slice trong baseline; P4-S6/S7 về học bù khác lớp vẫn là đề xuất chờ Q-MAKEUP-01. Chưa có design Claude cho phase này. Sau duyệt kế hoạch tổng mới tách tài liệu slice theo [ADR-017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md); triển khai code, duyệt UI trước API và nghiệm thu tiếp tục theo các cổng trong kế hoạch.
