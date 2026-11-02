# P6-S2 — quiz-editor

- `GET /mentor/assignments/:id`: đầy đủ câu hỏi, mỗi câu id UUID/position/prompt/options đủ A–D và correctOption riêng tư. Không log/persist/đưa đáp án qua route params.
- `POST /mentor/class-sessions/:sessionId/assignments`: type QUIZ, purpose, title trim 1–250, description ≤20000, maxScore decimal string >0 và tối đa 6 chữ số nguyên/2 thập phân; dueAt/timeLimitMinutes nullable. maxAttempts bỏ qua để backend mặc định 1. Không gửi revision ở create.
- `PATCH /mentor/assignments/:id`: expectedRevision, chỉ các trường title/description/dueAt/timeLimitMinutes đã đổi. Không gửi purpose/type/maxScore/maxAttempts dù vẫn DRAFT. Xóa dueAt/timer gửi null. Response thường thiếu questions; giữ nguyên câu đang soạn và dùng revision server trả về.
- `PUT /mentor/assignments/:id/questions`: expectedRevision và toàn bộ 1–200 câu đúng thứ tự. Câu cũ giữ id, câu mới bỏ id để server cấp; key local không gửi. Prompt trim 1–5000, 4 option nhãn A/B/C/D duy nhất, text trim 1–2000, một correctOption. Response có questions và id mới. PUT mảng rỗng không hợp lệ.

Hai tab lưu riêng, mỗi mutation tăng revision; không tự cộng revision client. 409 giữ form để đối chiếu hoặc tải bản server sau xác nhận bỏ phần chưa lưu, không tự merge/ghi đè. Mất response tạo không tự POST lại, không khẳng định id từ title duy nhất; hiển thị ứng viên để người dùng chọn. PATCH/PUT uncertain kiểm GET và nội dung/revision trước quyết định retry. Mọi form chỉ RAM; soạn offline được, gửi chỉ online.
