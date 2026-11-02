# Phase 2 — Attendance and Notes

**Cập nhật hiện hành:** [Hai tiện ích Manager, header tabs, filter ngang và correction rút gọn](ui-utilities-update.md) theo yêu cầu trực tiếp ngày 01/11/2026; phần mô tả baseline khác với cập nhật này được giữ để truy vết.

Ngày lập: 01/11/2026 (Asia/Bangkok). Người soạn: Codex.

**Hiện hành 02/11/2026:** Đã nối API thật 7/7 và thêm tabs Lịch sử/Khôi phục trong chi tiết buổi theo chỉ thị mới. Xem [tích hợp API](api-integration.md), [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [E2E và giới hạn](e2e.md). E2E Android và backend postconditions đã pass; phase chờ nghiệm thu, Q-PLAT-01 còn mở. Các mô tả mock/API Todo phía dưới là lịch sử trước tích hợp.

**01/11/2026 — đã triển khai mã UI mock cho cả 7 slice theo chỉ thị “Triển khai đi”.** Người dùng duyệt UI toàn phase ngày 02/11/2026 với chỉ thị “Duyệt UI phase 2”; UI được duyệt 7/7, API đã nối 7/7 và slice hoàn chỉnh 0/7. Xem [bản review và cách mở](ui-review.md), [kiểm chứng](ui-verification.md), [Maestro UI mock](e2e-ui.md).

- [Kế hoạch tổng phase 2](phase-002-attendance-and-notes.md): phạm vi 7 slice, cổng đầu vào, UI/API, tải dữ liệu, kiểm thử và nghiệm thu.
- [Tiến độ và nhật ký](../../progress/phase/phase-002-attendance-and-notes.md).
- [Baseline P2](../../implementation-plan.md#p2-attendance-and-notes) và [mapping API khảo sát](../../api-contract/README.md#p2-s1).

Theo [ADR-017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md), bước tách slice đã được người dùng cho phép trực tiếp. Chỉ thị implement đã mở giai đoạn UI mock; Cổng duyệt UI toàn phase đã được đáp ứng ngày 02/11/2026 theo ADR-009. Đã có contract/HTTP P2 theo hồ sơ tích hợp; hồ sơ UI hiện ở các liên kết bên trên. [Design chung](../../design/attendance-and-notes/design.md) ghi các quyết định Q-OFF-01/Q-DATA-01/Q-ATT-01/Q-P2-01/Q-P2-02 đã được người dùng chốt; Q-PLAT-01 còn mở.

Command E2E hiện có: `npm run test:e2e:phase-2`, tự chuẩn bị/kiểm API và dataset, chạy Maestro toàn phase cùng hồi quy liên quan theo ADR-020/026. Runner đã được triển khai; xem kết quả và yêu cầu môi trường tại hồ sơ E2E.

## Kế hoạch theo slice

| Slice | Kế hoạch chi tiết | Design Claude |
| --- | --- | --- |
| P2-S1 — Mentor điểm danh | [Kế hoạch](slice-001-attendance-editor.md) | [Design](../../design/attendance-and-notes/attendance-editor/design.md) |
| P2-S2 — Ghi chú nội bộ | [Kế hoạch](slice-002-teaching-note-editor.md) | [Design](../../design/attendance-and-notes/teaching-note-editor/design.md) |
| P2-S3 — Buổi cần xử lý | [Kế hoạch](slice-003-incomplete-sessions.md) | [Design](../../design/attendance-and-notes/incomplete-sessions/design.md) |
| P2-S4 — Manager xem điểm danh | [Kế hoạch](slice-004-manager-attendance.md) | [Design](../../design/attendance-and-notes/manager-attendance/design.md) |
| P2-S5 — Correction và chốt thay | [Kế hoạch](slice-005-attendance-correction.md) | [Design](../../design/attendance-and-notes/attendance-correction/design.md) |
| P2-S6 — Khôi phục bằng bằng chứng | [Kế hoạch](slice-006-attendance-recovery.md) | [Design](../../design/attendance-and-notes/attendance-recovery/design.md) |
| P2-S7 — Lịch sử điểm danh | [Kế hoạch](slice-007-attendance-audits.md) | [Design](../../design/attendance-and-notes/attendance-audits/design.md) |

## Thứ tự và công việc chung

UI-00 (mapping design/test) → UI-01 (module/mock boundary, route, role, shared components) → S1 → S2 → S3 → S4 → S5 → S6 → S7 → review UI cả phase. S2 và S3 độc lập nghiệp vụ với S1; S5/S6 dùng thành phần draft/intent/form đã có. Sau duyệt UI: API-00/01 → API từng slice → kiểm offline/security/hồi quy → E2E tổng → nghiệm thu.

- S1 sở hữu Home/context Mentor cho điểm danh; S2 sở hữu nút ghi chú. S3 sở hữu tile và tổng backlog Home Manager.
- S4 sở hữu tab Manager và điểm mở action; S5 sở hữu sheet/mutation chốt thay được mở từ S4. S6 chỉ insert record thiếu; S7 chỉ đọc audit server.
- UI-00 phải mapping đủ test case trong 7 design và TC-P2-HOME/CTX/NAV/I18N cấp phase tới test/flow, không chỉ các ứng viên Maestro. Giữ nguyên ID và kỳ vọng nguồn; cập nhật test P1 bị thay thế theo design chung mục 4.4.
- Chuẩn chung: ADR-025, query key account/role/resource/filter/pageSize/page, cache/draft chỉ RAM, không Retry offline, không tự gửi khi reconnect, UUID v4 an toàn cho mutation và intent bất biến.
- API-00 phải xác minh khoảng lệch G-P2-01–12; đặc biệt quyền từ attendance, Origin note, UUID, lookup tên lớp/tên audit và giờ kết thúc thật khi Manager chốt thay. Không sửa design/backend nguồn trong lượt tách kế hoạch.

## Kiểm chứng và cổng hoàn thành

Checklist trong slice là tiêu chí cần đối chiếu khi review/nghiệm thu; mã UI đã được triển khai, bằng chứng và giới hạn tra tại hồ sơ verification. Khi implement, tạo hồ sơ verification/review/API/E2E có mapping từng ID, test/flow, command, kết quả và giới hạn. Lint 0 error/0 warning, typecheck, Jest, native UI và E2E backend thật theo kế hoạch tổng; không dùng mock/build thay Maestro. Q-PLAT-01 cần chốt trước nghiệm thu nền tảng. Chỉ người dùng nghiệm thu mới chuyển phase Done. Lượt tách kế hoạch trước đây chỉ kiểm tài liệu; lượt triển khai hiện có unit/UI tests, Android build và Maestro mock, UI đã được người dùng duyệt ngày 02/11/2026; phase chưa nghiệm thu.
