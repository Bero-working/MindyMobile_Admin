# Phase 2 — Kiểm chứng UI mock

**Cập nhật hiện hành:** [Hai tiện ích Manager, header tabs, filter ngang và correction rút gọn](ui-utilities-update.md) theo yêu cầu trực tiếp ngày 01/11/2026; phần mô tả baseline khác với cập nhật này được giữ để truy vết.

Ngày: 01/11/2026 (Asia/Bangkok). Nguồn yêu cầu: [design cấp phase](../../design/attendance-and-notes/design.md), 7 design slice và [kế hoạch tổng](phase-002-attendance-and-notes.md). Không sửa nguồn design hoặc ADR Accepted.

## Phạm vi mã

- `src/modules/attendance/`: UI models, model draft/thời gian/payment basis, provider có cache/khóa intent trong RAM, hook đọc/mutation, mock source, shared components và 7 màn/tab.
- `AuthApp`: provider gắn với identity auth, route theo role và chỉ bật P2 trong review; lazy screen như P1.
- Home/context P1: entry point Mentor, totals quyền từ attendance, Home Manager/backlog và tab/action Manager; P1 dùng API thật vẫn giữ luồng hiện hành khi chưa bật review.
- `AttendanceReviewHost`: opt-in development, mock auth và teaching khi review; chuyển role khởi tạo lại source. Không thêm dependency hoặc storage nhạy cảm.
- Thêm Material Symbols Rounded weight 300 từ SVG chính thức của Google vào registry hiện hữu; không tạo hệ icon khác.

## TDD và kiểm tra tự động

Đã ghi nhận red trước code: test model không tìm thấy module, test source không tìm thấy mock source, test UI không tìm thấy entry point P2. Sau đó triển khai và chạy lại theo nhóm. Không quy kết các lần red hoặc test chạy chọn lọc có skipped là kết quả suite đầy đủ.

| Bộ kiểm tra | Phạm vi trực tiếp |
| --- | --- |
| `__tests__/attendance-model.test.ts` | Draft không đổi snapshot; trở về base thì bỏ draft; giới hạn 100 regular + 100 guest; so conflict từng hàng; code point note; ngày/giờ Việt Nam hợp lệ; payment basis; kích thước JSON UTF-8 |
| `__tests__/attendance-source.test.ts` | Bulk gồm trang chưa mở và guest; replay cùng intent chỉ ghi một lần; mất response; note version độc lập; Manager cần reason/giờ kết thúc; recovery insert-only |
| `__tests__/attendance-ui.test.tsx` | Nguồn mặc định của review; Home → S1; totals/draft/save; offline/reconnect không tự ghi; lưu trước chốt; note version/dirty Back; Manager backlog/tab/correction reason; intent retry; recovery chọn trạng thái và tự về S4; correction → audit; note conflict cần tự lưu lại |
| Hồi quy hiện hữu | Auth/Settings P0, Home/lịch/lớp/context P1, query/model/API adapter đã có và primitives |

Kết quả source cuối được ghi sau khi chạy `npm run check` tại `build-logs/phase-2-ui/check-final.log`. Kết quả trung gian 20 suite/216 test đã pass trước khi bổ sung các case recovery/audit/note conflict; không lấy lượt trung gian làm kết quả cuối. Lượt kiểm toàn dự án đã **PASS — 20 suite/225 test**, không skip, cùng ESLint 0 warning, Prettier và TypeScript. Sau chỉnh vị trí badge review development, preview source cuối pass exit 0; log kiểm toàn dự án cuối lưu cùng folder.

## Mapping design

| Nguồn | ID bắt buộc được giữ | Bằng chứng hiện có và phần cần kiểm tiếp |
| --- | --- | --- |
| [S1](../../design/attendance-and-notes/attendance-editor/design.md#12-test-case) | TC-P2-S1-01–66, đủ 66 ID; -63 nằm cuối bảng nguồn | Model/source/UI tests ở trên; Maestro điểm danh/lưu/chốt. Các mã lỗi và contract/header/runtime phải kiểm lại ở bước API |
| [S2](../../design/attendance-and-notes/teaching-note-editor/design.md#11-test-case) | TC-P2-S2-01–32 | Code point/version riêng, dirty Back/conflict/offline không tự gửi trong Jest; native editor. Origin, cookie, clipboard native và hạn từ backend cần bằng chứng API/native riêng |
| [S3](../../design/attendance-and-notes/incomplete-sessions/design.md#8-test-case) | TC-P2-S3-01–24 | UI backlog → S4, Home total; native backlog. Filter/race/pagination/runtime dataset phải kiểm đủ khi tích hợp |
| [S4](../../design/attendance-and-notes/manager-attendance/design.md#10-test-case) | TC-P2-S4-01–28 | UI initialTab/entry/action và ẩn toàn nhóm khi capability false, native tab và quay lại sau correction. Quyền thực/candidates/phiên hết hiệu lực cần chạy với server |
| [S5](../../design/attendance-and-notes/attendance-correction/design.md#11-test-case) | TC-P2-S5-01–31 | Reason, bulk/source, correction → audit; native correction. Finalize Manager với giờ lịch sử thật và audit backend chưa kiểm |
| [S6](../../design/attendance-and-notes/attendance-recovery/design.md#11-test-case) | TC-P2-S6-01–37 | Model payment/time/UTF-8; UI form trống/lazy pick/chọn mark/review/save; source insert-only. Thanh toán/evidence/createdAt/clock conflict thật chưa kiểm |
| [S7](../../design/attendance-and-notes/attendance-audits/design.md#10-test-case) | TC-P2-S7-01–28 | Correction sinh audit từ source và UI đọc; native audit. Pagination/actor/evidence thật còn ở bước API |
| [Cấp phase](../../design/attendance-and-notes/design.md#13-test-case-cấp-phase-và-dữ-liệu-e2e) | HOME-01–07, CTX-01–07, NAV-01/02, I18N-01: 17 ID | Home/entry/role trong Jest và native; native đã có vi/light và backlog en/dark; toàn bộ ma trận/font scale/TalkBack còn cần bằng chứng riêng |

Tổng kiểm kê: **246 test case slice + 17 cấp phase = 263 ID**. Bảng này truy vết nguồn và các nhóm đã kiểm; **không phải tuyên bố 263/263 case đã pass**. Test fake source không chứng minh backend hoặc E2E tích hợp. Giữ đủ ID/kỳ vọng nguồn khi mở contract/API tests, bổ sung bằng chứng cụ thể cho các nhánh còn thiếu.

## Native và cổng

Android debug x86_64 dùng JBR Android Studio, `android/gradlew.bat -p android app:assembleDebug -PreactNativeArchitectures=x86_64`: **BUILD SUCCESSFUL, 29s**, 438 tasks; log `build-logs/phase-2-ui/android-build.log`. APK được cài lại lên emulator-5554. JavaScript hiện hành do Metro 8081 phục vụ; không coi debug APK có bundle JS release.

Xem [Maestro và ảnh](e2e-ui.md) để biết flow nào pass/fail và ảnh đã xem. iOS chưa chạy; Android thực/TalkBack/clipboard/offline mất response qua mạng thật và Q-PLAT-01 chưa được nghiệm thu. Chưa thêm command E2E tích hợp rỗng hoặc đánh phase Done.

## Kiểm tra cập nhật tiện ích và roster gọn

02/11/2026 — Bản mở thẳng nội dung hai tabs sau chọn lớp: `npm run check` pass exit 0, **20 suite/228 test**, 226.4s; ESLint 0 warning, Prettier, TypeScript pass. Log `build-logs/phase-2-utilities/check-direct-tabs.log`. UI test kiểm không có status/list buổi, roster hiện ngay, chuyển lịch sử thấy audit sau lưu, chuyển tab khi dirty mở guard và giữ draft khi chọn Ở lại, Back về chọn lớp. Maestro direct-tabs pass ở lượt 2026-11-02_100129; ảnh và hồ sơ ở [E2E UI](e2e-ui.md). Mặc định buổi gần nhất của lớp; bản này vẫn là UI mock.

02/11/2026 — Bổ sung chọn lớp trước tabs. `npm run check` cuối pass exit 0: **20 suite/228 test**, 176.754s; ESLint 0 warning, Prettier và TypeScript pass. Log: `build-logs/phase-2-utilities/check-class-picker-final.log`. UI test kiểm chưa tải managerSessions trước khi chọn lớp, giữ classId khi đổi tab, Back chọn lớp khác không dùng lại buổi lớp trước. Source test kiểm lọc lớp trước phân trang. Hai test write cũ ở lượt đầu chưa chờ hết xử lý bất đồng bộ; đã dùng `act` cho thao tác submit và xác nhận source được gọi, rồi chạy lại toàn dự án. Maestro chọn lớp → tabs → audit → đổi lớp → Home pass, ảnh và lượt bị gián đoạn được ghi ở [E2E UI](e2e-ui.md). UI mock/API 0/7 giữ nguyên.

01/11/2026 — `npm run check` cuối pass exit 0: ESLint 0 warning, Prettier, TypeScript và **20 suite/227 test**, 97.946s. Log: `build-logs/phase-2-utilities/check-final.log`. Jest kiểm hai tiện ích Home, tabs, audit empty, finalize riêng; correction chỉ hai trạng thái, chip đổi qua lại và tổng cập nhật theo draft. Lượt trước có một assertion lịch sử không phân biệt hai hàng cùng lý do; đã scope vào đúng audit row rồi chạy lại toàn bộ.

Maestro utilities pass ở 20:44; preview correction mới pass ở 21:01. [E2E UI](e2e-ui.md#cập-nhật-tiện-ích-và-correction-hai-trạng-thái) ghi lượt chạy, ảnh đã xem và lỗi khởi động trung gian. Chỉ xác nhận Android UI mock; chưa tăng UI được duyệt hoặc API 0/7.
