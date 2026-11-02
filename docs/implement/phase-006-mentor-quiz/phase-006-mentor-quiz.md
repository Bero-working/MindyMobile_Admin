# Phase 6 — Kế hoạch triển khai Mentor Quiz

**Hiện hành API — 02/11/2026:** Đã tích hợp API thật S1–S3 theo chỉ thị “Tích hợp luôn api”, xem [bằng chứng](api-integration.md) và [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). API 3/3, chưa nghiệm thu. E2E/Maestro tiếp tục được miễn; các dòng “API 0/3/chờ duyệt UI trước API” trong lịch sử bên dưới đã được thay bằng chỉ thị này.

**Hiện hành 02/11/2026:** Đã nhận chỉ thị “triển khai phase 6” và chốt gói theo design; đã có mã UI mock 3 màn để review, API 0/3, chưa duyệt UI/nghiệm thu. Mặc định điểm 10, có xóa draft, form RAM và soạn offline/lưu online; xem [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md) và [hồ sơ UI](ui-review.md). E2E đã dừng và được miễn trong lượt này theo yêu cầu người dùng. Các ghi nhận “chưa có chỉ thị/design/code” bên dưới là lịch sử trước triển khai.

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Bản kế hoạch gốc đã được người dùng duyệt ngày 02/11/2026 qua phản hồi “Duyệt”.** Các mô tả “chưa có chỉ thị/code” và đề xuất còn mở trong bản gốc dưới đây đã được cập nhật bởi phần hiện hành/ADR-031 ở đầu file. Đã tách [3 kế hoạch slice](README.md#kế-hoạch-theo-slice) theo ADR-017, không sử dụng SpecKit. Chưa có chỉ thị implement, chưa tạo design, viết UI, nhập contract hoặc tích hợp API. Các câu hỏi/policy được ghi còn mở bên dưới tiếp tục giữ nguyên; UI 0/3, API 0/3, slice hoàn chỉnh 0/3 (0%); xem [tiến độ thực tế](../../progress/phase/phase-006-mentor-quiz.md).

## 1. Mục tiêu và phạm vi

Mentor xem quiz trong lớp/buổi được cấp quyền, tạo draft, soạn câu hỏi ABCD, công bố và lưu trữ theo trạng thái server. Theo dõi trạng thái ở đây là **DRAFT / PUBLISHED / ARCHIVED của assignment**, chưa bao gồm thống kê học viên làm bài hoặc dashboard điểm.

Giữ baseline 3 slice của [P6](../../implementation-plan.md#p6-mentor-quiz), ưu tiên sản phẩm P1; phụ thuộc P0/P1/P2 và cổng nghiệm thu MVP trước roadmap. Việc lập kế hoạch không xác nhận các phụ thuộc đã nghiệm thu.

| Slice | Kết quả cần đạt | BR / UC | Phụ thuộc |
| --- | --- | --- | --- |
| P6-S1 — quiz-list | Danh sách quiz theo lớp hoặc buổi, lọc/phân trang đúng scope; mở chi tiết hoặc tạo draft gắn buổi cụ thể | BR-QUIZ-01/04; UC-M-11 | P1-S3, P1-S4 |
| P6-S2 — quiz-editor | Tạo draft QUIZ; sửa metadata được phép; thêm/sửa/xóa/sắp xếp câu hỏi và chọn một đáp án đúng | BR-QUIZ-01; UC-M-11 | P6-S1 |
| P6-S3 — quiz-detail | Đọc metadata/câu hỏi/đáp án, xác nhận publish hoặc archive theo trạng thái và revision | BR-QUIZ-01–04; UC-M-11 | P6-S1; draft từ P6-S2 cho luồng đầy đủ |

Confirmation, loading, empty, lỗi, conflict và denied là trạng thái của slice, không tăng số UI. Đề xuất hỗ trợ cả purpose TEST và HOMEWORK trong cùng editor; chỉ type QUIZ. Cần chốt phần quiz của Q-P1-01 trước design/code, không coi đề xuất là phạm vi đã duyệt.

Ngoài baseline: Student start/resume/nộp bài, results queue, điểm từng học viên/KPI, assignmentSummary, ZIP upload/publish/chấm, Manager/Admin authoring, push/chat, unpublish/khôi phục archive, duplicate/import/export. Backend có DELETE draft nhưng chưa đưa vào baseline S1–S3; nếu cần phải chốt rõ trước tách slice.

## 2. Hiện trạng và căn cứ khảo sát

- Đã có module auth, teaching, attendance, materials, leave, operations; có cookie HTTP, kiểm role, primitives, theme và vi/en. Chưa có `src/modules/assignments/`, design `mentor-quiz` hoặc contract P6 tại lần lập này.
- Working tree đang có nhiều thay đổi từ các phase khác. Lượt này chỉ bổ sung hồ sơ P6 và cập nhật liên kết/nhật ký liên quan, giữ nguyên code và các thay đổi đó.
- Đã đọc backend cạnh repo ngày 02/11/2026: [controller Mentor](../../../../Mindy-BE/src/modules/assignments/controllers/mentor-assignments.controller.ts), [input DTO](../../../../Mindy-BE/src/modules/assignments/dtos/assignment-input.dto.ts), [response DTO](../../../../Mindy-BE/src/modules/assignments/dtos/assignment.dto.ts), [assignment service](../../../../Mindy-BE/src/modules/assignments/services/assignments.service.ts), [access service](../../../../Mindy-BE/src/modules/assignments/services/assignment-access.service.ts), [quiz domain](../../../../Mindy-BE/src/modules/assignments/domain/quiz.ts) và [pagination DTO](../../../../Mindy-BE/src/common/dtos/page-options.dto.ts).
- Đây là khảo sát source để lập kế hoạch, chưa phải snapshot contract, kiểm chứng backend deploy hoặc bằng chứng API runtime. Không chạy mutation backend trong lượt này.

Áp dụng ADR-002/003/004/005/007/008 cho kiểu dữ liệu, UI, cache, quyền, lỗi và điểm/thời gian; ADR-009/012/014/016/017 cho phân vai, nguồn design và các cổng; ADR-018/019/025 cho tải dữ liệu/security; ADR-020/026 cho E2E. Tra [sổ ADR](../../adr/README.md) để biết hiệu lực. Những chỉ thị bỏ cổng UI/API riêng ở P3/P4/P5 không tự mở cổng P6.

## 3. Các cổng và điểm cần chốt

| Cổng / câu hỏi | Nội dung | Điều kiện tiếp theo |
| --- | --- | --- |
| Duyệt kế hoạch tổng — đã đáp ứng | Người dùng phản hồi “Duyệt” ngày 02/11/2026 | Đã tách 3 kế hoạch slice theo ADR-017; không đồng nghĩa chỉ thị code/duyệt UI |
| Q-P1-01 — phần quiz | Chốt Mentor authoring QUIZ, TEST/HOMEWORK, publish/archive; có cần xóa draft không; không hứa results/KPI chưa có nguồn | Chốt trước design/code; phần báo cáo/chat/push P7/P8 vẫn độc lập |
| Điều kiện roadmap | Xác nhận nghiệm thu MVP và các phụ thuộc theo baseline | Không tự nâng P6 thành MVP hoặc coi code P2–P5 là nghiệm thu |
| Design/test case Claude | Toàn phase, layout câu hỏi dài/200 câu, trạng thái/quyền, dirty form và xác nhận archive | Codex chỉ đọc design nguồn, không tự tạo/sửa |
| Policy dữ liệu | Chốt cache, draft cục bộ, offline và dữ liệu đáp án riêng tư | Đề xuất RAM-only, không persist hoặc tự queue mutation |
| Chỉ thị implement | Người dùng yêu cầu triển khai sau đọc kế hoạch | UI mock TDD toàn phase khi đủ đầu vào |
| Approve UI toàn phase | Người dùng duyệt đủ S1–S3 | Sau đó mới tạo contract/schema/service/hook API |
| Kiểm chứng và nghiệm thu | Cleanup, lint/typecheck/Jest, build, Maestro toàn phase/hồi quy; Q-PLAT-01 cho nền tảng | Bằng chứng thực tế; chỉ người dùng chuyển Done |

## 4. Mapping API dự kiến

Đường dẫn dưới đây là route trong controller, ghép global prefix/base URL từ cấu hình hiện hành ở bước contract. Không đoán host hoặc tự thêm `/api`.

| Slice | Endpoint khảo sát | Ràng buộc |
| --- | --- | --- |
| S1 | `GET /mentor/classes/:classId/assignments` | Scope lớp hoặc những buổi dạy thay do server lọc |
| S1 | `GET /mentor/class-sessions/:sessionId/assignments` | Buổi được cấp quyền; không lấy dữ liệu toàn lớp để giả scope buổi |
| S2 | `POST /mentor/class-sessions/:sessionId/assignments` | Tạo DRAFT với `type=QUIZ`, purpose, title, maxScore; không nhận expectedRevision |
| S2 | `PATCH /mentor/assignments/:assignmentId` | Chỉ title/description/dueAt/timeLimitMinutes và expectedRevision |
| S2 | `PUT /mentor/assignments/:assignmentId/questions` | Thay toàn bộ danh sách câu hỏi nguyên tử, có expectedRevision |
| S2/S3 | `GET /mentor/assignments/:assignmentId` | Detail Mentor có private correctOption; list không có questions |
| S3 | `POST /mentor/assignments/:assignmentId/publish` | expectedRevision; chỉ draft QUIZ hợp lệ |
| S3 | `POST /mentor/assignments/:assignmentId/archive` | expectedRevision + reason; chỉ PUBLISHED |

Query list hỗ trợ type, purpose, sessionId, status, page và pageSize. Đề xuất luôn gửi `type=QUIZ`; page=1, pageSize=20 (giới hạn server 1–100). Response là `items/total/page/pageSize`; sắp createdAt giảm dần, id tăng dần. Không thêm search/sort/ngày hoặc bộ đếm từng status khi contract chưa có.

Hồ sơ contract sau approve UI dự kiến nằm trong `docs/api-contract/phase-006-mentor-quiz/`, gồm README và contract 3 slice; legacy snapshot có manifest nguồn/ngày. Các đường dẫn này chưa tồn tại, không dùng làm link bằng chứng hiện hành. Khi nhập contract đồng bộ mapping và các đích dự kiến cũ trong implementation-plan.

## 5. Quyền, dữ liệu và mutation

1. Controller authoring chỉ cho MENTOR active, dùng cookie auth và RequestOriginGuard. Không mở action cho MANAGER/ADMIN/STUDENT. Kiểm scope lại khi mở/deep link/mutation, không coi ẩn nút là bảo vệ đủ.
2. Access service cho mentor chính của lớp hoặc effective mentor của buổi; danh sách lớp với accessScope SESSION chỉ chứa các buổi server cho phép. Không thay bằng kiểm createdBy hoặc chỉ cho người tạo sửa. Khi mất phân công, xóa/che cache đúng resource theo auth boundary.
3. Mutation bị chặn khi lớp CANCELLED/COMPLETED hoặc buổi CANCELLED. Không tự khóa tất cả buổi đã kết thúc nếu backend không có luật đó; quyền và trạng thái cuối cùng do server kiểm tra.
4. State machine: tạo → DRAFT; publish DRAFT → PUBLISHED; archive PUBLISHED → ARCHIVED. Không sửa metadata/câu hỏi đã publish, không archive draft, không unarchive. Publish đóng băng nội dung/cấu hình.
5. Tạo draft: title 1–250 ký tự, không toàn khoảng trắng; description tối đa 20.000; maxScore decimal string lớn hơn 0 theo định dạng DTO; QUIZ chỉ một lượt chính thức (`maxAttempts=1`). Time limit null hoặc integer 1–240 phút; dueAt null hoặc ISO instant có timezone. Không tự mặc định 0 thành không giới hạn.
6. Purpose/type/maxScore/maxAttempts chỉ có ở create, không có trong PATCH. Editor draft hiện hữu phải khóa các trường này; không đưa chúng vào payload sửa dù trạng thái vẫn DRAFT. Không thêm endpoint đổi cấu hình.
7. Câu hỏi khi lưu: 1–200 câu; prompt 1–5.000 ký tự; đúng 4 nhãn A/B/C/D duy nhất, nội dung mỗi lựa chọn 1–2.000 ký tự, một correctOption; nội dung không toàn khoảng trắng. Draft mới có thể chưa có câu hỏi nhưng không publish được. Không gọi PUT với mảng rỗng sau khi xóa câu cuối.
8. PUT thay toàn bộ câu hỏi; thứ tự mảng quyết định position. Giữ UUID của câu đang có, câu mới bỏ id để server cấp; không gửi id trùng hoặc thuộc assignment khác. Danh sách chưa tải questions không được xem là quiz có 0 câu.
9. Mỗi PATCH/PUT/publish/archive gửi revision mới nhất; một thành công tăng revision. Lưu metadata rồi questions là hai transaction riêng: dùng revision trả về bước trước, ghi nhận lỗi từng bước, không báo “đã lưu tất cả” khi chỉ metadata thành công. Response PATCH/publish/archive có thể không kèm questions; không ghi đè nội dung đã tải thành mảng rỗng.
10. `ASSIGNMENT_VERSION_CONFLICT` cần đọc lại và cho đối chiếu, không tự overwrite/rebase. Tách lỗi `ASSIGNMENT_CONTENT_FROZEN`, `ASSIGNMENT_STATE_CONFLICT`, `ASSIGNMENT_CLOSED`, `ASSIGNMENT_SCOPE_REQUIRED`, `ASSIGNMENT_NOT_FOUND` và lỗi cấu hình/câu hỏi/deadline theo error adapter. Giữ requestId khi có.
11. Publish yêu cầu câu hỏi hợp lệ và dueAt nếu có phải còn tương lai theo đồng hồ database. UI kiểm trước chỉ hỗ trợ nhập; thời gian máy không thay quyết định server. Hiển thị instant theo timezone nghiệp vụ UTC+7, không ép date-only qua UTC midnight.
12. Archive cần lý do 1–2.000 ký tự không trắng và xác nhận tác động: backend void các attempt IN_PROGRESS và kết thúc job finalization chưa hoàn tất. Không mô tả archive là chỉ ẩn khỏi danh sách hoặc tự khẳng định xóa kết quả đã chấm.
13. Wire maxScore/score giữ decimal string, adapter dùng integer hundredths chính xác theo ADR-008; không parse qua float rồi nhân 100. P6 không tự tính điểm hay lấy Student result DTO làm API dashboard Mentor.
14. Mutation chỉ online, khóa gửi lặp, không optimistic success/auto replay. Controller không khai báo Idempotency-Key cho các mutation này. Mất response cần refetch đúng assignment trước retry; create có thể đã thành công nên không tự POST lại, không suy duy nhất từ title để chọn draft. Ghi rõ tình trạng chưa xác định khi không thể đối chiếu chắc chắn.

## 6. Tải dữ liệu, cache và UI

Các lựa chọn dưới đây là **đề xuất cần chốt trong design/policy**, áp dụng ADR-025.

| Slice | Lựa chọn ban đầu / thời điểm tải | Refresh và phân trang |
| --- | --- | --- |
| S1 | Vào từ lớp giữ classId; vào từ buổi giữ sessionId. Mặc định type QUIZ, tất cả status/purpose, trang 1. Chỉ tải query đang mở | Đổi filter reset trang; load more chỉ danh sách hiển thị; retry đúng trang lỗi, giữ hàng đã tải cùng query |
| S2 | Tạo từ buổi đã chọn; nếu vào từ lớp phải chọn buổi hợp lệ trước POST. Purpose chưa chọn, title/description/câu hỏi trống; đề xuất maxScore 100.00, maxAttempts 1, dueAt/time limit null | Sửa tải detail mới nhất và questions khi mở; không tải trước mọi quiz. Sau save dùng revision mới; quay lại list invalidate query liên quan |
| S3 | Tải đúng assignmentId khi mở; đọc metadata, revision, questions và quyền hiện hành. Chưa mở dialog thì chưa nhập reason | Publish/archive xong đọc trạng thái server, invalidate list lớp/buổi/status tương ứng. Không tải dashboard hoặc attempt theo từng hàng |

Query key gồm tài khoản/role, classId hoặc sessionId, assignmentId khi có, type/purpose/status/page. Đổi filter/resource/tài khoản không hiển thị kết quả cũ dưới nhãn mới; response cũ không ghi đè request mới. total chỉ là tổng của query hiện tại, không suy số câu/số học viên/kết quả từ một trang.

Đề xuất cache server và form chỉ RAM, không persist câu hỏi/đáp án đúng vào MMKV/log/analytics; logout/đổi tài khoản xóa dữ liệu. List/metadata đã tải có thể giữ read-only khi offline và ghi rõ có thể cũ; câu hỏi/đáp án riêng tư và editor bị che/khóa, giữ form trong RAM nếu policy được duyệt. Chưa tải thì hiển thị chưa có dữ liệu offline, không giả empty. Offline warning không có Retry; online/focus trở lại refetch trước khi mở action, không tự gửi form.

Skeleton theo cấu trúc thật; tải thêm giữ hàng cũ; nội dung/empty trước warning/Retry. Phân biệt chưa tải/rỗng/lỗi và số 0 có nguồn. Loading/lỗi metadata và questions được diễn đạt đúng từng phần. Dialog xác nhận có pending/success/error và không đóng như thành công khi request lỗi.

Điều hướng mở/Back/tab trực tiếp, không animation/gesture chuyển màn. Design phải xử lý keyboard, scroll/focus câu lỗi, 200 câu không render nặng, vùng chạm, nhãn đáp án và accessibility, vi/en, light/dark, dirty form khi Back/Android Back. Không tự nhân bản layout P1 hoặc sửa design nguồn.

## 7. Trình tự thực hiện sau khi đủ đầu vào

| Bước | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| P6-01 | Duyệt tổng, chốt Q-P1-01 cho quiz, policy và phụ thuộc | Ghi phản hồi thật, không tự đóng câu hỏi |
| P6-02 | Tách 3 kế hoạch slice; nhận design/test case toàn phase từ Claude | Đủ đầu vào S1–S3 và mapping trạng thái/quyền |
| P6-03 | Sau chỉ thị implement: test fail → model/fixture/UI mock S1 | Danh sách lớp/buổi, scope và trạng thái dữ liệu pass |
| P6-04 | Test fail → editor mock S2 | Validation, dirty form, nhiều câu và lưu nhiều bước được kiểm chứng |
| P6-05 | Test fail → detail mock S3 | Freeze, revision, publish/archive và ảnh hưởng archive pass |
| P6-06 | Rà UI toàn phase, ảnh native và hồi quy entry P1; trình duyệt | Người dùng approve UI đủ 3 slice trước API |
| P6-07 | Nhập legacy/contract; schema/adapter/service test fail → pass | Wire, scope, lỗi, score/time và partial response đúng nguồn |
| P6-08 | Tích hợp list/detail read, sau đó create/PATCH/PUT, rồi publish/archive | Không fallback mock; stale response/revision và mất response có xử lý |
| P6-09 | Cleanup, lint/typecheck/Jest, native build, E2E và hồ sơ | Bằng chứng trên source hiện tại, không lấy pass phase khác |
| P6-10 | Trình nghiệm thu | Người dùng xác nhận; chưa xác nhận không Done |

Kiến trúc dự kiến: `src/modules/assignments/` gồm screens, components, hooks, services/schema, model/types, messages và public index theo module hiện hành. Entry từ MentorClassDetail/SessionContext qua public interface, giữ đúng class/session; không thêm Manager route. Dùng shared HTTP/auth/error/primitives, component không gọi HTTP trực tiếp, không sửa backend trong phạm vi kế hoạch này.

## 8. Ma trận kiểm chứng dự kiến

| Nhóm | Ca kiểm bắt buộc |
| --- | --- |
| S1 / quyền | Mentor chính, dạy thay SESSION, người ngoài, Manager/deep link; class/session mismatch; đổi phân công, 401/403/404 |
| S1 / dữ liệu | Chưa tải/rỗng/lỗi/offline; paging/retry trang lỗi; đổi filter và race response; total đúng query, không gọi detail từng hàng |
| S2 / validation | 0/1/200/201 câu; thiếu/trùng nhãn hoặc đáp án; whitespace và giới hạn ký tự; question id lạ/trùng; đổi thứ tự; decimal score; timer null/1/240/241 |
| S2 / save | Create rồi lưu questions; PATCH thành công/PUT lỗi; revision mới cho bước kế; mất response; chống gửi đôi; dirty Back; đổi account/mất quyền |
| S3 / lifecycle | DRAFT → PUBLISHED → ARCHIVED; thiếu câu, dueAt trước/đúng/sau hạn theo server; sửa sau publish bị khóa; archive thiếu reason; state/revision conflict; lớp/buổi đóng |
| Security / cache | Private correctOption không persist/log/lộ sang role/account khác; questions vắng khác mảng rỗng; không tự chuyển sang Student/API results |
| UI native | Form dài/keyboard/scroll, 200 câu, accessibility, vi/en, light/dark, loading/feedback và Android Back theo design |
| Hồi quy | Auth refresh/logout/denied; entry, class/session context và scope dạy thay P1; dữ liệu attendance P2 nếu bị tác động |

Lệnh kiểm chứng theo package hiện hành: `npm run lint`, `npm run lint:type-check`, `npm test -- --runInBand` và `npm run build:android`. Lệnh lint đã gồm type-check; chỉ chạy riêng khi cần khoanh vùng lỗi. Viết test model/UI/API có ý nghĩa theo design/contract; ghi command/kết quả thực tế ở lần triển khai, không đánh dấu pass trong kế hoạch.

E2E công khai duy nhất khi triển khai: `npm run test:e2e:phase-6` theo ADR-020/026. Command **chưa tồn tại**; sau này tự kiểm môi trường/API và chuẩn bị dataset mới, rồi chạy Maestro S1–S3 và hồi quy. Helper/dataset/flow dự kiến dưới `scripts/` và `.maestro/phase-006-mentor-quiz/`; không tạo command rỗng trong lượt lập kế hoạch.

Dataset cần mentor chính, dạy thay một số buổi, người không có quyền, quiz ở ba trạng thái, revision cũ và fixture deadline/closed. Chỉ dùng dữ liệu thử cô lập cho publish/archive; không archive bài đang được học viên thật làm. Nếu chứng minh tác động attempt phải có fixture backend hợp lệ; không thêm Student UI vào P6 hoặc giả thống kê. Ghi nhánh không đủ dữ liệu là blocked/skipped, không pass.

Chuẩn bị/API thất bại, dataset thiếu/cũ, flow lỗi hoặc bị ngắt phải trả exit code khác 0; API pass không thay native E2E. Lưu build, thiết bị/OS, backend/dataset, log/report/screenshot, ngày và kết quả từng flow. Q-PLAT-01 tiếp tục giữ riêng giới hạn iOS.

## 9. Điều kiện bàn giao

- Đủ S1–S3 theo scope đã chốt, có nguồn design/contract, không mở rộng ZIP/results/role.
- UI được duyệt trước API; mỗi bước có bằng chứng test, metadata/questions/revision và quyền đúng server.
- Cleanup, lint 0 error/0 warning, typecheck/Jest, native build và Maestro toàn phase/hồi quy pass trên bản hiện tại.
- Đồng bộ README, progress và mapping; ghi rõ giới hạn/blocker, commit/PR thật nếu có; chỉ người dùng nghiệm thu mới chuyển Done.

Lượt lập kế hoạch chỉ kiểm tài liệu và liên kết; không chạy test ứng dụng, không tạo bằng chứng runtime, không thay BR hoặc ADR Accepted.
