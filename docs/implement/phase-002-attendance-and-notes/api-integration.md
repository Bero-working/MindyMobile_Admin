# Phase 2 — Tích hợp API

Ngày: 02/11/2026 (Asia/Bangkok). Người dùng duyệt UI toàn phase rồi yêu cầu “Tích hợp api đi”. Đã nối HTTP thật cho 7 slice. Chỉ thị tiếp theo “Hãy thêm thành tabs (lịch sử, khôi phục) vào chi tiết buổi học” thay thế lựa chọn giữ UI trước đó: Manager có Tổng quan / Điểm danh / Lịch sử / Khôi phục trong cùng chi tiết buổi.

**Kiểm mã cuối:** `npm run check` pass 24 suites/272 tests, ESLint/Prettier/TypeScript pass. Log `build-logs/phase-2-api/check-delivery.log`.

[Contract chung và từng slice](../../api-contract/phase-002-attendance-and-notes/README.md) · [Snapshot nguyên byte + SHA-256](../../api-contract/legacy/2026-11-02-attendance/README.md).

## Thay đổi

- `attendanceSchemas.ts` xác minh response/session/version/quyền/totals, regular và guest, candidates, note, audit/evidence, backlog, enrollment và paging. `attendanceService.ts` ánh xạ DTO sang UI; không dùng fixture khi HTTP/schema lỗi.
- Source live được truyền vào AttendanceProvider cho cả development/release. Các route đăng ký theo Mentor/Manager, độc lập chế độ review. Menu scenario chỉ xuất hiện ở mock development.
- Attendance giữ expectedVersion và UUID v4 từ native crypto; retry cùng intent sao chép records/body/key/version, không gửi tự động khi reconnect. 401 refresh rồi replay tối đa một lần, kiểm identity sau await; logout/đổi tài khoản remount provider, cache/draft chỉ RAM. 409 giữ code riêng; 5xx/mất response sau gửi là uncertain, response 200 sai schema cũng không báo đã lưu.
- Note dùng version riêng (null → 0). Chỉ request lưu note có Origin cấu hình rõ; `API_ORIGIN=http://localhost:3003` đã được xác minh ở deploy bằng preflight và PUT trên fixture. Origin trong checkout backend local khác deploy và đã trả ORIGIN_NOT_ALLOWED ở lượt đầu. Không thay cấu hình/backend deploy.
- Home Manager/backlog dùng endpoint incomplete thật, mặc định không giới hạn tuần. Chọn học viên → chỉ lúc chọn mới đọc enrollment/classes; không gọi HTTP theo mỗi hàng. Session của lớp lấy `/management/classes/:id` đầy đủ trang trước lọc/sắp xếp local; không có endpoint managerSessions tự dựng. Tiện ích chốt thay toàn cục tải index/timetable các lớp khi mở, rồi lọc toàn bộ IN_PROGRESS (cả buổi chưa overdue); không thay danh sách này bằng backlog quá hạn.
- Form giờ dùng mốc server cộng thời gian đã trôi qua để không so thời gian mới nhập với asOf cũ; backend vẫn kiểm actual times khi ghi. Thanh tab tự đưa tab đang chọn vào vùng nhìn thấy.
- Hai tab mới lazy load. Tab History đọc audit thật; tab Recovery đọc quyền, sau đó roster của đúng classId khi cần. Chuyển tab bằng replace cùng session, có guard cho dirty/busy/uncertain; Back về nơi mở chi tiết; recovery thành công về Điểm danh của cùng buổi.

## Kiểm chứng

- TDD: test adapter được viết và chạy fail trước service; kiểm DTO/paths/body/key/version, guest-only, note null/version0/Origin, conflict riêng, denied/notFound, offline, malformed200 và HTML503; bổ sung test native crypto và live navigation.
- Live GET bằng tài khoản Mentor/Manager hiện có: candidates, attendance/context, note, incomplete, students/classes/enrollments, class timetable, recovery roster, audit. Không sửa dữ liệu dạy học hiện có.
- Với tài khoản Admin do người dùng cung cấp, runner tạo lớp `P2 E2E <run>`, Mentor và hai học viên thử riêng, sáu buổi và đơn CASH xác nhận thật bằng Manager. Credentials ở accounts.local.json được Git bỏ qua; dataset ID/evidence ở phase-2-dataset.local.json được bỏ qua. Không backdate payment/enrollment hoặc sửa SQL/backend để tạo lịch sử.
- Trên fixture riêng: start và replay cùng key, conflict với version cũ, roster qua hai trang pageSize=1, lưu, bulk, finalize chuyển UNMARKED → ABSENT, note, correction, sync, Manager finalize, recovery insert-only, record-exists và audit/evidence đã pass. Actual end cho API verifier lấy `session.asOf` từ server để tránh clock skew máy chạy.
- Postman 1.77.0 HTTP simulation: adapter thật với regular/guest qua hai trang; commit rồi trì hoãn response 11 giây vượt timeout 10 giây; caller uncertain và retry key cũ chỉ có một commit; thêm conflict, HTML503 và denied. Request log đã quan sát tại `build-logs/phase-2-api/simulation.ndjson`. Mock synthetic đối chiếu snapshot; không có owning-team mock kết nối trong repo; không push/deploy mock.
- `npm run check` cuối pass 24 suites/272 tests cùng lint/format/TypeScript; log `build-logs/phase-2-api/check-live-ui-final.log`. Bao gồm clock form, guard tài khoản/Unicode và debug overlay live. Kết quả Maestro tại [E2E](e2e.md). Android x86_64 debug build pass. Unit/API/mock evidence không thay cho native E2E.

## Giới hạn

`SessionEdit` (đổi cả tên và ngày/giờ) là tiện ích mock bổ sung ngoài 7 slice: backend Manager hiện có reschedule nhưng không có contract tương đương cho đổi title; không giả `canEditSession` hoặc gọi route Admin bằng Manager. Tính năng này chưa nối API; giữ code mock để truy vết, live không cấp action khi server không có quyền đó. Không đổi luật/ADR/design nguồn để che khoảng lệch.

iOS, TalkBack/font scaling native, native access-expiry/revocation theo thời gian thật và dữ liệu guest/many-page native ngoài fixture regular vẫn cần bằng chứng riêng; guest/HTTP uncertainty đã có unit + HTTP simulation. Q-PLAT-01 và nghiệm thu người dùng còn mở. Không tự đánh dấu phase Done.

## Ma trận slice

| Slice | Bằng chứng chính |
| --- | --- |
| S1 | Adapter tests; live candidates/start/save/bulk/sync/finalize/replay/conflict; regular/guest qua HTTP simulation; native Mentor |
| S2 | Adapter null/version riêng/Origin/conflict; live GET/PUT; native note + backend postcondition |
| S3 | Live incomplete không date window; Home server total và filter lớp/issue; native backlog |
| S4 | Live attendance/context permissions/totals/candidates; native snapshot của session đang chọn |
| S5 | Live correction/reason/Manager finalize; native chọn học viên/lớp/buổi và chốt thay; audit postcondition |
| S6 | Live recovery/record-exists/evidence; UI guard/denied/time regression; native Recovery và backend postcondition pass |
| S7 | Live audit/filter/actor/evidence; native History empty và sau recovery có audit thật pass |

Chi tiết native và ảnh đã xem tại E2E; các nhánh chưa được tái tạo native được ghi ở Giới hạn, không coi là pass từ unit tests.

Review P2 chỉ xuất hiện trên đăng nhập/khôi phục phiên khi đang live; đã ẩn khỏi các màn nghiệp vụ để không đè SaveBar. Native postcondition đã phát hiện lần bấm Lưu ghi chú bị nút debug nhận thay; regression test host và assertion không có overlay đã được thêm.

Các kiểm tra adapter bổ sung: hủy request nếu tài khoản đổi trong lúc NetInfo đang await (kiểm ngay trước gửi HTTP); giới hạn note/reason/evidence theo Unicode code point thống nhất UI và backend class-validator, không đếm emoji thành hai ký tự. Tập kiểm tra mới được chạy fail trước sửa, sau đó pass.
