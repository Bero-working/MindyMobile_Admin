# P6-S3 — quiz-detail

`GET /mentor/assignments/:id` lấy nội dung riêng tư. Các mutation dùng revision của bản được hiển thị, chạy tuần tự và có xác nhận:

| Action | Endpoint/body | Response |
| --- | --- | --- |
| Publish | POST `.../:id/publish`, `{ expectedRevision }` | 200 assignment, thường thiếu questions; GET lại |
| Archive | POST `.../:id/archive`, `{ expectedRevision, reason }` | 200 assignment, thường thiếu questions; GET lại |
| Xóa draft | DELETE `.../:id`, JSON body `{ expectedRevision }` | 204, không parse assignment |

Publish chỉ DRAFT QUIZ đủ câu; dueAt nếu có phải > thời điểm database. Sau publish khóa nội dung/cấu hình. Archive chỉ PUBLISHED, reason trim 1–2000; void attempt IN_PROGRESS và kết thúc job finalization chưa hoàn tất theo backend, không xóa bài đã nộp. ARCHIVED chỉ đọc, không khôi phục. Không dựng số học viên/điểm/attempt count.

Mutation bị chặn nếu lớp COMPLETED/CANCELLED hoặc buổi CANCELLED; UI chỉ là kiểm hỗ trợ. Lỗi conflict/frozen/state cần đọc lại, không tự gửi lại. Uncertain publish/archive kiểm GET trạng thái; uncertain DELETE chỉ coi thành công khi GET 404, không coi lỗi mạng là đã xóa. Nếu GET xác nhận trạng thái và revision chưa đổi mới cho retry rõ ràng, không gửi tự động.
