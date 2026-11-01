# Phase 2 — Kế hoạch triển khai Attendance and Notes

Ngày lập: **01/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Kế hoạch tổng — chờ người dùng duyệt.** Lượt này lập tài liệu; chưa tách kế hoạch slice, chưa viết design/code hoặc tích hợp API. Tiến độ UI/API giữ 0/7; trạng thái thực tế tại [progress P2](../../progress/phase/phase-002-attendance-and-notes.md).

## 1. Mục tiêu và phạm vi

Mentor bắt đầu buổi, điểm danh đúng snapshot, đồng bộ roster, chốt buổi và ghi chú nội bộ. Manager đọc danh sách buổi cần xử lý, xem điểm danh, correction có lý do, recovery có bằng chứng và tra audit. Giữ **7 slice** của [baseline P2](../../implementation-plan.md#p2-attendance-and-notes), ưu tiên sản phẩm P0, phụ thuộc P0/P1.

| Slice | Kết quả cần đạt | BR / UC | Phụ thuộc |
| --- | --- | --- | --- |
| P2-S1 — attendance-editor | Preview → start online → roster snapshot → đánh dấu/bulk/sync → finalize; sửa trong hạn | BR-ATT-01–09/11, BR-OFF-01/02; UC-M-04/05/06 | P1-S4 |
| P2-S2 — teaching-note-editor | Đọc và lưu content/nextSteps nội bộ, version note riêng | BR-NOTE-01/02, BR-ATT-06; UC-M-07 | P1-S4 |
| P2-S3 — incomplete-sessions | Danh sách buổi cần xử lý, issue/filter/phân trang theo backend | BR-ATT-01/05, BR-REPORT-01; UC-MG-02/03 | P1-S6 |
| P2-S4 — manager-attendance | Đọc snapshot, totals, quyền và action hợp lệ của buổi | BR-ATT-03/10, BR-REPORT-01; UC-MG-03 | P2-S3; context P1-S4 |
| P2-S5 — attendance-correction | Sửa record hiện hữu với lý do, version/key và audit | BR-ATT-08/10/11; UC-MG-03 | P2-S4 |
| P2-S6 — attendance-recovery | Khôi phục insert-only dựa trên bằng chứng lịch sử | BR-ATT-08/10; UC-MG-03 | P2-S4 |
| P2-S7 — attendance-audits | Đọc lịch sử correction/recovery thật, phân trang/filter đúng scope | BR-ATT-10; UC-MG-03 | P2-S4 |

Confirmation, loading, conflict và recovery feedback là trạng thái trong các slice, không tăng số UI. Không mở rộng sang tạo enrollment, CASH, xếp lịch bù, phân công mentor, tài liệu, quiz hoặc dashboard/KPI mới. Manager sửa teaching note có route backend riêng nhưng không tự thêm editor đó vào phạm vi 7 slice hiện tại.

## 2. Hiện trạng và căn cứ

- P1 đã được người dùng nghiệm thu ngày 01/11/2026, UI/API 7/7: [hồ sơ rà soát](../phase-001-teaching-workspace/review-cleanup.md). P0 đã được duyệt; giới hạn nền tảng/bằng chứng còn lại tiếp tục theo [progress P0](../../progress/phase/phase-000-foundation-auth.md).
- Đã có `src/modules/teaching/`, context buổi, auth, HTTP cookie, i18n/theme và UI primitives. `SessionContextScreen.tsx` hiện giữ số điểm danh chưa có nguồn là `—`; P2 cần thay bằng dữ liệu thật trong phạm vi được duyệt, không suy từ roster toàn lớp.
- Chưa có module attendance, design `attendance-and-notes`, contract hoặc bộ E2E P2. HTML tham khảo không thay design/test case cấp phase và từng slice.
- Đã đọc source backend cạnh repo ngày 01/11/2026: [attendance controller](../../../../Mindy-BE/src/modules/attendance/controllers/attendance.controller.ts), [management controller](../../../../Mindy-BE/src/modules/attendance/controllers/attendance-management.controller.ts), [query DTO](../../../../Mindy-BE/src/modules/attendance/dtos/attendance-report-query.dto.ts), [input DTO](../../../../Mindy-BE/src/modules/attendance/dtos/attendance-input.dto.ts), [note controller](../../../../Mindy-BE/src/modules/teaching-operations/controllers/teaching-notes.controller.ts), [note DTO](../../../../Mindy-BE/src/modules/teaching-operations/dtos/teaching-note.dto.ts). Đây là căn cứ lập kế hoạch, chưa xác minh deploy/runtime, chưa chạy mutation backend.
- Working tree có thay đổi từ công việc P1 trước lượt này; giữ nguyên và không dùng làm bằng chứng thực hiện P2.

Áp dụng ADR-004/005/006/007/008/009 về dữ liệu, quyền, offline, lỗi, thời gian và TDD; ADR-016/017 về kế hoạch; ADR-018/019 về lazy loading/security; ADR-020/025/026 về E2E và chuẩn chung. Tra [sổ ADR](../../adr/README.md) để đọc hiệu lực hiện hành; không sửa ADR Accepted hoặc tự coi kế hoạch này là phê duyệt nghiệp vụ.

## 3. Cổng đầu vào và câu hỏi cần chốt

| Cổng / câu hỏi | Nội dung | Phần phụ thuộc |
| --- | --- | --- |
| Duyệt kế hoạch tổng | Người dùng đọc và duyệt tài liệu này theo ADR-017 | Sau duyệt mới tách 7 kế hoạch slice; chưa tự cho phép code |
| Q-DATA-01 | Có persist roster/draft không; mã hóa, retention và logout/đổi tài khoản xử lý thế nào? | Chưa bật query persistence, draft/queue lưu bền hoặc hứa phục hồi sau app-kill |
| Q-OFF-01 | Offline chỉ với trang đã tải hay phải đủ snapshot; batch/serialize thao tác liên tiếp, mất response và reconnect xử lý thế nào? | Trước design/implement phần draft/queue offline S1; không tự bỏ offline khỏi scope |
| Q-ATT-01 | Manager chỉ cần incomplete list hay thêm KPI; chốt filter theo DTO | Trước chốt design S3; đề xuất chỉ dùng danh sách endpoint hiện có |
| Q-PLAT-01 | Mốc nghiệm thu Android/iOS và thiết bị/OS tối thiểu | Chốt bằng chứng nền tảng trước nghiệm thu P2; không lấy test P1 thay thế |
| Design toàn phase | Claude cung cấp design chung và đủ 7 slice, trạng thái/quyền/test case | Trước UI TDD; Codex không tự viết/sửa design nguồn |
| Chỉ thị implement | Người dùng yêu cầu code sau khi đọc kế hoạch | Mở giai đoạn UI mock khi đủ đầu vào |
| Duyệt UI toàn phase | Người dùng approve cả 7 slice | Trước tạo contract/schema/service/hook API thật và tích hợp |
| Contract và dữ liệu thử | Legacy snapshot, route/DTO/quyền, tài khoản và session phù hợp từng case | Trước API/E2E thật; không bịa endpoint/dataset hoặc tự sửa backend |

Đề xuất trong tài liệu chưa thay câu trả lời người dùng. Phần độc lập có thể tiếp tục đúng cổng; phần phụ thuộc câu hỏi vẫn chờ. S1 chưa hoàn tất nếu phần offline được giữ trong phạm vi mà chưa chốt/kiểm chứng. Mọi thay đổi luật hoặc ranh giới đã duyệt đi qua ADR theo quy trình hiện hành.

## 4. Hồ sơ và cấu trúc dự kiến

Sau duyệt tổng mới tạo `slice-001-attendance-editor.md` đến `slice-007-attendance-audits.md` trong folder này. Chưa tạo các file đó trong lượt lập kế hoạch.

Design Claude cần cung cấp: `docs/design/attendance-and-notes/design.md` và `docs/design/attendance-and-notes/<slice-slug>/design.md` theo 7 slug ở mục 1. Design chung cần có điều hướng từ Home/context P1, component tái sử dụng, vi/en, light/dark, accessibility, keyboard, spacing, loading/empty/error/offline/no-permission/success, conflict và test case tương ứng. Đường dẫn này là đích dự kiến, chưa có file.

| Vị trí dự kiến | Trách nhiệm |
| --- | --- |
| `src/modules/attendance/screens/` | 7 UI theo design; context và entry point P1 chỉ thay trong phạm vi P2 |
| `src/modules/attendance/components/` | Hàng regular/guest, totals, editor, xác nhận bulk/finalize, conflict, evidence/audit |
| `src/modules/attendance/types/` | Model UI và mutation intent rõ kiểu; mock không được coi là wire DTO |
| `src/modules/attendance/services/` | Mock boundary ở UI; Zod schema và HTTP thật ở bước API |
| `src/modules/attendance/hooks/` | Query theo resource/filter; điều phối mutation/session và note version độc lập |
| `src/modules/attendance/index.ts` | Public exports; module khác không import sâu nội bộ |
| `src/modules/auth/AuthApp.tsx`, `src/navigation/` | Khai báo route/params và entry point đúng role; giữ auth gate và lazy screen hiện có |
| `src/translations/`, module messages | Bổ sung namespace vi/en theo quy ước code hiện hữu |
| `__tests__/`, `scripts/`, `.maestro/phase-002-attendance-and-notes/` | UI/API tests, runner và flow native khi đến bước tương ứng |

Contract đích sau duyệt UI: `docs/api-contract/phase-002-attendance-and-notes/<slice-slug>.md` cùng README; legacy snapshot theo quy ước [API index](../../api-contract/README.md). Tên này gom theo phase như P0/P1, thay đích phẳng dự kiến trong baseline cũ khi file thật được tạo. Không tạo link tới contract/design chưa tồn tại.

Giữ React Native/TypeScript strict, không explicit `any`/`unknown`, screen không gọi HTTP trực tiếp, service không điều hướng, tái sử dụng primitives/auth/theme. Không cài dependency hoặc refactor P0/P1 ngoài nhu cầu P2 trong lượt kế hoạch.

## 5. Quy tắc dữ liệu và mutation

1. Candidates chỉ preview trước start. Start online chụp roster/người dạy/thời gian thật, chuyển IN_PROGRESS; Mentor chỉ start đúng ngày nghiệp vụ và class hợp lệ. Thời gian qua `startsAt` không tự start.
2. Attendance đọc snapshot phân trang và totals toàn roster từ server. Phân biệt regular/guest bằng ID đúng DTO; thiếu record khác UNMARKED và không tự là ABSENT. Sync chỉ thêm đối tượng đủ điều kiện backend, không dựng snapshot bằng candidates hoặc roster toàn lớp.
3. Ghi điểm danh dùng `expectedVersion` của buổi và UUID v4 `Idempotency-Key`; serialize mutation cùng session. Intent đã gửi giữ nguyên body/key/version khi retry mất response; thay đổi sau đối chiếu là intent mới, không sửa payload của request cũ.
4. Bulk `checked=true/false` là PRESENT/ABSENT cho **toàn snapshot mọi trang, cả guest**. Xác nhận rõ phạm vi, không chỉ đếm hàng đang hiển thị hoặc mô tả thành reset UNMARKED.
5. Finalize luôn online; đồng bộ các thay đổi cần lưu trước, cho thấy tác động UNMARKED → ABSENT và chuyển COMPLETED trước xác nhận. Nếu totals/version thay đổi thì tải lại và đối chiếu tác động, không dùng xác nhận cũ cho snapshot mới.
6. Mentor có thể sửa COMPLETED trong hạn/phạm vi server. `now < editableUntil`; học 23/10 thì hạn 00:00 25/10 theo timezone nghiệp vụ, không cộng 48 giờ từ start. Hết hạn/mất assignment giữa thao tác vẫn do backend kiểm.
7. 409 version: tải bản mới, giữ rõ phần chưa được chấp nhận và yêu cầu đối chiếu; không last-write-wins/rebase tự động. 409 trạng thái/hết hạn không bị gộp thành version conflict hoặc báo đã đồng bộ. Hiển thị mã hỗ trợ/requestId khi có.
8. Teaching note nội bộ: content tối đa 10000, nextSteps 5000; chưa có note dùng version 0. Note version riêng, không dùng `session.version`. Mutation có key; không mở rộng queue offline attendance sang note.
9. Manager correction chỉ sửa record hiện hữu, reason bắt buộc. Recovery là insert-only, cần evidence lịch sử, người dạy/actual times/quan hệ thanh toán hợp lệ, giới hạn body 256 KiB theo backend. Không tự lấy roster hoặc thời gian hiện tại để dựng lịch sử còn thiếu.
10. Quyền lấy từ server, revalidate sau focus/mutation theo nhu cầu. Route/deep link phải kiểm role/scope; không lộ dữ liệu tài khoản trước. Chưa chốt Q-DATA/Q-OFF thì chưa hứa persist draft, replay sau restart hoặc tự xóa draft theo policy mới.

## 6. Tải dữ liệu, trạng thái ban đầu và cache

Các lựa chọn mới dưới đây là đề xuất để duyệt/design, áp dụng ADR-025. Chỉ tải phần đang dùng; các request xác thực/quyền và bảo đảm mutation đúng dữ liệu vẫn cần thực hiện.

| Slice | Lựa chọn ban đầu / lúc tải | Phân trang và refresh |
| --- | --- | --- |
| S1 | Session từ context P1; tải context/quyền, rồi candidates nếu chưa start hoặc attendance nếu đã có snapshot. Không tải candidates và snapshot đồng loạt để trang trí | Trang đầu khi mở; load more chỉ danh sách đang mở. Mutation cập nhật/invalidate snapshot, totals và context đúng session; không tăng page khi request đang chạy |
| S2 | Đọc note/version khi mở editor; không preload mọi note từ danh sách session | Không phân trang. Sau lưu lấy version note server trả; refresh không âm thầm ghi đè nội dung đang sửa |
| S3 | Mặc định toàn backlog unresolved overdue theo API, không tự giới hạn tuần hoặc gán from/to. Issue/class chưa chọn; chỉ tải trang đầu | Đổi filter mới tải; DTO có classId, issue OVERDUE_NOT_STARTED/STARTED_NOT_FINALIZED và cặp from/to tối đa 93 ngày. Không dựng KPI từ một trang |
| S4 | Đọc context và trang attendance đầu khi mở session Manager; note/audit không tự tải kèm | Load more đúng session/filter. Refresh sau correction/recovery; quyền quyết định action, không suy chỉ từ role/status |
| S5 | Record được chọn từ S4, đối chiếu snapshot/version trước sửa; form lý do trống | Chỉ tải thêm khi cần chọn record; sau mutation refresh S4/context và invalidate queue/audit liên quan |
| S6 | Form evidence trống theo DTO/design; lấy context và dữ liệu cần xác minh khi mở | Không preload mọi enrollment/lịch sử; lỗi thiếu dữ liệu không được điền bằng dữ liệu phỏng đoán |
| S7 | Trang audit đầu của session, chưa lọc enrollment; mở S7 mới gọi audit | Filter theo query backend; đổi filter reset page, lỗi load more retry đúng trang và giữ hàng cũ |

Query key phải bao gồm tài khoản/role, session/resource, filter và page theo kiến trúc. Đổi session/filter/tài khoản không hiển thị dữ liệu cũ dưới nhãn mới; response cũ không ghi đè lựa chọn mới. Không gọi API từng hàng chỉ để lấy thông tin phụ hoặc đếm status chưa mở.

Cache đọc dự kiến chỉ trong bộ nhớ, không bật persist nhạy cảm. Khi mất mạng: dữ liệu đã tải của cùng query có thể hiển thị read-only với cảnh báo cũ/chưa đồng bộ; chưa tải thì hiển thị trạng thái chưa có dữ liệu offline, không giả empty/0. Không Retry trong warning offline; phục hồi qua kết nối/focus/pull-to-refresh. Start/sync/finalize/correction/recovery/note save cần online; draft attendance offline theo Q-OFF-01, không dùng read-only cache để tự quyết chính sách draft. Phiên/quyền không còn hợp lệ phải che/xóa dữ liệu theo auth boundary hiện hành.

Skeleton theo nội dung từng phần; tải thêm giữ hàng có sẵn. Empty/content trước warning/Retry; lỗi phần độc lập không khóa cả màn trừ lỗi auth/quyền. Mở màn/Back/tab trực tiếp, không animation/gesture chuyển màn; spacing/token và vùng chạm theo hệ thống chung. Không lấy số đếm chưa tải làm 0.

## 7. Thứ tự thực hiện UI mock

Sau duyệt tổng: tách kế hoạch slice → giải quyết đầu vào → Claude hoàn tất design/test case → người dùng yêu cầu implement. Tất cả task dưới đây **chưa thực hiện**; TDD từ test fail → mock pass, chưa dùng HTTP thật.

| Task | Công việc | Phụ thuộc / điều kiện hoàn thành |
| --- | --- | --- |
| UI-00 | Đối chiếu design/BR/ADR, mapping test case 7 slice, ghi phần thiếu và quyết định offline/filter | Đủ đầu vào mục 3; không tự sửa design Claude |
| UI-01 | Module/mock fixture/route/role, shared feedback, i18n/theme và entry point context/Home theo design | UI-00; giữ hồi quy P0/P1 |
| UI-02 | S1 preview/start/roster regular+guest, đánh dấu, bulk mọi trang, sync, finalize và sửa trong hạn | UI-01; bao phủ empty snapshot, hết hạn, conflict/mất response, phần draft sau chốt policy |
| UI-03 | S2 note editor, version riêng, validation, dirty state/Back, lỗi/quyền | UI-01; không dùng version buổi hoặc hứa offline save |
| UI-04 | S3 queue và S4 Manager snapshot/action | UI-01; backlog/filter/totals đúng; correction và recovery phân biệt rõ |
| UI-05 | S5 correction, S6 recovery evidence và S7 audit | UI-04; reason, validation, insert-only, giới hạn request, phân trang audit |
| UI-06 | Toàn phase: loading/empty/error/offline/success/denied, vi/en/dark, accessibility, navigation và native review | UI-02–05; mapping test case đầy đủ, ảnh native đã xem |
| UI-REVIEW | Lint/typecheck/Jest và trình người dùng duyệt UI cả 7 slice | UI-06; dừng trước API cho đến phản hồi duyệt |

## 8. API sau khi UI toàn phase được duyệt

[Mapping khảo sát](../../api-contract/README.md#p2-s1) và source backend là đầu vào, không phải bằng chứng contract chạy thật.

| Slice | Route cần đóng gói/kiểm chứng |
| --- | --- |
| S1 | GET `/class-sessions/:sessionId/attendance-candidates`; GET `/class-sessions/:sessionId/attendance`; POST `/class-sessions/:sessionId/start`; PUT `/class-sessions/:sessionId/attendance`; PUT `/class-sessions/:sessionId/attendance/bulk`; POST `/class-sessions/:sessionId/attendance/sync-roster`; POST `/class-sessions/:sessionId/finalize` |
| S2 | GET/PUT `/class-sessions/:sessionId/teaching-notes` cho Mentor |
| S3 | GET `/management/class-sessions/incomplete` |
| S4 | GET `/class-sessions/:sessionId/context`; GET `/class-sessions/:sessionId/attendance` |
| S5 | PUT attendance và attendance/bulk như S1, kèm reason bắt buộc đối với Manager |
| S6 | POST `/management/class-sessions/:sessionId/attendance/recover` |
| S7 | GET `/management/class-sessions/:sessionId/attendance-audits` |

| Task | Công việc | Phụ thuộc / điều kiện hoàn thành |
| --- | --- | --- |
| API-00 | Nhập legacy nguyên bản, contract 7 slice: request/response/error, permission, pagination, header/key/version và limit | Duyệt UI; đối chiếu source/OpenAPI/runtime khi có; chênh lệch ghi rõ |
| API-01 | Schema/service/query/mutation tests fail → pass; query key và account isolation | API-00; không fallback mock khi server lỗi |
| API-02 | Tích hợp S1; serialize mutation, retry cùng intent, conflict, refresh snapshot/totals/context | API-01; kiểm regular/guest và toàn snapshot nhiều trang |
| API-03 | Tích hợp S2; version note độc lập và retry/conflict riêng | API-01; kiểm null note/version 0 và giới hạn ký tự |
| API-04 | Tích hợp S3/S4 và S5/S6/S7; server scope, reason/evidence, audit và invalidation | API-01; endpoint/DTO và dữ liệu từng nhánh đã kiểm |
| API-05 | Offline/reconnect theo policy đã chốt; mạng rớt sau commit, app active, đổi quyền/hết hạn/tài khoản | API-02–04; không đánh dấu xong khi policy hoặc bằng chứng còn thiếu |
| VERIFY-01 | Cleanup, lint 0 error/0 warning, typecheck, Jest; rà native UI trên source hiện tại | API-05; ghi command/kết quả và giới hạn thực tế |
| E2E-01 | Runner duy nhất, API/dataset mới → Maestro phase 2 và hồi quy liên quan | VERIFY-01; mọi bước bắt buộc pass, không dùng dataset cũ nếu setup lỗi |
| ACCEPT-01 | Trình bằng chứng, giới hạn và toàn luồng hai role cho người dùng nghiệm thu | E2E-01; chỉ chuyển Done sau nghiệm thu |

Sau mutation cập nhật/invalidate đúng dữ liệu buổi, totals, note, queue/audit và context P1 bị ảnh hưởng; không refetch mọi lớp/ngày/tab. Không auto-refetch ghi đè draft đang sửa. Các hành động chốt/mutation phụ thuộc phải chờ intent trước được xác định kết quả.

## 9. Ma trận kiểm chứng bắt buộc

| Nhóm | Case tối thiểu |
| --- | --- |
| Quyền / thời gian | PRIMARY/SUBSTITUTE đúng assignment; deep link trái quyền; sai ngày start; class/buổi hủy; hết hạn tại đúng editableUntil; đổi assignment khi màn đang mở |
| Snapshot / bulk | Candidates khác roster đã chụp; snapshot rỗng; regular/guest; nhiều trang; record thiếu khác UNMARKED; bulk ảnh hưởng trang chưa tải; sync không đưa enrollment chưa hợp lệ vào |
| Finalize | Draft còn chưa sync; xác nhận totals UNMARKED; UNMARKED → ABSENT; version đổi trước confirm; sửa COMPLETED còn hạn; không tự start/finalize theo đồng hồ |
| Version / idempotency | Double tap; mất response sau commit; retry giữ body/key/version; hai intent nối tiếp; 409 version khác 409 trạng thái/hạn; không replay tự động sau conflict |
| Note | Note null/version 0; version riêng; giới hạn 10000/5000; save fail giữ nội dung chưa chấp nhận; dirty Back theo design; hết quyền/hạn trong lúc nhập |
| Manager | Queue toàn backlog, cả 2 issue và filter theo DTO; totals server; correction thiếu reason; record không tồn tại không chuyển ngầm thành insert; recovery thiếu/sai evidence/actual times; body vượt giới hạn; audit phân trang/filter đúng session |
| Data / offline | Chưa tải khác empty/0; lỗi refresh/load more giữ đúng query; đổi filter/session không lẫn response; offline không Retry; draft/reconnect/app-kill/logout theo quyết định đã chốt, không lộ dữ liệu tài khoản trước |
| Native / hồi quy | vi/en, light/dark, keyboard và vùng chạm, skeleton/spacing; mở/Back không animation; auth/Settings P0, Home/lịch/lớp/context P1 và đường vào/ra 7 slice |

UI test dùng mock rõ ràng; API tests kiểm schema/HTTP/header và lỗi thật; native xác minh layout/interaction trên emulator hoặc thiết bị. Những case khó tái tạo native cần mapping bằng chứng phù hợp, ghi blocked/skipped rõ; case bắt buộc chưa pass thì chưa nghiệm thu. Không lấy Jest hoặc build thành công thay Maestro.

## 10. Command, E2E và bàn giao

Khi triển khai chạy `npm run lint`, `npm run lint:type-check`, `npm test -- --runInBand` theo cấu hình thực tế; lint hiện đã gồm typecheck nên có thể ghi bằng chứng gộp thay chạy trùng. Chạy kiểm tra trên bản source cuối, ghi test count thật, môi trường và failed/skipped/blocked; không tái sử dụng kết quả P1.

E2E công khai duy nhất dự kiến: **`npm run test:e2e:phase-2`** theo [ADR-026](../../adr/ADR-026-single-e2e-command-per-phase.md). Chưa có command này. Khi tạo, runner tự kiểm cấu hình/backend/tài khoản, tạo và xác minh dataset mới phù hợp các nhánh trước khi chạy Maestro toàn phase và hồi quy P0/P1 liên quan theo [quy ước E2E](../e2e-maestro.md). Không thêm command công khai `:ui`/`:api` riêng hoặc yêu cầu ghép bước thủ công. Credentials ở cấu hình local, không vào Git/log; dataset không chứa secret.

Dataset cần session preview/start, IN_PROGRESS, COMPLETED còn hạn/quá hạn, regular/guest, snapshot nhiều trang, incomplete backlog và trường hợp correction/recovery có bằng chứng hợp lệ. Kịch bản mutation dùng dữ liệu thử được phép; recovery không tạo lịch sử giả chỉ để test pass. Thiếu dữ liệu bắt buộc phải báo blocked và dừng flow phụ thuộc, không âm thầm skip. Lỗi setup/API/flow/interruption trả exit code khác 0; chỉ trả 0 khi mọi bước bắt buộc thành công.

Trước nghiệm thu cần contract đủ 7 slice; mapping design → UI/API/native tests; hồ sơ API/E2E có command, môi trường, dataset, ảnh native đã xem và kết quả; cleanup đạt chuẩn; câu hỏi ảnh hưởng đã giải quyết. Ghi nhật ký tại progress P2, duy trì mẫu số 7 và trạng thái riêng UI/API. Bàn giao hiện tại gồm kế hoạch tổng và README; chờ duyệt tổng trước bước tách slice theo ADR-017.
