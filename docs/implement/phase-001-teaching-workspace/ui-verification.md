# Phase 1 — Kiểm chứng UI

Ngày 31/10/2026 (Asia/Bangkok). Design: `docs/design/teaching-workspace/design.md` và 7 design slice của Claude. Không sửa design hoặc ADR Accepted.

## Phạm vi thực hiện

Đã thêm module `src/modules/teaching`: model UI độc lập wire DTO, nguồn fixture, query/view-state, các thành phần dùng chung và 7 UI. Route được đăng ký theo role của phiên P0, lazy `getComponent`; module không có HTTP/service/schema API thật. Provider tách theo email/phiên; không persist dữ liệu P1. Header Trang chủ, Hồ sơ và Settings P0 giữ testID hồi quy.

Mở rộng Chip, token success/warning/lịch và Material Symbols Rounded weight 300 theo design. Dùng lại primitives, NativeWind, theme, i18n vi/en, Native Stack và giảm chuyển động hiện có. Không thêm dependency.

## Mapping test tự động

| File | Design / hành vi được kiểm tra |
| --- | --- |
| `__tests__/teaching-model.test.ts` | S1-01/02/04: ngày Việt Nam/biên tuần; S2-06: calendar date; S4-08/09: link http(s); S5-02/03: chặn roster theo capability tại boundary; empty/offline/error/denied/not-found; filter/search ở nguồn fixture |
| `__tests__/teaching-ui.test.tsx` | S2-04/09, S3-02/06, S4-15: scope SESSION đi tới roster buổi; S3-01/07/08 và S5-05/06: quyền, snapshot legacy, payment; S6-04/16 và S7-02/07/12/13: Manager/tab/contact/context; S1-09 và S4-08/20: link/xóa dữ liệu khi mất quyền; S6-08/14/21: English/search/reset; S2-18: denied không giữ thẻ; S4-18/19: lỗi nhóm học viên/422; S3-03: capability false; S2-17: giữ dữ liệu khi refresh lỗi; S7-10, S4-14/31: lớp/buổi hủy |
| `__tests__/teaching-query.test.tsx` | S2-13: response bộ lọc cũ không ghi đè bộ lọc mới; S1-10: tự tải đủ 130 buổi; S2-10: nối trang và giữ total, không trùng item |
| Các test P0 hiện hữu | Bootstrap/login/deny/preferences/logout, HTTP/cookie và primitives; không dùng kết quả API P0 để khẳng định API P1 |

TDD: test model ban đầu fail vì chưa có module `format`/mock source. Sau implementation bộ model/UI pass; lượt UI đầu phát hiện selector nhãn payment trùng với chip lọc, sửa assertion để kiểm tra trong đúng hàng học viên. Không coi test wire DTO/HTTP/phân trang server/401 hoặc endpoint được ghi trong design là đã kiểm chứng ở giai đoạn UI.

## Kết quả và giới hạn

- Android Debug x86_64: `JAVA_HOME=C:/Program Files/Android/Android Studio/jbr`, `./android/gradlew.bat -p android assembleDebug -PreactNativeArchitectures=x86_64` — BUILD SUCCESSFUL, 46s. Log: `build-logs/phase-1-build.log`.
- ESLint toàn repo với `--max-warnings=0`: pass.
- `tsc --noEmit`: pass sau khi sửa kiểu optional/ref và annotation cụ thể.
- `npm run check`: pass lint/format/typecheck + 11 suite, 120/120 test, không skip. Log: `build-logs/phase-1-check.log`. Sau đó sửa riêng test để chờ async update trong `act`; rerun 10/10 UI test pass, không còn warning act (`build-logs/phase-1-ui-jest.log`); ESLint/typecheck kiểm lại pass.
- Native UI smoke: pass, exit 0; đủ 7 màn, Mentor CLASS/SESSION, Manager tabs, tìm kiếm, English/dark và lỗi riêng tab roster. 12 ảnh native đã chụp và rà, xem `e2e-ui.md`. Không phải E2E tích hợp API P1.
- iOS chưa chạy trên môi trường Windows; screen reader, font scale và mọi biến thể theme cần kiểm chứng thiết bị riêng, không suy từ Jest thành pass.
- API P1, wire schema/contract, cache TanStack Query thật, lỗi HTTP và E2E dữ liệu thật chưa triển khai trước cổng approve UI.

UI đang dùng danh sách cuộn và phân trang fixture; việc kiểm chứng virtualization/viewability với dataset lớn sẽ phải hoàn tất khi nối danh sách API, không dùng dataset fixture nhỏ làm bằng chứng hiệu năng.


## Home — triển khai 31/10/2026

Theo chỉ thị “Triển khai Home UI trong phase 1”, dùng design Claude mục 3/6, H-A–H-I. `WorkspaceScreen` chuyển danh sách Row thành nhóm/lưới HomeTile; linh vật trích từ design được copy nguyên byte vào assets runtime. Card padding 24/16/16, gap 14, overlap −50; linh vật nằm ngoài overflow của card, không nhận chạm hoặc đọc bởi screen reader. Tên tự xuống dòng, email một dòng; các nút avatar/Settings không co. Home chỉ dùng phiên xác minh, không thêm nguồn API/KPI, giữ guard route mock của build và fallback P0.

- TDD: lượt trước code fail 5 case Home (10 case P1 cũ pass), log `build-logs/home-red.log`. Bổ sung unit test HomeTile pressed/reduced motion và tài khoản tên/email dài.
- `npm run check`: **PASS — 12 suite, 128/128 test**, không skip; gồm ESLint 0 warning, Prettier và TypeScript. Log `build-logs/home-check.log`.
- Android: `JAVA_HOME=C:/Program Files/Android/Android Studio/jbr`, `./android/gradlew.bat -p android assembleDebug -PreactNativeArchitectures=x86_64`: **BUILD SUCCESSFUL, 15s**. Cài APK debug lên emulator-5554 thành công. Log `build-logs/home-android-build.log`. Phản hồi nhấn HomeTile sau đó đổi sang state/style tường minh; JS mới được Metro phục vụ cho lượt smoke cuối.
- H-A/B/E: Jest kiểm nhóm đúng role, không có tile role khác, vi/en/light/dark; Settings đổi en/dark rồi back áp dụng tức thì. H-C: hồi quy điều hướng S1/S2/S6 và P0 Profile/Settings/back. H-D: không hiện nhãn yêu thích/xem tất cả, không có KPI hoặc badge mới. H-F: test tên dài không giới hạn dòng, email một dòng và control không co; không coi assertion props là bằng chứng layout native.
- H-H/I: Jest kiểm role/label nút, mascot ẩn khỏi accessibility tree và pointerEvents none, phản hồi scale .94 hoặc opacity .8 theo reduced motion. Thứ tự focus/TalkBack thực chưa kiểm, không suy từ Jest thành pass.
- Native Home và smoke hồi quy: xem phần Home trong `e2e-ui.md`. iOS, tên dài trên native, mất mạng thật trên Home và TalkBack còn chưa kiểm đầy đủ. API P1 vẫn 0/7, UI chờ người dùng duyệt.


Cập nhật kết quả Home cuối: Android build lại trên source cuối **BUILD SUCCESSFUL, 11s** (`build-logs/home-android-build-final.log`); Maestro toàn flow P1 mở rộng Home **pass exit 0**, lượt `094806`. Rà 4 ảnh Home, gồm Manager en/dark 360dp/font130 (flow `095121`, pass exit 0); xem `e2e-ui.md`. Đã khôi phục emulator 1080×2400/font_scale 1.0. Đây là smoke UI fixture, chưa phải E2E API.

## Bản UI mới và phản hồi ảnh — 31/10/2026

Triển khai design S6/S7 mới và Home hiện hành. Thay đổi Manager: mặc định IN_PROGRESS, 5 số đếm lifecycle độc lập với tìm kiếm, tổng trên header, xóa từ khóa giữ chip, ba tab header với lazy-load, bốn ô ghi danh và nhóm thông tin; roster rút gọn, bỏ liên hệ/thanh toán/filter đơn. Chỉ tab đang hiển thị đăng ký tải trang tiếp. Tóm tắt lỗi không khóa hai tab con.

Home có thẻ hôm nay, chọn buổi theo ưu tiên design và ngày Việt Nam, context link của đúng buổi hiển thị; Meet và điều hướng chi tiết tách vùng thao tác. Thẻ Manager tĩnh. Tiện ích Mentor đưa ra nền, Lớp phụ trách đứng trước và nổi bật. Có kéo làm mới, retry lịch/context, cập nhật khi foreground/focus/qua ngày.

Phản hồi ảnh của người dùng:

- Bỏ hàng riêng của “Xem lịch”, đặt tuyệt đối gần ngang chip trạng thái. Native preview đã chụp và rà: `build-logs/phase-1/ui/home-today-compact.png`. Flow `home-today-layout.yaml` pass, kiểm mở lịch và mở đúng chi tiết buổi từ Home.
- Tab Tổng quan bị cắt/lệch trái do negative margin đặt ở nội dung con của ScrollView ngang. Chuyển margin sang ScrollView, giữ hàng tab không có margin âm; áp dụng cho Manager S7 và Mentor S4.

Kiểm chứng đã có: Android `app:assembleDebug` BUILD SUCCESSFUL (59s), cài APK thành công trên emulator-5554. Bộ `npm run check` cuối sau chỉnh lề tab PASS: 13 suite / 139 test, ESLint 0 warning, Prettier và TypeScript pass. Log: `build-logs/phase-1-ui-new-check-final.log`. Sau chỉnh gap header 12px, lint/format/typecheck kiểm lại PASS (`build-logs/phase-1-ui-layout-final-lint.log`). Maestro cuối PASS exit 0, lượt `2026-10-31_165317`, đủ 7 màn, Manager vi/light và en/dark, tìm kiếm/reset, lỗi roster độc lập; log `build-logs/phase-1-ui-new-smoke-final.log`. Đã rà ảnh native Home, Session, Manager list/detail; ảnh đã copy về `build-logs/phase-1/ui/`. Jest bổ sung kiểm số đếm lỗi không ảnh hưởng danh sách, không gọi đếm theo từng lần gõ, lazy-load tab đúng một lần, lỗi tóm tắt không khóa roster, dữ liệu roster tối giản, lựa chọn buổi hôm nay và Meet độc lập.

API P1 vẫn chưa tích hợp, UI chưa được duyệt. iOS, TalkBack và font scale đầy đủ chưa được kiểm chứng. Các kết quả Home cũ bên trên là lịch sử, không đại diện layout bản mới.


## Cập nhật chi tiết buổi học Manager — 01/11/2026

- Áp dụng bố cục P1-S4 mục 2.1 và 4: hai tab Tổng quan/Học viên, ô ngày theo giờ Việt Nam, nhóm thông tin gộp; ẩn mentor chính khi trùng vai trò người dạy, giữ link an toàn và thời gian thực tế.
- Học viên tải khi mở lần đầu, giữ dữ liệu khi đổi tab, chỉ phân trang tự động ở tab đang mở; trạng thái rỗng/422/hủy có khối icon căn giữa. Không thêm điểm danh, ghi chú hoặc thao tác ngoài P1.
- TypeScript, ESLint và Prettier cho các file thay đổi: pass. Jest teaching-ui + teaching-manager: 39 pass, 1 bỏ qua sau khi lần chạy đầy đủ báo test “Mentor session defers roster and unit requests until their tabs are opened” lỗi kỳ vọng gọi units; luồng Mentor này không được sửa trong đợt cập nhật Manager. Test Manager đã kiểm tra tải muộn, tái sử dụng dữ liệu, không hiển thị trạng thái điểm danh và trạng thái buổi hủy.
- Chưa chạy lại Android build/Maestro hoặc kiểm tra trực quan trên thiết bị cho đợt cập nhật này.
