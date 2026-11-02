# Phase 5 — Manager Operations and Cash

**Hiện hành 02/11/2026:** Đã triển khai UI/API 5/5 theo [ADR-027](../../adr/ADR-027-phase-5-direct-api-implementation.md); người dùng bỏ qua E2E theo [ADR-030](../../adr/ADR-030-phase-5-e2e-waiver.md). [Kết quả tích hợp/giới hạn](api-integration.md) · [Cách xem UI](ui-review.md). Chưa nghiệm thu hoặc Done. Mô tả chờ design/UI/API trong bản kế hoạch ban đầu bên dưới là lịch sử, không yêu cầu duyệt lại.

Ngày lập: 02/11/2026 (Asia/Bangkok). Người soạn: Codex.

**Đã nhận chỉ thị “Triển khai phase 5” ngày 02/11/2026; đã tách 5 checklist slice, chờ design Claude/test case trước code. UI 0/5, API 0/5, slice hoàn chỉnh 0/5.**

- [Kế hoạch tổng](phase-005-manager-operations-cash.md): phạm vi 5 slice, phụ thuộc, cổng đầu vào, thứ tự UI/API, tải dữ liệu và kiểm chứng.
- [Tiến độ và nhật ký](../../progress/phase/phase-005-manager-operations-cash.md).
- [Baseline P5](../../implementation-plan.md#p5-manager-operations-cash) và [mapping API khảo sát](../../api-contract/README.md#p5-s1).

Người dùng đã chốt Q-CLASS-02/Q-PAY-01 cho P5: chỉ dạy thay theo buổi, dùng tên “đơn thanh toán tiền mặt”, không đổi mentor chính, sửa meeting URL hay xuất hóa đơn/biên nhận riêng. Chỉ thị implement đã đáp ứng, không cần hỏi lại. Design/test case Claude toàn phase và policy dữ liệu còn thiếu; UI cần duyệt trước API theo ADR-009/016.

## Kế hoạch theo slice

1. [S1 — Dạy thay theo buổi](slice-001-substitute-assignment.md).
2. [S2 — Dời buổi tương lai](slice-002-reschedule-session.md).
3. [S3 — Hủy và tạo replacement](slice-003-replacement-session.md).
4. [S4 — Danh sách đơn thanh toán tiền mặt](slice-004-cash-orders.md).
5. [S5 — Xác nhận đủ tiền mặt](slice-005-cash-order-detail.md).

[Đầu vào cần Claude bàn giao](design-handoff.md) tổng hợp trạng thái/test case và policy cần chốt trước code. Checklist là yêu cầu kiểm chứng, không phải design hoặc bằng chứng đã chạy test.

Chưa tạo design, contract/legacy snapshot, module runtime, flow hoặc command E2E P5. Khi triển khai, command E2E công khai duy nhất dự kiến là `npm run test:e2e:phase-5`, tự kiểm API/chuẩn bị dataset và chạy Maestro toàn phase cùng hồi quy theo ADR-020/026. Command này **chưa tồn tại**.

## Bàn giao kiểm chứng

`npm run check` pass: lint 0 lỗi/cảnh báo, format, typecheck, 354 tests / 34 suites. P5 UI/API 5/5 đã nối; đọc/ghi backend thật trên fixture riêng, HTTP simulation và Android Debug build/cài APK pass. E2E đã được người dùng yêu cầu bỏ qua; không ghi native pass hoặc nghiệm thu. [Hồ sơ đầy đủ](api-integration.md).
