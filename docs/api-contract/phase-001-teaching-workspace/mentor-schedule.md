# P1-S1 — Mentor schedule

GET `/mentor/schedule`, role MENTOR. Query page/pageSize, from/to ISO timestamp có offset; UI gửi khoảng `[from,to)` theo Asia/Ho_Chi_Minh. Home gửi một ngày, lịch gửi một tuần. Response page TeachingSessionDto. Adapter map sessionId → id, classUnitId → unitId, assignmentType → assignment, actualStartedAt/actualEndedAt, version và snapshot mentors. Chỉ lịch assignment của actor được backend trả; không dựng scope từ tài khoản khác. Timetable không có room/link họp. Query tải hết trang để dấu chấm/ngày không thiếu buổi. Xem [quy tắc chung](README.md).


Bổ sung 31/10/2026 — Thẻ lịch của ngày đang xem gọi GET `/class-sessions/:id/context` riêng để lấy roomName. Không coi room/link vắng trong TeachingSessionDto là backend chưa cung cấp. Hình thức online lấy từ class summary (hoặc context meetingUrl khi chưa có class summary). Loading/error/offline/denied không chuyển thành nhãn thiếu phòng; chỉ context success roomName=null mới hiển thị chưa có thông tin phòng. Không gọi context cho buổi CANCELLED hoặc capability không cho phép. Chỉ tải context cho các thẻ ngày được chọn, không fan-out cả tuần.


UI chốt sau đó ngày 31/10/2026: người dùng bỏ tên buổi khỏi thẻ lịch, giữ tên lớp/phòng; luôn có Điểm danh và Chi tiết. Điểm danh bị khóa trước startsAt, khi thiếu quyền context, khi COMPLETED/CANCELLED hoặc SCHEDULED đã qua endsAt. Đây là điều kiện UI, không thay thế quyền backend; chưa có attendance mutation P2 trong phase này. Home vẫn có Meet theo context khi có link.
