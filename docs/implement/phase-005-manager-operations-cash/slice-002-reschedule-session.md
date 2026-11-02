# P5-S2 — Dời buổi tương lai

**Hiện hành 02/11/2026:** UI/API slice đã triển khai. Đã có design Claude tương ứng, người dùng chốt Q-P5-01–05 và cho làm API cùng lượt (ADR-027). E2E bỏ qua theo ADR-030; [bằng chứng và giới hạn](api-integration.md). Checklist dưới đây là tiêu chí đối chiếu từng nhánh, không phải tuyên bố mọi case design đã pass native. Các ghi nhận “chờ design/chưa code” của bản tách ban đầu là lịch sử.

Ngày tách: 02/11/2026 (Asia/Bangkok), theo chỉ thị “Triển khai phase 5”. **Chờ design Claude/test case trước code. UI/API chưa triển khai.**

## Phạm vi và đầu vào

BR-OPS-01, BR-TIME-01, BR-TEACH-03; UC-MG-07. Phụ thuộc P1-S7. [Kế hoạch tổng](phase-005-manager-operations-cash.md), [bàn giao design](design-handoff.md).

Design đích chưa có: `docs/design/manager-operations-cash/reschedule-session/design.md`. Chỉ dời SCHEDULED tương lai; không đổi mentor chính/meeting URL hoặc sửa thời gian thực của buổi lịch sử.

## Checklist UI TDD sau khi có design

- [ ] Tải context/quyền/version; điền lịch hiện tại, lý do trống; phân biệt giờ lịch với actual times.
- [ ] Chọn ngày/giờ mới, start < end, instant có offset/Z, hiển thị UTC+7 theo ADR-008; không ép calendar date qua UTC midnight.
- [ ] Review giờ cũ/mới và lý do; đổi giờ không auto-submit; kiểm lịch/nghỉ/class period do server quyết định.
- [ ] Status đổi/hết quyền/409/conflict cần đối chiếu; không tự nâng version và replay. Timeout giữ intent để xác minh kết quả theo contract.
- [ ] Loading/error/offline/no-permission/success, skeleton theo phần, vi/en/theme/keyboard/Back/a11y theo design; không prefetch mọi lịch/ngày.
- [ ] UI test fail → mock pass từ test case Claude; chưa triển khai HTTP.

## API sau duyệt UI toàn phase

- [ ] Contract/schema/service/hook `PATCH /management/class-sessions/:sessionId/schedule`: expectedVersion, reason trim 1–1000, startsAt/endsAt, Idempotency-Key.
- [ ] Kiểm timestamp/permission/status và lỗi nghiệp vụ thực; retry cùng intent giữ payload/key/version, 409 không tự rebase.
- [ ] Invalidate ngày cũ/mới, buổi/lớp/context và lịch hai role trong phạm vi; chỉ refetch phần đang sử dụng.

## Kiểm chứng

Coverage cần design: ngày/giờ không hợp lệ, giao ngày UTC+7, buổi đã bắt đầu/đổi status, mentor bận/nghỉ, class period, version race, double tap/timeout, mất quyền/offline. Native kiểm lịch cũ/mới và attendance lịch sử không bị đổi. Chưa có test hoặc kết quả chạy; E2E theo command tổng P5 khi được triển khai.
