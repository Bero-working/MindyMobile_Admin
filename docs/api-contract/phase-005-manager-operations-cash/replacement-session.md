# P5-S3 — Hủy và tạo replacement

[Quy ước chung](README.md). Đọc GET context, lớp và impact độc lập. SCHEDULED lấy /class-sessions/:id/attendance-candidates?page=1&pageSize=1 total; IN_PROGRESS lấy /class-sessions/:id/attendance?page=1&pageSize=1 totals. Nguồn impact lỗi/thiếu không hiện số 0 giả.

POST /management/class-sessions/:id/cancel: key UUID, {reason,expectedVersion}. Response TeachingSessionDto CANCELLED và version mới. Sau hủy UI chuyển bước 2 trên cùng màn, chưa gọi makeups.

POST /management/class-sessions/:id/makeups: key **khác cancel**, body {classUnitId,title,startsAt,endsAt,reason,expectedVersion}. ClassUnitId từ buổi nguồn; title trim 1..250; thời lượng giữ đúng nguồn; không gửi mentorId, attendance hoặc actual times. Version nguồn sau hủy. Response 201 {originalSessionId,originalVersion,classEndDate,session}; originalSessionId/makeupForSessionId phải đúng nguồn. Hiển thị gia hạn lớp nếu server kéo dài, thay route bằng chi tiết buổi mới.

Hai mutation riêng, không giả transaction chung: cancel thành công/create lỗi vẫn là buổi đã hủy. MAKEUP_ALREADY_EXISTS khóa tạo và mở lịch lớp, không quét trước mọi trang để tìm replacement hoặc tạo nhánh từ tổ tiên. Conflict/version/uncertain theo quy ước; retry giữ đúng intent từng bước. Buổi cũ bảo toàn attendance/lịch sử, buổi mới không copy điểm danh/giờ thực tế.
