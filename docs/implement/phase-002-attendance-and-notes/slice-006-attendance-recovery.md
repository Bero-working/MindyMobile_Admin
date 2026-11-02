# P2-S6 — Khôi phục điểm danh bằng bằng chứng

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-ATT-08/10; UC-MG-03. Phụ thuộc S4, shared form/intent/time components; UI-05/API-04 trong [kế hoạch tổng](phase-002-attendance-and-notes.md).
- [Design S6](../../design/attendance-and-notes/attendance-recovery/design.md), [design chung](../../design/attendance-and-notes/design.md). Route Manager `AttendanceRecovery(sessionId, classTitle?)`.
- Insert-only record regular còn thiếu; không recover guest/nhập người dạy/giả thanh toán. Điều kiện canRecover và endsAt <= asOf; IN_PROGRESS/CANCELLED không mở form.

## 2. Task UI mock

- [ ] Mapping test fail → mock pass, giữ testID `recovery-*`; mở context + attendance pageSize=1 để lấy quyền/totals/version.
- [ ] SCHEDULED: ngày/giờ/bằng chứng/reason và lựa chọn học viên đều trống. Giờ server đã biết ở COMPLETED chỉ đọc và giữ nguyên. Chỉ điền lịch khi người dùng bấm nút tương ứng.
- [ ] DateField dd/MM/yyyy và TimeField HH:mm theo Việt Nam, kiểm ngày có thật/start < end <= asOf; lệch ngày lịch chỉ cảnh báo. Form chưa hỗ trợ kết thúc 00:00 hôm sau theo giới hạn design, phải ghi khi review.
- [ ] evidenceNote sau trim 1–2000, reason 1–1000; lỗi focus ô đầu. Không upload file.
- [ ] Chỉ mở sheet chọn học viên khi giờ hợp lệ, lúc đó mới đọc roster Manager pageSize=100; tìm cục bộ trên hàng đã tải. Nếu eligible > 0 thì đọc đủ snapshot pageSize=100 trước kết luận ai chưa có record; chưa rõ thì khóa chọn.
- [ ] Khóa người đã có record, ghi danh ngoài ACTIVE/COMPLETED/CANCELLED, chưa thanh toán; paidAt <= start dùng PAID_BEFORE_START, CASH sau start dùng CASH_LATE_ADMISSION, loại khác trả sau giờ khóa. Không hiện số tiền/order id.
- [ ] Người dùng tự chọn PRESENT/ABSENT từng người; không UNMARKED/mặc định Vắng. Đổi giờ tính lại cơ sở, bỏ người không hợp lệ và báo số. Tối thiểu 1/tối đa 1000 records.
- [ ] Tính kích thước UTF-8 JSON đúng body, chặn >256 KiB; không cắt/chia lô. Review nêu thời gian/evidence/reason/số người, tác động SCHEDULED → COMPLETED và không hoàn tác; lấy lại version/quyền trước xác nhận.
- [ ] Intent bất biến; mất response khóa form, retry cùng request. Version conflict giữ form; RECORD_EXISTS bỏ người đã có, CLOCK_CONFLICT giữ giờ server và tính lại, EVIDENCE_INVALID không đoán học viên; 413 không gửi lại body quá lớn.
- [ ] State conflict dừng form nhưng giữ evidence đọc/sao chép; 403/401/404 xóa theo auth boundary. Offline giữ form RAM/khóa gửi/không Retry, reconnect không tự gửi; dirty Back có dialog.
- [ ] Thành công về S4; người không chọn không có record, không hiển thị Vắng; effectiveMentor null giữ đúng thiếu dữ liệu. Vi/en/theme/a11y/keyboard/skeleton theo design.

## 3. Mapping kiểm chứng

| ID nguồn | Trọng tâm |
| --- | --- |
| TC-P2-S6-01–10 | Điều kiện mở, form trống/giờ server, timezone/date/evidence validation |
| TC-P2-S6-11–22 | Lazy lookup, đủ snapshot, payment basis, chọn trạng thái, giới hạn/UTF-8 |
| TC-P2-S6-23–32 | Review/request/intent, version/record/clock/evidence/state conflict, 413 |
| TC-P2-S6-33–37 | Mất quyền, Back/offline và kết quả không bịa record/người dạy |

Đủ 37 ID; chưa có test/flow hoặc kết quả thực. Bảng case nguồn là căn cứ kỳ vọng, không dùng kế hoạch làm bằng chứng đã kiểm backend.

## 4. Task API sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/attendance-recovery.md` (chưa tạo).

- [ ] API-00/01 đối chiếu POST `/management/class-sessions/:sessionId/attendance/recover`, GET context/attendance, GET `/manager/classes/:classId/students`; DTO/body limit/payment scope và nullable fields; schema/service tests fail → pass.
- [ ] Body expectedVersion/reason/evidenceNote/actualStartedAt/actualEndedAt/records[{enrollmentId,status,admissionBasis}], UUID v4. Server kiểm createdAt/enrollment/payment mà lookup không đủ; không tự coi client validation là chứng minh hợp lệ.
- [ ] Query key/invalidation account/role/session gồm attendance/context/backlog/Home/audit/buổi lớp. Không sửa backend hoặc tạo dữ liệu lịch sử thiếu căn cứ để làm test pass; không log/persist evidence/reason.

## 5. E2E và hoàn thành

Dataset thật: SCHEDULED đã diễn ra có evidence/giờ, COMPLETED thiếu record, người đã có record, paidAt trước start, CASH muộn và PAYOS muộn, conflict/giờ server. Dùng ứng viên cuối design S6; thiếu dữ liệu thanh toán thật ghi blocked cho case, không tạo lịch sử giả. Command tổng dự kiến `npm run test:e2e:phase-2`; kiểm/cổng theo kế hoạch tổng. Q-PLAT-01 còn mở.
