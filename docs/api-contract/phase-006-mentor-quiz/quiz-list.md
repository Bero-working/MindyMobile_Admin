# P6-S1 — quiz-list

`GET /mentor/classes/:classId/assignments` hoặc `GET /mentor/class-sessions/:sessionId/assignments`. Query luôn `type=QUIZ`; page mặc định 1, pageSize 20 (1–100); status/sessionId chỉ gửi khi đang lọc. Backend cũng hỗ trợ purpose nhưng UI hiện không có bộ lọc purpose.

Response `{ items, total, page, pageSize }`, assignment list không có questions. Thứ tự created_at DESC/id ASC từ server. Không gọi detail từng hàng để đếm câu hoặc tạo tổng hợp; total là của đúng query. Mỗi query gồm class/session/status/filter/page; đổi filter xóa hàng cũ khỏi lựa chọn mới, load more retry cùng trang, khử trùng id. Focus/pull-to-refresh/reconnect tải lại; không persist. List lớp dạy thay do server giới hạn buổi, không thay bằng lọc client toàn lớp.

Lớp/buổi P1 chỉ phục vụ context/lookup/chọn buổi. Chọn buổi tạo phải thuộc lớp và không CANCELLED; buổi COMPLETED vẫn có thể ghi nếu lớp còn mở. Lỗi lookup không làm list assignment thành rỗng.
