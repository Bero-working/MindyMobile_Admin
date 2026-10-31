# Phase 1 — API integration

31/10/2026 (Asia/Bangkok), Codex. Chỉ thị: “Triển khai API cho phase 1”. Chỉ thị này cho phép nối API; không tự ghi nhận UI hoặc phase đã nghiệm thu. Giữ nguyên design Claude và các thay đổi có sẵn trong working tree, không sửa backend.

## Kết quả triển khai

- Đã nối 7/7 slice qua `createTeachingService`: lịch/lớp/workspace/context/roster Mentor, list/detail/roster Manager. Home Today dùng lịch/context thật.
- App dùng API thật ở debug và release. Các screen và Home entry mở theo role; DEBUG_MODE không còn tự chọn dữ liệu mock. Test UI mock truyền `teachingMock` rõ ràng; không có mock fallback.
- Zod wire schemas và adapter riêng; capabilities/scope kiểm đúng resource. Giữ snapshot người dạy null và version. CLASS roster kiểm lại quyền trước khi gọi; SESSION roster không dùng toàn lớp.
- Tích hợp session P0: restore/refresh khi 401, single flight và replay một lần. Phiên hết hạn xóa cache/đổi navigator. Response account cũ không làm hết phiên account mới; provider reset theo role/email/phase auth.
- Hook giữ phân trang/refetch/focus/app active; bổ sung chống tải trang trùng và retry đúng trang lỗi. Bộ đếm dùng total từ server. Không persist dữ liệu lớp/roster/query, không log PII/credentials.
- Trường chưa có trong DTO dùng null và UI ẩn/“—”. Không dựng tiến độ, số học viên, phòng hoặc hình thức online giả. Dữ liệu P1 không suy trạng thái điểm danh cho buổi đang diễn ra.

[Contract 7 slice](../../api-contract/phase-001-teaching-workspace/README.md) · [Snapshot nguồn + hash](../../api-contract/legacy/2026-10-31-teaching/README.md).

## Kiểm chứng

| Kiểm tra | Kết quả và phạm vi |
| --- | --- |
| `npm run check` | Pass: ESLint 0 error/0 warning, Prettier, tsc và Jest 16 suites/174 tests. Log `build-logs/phase-1-api-check.log` |
| Android `gradlew.bat assembleDebug -PreactNativeArchitectures=x86_64` | BUILD SUCCESSFUL, 29s; đã cài APK vào Pixel_8 / emulator-5554 |
| `npm run test:api:phase-1` | Pass với API_URL development hiện có: Mentor 6 lớp/5 chương/10 buổi/1 học viên lớp/1 học viên buổi, schedule 9; Manager 10 lớp/6 chương/13 buổi/3 học viên lớp và buổi cho resource được chọn. Login xác minh role; cả hai context pass. Chỉ GET ngoài login; không sửa dataset backend |
| Postman HTTP simulation | CLI 1.77.0, `postman simulation run postman/simulations/teaching/teaching.sim.yaml --port 4010 --no-history --output ndjson`; chạy adapter thật bằng `TEACHING_API_URL=http://localhost:4010/teaching node scripts/verify-teaching-api.cjs --simulation`: 7 thao tác pass kỳ vọng, context HTML 503 → error, các read còn lại success |
| Native E2E | `npm run test:e2e:phase-1` pass exit 0 trên Pixel_8, report `2026-10-31_202502`; xem [e2e.md](e2e.md) |

Simulation dùng synthetic DTO example từ snapshot source; không có owning-team mock đã kết nối trong repo nên không tìm/pull cloud mock. Traffic log đã quan sát: 8 GET, 7 response 200 và context 503, không có mutation. Context nhận lỗi và không fallback fixture. Không suy rằng backend thật sẽ luôn trả HTML; đây là tình huống kiểm khả năng xử lý lỗi. Artifact simulation giữ trong `postman/`, không push/deploy bên ngoài.

Node verification nạp chính TypeScript service bằng TypeScript transpiler và axios Node, thay NetInfo bằng connected và dùng cookie trong RAM. Kiểm này chứng minh wire mapping/namespace với server thật; cookie/session native được kiểm riêng bằng Maestro. `.maestro/accounts.local.json` và dataset ID `.maestro/phase-1-dataset.local.json` nằm trong gitignore; không commit account/cookie hoặc response PII.

## Giới hạn

Không tạo dữ liệu dạy thay, revoke assignment hoặc legacy snapshot trên backend chỉ để E2E. Tài khoản kiểm thử hiện không có lớp SESSION đang IN_PROGRESS; quyền này được kiểm bằng unit/UI tests và nhánh Maestro tùy dataset. Các trường progress/fixed schedule thiếu ở API được ghi ở contract. iOS, TalkBack, font scale, native 401 sau access expiry/revocation và môi trường production chưa được kiểm trong lượt này. Phase vẫn chờ nghiệm thu người dùng.


Kết quả hồi quy auth cuối: đăng nhập sai + Mentor pass trong report P0 `2026-10-31_202749`; Manager retry riêng pass exit 0 trong `2026-10-31_204004` sau khi restart Metro bị kẹt tải bundle. Lượt tổng P0 không pass do hạ tầng Metro; các nhánh hồi quy đã được kiểm qua hai lượt, chi tiết tại [E2E](e2e.md). Android 17 / API 37. Không có code runtime thay đổi sau `npm run check` 174/174 và E2E P1 pass; chỉ cập nhật tài liệu/format và Git attributes giữ nguyên byte snapshot.


## Sửa phòng học trên thẻ lịch — 31/10/2026

Người dùng báo thẻ Python hiện “Chưa cập nhật”. Đối chiếu backend thật: schedule không có roomName, nhưng context buổi 09:00 trả “Phòng Lab 2”; buổi online 15:00 trả meetingUrl. Trước đó adapter timetable giữ room=null và thẻ lịch chưa đọc context nên nhãn thiếu phòng sai. Đã thêm query context cho từng thẻ của ngày đang xem, giữ title từ timetable, hiển thị phòng thật/hình thức online và tách loading/error/offline/denied khỏi trạng thái phòng trống.

Kiểm chứng sửa lỗi: 2 suites/39 tests pass (teaching UI + 9 test mới về location); ESLint 0 error/0 warning, tsc và Prettier pass. Native flow cục bộ `build-logs/schedule-location.yaml` pass exit 0, report `C:/Users/admin/.maestro/tests/2026-10-31_224741`: login Mentor → lịch → “Phòng Lab 2” và “Trực tuyến” hiện, không còn “Chưa cập nhật”. Đã xem ảnh `takeScreenshot/schedule-location-fixed.png`. Không đổi API/backend hoặc giả phòng học bằng fixture.


31/10/2026 — Theo yêu cầu format subtitle, thẻ lịch hiển thị từng dòng theo thứ tự tên lớp → tên buổi → phòng/hình thức học. Không nối tên buổi với phòng bằng dấu “·”; icon vị trí/video chỉ nằm ở dòng phòng/hình thức. 9 test location, ESLint/typecheck/Prettier pass; Maestro targeted `build-logs/schedule-subtitles.yaml` pass (`2026-10-31_225403`, xác nhận schedule-day-title trước khi kiểm subtitle), đã xem ảnh `schedule-separate-subtitles.png` trên Android.


## Chốt UI Home và Lịch dạy — 31/10/2026

Người dùng xác nhận Home có nút Google Meet khi API có link; Lịch dạy mỗi thẻ có Điểm danh (disabled trước giờ) và Chi tiết, sau đó yêu cầu bỏ tên buổi khỏi card schedule. Đã giữ Home Meet/context hiện có; thẻ lịch chỉ hiện tên lớp + phòng/hình thức, không còn title buổi kể cả khi chưa tra được lớp (fallback nhãn Lớp học).

Hai nút luôn hiện trên card. Điểm danh chỉ bật khi đã đến startsAt, có quyền context, và status IN_PROGRESS hoặc SCHEDULED chưa qua endsAt; COMPLETED/CANCELLED bị khóa. Thời gian cập nhật khi màn focus/app active và trong lúc mở màn. Chi tiết luôn mở đúng sessionId. Vùng bấm thông tin được tách khỏi các nút để chạm nút disabled không vô tình mở chi tiết. Nghiệp vụ điểm danh P2 chưa triển khai: nút đang bật vẫn giữ thông báo hiện có, không gửi mutation.

Kiểm chứng: 2 suites/42 tests pass, gồm Home Meet, bỏ title và boundary startsAt/endsAt, disabled/closed/detail; ESLint 0 error/0 warning, tsc và Prettier pass. Maestro cục bộ `build-logs/schedule-actions.yaml` pass exit 0, report `2026-10-31_230652`, xác nhận thẻ có cả hai nút, không có subtitle tên buổi và Chi tiết mở context. Đã xem ảnh `schedule-actions-without-session-title.png`.
