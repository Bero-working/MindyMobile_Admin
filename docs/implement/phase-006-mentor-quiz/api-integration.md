# P6 — Tích hợp API quiz

Ngày: **02/11/2026 (Asia/Bangkok)**. Người dùng yêu cầu “Tích hợp luôn api”; áp dụng [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). **Đã nối API S1–S3; chưa nghiệm thu phase.** Không chạy E2E/Maestro theo yêu cầu trước và lời nhắc lại của người dùng.

## Thay đổi

- [Contract P6](../../api-contract/phase-006-mentor-quiz/README.md) và [snapshot/manifest](../../api-contract/legacy/2026-11-02-quiz/manifest.json) từ backend cạnh repo ngày 02/11/2026.
- `schema.ts` validate QUIZ, một lượt, UUID/revision, decimal string/thời gian nullable, ABCD và private keys của detail; list không tự tạo questions/count. `service.ts` gửi cookie/Origin, DELETE JSON body, chỉ field PATCH được đổi, bỏ key local và id câu mới ở PUT; giữ id câu cũ.
- `hooks.ts` tải list/detail thật, trang tiếp theo theo query đang mở, khử trùng id, giữ hàng khi trang lỗi, đổi filter không lộ hàng cũ; focus/reconnect/app-active/pull-to-refresh đọc lại. Không dùng cache query khác hoặc fallback mock.
- Live provider tách khỏi mock, giữ cache chỉ RAM; identity auth remount xóa dữ liệu. Response sau đổi account bị chặn bởi isActive; 401 restore một lần, kiểm lại cùng role/email trước retry. Scope/404 clear cache; response revision cũ không ghi đè bản mới hơn.
- Editor hydrate detail bất đồng bộ, hai tab lưu riêng, PATCH không mất câu hỏi đang soạn; revision server cho bước sau. Conflict giữ form và chỉ thay bằng server khi người dùng xác nhận. Publish/archive đọc lại detail để giữ questions và trạng thái/công tắc đáp án đúng.
- Mất response/5xx ghi → uncertain. Chỉ sau GET xác nhận nội dung/trạng thái/revision mới kết luận thành công hoặc mở nút gửi lại cùng ý định. Không tự resend; create uncertain chỉ đưa ứng viên theo title để người dùng kiểm tra, không tự chọn id hoặc tự POST lại. Muốn tạo bản mới phải xác nhận nguy cơ trùng rồi chủ động gửi form.
- Header Date làm nguồn cảnh báo deadline, server vẫn quyết định publish. Thông tin lớp/buổi dùng P1; trạng thái đóng khóa mutation. Không mở ZIP/results/Student/Manager authoring.
- Route/entry quiz có trong app bình thường; API thật được truyền từ AuthNavigation. Chế độ review teachingMock dùng fixture có nhãn, không có HTTP quiz; nhãn mock không xuất hiện trong chế độ live.

## Kiểm chứng thực tế

### API thật, không phải E2E

`node scripts/verify-quiz-api.cjs` **pass 11 nhóm kiểm** bằng adapter mobile thật qua HTTP/cookie. Dùng lớp/buổi fixture P5 có sẵn và tài khoản test tương ứng, không sửa quiz có sẵn. Tạo quiz thử mới, lưu thông tin/câu hỏi, kiểm stale revision, Mentor khác/Manager bị từ chối, publish khóa sửa, archive và DELETE draft 204/GET 404.

Báo cáo: `build-logs/phase-6-api.json`. Quiz thử đã publish được archive, draft phụ đã xóa; quiz ARCHIVED không có API xóa nên giữ lại trong lớp thử cô lập. Không ghi credentials vào báo cáo/Git. Không kiểm Student attempt bị VOIDED vì lượt này không tạo bài làm Student hoặc chạy E2E.

### HTTP mô phỏng, không phải API production hoặc E2E native

Đã dùng Postman CLI 1.77.0 chạy simulation cục bộ `postman/simulations/quiz/quiz.sim.yaml` trên port 4036, rồi `scripts/verify-quiz-simulation.cjs` qua adapter thật. **Pass**: serialization, chỉ một commit khi publish đã ghi nhưng trả 503, GET đối chiếu mà không tự POST lại, stale revision, archive/delete, HTML 503 và scope denied. Log: `build-logs/phase-6-simulation.ndjson`; context ghi ở simulation. Server mô phỏng đã dừng sau kiểm tra; không có E2E/Maestro mới.

### Kiểm tra mã

Bộ test P6 model/UI/mock/service/live: **35/35 test pass** trên 5 suite P6; gồm tải detail async, chuyển filter trong lúc chờ, load-more lỗi retry đúng trang, giữ câu hỏi khi PATCH và reconcile/resend có kiểm tra. TypeScript toàn repo, ESLint phạm vi thay đổi và format đã pass. Lượt kiểm toàn repo: **39/39 suite, 391/391 test pass**; sau đó bổ sung 2 ca mất quyền ở load-more/editor và chạy lại P6 35/35 pass. Kết quả/log: `build-logs/phase-6-api-jest-final.json`, `build-logs/phase-6-quiz-final.json`; phần live sau chỉnh cache cuối chạy lại riêng, `build-logs/phase-6-live-final.json`.

## Giới hạn

Chưa có kiểm chứng native hoàn chỉnh cho bản API sau tích hợp, iOS, offline/reconnect trên thiết bị thật, cookie isolation nhiều account native hoặc tác động archive lên Student attempt. E2E được miễn, không báo pass; các ảnh/build UI trước tích hợp là bằng chứng lịch sử. Chưa có phản hồi nghiệm thu nên phase không Done.
