# P6-S3 — Chi tiết, công bố và lưu trữ quiz

**Hiện hành API — 02/11/2026:** Đã tích hợp API thật S1–S3 theo chỉ thị “Tích hợp luôn api”, xem [bằng chứng](api-integration.md) và [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). API 3/3, chưa nghiệm thu. E2E/Maestro tiếp tục được miễn; các dòng “API 0/3/chờ duyệt UI trước API” trong lịch sử bên dưới đã được thay bằng chỉ thị này.

**Hiện hành 02/11/2026:** Đã nhận chỉ thị “triển khai phase 6” và chốt gói theo design; đã có mã UI mock 3 màn để review, API 0/3, chưa duyệt UI/nghiệm thu. Mặc định điểm 10, có xóa draft, form RAM và soạn offline/lưu online; xem [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md) và [hồ sơ UI](ui-review.md). E2E đã dừng và được miễn trong lượt này theo yêu cầu người dùng. Các ghi nhận “chưa có chỉ thị/design/code” bên dưới là lịch sử trước triển khai.

Ngày tách: **02/11/2026 (Asia/Bangkok)**, sau phản hồi “Duyệt” kế hoạch tổng Phase 6. **Kế hoạch tổng đã duyệt; chưa có chỉ thị implement hoặc code UI/API.**

## Phạm vi và đầu vào

BR-QUIZ-01–04; UC-M-11. Phụ thuộc [S1](slice-001-quiz-list.md), dùng draft từ [S2](slice-002-quiz-editor.md) cho luồng đầy đủ. Đối chiếu [kế hoạch tổng](phase-006-mentor-quiz.md) và [tiến độ](../../progress/phase/phase-006-mentor-quiz.md).

Đọc metadata/câu hỏi/đáp án riêng tư của Mentor; publish draft và archive bài đã công bố. Design đích chưa có: `docs/design/mentor-quiz/quiz-detail/design.md`. Trạng thái theo dõi là lifecycle assignment; không có điểm học viên/results/KPI, Student làm bài, ZIP hoặc Manager action. Q-P1-01/policy và các cổng còn mở theo kế hoạch tổng.

## Checklist UI TDD sau khi đủ đầu vào và chỉ thị implement

- [ ] Mở đúng assignmentId, kiểm role/scope và tải detail mới nhất. Hiển thị metadata, revision, dueAt, timer và câu hỏi theo nguồn; questions chưa tải khác mảng rỗng.
- [ ] DRAFT có đường sửa và publish khi đủ điều kiện; PUBLISHED khóa nội dung/cấu hình, có archive theo quyền; ARCHIVED chỉ đọc. Không có unpublish/unarchive/xóa draft trong baseline.
- [ ] Publish xác nhận việc đóng băng nội dung; thiếu câu hoặc hạn không hợp lệ hiển thị đúng lỗi. Đồng hồ local không thay kiểm tra server.
- [ ] Archive bắt buộc lý do 1–2.000 ký tự không trắng; dialog nói rõ có thể vô hiệu hóa attempt đang diễn ra, không mô tả chỉ ẩn bài hay xóa kết quả đã chấm.
- [ ] Pending khóa gửi đôi; success dựa trên server. Lỗi/mất response không đóng dialog như thành công hoặc tự chuyển trạng thái.
- [ ] Đủ loading/empty câu hỏi/error/offline/denied/frozen/state conflict/revision conflict/closed. Không suy hết dueAt thành ARCHIVED.
- [ ] Policy private questions/correctOption được áp dụng khi offline, logout, đổi account hoặc mất scope; không persist/log đáp án. Offline không Retry/tự gửi lại.
- [ ] Nội dung/feedback/skeleton, điều hướng trực tiếp, Back/dialog, vi/en, light/dark và accessibility theo design; không tự thiết kế dashboard.
- [ ] Test fail từ design → mock pass; chờ approve UI toàn phase trước API.

## API sau duyệt UI toàn phase

- [ ] Contract/schema từ GET assignment detail, POST publish với expectedRevision và POST archive với expectedRevision/reason; dùng cookie/origin/auth/error chung.
- [ ] Validate status DRAFT/PUBLISHED/ARCHIVED và revision, nullable dueAt/timeLimitMinutes/publishedAt, optional questions/correctOption ở projection Mentor.
- [ ] Refetch detail trước action khi cần bảo đảm revision/quyền hiện hành; server kiểm lớp CANCELLED/COMPLETED, buổi CANCELLED và scope primary/effective mentor.
- [ ] Publish yêu cầu quiz có câu hợp lệ và dueAt nếu có phải lớn hơn thời điểm server. Test lỗi QUESTIONS_REQUIRED/INVALID_ASSIGNMENT_DEADLINE, không sửa backend để lách luật.
- [ ] Archive chỉ PUBLISHED; test lý do, stale revision, state conflict và tác động attempt bằng fixture hợp lệ. Không gọi Student endpoint như nguồn dashboard Mentor.
- [ ] Xử lý riêng VERSION_CONFLICT/CONTENT_FROZEN/STATE_CONFLICT/CLOSED/SCOPE_REQUIRED/NOT_FOUND và lỗi phiên/mạng; giữ requestId khi có.
- [ ] Mất response đọc lại assignment trước retry; không tự replay mutation, không thêm idempotency header như cam kết server khi chưa có contract.
- [ ] Sau action thành công dùng response/refetch server, invalidate list lớp/buổi/filter liên quan. Response action có thể không kèm questions; không xóa câu hỏi đã tải vì field vắng.

## Kiểm chứng và hoàn thành

Test lifecycle DRAFT → PUBLISHED → ARCHIVED, freeze sau publish, archive draft bị từ chối, archive thiếu reason, deadline trước/đúng/sau hạn, revision cũ và lớp/buổi đóng. Test mất phân công trong lúc mở detail, response chậm, timeout và logout.

Maestro trên dữ liệu thử cô lập: mở draft từ list → kiểm nội dung → publish → thử sửa bị khóa → archive có xác nhận/lý do → mở lại xác minh trạng thái, kèm hồi quy entry/scope P1. Chứng minh tác động attempt chỉ bằng fixture backend được kiểm đủ điều kiện; thiếu fixture ghi blocked/skipped, không pass.

Dùng command tổng `npm run test:e2e:phase-6` khi được triển khai. Chưa có command, test/runtime hoặc bằng chứng pass. API/native E2E phải ghi riêng; nghiệm thu toàn phase vẫn thuộc người dùng.
