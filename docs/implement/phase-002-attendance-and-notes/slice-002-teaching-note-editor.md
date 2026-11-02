# P2-S2 — Ghi chú nội bộ của buổi

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-NOTE-01/02, BR-ATT-06; UC-M-07. Phụ thuộc P1-S4, UI-00/01; task UI-03/API-03 trong [kế hoạch tổng](phase-002-attendance-and-notes.md).
- [Design S2](../../design/attendance-and-notes/teaching-note-editor/design.md), [design chung](../../design/attendance-and-notes/design.md). Route Mentor `TeachingNoteEditor(sessionId, classTitle?)`.
- Sở hữu nút Ghi chú buổi học ở context Mentor; nhận action sau finalize S1. Không thêm editor Manager hoặc queue offline note.

## 2. Task UI mock

- [ ] Mapping design → test fail → UI mock pass, giữ testID `note-*`; chưa dùng HTTP thật.
- [ ] Mở chỉ tải context + note. Note null/version 0 khác tải lỗi: lỗi lần đầu không hiện ô trống có thể ghi đè note thật.
- [ ] Chế độ sửa theo effectiveMentor, status, `asOf < editableUntil`; chỉ đọc cho chưa start/hủy/hết hạn/khác người dạy, server vẫn quyết định khi lưu.
- [ ] Hai ô content/nextSteps, đếm code point tối đa 10000/5000, không cắt hoặc trim; cho xóa hết rồi lưu. Không đổi nội dung thì không có SaveBar.
- [ ] Note version độc lập với session; save thành công cập nhật bản server/version và ở lại editor.
- [ ] Mất response/5xx giữ intent, khóa ô khi chưa rõ kết quả; retry nguyên key/body/version. Conflict note giữ chữ của tôi, cho Dùng bản mới có xác nhận hoặc Giữ của tôi rồi tự bấm Lưu với key/version mới.
- [ ] Hết hạn/đổi trạng thái sau nhập: giữ chữ chưa lưu trong vùng chỉ đọc để sao chép; 403 xóa chữ và hiện không quyền. Không nhầm lỗi note với session version conflict.
- [ ] Kiểm thư viện clipboard hiện có trước implement nút Sao chép; nếu thiếu, ghi giới hạn và giữ toàn văn selectable theo design, không tự báo nút đã hoạt động.
- [ ] Refetch không ghi đè chữ dirty; không dirty thì cập nhật theo bản mới. Back/Android Back có dialog; busy khóa Back.
- [ ] Offline đã có dữ liệu vẫn gõ được, khóa Lưu và không Retry/queue/tự gửi khi có mạng lại; chưa có dữ liệu không hiện editor. Chỉ RAM; logout/đổi account xóa dữ liệu.
- [ ] Bàn phím không che ô/SaveBar, ô tự giãn theo design; vi/en, theme, accessibility, skeleton/lỗi từng phần và mã hỗ trợ.

## 3. Mapping kiểm chứng

| ID nguồn | Trọng tâm |
| --- | --- |
| TC-P2-S2-01–10 | Null/version 0, version riêng, empty string/nguyên văn, giới hạn và emoji |
| TC-P2-S2-11–18 | Double tap, intent, note conflict, hết hạn/đổi trạng thái/mất quyền |
| TC-P2-S2-19–26 | Chế độ sửa/đọc theo asOf, Back và refetch dirty |
| TC-P2-S2-27–32 | Lỗi tải, offline/reconnect, độc lập attendance, bàn phím |

Bao phủ đủ 32 ID; mapping tới test/flow cụ thể và kết quả được ghi khi triển khai, chưa có pass.

## 4. Task API sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/teaching-note-editor.md` (chưa tạo).

- [ ] API-00/01 đối chiếu GET/PUT `/class-sessions/:sessionId/teaching-notes` và context; kiểm `RequestOriginGuard`/Origin thực trên mobile (G-P2-10) trước kết luận gọi được.
- [ ] Schema/service tests fail → pass cho nullable note, version ngoài cùng, content/nextSteps và mã lỗi `TEACHING_*`. Body `expectedVersion` của note, UUID v4; retry cùng intent khi chưa rõ.
- [ ] Query/invalidation chỉ note cùng account/role/session; lưu note không gọi/invalidate attendance. Giữ auth/cookie adapter và account isolation; không persist/log nội dung.

## 5. E2E và hoàn thành

Dataset: note null/có note, session version khác note version, còn/hết hạn, đổi assignment và hai phiên tạo conflict. Dùng ứng viên cuối design S2, kiểm bàn phím/native và clipboard nếu có. Command tổng dự kiến `npm run test:e2e:phase-2`; lint/typecheck/Jest/native/E2E và cổng duyệt theo kế hoạch tổng. Q-PLAT-01 còn mở.
