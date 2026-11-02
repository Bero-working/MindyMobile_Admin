# P5-S3 — Hủy buổi và tạo replacement

**Hiện hành 02/11/2026:** UI/API slice đã triển khai. Đã có design Claude tương ứng, người dùng chốt Q-P5-01–05 và cho làm API cùng lượt (ADR-027). E2E bỏ qua theo ADR-030; [bằng chứng và giới hạn](api-integration.md). Checklist dưới đây là tiêu chí đối chiếu từng nhánh, không phải tuyên bố mọi case design đã pass native. Các ghi nhận “chờ design/chưa code” của bản tách ban đầu là lịch sử.

Ngày tách: 02/11/2026 (Asia/Bangkok), theo chỉ thị “Triển khai phase 5”. **Chờ design Claude/test case; phụ thuộc tích hợp P4-S5 chưa hoàn tất. UI/API chưa triển khai.**

## Phạm vi và đầu vào

BR-OPS-01, BR-MAKEUP-01; UC-MG-07. Phụ thuộc P1-S7, P4-S5. [Kế hoạch tổng](phase-005-manager-operations-cash.md), [bàn giao design](design-handoff.md).

Design đích chưa có: `docs/design/manager-operations-cash/replacement-session/design.md`. Replacement cả buổi khác guest placement P4. Không dựng luồng leave mock rồi ghi nhận là tích hợp P4 thật.

## Checklist UI TDD sau khi có design

- [ ] Tải context/quyền/source chain; chỉ dùng leaf hợp lệ, không tạo nhánh từ tổ tiên.
- [ ] Hủy SCHEDULED/IN_PROGRESS theo quyền server; review tác động, lý do và bảo toàn attendance/lịch sử.
- [ ] Hủy và tạo replacement là hai thao tác riêng. Sau cancel thành công refetch version; create fail hiển thị đã hủy/chưa tạo bù, không giả rollback hoặc gửi lại cancel.
- [ ] Form title/classUnitId, startsAt/endsAt, mentorId tùy chọn và reason theo DTO/design; lookup chỉ tải khi mở, chưa tự chọn giờ mới.
- [ ] Thành công hiển thị nguồn/replacement và classEndDate server trả; không copy actual times/attendance/guest credit.
- [ ] UI test fail → mock pass, phủ trạng thái tải/lỗi/offline/quyền/conflict/success từng bước, vi/en/theme/a11y/Back theo Claude.

## API sau duyệt UI toàn phase

- [ ] Contract/schema/service/hook `POST /management/class-sessions/:sessionId/cancel` và `POST /management/class-sessions/:sessionId/makeups`, version/reason/key từng intent.
- [ ] Đối chiếu CreateMakeupSessionDto; create dùng version nguồn sau cancel, không tái dùng version hoặc key của cancel.
- [ ] Timeout xác minh đúng bước; 409/leaf conflict dừng và tải lại. Tạo thành công cập nhật chain/lịch/classEndDate/context; đối chiếu invalidation P2/P4 liên quan.

## Kiểm chứng

Coverage cần design: hủy thành công/create thất bại, timeout mỗi bước, hủy IN_PROGRESS giữ lịch sử, source không phải leaf, slot bận/nghỉ, class extension, quyền mất giữa hai thao tác. E2E cần P4/dataset nguồn thật; thiếu thì ghi blocked, không dùng mock thay bằng chứng. Chưa có test hoặc kết quả chạy; command tổng P5 chỉ tạo khi triển khai.
