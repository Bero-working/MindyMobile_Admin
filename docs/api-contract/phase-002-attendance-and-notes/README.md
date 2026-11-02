# P2 — Contract Attendance and Notes

Ngày: 02/11/2026. Người dùng đã duyệt UI 7/7 và yêu cầu “Tích hợp api đi”. Căn cứ: [snapshot nguyên byte và SHA-256](../legacy/2026-11-02-attendance/README.md). Prefix lấy từ API_URL đã cấu hình (`/api/v1`), cookie HttpOnly do native quản lý; không Bearer/storage token. Chỉ Mentor/Manager, không suy quyền từ role khi attendance có permissions.

Mọi mutation attendance: `Idempotency-Key` UUID v4, expectedVersion của session >=1. Retry sau mất response giữ nguyên method/body/key/version, không tự replay khi reconnect. 401 refresh chung rồi replay tối đa một lần; 403/404 che dữ liệu; 409 giữ code riêng SESSION_VERSION_CONFLICT, SESSION_STATE_CONFLICT, ATTENDANCE_EDIT_WINDOW_EXPIRED; không gộp thành version conflict. requestId dùng cho hỗ trợ. Timeout/5xx sau gửi là chưa xác định; không coi đã lưu. Lỗi schema không fallback mock.

Roster: session TeachingSessionDto + permissions; items attendanceId/enrollmentId/entryType/makeupPlacementId/student/status/checkedInAt; totals eligible/present/absent/unmarked toàn snapshot; pendingPaymentCount ngoài totals; page/pageSize/total. Server cung cấp editableUntil nullable, asOf/timeZone, actual times, version và effectiveMentor. Null deadline không cho Mentor sửa. Context lấy attendance pageSize=1 để có quyền thật, không gọi theo từng hàng.

Candidates chỉ preview: items enrollmentId/student/entryType/makeupPlacementId, provisional/asOf và paging; không dùng số preview như snapshot đã start. Audit không tạo before/after hoặc evidence phía client. Pages 1-based, pageSize <=100, đọc đủ trang trước khi lọc tổng cục bộ; đổi resource/filter reset trang.

Các tiện ích dùng GET /manager/students; chỉ khi chọn học viên mới GET /manager/students/:studentId/classes, lấy enrollmentId/class metadata, không query theo mỗi hàng. Classes thường dùng GET /manager/classes; session của lớp dùng GET /management/classes/:classId (class + sessions phân trang, controller cấp MANAGER). Chốt thay không chọn lớp dùng index GET /management/classes và timetable GET /management/classes/:classId đủ trang, chỉ tải khi mở tiện ích; lọc IN_PROGRESS trên tập đầy đủ, gồm cả buổi chưa qua giờ kết thúc theo lịch. Không dùng backlog overdue thay cho toàn bộ buổi đang diễn ra. Không dựng endpoint từ tên mock managerSessions. SessionEdit (đổi cả title và lịch) không có contract tương đương cho Manager; giữ không khả dụng trong live thay vì gửi sai route/admin hoặc bỏ qua version.

Recovery roster: GET /manager/classes/:classId/students; enrollmentStatus/paymentType/paidAt từ server, không lấy thời điểm hiện tại làm bằng chứng. Body UTF-8 <=256 KiB; records <=1000, insert-only, reason/evidenceNote và actualStartedAt/actualEndedAt bắt buộc. Audit filter enrollmentId/makeupPlacementId đúng phạm vi session.

Contract được đối chiếu source; kết quả runtime và phần chưa kiểm ghi riêng ở hồ sơ tích hợp.

## Contract từng slice

| Slice | Contract |
| --- | --- |
| P2-S1 | [attendance-editor](attendance-editor.md) |
| P2-S2 | [teaching-note-editor](teaching-note-editor.md) |
| P2-S3 | [incomplete-sessions](incomplete-sessions.md) |
| P2-S4 | [manager-attendance](manager-attendance.md) |
| P2-S5 | [attendance-correction](attendance-correction.md) |
| P2-S6 | [attendance-recovery](attendance-recovery.md) |
| P2-S7 | [attendance-audits](attendance-audits.md) |
