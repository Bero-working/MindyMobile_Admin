# Phase 1 — Spacing, feedback và hướng mở UI

Ngày: 31/10/2026 (Asia/Bangkok). Người thực hiện: Codex.

Nguồn: các ảnh review và yêu cầu trong chat; sau khi duyệt đợt sửa phase 0, người dùng yêu cầu “sửa các phần kia tiếp đi”. Đây là bản sửa UI mock để review, chưa approve UI toàn phase 1 và chưa mở tích hợp API.

## Thay đổi

- Panel teaching tăng padding ngang từ 16 lên 24, padding trên/dưới 24 và gap giữa các phần 24. QueryBlock dùng gap 20 trong nội dung và gap 24 trước feedback; feedback có gap 16 giữa warning và nút thử lại.
- Nội dung/card/empty hiển thị trước cảnh báo. Danh sách lớp có empty state cả khi lần tải hiện tại chưa có dữ liệu, theo yêu cầu “No class trước”; không hiển thị dữ liệu của filter cũ. Roster/lịch có empty text thay cho card rỗng mỏng khi chưa tải được dữ liệu.
- Lỗi initial/refresh dùng warning nằm dưới nội dung và retry riêng; giữ requestId khi có. Refresh lỗi vẫn giữ dữ liệu đã tải cho đúng query.
- Offline chỉ có warning, không có retry, cả initial load, refresh, footer tải thêm và Today/context. Kết nối trở lại có thể tải lại qua pull-to-refresh hoặc AppState hiện có.
- Nút Back trong teaching tăng padding ngang 20, padding dọc 6, giữ vùng chạm tối thiểu 44. Nút retry/Back nội dung dùng size sm, padding ngang 28; giảm phần dọc so với nút lớn. Không đổi kích thước nút submit auth đã duyệt.
- Card lớp tăng padding ngang 24; card chứa roster/lịch tăng inset ngang; student row có padding ngang 8, dọc 16. Heading section có inset ngang 8 và khoảng trên 20.
- Today bỏ SkeletonList ba hàng lớn. Skeleton phủ tuyệt đối lên bố cục nội dung dự trữ; phần context dùng đúng bố cục button nhỏ của CTA thật. Lớp skeleton không tham gia tính chiều cao, tôn trọng reduced motion và cleanup animation. Khi dữ liệu đã có, refresh giữ nội dung thay vì thay bằng skeleton.
- Skeleton initial của danh sách là một vị trí dự trữ, không còn ba hàng mặc định ở QueryBlock. Danh sách thực vẫn có chiều cao theo số hàng/nội dung thực; chưa có bằng chứng đo mọi biến thể initial skeleton và dữ liệu trên native.
- Avatar/Profile và hai tile lớp ở phía trái dùng slide_from_left; Settings phía phải và drill-down giữ slide_from_right. Reduced motion dùng none. [ADR-021](../../adr/ADR-021-entry-side-navigation.md) ghi yêu cầu và mapping cửa vào; ADR đang Proposed, không tự coi việc cho phép code là duyệt riêng tài liệu.

## Kiểm chứng

- Jest toàn repo: PASS, 13 suites / 143 tests.
- TypeScript, ESLint và Prettier các file thay đổi: PASS, không warning.
- `npm run test:e2e:phase-1:ui`: PASS, exit 0 trên Pixel_8 Android debug qua Metro hiện hành. Real P0 login, dữ liệu P1 mock; đi qua 7 màn, Profile/Back, Mentor/substitute, Manager, vi/light và en/dark, search và nhánh studentsError.
- Lượt bổ sung `maestro test .maestro/phase-001-teaching-workspace/ui-mock/feedback-states.yaml`: PASS, exit 0, kiểm error → offline → loading → success. Flow dùng phiên Manager en/dark được flow tổng để lại; không phải bài test độc lập từ dữ liệu trắng.
- Log: `build-logs/phase-1-ui-spacing-maestro.log`, `build-logs/phase-1-ui-feedback-maestro.log`. Ảnh lượt tổng được sao chép vào `build-logs/phase-1/ui-spacing/` từ report Maestro `C:/Users/admin/.maestro/tests/2026-10-31_181415/`.

Đã quan sát ảnh native lượt tổng; sau đó sửa empty text để bỏ card roster rỗng mỏng và chạy flow feedback riêng cho source mới. Giữ kết quả các lượt test lỗi ban đầu là lỗi test harness/assertion, không tính là pass; đã sửa và chạy lại. Không coi test unit là chứng minh chuyển động trái/phải hoặc không có layout shift ở mọi cỡ chữ; cần review trực tiếp các biến thể đó. Không có build native mới vì không thay dependency/native code; không kiểm iOS hoặc API P1.

Flow feedback report: `C:/Users/admin/.maestro/tests/2026-10-31_181832/`. Đã sao chép ảnh cuối vào `build-logs/phase-1/ui-spacing/roster-{error,offline,loading,success}.png`. `git diff --check` pass. Chưa có phản hồi duyệt UI cho đợt sửa này.

## Bổ sung loading footer — 31/10/2026

Theo ảnh review tiếp theo, đã thay ActivityIndicator ở Footer dùng chung bằng skeleton theo kích thước nút tải thêm (min-height 52), giữ các card đã tải. Refresh danh sách đã đủ total không thêm footer loading. Đây là chỉnh sửa sau hai lượt Maestro ghi phía trên, chưa rerun native/Maestro cho riêng bổ sung này. Kiểm chứng và hồi quy pagination bằng teaching-footer.test.tsx và teaching-query.test.tsx; xem kết quả bàn giao trong chat.

## Đính chính hướng điều hướng — 31/10/2026

Theo chỉ thị mới: chỉ avatar và Back đi từ trái sang phải; mọi nút mở màn khác từ phải sang trái. MentorClasses/ManagerClasses đã trả về slide_from_right. Profile vẫn mở từ trái; transitionEnd lúc mở đổi cấu hình route sang slide_from_right để pop/Back thoát sang phải. Vẫn dùng stack pop thật và reduced motion. Đã cập nhật ADR-021 Proposed; mapping theo vị trí nút phía trên là lịch sử, không còn áp dụng.

Kiểm chứng đính chính navigation: auth-ui 66/66 tests PASS; TypeScript, ESLint, Prettier và diff check PASS. Chưa chạy lại native/Maestro hoặc kiểm chuyển động trực tiếp cho riêng đính chính này; các lượt Maestro ở trên xảy ra trước thay đổi navigation mới.

## Đính chính Back trong Profile — 31/10/2026

Theo yêu cầu mới “Chuyển UI back trong profile là từ phải sang trái”, đã bỏ listener transitionEnd đổi animation của Profile. Avatar mở từ trái sang phải; Profile pop tự nhiên theo slide_from_left để thoát từ phải sang trái. Các màn khác giữ nguyên. Cập nhật ADR-021 Proposed theo chỉ thị mới; ghi nhận chiều Back Profile ở phần trước là lịch sử.

## Hướng chuyển hai tiện ích Mentor — 31/10/2026

Theo ảnh và yêu cầu mới, Lớp phụ trách (MentorClasses) và Lịch dạy (TeachingSchedule) mở và Back đều từ phải sang trái. Entry giữ slide_from_right; transitionEnd mở cấu hình route thành slide_from_left để pop thoát sang trái. Native Back dùng cùng cấu hình; reduced motion vẫn none. Không đổi Back của các drill-down khác. ADR-021 Proposed đã cập nhật theo chỉ thị này.

Kiểm chứng hai tiện ích: teaching-ui 27/27 tests PASS; TypeScript, ESLint, Prettier và diff check PASS. Chưa kiểm lại chuyển động native/Maestro cho riêng thay đổi này.

## Home offline và padding — 31/10/2026

Theo hai ảnh review mới, card Today khi offline chỉ hiện một warning, ẩn dữ liệu buổi học đã cache và action Xem lịch/meeting/retry. Đã đưa query context/classes lên cùng chủ sở hữu với query schedule; bất kỳ query đang dùng nào báo offline đều đi vào một nhánh warning chung. Các query vẫn mounted để pull-to-refresh/AppState phục hồi khi có mạng; không khóa UI vào offline do unmount query con. Query context cũ không còn áp dụng khi không có buổi hiện hành được bỏ qua.

Card dùng cùng padding 24 bốn phía cho online/offline; Xem lịch chỉ xuất hiện khi online, căn phải 24, không đè warning. Kiểm chứng teaching-ui 28/28 tests PASS, gồm chuyển offline sau khi có dữ liệu, đúng một warning, không còn dữ liệu/button trong card, padding 24 và phục hồi nội dung khi online. TypeScript/ESLint/Prettier PASS. Probe native riêng được ghi bổ sung sau khi hoàn tất. Không thay quy tắc offline của các QueryBlock khác trong đợt sửa Home này.

Probe native Home offline: lượt đầu FAIL vì emulator còn bundle cũ (ảnh vẫn có Xem lịch đè warning), giữ log phase-1-home-offline-padding-maestro.log và report 2026-10-31_195237. Sau broadcast reload JavaScript hiện hành, chạy lại flow warm Mentor với setup scenario offline: PASS, exit 0. Log build-logs/phase-1-home-offline-padding-rerun-maestro.log; report C:/Users/admin/.maestro/tests/2026-10-31_195350/; ảnh build-logs/phase-1/ui-spacing/today-offline-padding.png. Đã xác nhận native warning hiện, session/schedule và hai warning con đều ẩn.

Probe ảnh ổn định bổ sung PASS, exit 0: waitForAnimationToEnd, xác nhận nội dung Không có kết nối mạng và Xem lịch ẩn. Log build-logs/phase-1-home-offline-settled.log. Ảnh cuối thay bằng bản sau khi animation ổn định.

Đã restart Activity để loại bỏ trạng thái render sau reload; flow setup offline + waitForAnimationToEnd PASS, exit 0. Report 2026-10-31_195602, log phase-1-home-offline-padding-restart-maestro.log. Đã xem ảnh cuối: chữ warning, icon và padding bốn phía hiện đúng; không có dữ liệu/session hoặc Xem lịch. Ảnh bàn giao đã thay bằng lượt restart này.
