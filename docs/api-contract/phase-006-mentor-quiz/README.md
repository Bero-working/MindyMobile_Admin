# P6 — Mentor Quiz API contract

Đối chiếu backend cạnh repo ngày **02/11/2026**, lưu [manifest/snapshot](../legacy/2026-11-02-quiz/manifest.json). Controller, DTO, service, access và Origin guard trong snapshot là căn cứ; kết quả runtime được ghi riêng trong hồ sơ tích hợp.

Chỉ MENTOR active; cookie HttpOnly qua native jar, `withCredentials=true`; mutation cần Origin từ cấu hình. Chỉ QUIZ, một lượt; TEST/HOMEWORK, không ZIP/results/Student authoring. Lớp/buổi và assignment phải nằm trong scope server. Mất account identity không nhận response cũ. Không tự thêm Idempotency-Key.

| Slice | Contract |
| --- | --- |
| S1 | [quiz-list](quiz-list.md) |
| S2 | [quiz-editor](quiz-editor.md) |
| S3 | [quiz-detail](quiz-detail.md) |

Base URL/global prefix lấy cấu hình ứng dụng. Phản hồi assignment có UUID id/sessionId, type QUIZ, purpose TEST/HOMEWORK, title/description, maxScore decimal string >0, dueAt ISO instant hoặc null, timeLimitMinutes null hoặc 1–240, maxAttempts=1, status DRAFT/PUBLISHED/ARCHIVED, revision integer >0, publishedAt nullable. Adapter giữ wire decimal và chuẩn hóa nhãn/tính chính xác theo ADR-008. Thiếu optional questions khác mảng rỗng; chỉ detail/PUT câu hỏi buộc có questions.

Error envelope đọc code/requestId; 401 refresh phiên một lần và chỉ retry sau xác nhận cùng identity. 403 scope → denied, riêng ORIGIN_NOT_ALLOWED là lỗi cấu hình, giữ dữ liệu. 404 → notFound; 409 VERSION_CONFLICT khác CONTENT_FROZEN/STATE_CONFLICT/CLOSED; 422 lỗi cấu hình/câu hỏi/hạn. Timeout, mất mạng sau gửi, 5xx/408 hoặc thành công sai schema khi ghi → uncertain, không tự gửi lại. Không fallback mock. Header Date dùng cảnh báo hạn theo server; thiếu mới dùng đồng hồ máy, server quyết định publish.
