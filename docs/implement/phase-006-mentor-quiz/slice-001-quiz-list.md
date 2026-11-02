# P6-S1 — Danh sách quiz

**Hiện hành API — 02/11/2026:** Đã tích hợp API thật S1–S3 theo chỉ thị “Tích hợp luôn api”, xem [bằng chứng](api-integration.md) và [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). API 3/3, chưa nghiệm thu. E2E/Maestro tiếp tục được miễn; các dòng “API 0/3/chờ duyệt UI trước API” trong lịch sử bên dưới đã được thay bằng chỉ thị này.

**Hiện hành 02/11/2026:** Đã nhận chỉ thị “triển khai phase 6” và chốt gói theo design; đã có mã UI mock 3 màn để review, API 0/3, chưa duyệt UI/nghiệm thu. Mặc định điểm 10, có xóa draft, form RAM và soạn offline/lưu online; xem [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md) và [hồ sơ UI](ui-review.md). E2E đã dừng và được miễn trong lượt này theo yêu cầu người dùng. Các ghi nhận “chưa có chỉ thị/design/code” bên dưới là lịch sử trước triển khai.

Ngày tách: **02/11/2026 (Asia/Bangkok)**, sau phản hồi “Duyệt” kế hoạch tổng Phase 6. **Kế hoạch tổng đã duyệt; chưa có chỉ thị implement hoặc code UI/API.**

## Phạm vi và đầu vào

BR-QUIZ-01/04; UC-M-11. Phụ thuộc P1-S3/P1-S4. Đối chiếu [kế hoạch tổng](phase-006-mentor-quiz.md), [editor S2](slice-002-quiz-editor.md), [detail S3](slice-003-quiz-detail.md) và [tiến độ](../../progress/phase/phase-006-mentor-quiz.md).

Mentor vào danh sách từ lớp hoặc buổi được cấp quyền; xem quiz, mở detail hoặc tạo draft gắn buổi cụ thể. Không có Manager route, ZIP hoặc thống kê kết quả. Design đích chưa có: `docs/design/mentor-quiz/quiz-list/design.md`; layout, route cụ thể và testID chờ Claude. Q-P1-01/policy và các lựa chọn mặc định tiếp tục được xác nhận trước design/code theo kế hoạch tổng.

## Checklist UI TDD sau khi đủ đầu vào và chỉ thị implement

- [ ] Giữ classId/sessionId từ entry. Từ lớp chỉ chọn buổi hợp lệ trước khi mở tạo draft; không tự chọn buổi ngoài scope dạy thay.
- [ ] Đề xuất mặc định type QUIZ, tất cả status/purpose, trang 1/pageSize 20. Chỉ tải phần đang mở, không preload mọi filter hoặc detail từng hàng.
- [ ] Hiển thị metadata có nguồn; list không có questions nên không gán số câu là 0. Total theo query hiện tại, không biến thành bộ đếm mọi status/kết quả học viên.
- [ ] Đổi filter/resource reset trang, ngăn response cũ ghi đè; load more chống request trùng. Lỗi trang sau giữ hàng cùng query và retry đúng trang lỗi.
- [ ] Đủ chưa tải/loading/empty/error/refresh-error/offline/denied/success. Skeleton theo nội dung; nội dung/empty trước warning. Offline không Retry; dữ liệu cache theo policy được chốt.
- [ ] Mất phân công/phiên/đổi tài khoản che hoặc xóa dữ liệu đúng boundary. Role hoặc scope cache không tự cấp quyền deep link.
- [ ] Điều hướng/Back/tab trực tiếp, không animation/gesture chuyển màn; kiểm vi/en, theme, vùng chạm và accessibility theo design.
- [ ] Test fail theo test case design → mock UI pass; mock rõ ràng, không gọi API P6 trước duyệt UI toàn phase.

## API sau duyệt UI toàn phase

- [ ] Nhập contract/schema từ `GET /mentor/classes/:classId/assignments` và `GET /mentor/class-sessions/:sessionId/assignments`; dùng shared cookie HTTP/auth/error.
- [ ] Query type/purpose/sessionId/status/page/pageSize đúng DTO; pageSize 1–100. Không thêm search/sort/ngày chưa có API.
- [ ] Validate `items/total/page/pageSize`, enum/revision/nullable metadata; sắp xếp theo server. Không lấy list toàn lớp để giả scope SESSION.
- [ ] Query key chứa account/role, class hoặc session, filter/page. Refetch sau quay lại từ S2/S3; invalidate các query lớp/buổi/status chịu tác động.
- [ ] Kiểm 401/403/404, stale response, phân trang, offline/focus, primary/substitute và mất scope. Không fallback mock khi API thật lỗi.

## Kiểm chứng và hoàn thành

Test Mentor chính, Mentor dạy thay một số buổi, người ngoài và Manager/deep link; class/session mismatch, filter race, trang lỗi, mất phân công và logout. Maestro đi từ entry P1 → list → detail/editor, quay lại và kiểm dữ liệu mới, kèm hồi quy context/quyền P1.

Chỉ dùng command tổng `npm run test:e2e:phase-6` khi được tạo lúc triển khai; hiện chưa tồn tại. Ghi riêng UI mock, API thật và native E2E; chưa có test hoặc kết quả pass. Slice hoàn chỉnh cần đủ UI/API, bằng chứng kiểm chứng và nghiệm thu theo kế hoạch tổng.
