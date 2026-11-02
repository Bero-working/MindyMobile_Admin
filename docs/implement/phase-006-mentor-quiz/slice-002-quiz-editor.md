# P6-S2 — Soạn quiz

**Hiện hành API — 02/11/2026:** Đã tích hợp API thật S1–S3 theo chỉ thị “Tích hợp luôn api”, xem [bằng chứng](api-integration.md) và [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). API 3/3, chưa nghiệm thu. E2E/Maestro tiếp tục được miễn; các dòng “API 0/3/chờ duyệt UI trước API” trong lịch sử bên dưới đã được thay bằng chỉ thị này.

**Hiện hành 02/11/2026:** Đã nhận chỉ thị “triển khai phase 6” và chốt gói theo design; đã có mã UI mock 3 màn để review, API 0/3, chưa duyệt UI/nghiệm thu. Mặc định điểm 10, có xóa draft, form RAM và soạn offline/lưu online; xem [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md) và [hồ sơ UI](ui-review.md). E2E đã dừng và được miễn trong lượt này theo yêu cầu người dùng. Các ghi nhận “chưa có chỉ thị/design/code” bên dưới là lịch sử trước triển khai.

Ngày tách: **02/11/2026 (Asia/Bangkok)**, sau phản hồi “Duyệt” kế hoạch tổng Phase 6. **Kế hoạch tổng đã duyệt; chưa có chỉ thị implement hoặc code UI/API.**

## Phạm vi và đầu vào

BR-QUIZ-01; UC-M-11. Phụ thuộc [S1](slice-001-quiz-list.md). Đối chiếu [kế hoạch tổng](phase-006-mentor-quiz.md), [S3](slice-003-quiz-detail.md) và [tiến độ](../../progress/phase/phase-006-mentor-quiz.md).

Tạo draft QUIZ theo session, sửa metadata được phép và thay danh sách câu hỏi ABCD. Design đích chưa có: `docs/design/mentor-quiz/quiz-editor/design.md`; Claude cần cung cấp layout/form, dirty Back, lỗi lưu từng bước, câu hỏi dài và 200 câu. TEST/HOMEWORK, giá trị khởi tạo và policy RAM/offline trong kế hoạch tổng vẫn là các điểm cần xác nhận, không tự coi “Duyệt” kế hoạch là câu trả lời riêng cho mọi câu hỏi còn mở.

## Checklist UI TDD sau khi đủ đầu vào và chỉ thị implement

- [ ] Tạo từ session cụ thể có quyền; form mới chưa chọn purpose, title/description/câu hỏi trống. Các đề xuất maxScore 100.00, một lượt, dueAt/time limit null cần thể hiện đúng trạng thái xác nhận trong design.
- [ ] Title 1–250, description tối đa 20.000; không chấp nhận title chỉ khoảng trắng. maxScore decimal string lớn hơn 0; timer null hoặc integer 1–240; dueAt null hoặc instant có timezone.
- [ ] Khi sửa draft hiện hữu chỉ sửa title/description/dueAt/timeLimitMinutes; khóa purpose/type/maxScore/maxAttempts vì PATCH không nhận các trường đó.
- [ ] Thêm/sửa/xóa/sắp xếp 1–200 câu khi lưu: prompt 1–5.000, đúng A/B/C/D duy nhất, text 1–2.000 và một đáp án đúng; nội dung không toàn khoảng trắng.
- [ ] Draft mới chưa có câu được phân biệt với lỗi chưa tải; không gửi PUT mảng rỗng. Nếu xóa câu cuối, hiển thị yêu cầu bổ sung trước lưu danh sách.
- [ ] Focus/scroll đến câu lỗi, keyboard/Back/dirty form rõ ràng; kiểm 200 câu không render nặng, vi/en, theme, accessibility theo design.
- [ ] Mô phỏng tạo draft rồi lưu câu hỏi và metadata-save/questions-save riêng; bước sau lỗi không báo lưu toàn bộ thành công. Khóa gửi lặp và giữ nội dung chưa lưu theo policy.
- [ ] Có loading/error/offline/denied/revision conflict/frozen/closed/mất response. Offline khóa editor/mutation theo policy tổng, không Retry hoặc tự replay.
- [ ] Test fail từ design → mock pass; chưa tích hợp API trước approve UI toàn phase.

## API sau duyệt UI toàn phase

- [ ] Contract/schema/service cho POST session assignments, GET assignment detail, PATCH metadata và PUT questions theo mapping tổng; không tạo endpoint mới.
- [ ] POST `type=QUIZ`, `maxAttempts=1`; purpose/maxScore chỉ lúc create. Không thêm expectedRevision hay Idempotency-Key không có trong contract create.
- [ ] Giữ decimal string ở wire; parse score sang hundredths chính xác/safe bounds theo ADR-008, không float. ISO instant có timezone, hiển thị UTC+7; null khác 0 và undefined.
- [ ] GET detail mới nhất trước sửa; lưu metadata rồi questions dùng revision trả về từng bước. Response metadata có thể thiếu questions, không biến thành mảng rỗng.
- [ ] PUT nguyên tử toàn bộ câu hỏi; giữ UUID câu cũ, câu mới bỏ id; thứ tự mảng quyết định position. Test id lạ/trùng/ngoài assignment.
- [ ] 409 revision tải lại để đối chiếu, không tự overwrite/rebase. Tách lỗi frozen/closed/scope/config/questions và lỗi mạng.
- [ ] Mất response PATCH/PUT phải đọc lại trước retry. Mất response POST không tự tạo lại hoặc suy draft chỉ bằng title; thể hiện tình trạng chưa xác định nếu không đối chiếu chắc chắn.
- [ ] Sau thành công cập nhật revision đúng server và invalidate list/detail liên quan; không optimistic success hoặc fallback mock.

## Kiểm chứng và hoàn thành

Test 0/1/200/201 câu, thiếu/trùng nhãn/đáp án, giới hạn ký tự, whitespace, timer null/1/240/241, score hợp lệ/không hợp lệ, tải questions lỗi, đổi thứ tự/id và config chỉ-create. Test PATCH pass/PUT fail, stale revision, mất response, mất quyền, logout và dirty Back.

Maestro tạo draft trên dữ liệu thử cô lập → lưu metadata/câu hỏi → mở lại xác minh → chuyển S3. Dùng command tổng P6 khi triển khai, không thêm command E2E công khai riêng cho editor. Chưa có test/runtime hoặc kết quả pass; không sửa design nguồn hay backend trong slice này.
