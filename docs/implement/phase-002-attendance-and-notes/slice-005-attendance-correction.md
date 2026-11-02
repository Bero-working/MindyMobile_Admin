# P2-S5 — Correction và chốt buổi thay Mentor

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-ATT-08/10/11; UC-MG-03. Phụ thuộc S4 và thành phần draft/intent dùng chung S1; UI-05/API-04 trong [kế hoạch tổng](phase-002-attendance-and-notes.md).
- [Design S5](../../design/attendance-and-notes/attendance-correction/design.md), [design chung](../../design/attendance-and-notes/design.md). Route Manager `AttendanceCorrection(sessionId, classTitle?)`.
- Chỉ sửa record hiện hữu; thiếu record đi S6. Theo Q-P2-01 đã duyệt, S5 còn sở hữu sheet Chốt buổi thay mở trực tiếp từ S4, không tăng số slice/route.

## 2. Task UI mock

- [ ] Mapping test fail → mock pass; reuse AttendanceRow/MarkToggle/TotalsStrip/SaveBar/IntentBanner/ConflictPanel; giữ testID correction/finalize theo design.
- [ ] Tải attendance trang 1 `pageSize=100`, thêm bằng nút; không candidates/roster lớp. Toggle chỉ PRESENT/ABSENT, không về UNMARKED; totals không cộng draft.
- [ ] Tiếp tục mở sheet liệt kê baseStatus → giá trị muốn đổi, regular/guest đúng định danh; reason bắt buộc sau trim 1–1000 ký tự. Giữ lý do khi đóng sheet/lỗi/conflict, xóa khi thành công.
- [ ] Bulk có sheet reason riêng, xác nhận toàn snapshot mọi trang/guest bằng server total và cảnh báo bỏ draft. Thành công dùng số changed thật, kể cả 0.
- [ ] Serialize mutation và chặn double tap; chưa rõ kết quả khóa reason/sheet, retry cùng body/key/version. 409 version giữ lý do và đối chiếu từng hàng; state conflict hiển thị riêng; ineligible loại hàng và báo số, không biến correction thành insert.
- [ ] Không áp hạn Mentor lên quyền Manager. canEditAttendance false chặn editor; 403 xóa dữ liệu/draft/reason; offline giữ form RAM nhưng khóa gửi, không Retry; Back dirty dialog.
- [ ] Sheet chốt từ S4: refetch totals/version/quyền, cảnh báo UNMARKED → ABSENT; giờ kết thúc thực tế để trống và reason bắt buộc. Ngày theo actualStartedAt; chỉ nút Dùng giờ theo lịch mới điền endsAt.
- [ ] Kiểm actualStartedAt < actualEndedAt <= asOf theo ngày/giờ Việt Nam; 409 version tải số mới và yêu cầu xác nhận lại. Thành công refresh S4/backlog/Home/audit/buổi lớp.
- [ ] Skeleton/lỗi lần đầu/refresh/load more, mã hỗ trợ, vi/en/theme, accessibility và bàn phím/safe area theo design.

## 3. Mapping kiểm chứng

| ID nguồn | Trọng tâm |
| --- | --- |
| TC-P2-S5-01–12 | Nguồn đọc, toggle, sheet/reason, regular/guest, double tap và success |
| TC-P2-S5-13–25 | Intent/conflict/state/ineligible, bulk mọi trang, quyền/offline/Back/CANCELLED |
| TC-P2-S5-26–31 | Chốt thay: giờ trống, validation, điền lịch có chủ đích, body và xác nhận lại |

Đủ 31 ID; chưa chạy. Bằng chứng finalize phải bao gồm điểm mở S4 và kết quả thẻ S3/Home, không chỉ test form đơn lẻ.

## 4. Task API sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/attendance-correction.md` (chưa tạo).

- [ ] API-00/01 đối chiếu GET/PUT `/class-sessions/:sessionId/attendance`, PUT `/attendance/bulk`, **POST `/class-sessions/:sessionId/finalize` cho Manager**; guard/capability/DTO/lỗi/schema tests fail → pass.
- [ ] Correction gửi expectedVersion/reason/records/guestRecords; bulk gửi checked/reason; finalize gửi expectedVersion/reason/**actualEndedAt** offset +07:00. Không để backend lấy giờ bấm hiện tại thay lịch sử (G-P2-07).
- [ ] UUID v4 và serialize cùng session; retry mất response cùng intent. Query/invalidation account/role/session theo design chung mục 10.1, gồm attendance/context/incomplete + Home/audit/buổi lớp; không fallback mock/log reason.

## 5. E2E và hoàn thành

Dataset: record regular/guest, snapshot trên 100, Mentor đang sửa cùng session, Manager có/mất quyền; buổi IN_PROGRESS quá hạn có actualStartedAt và giờ kết thúc thật để chốt thay. Dùng ứng viên cuối design S5; xác minh correction có audit đúng reason và finalize làm buổi rời backlog. Command tổng dự kiến `npm run test:e2e:phase-2`; kiểm/cổng theo kế hoạch tổng. Q-PLAT-01 còn mở.
