# Phase 7 — Báo cáo chuyên cần và stored progress

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Người dùng đã duyệt kế hoạch tổng ngày 02/11/2026 qua phản hồi “Duyệt”; đã tách hai kế hoạch slice.** Chưa có chỉ thị implement hoặc code UI/API. Không sử dụng SpecKit. UI 0/2, API 0/2, slice hoàn chỉnh 0/2.

- [Kế hoạch tổng](phase-007-attendance-progress-reports.md): phạm vi, khảo sát backend, quyền, dữ liệu, trình tự và kiểm chứng.
- [Tiến độ và nhật ký](../../progress/phase/phase-007-attendance-progress-reports.md).
- [Baseline P7](../../implementation-plan.md#p7-attendance-progress-reports).
- [Mapping API S1](../../api-contract/README.md#p7-s1) và [S2](../../api-contract/README.md#p7-s2).

Giữ hai slice `P7-S1 — mentor-attendance-report` và `P7-S2 — manager-attendance-report`. Q-P1-01 cho báo cáo/KPI, design/test case Claude và policy cache còn chờ. Mentor đọc chuyên cần và stored progress; Manager đọc chuyên cần theo lớp. Không mở rộng doanh thu, chứng chỉ, điểm quiz hoặc Manager progress khi chưa có quyết định và contract phù hợp.

## Kế hoạch theo slice

1. [S1 — Mentor đọc chuyên cần và stored progress](slice-001-mentor-attendance-report.md).
2. [S2 — Manager đọc chuyên cần theo lớp](slice-002-manager-attendance-report.md).

Đã tách tài liệu slice theo ADR-017 sau duyệt tổng; code theo chỉ thị implement và quy trình ADR-009/016. Các câu hỏi còn mở không tự đóng từ lần duyệt tổng. Command dự kiến duy nhất khi triển khai là `npm run test:e2e:phase-7`; **chưa tồn tại**. Lượt này chỉ lập tài liệu, không tạo design, contract/schema hoặc bằng chứng runtime.
