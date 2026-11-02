# P5-S1 — Dạy thay theo buổi

**Hiện hành 02/11/2026:** UI/API slice đã triển khai. Đã có design Claude tương ứng, người dùng chốt Q-P5-01–05 và cho làm API cùng lượt (ADR-027). E2E bỏ qua theo ADR-030; [bằng chứng và giới hạn](api-integration.md). Checklist dưới đây là tiêu chí đối chiếu từng nhánh, không phải tuyên bố mọi case design đã pass native. Các ghi nhận “chờ design/chưa code” của bản tách ban đầu là lịch sử.

Ngày tách: 02/11/2026 (Asia/Bangkok), theo chỉ thị “Triển khai phase 5”. Người dùng chốt “Giữ phạm vi này”: chỉ dạy thay từng buổi, không đổi mentor chính hoặc sửa meeting URL. **Chờ design Claude/test case trước code. UI/API chưa triển khai.**

## Phạm vi và đầu vào

BR-TEACH-01/03, BR-OPS-01; UC-MG-08. Phụ thuộc P1-S7. [Kế hoạch tổng](phase-005-manager-operations-cash.md), [bàn giao design](design-handoff.md).

Design đích chưa có: `docs/design/manager-operations-cash/substitute-assignment/design.md`. Route/entry point, layout, testID và tương tác do design xác định; không dùng tài liệu này thay design.

## Checklist UI TDD sau khi có design

- [ ] Đọc context/quyền/version đúng session; chỉ Manager được vào. Giữ mentor lịch sử, phân biệt mentor chính với override theo buổi.
- [ ] Chỉ tải candidates khi mở vùng chọn; search trống/chưa chọn, đổi search reset trang; giữ hàng đã tải khi load-more lỗi, không coi một trang là toàn bộ candidates.
- [ ] Gán mentor hoặc xóa override, lý do trim 1–1000, xác nhận tác động; xóa dùng null, không ghi đè teachingMentorId lịch sử.
- [ ] Candidate cũ có thể không còn hợp lệ; conflict/version cũ dừng gửi và đối chiếu, không tự chọn người khác hoặc ghi đè.
- [ ] Loading/empty/error/offline/no-permission/success; vi/en, light/dark, Back/keyboard/a11y và dirty form theo design. Offline khóa mutation, không Retry/tự gửi lại.
- [ ] Từ test case design viết test fail → mock pass; mock rõ ràng, chưa gọi API P5.

## API sau duyệt UI toàn phase

- [ ] Contract/schema/service/hook từ `GET /management/class-sessions/:sessionId/available-mentors` và `PATCH /management/class-sessions/:sessionId/mentor`.
- [ ] Body mentorId UUID hoặc null, expectedVersion/reason và Idempotency-Key; test quyền, pagination/search, stale candidate, request mất response và key/payload cố định.
- [ ] Sau thành công refetch context/lịch/assignment chịu ảnh hưởng; lịch Mentor mới/cũ theo server. Không tự mở quyền hoặc cập nhật thiết bị người khác bằng cache client.

## Kiểm chứng

Coverage cần design cung cấp: gán/xóa, chưa chọn, lý do rỗng, hết quyền, candidate đổi lịch/nghỉ, race version, timeout và Back/offline. E2E đi từ lớp/context Manager, kiểm lịch/quyền Mentor sau thay đổi; không sửa dữ liệu lịch sử. Dùng command tổng P5 khi được triển khai, theo kế hoạch tổng. Chưa có test hoặc kết quả pass.
