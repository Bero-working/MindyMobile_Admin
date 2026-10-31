# Hoàn thiện ADR còn thiếu trong UI phase 0

Ngày 30/10/2026 (Asia/Bangkok). Nguồn: người dùng yêu cầu “Hoàn thiện các UI ở trên bằng những phần adr còn thiếu đi”. Chỉ UI mock; không mở cổng API hoặc nghiệm thu phase.

| Quyết định | Hiện thực |
| --- | --- |
| ADR-003 — NativeWind/Reusables | Layout auth, root và UI primitives dùng className; Button/Text tách file, forwardRef/asChild/Slot, CVA và text context; bỏ khai báo StyleSheet tĩnh trong phạm vi này |
| ADR-003/010/014 — theme/token | Một mapping runtime tokens.json từ design Claude; Tailwind đọc dimensions/type, ThemeProvider cấp color variables cho screens/review/modal; classes.ts tái sử dụng component recipes |
| ADR-004 — Zod | loginSchema validate cả form, LoginInput suy ra bằng z.infer; email trim, password không trim; không tạo schema response/API trước cổng |
| ADR-013 — native/motion | Giữ Native Stack, Gesture Handler và Reanimated; duration dùng token; reduced motion vẫn tắt fade và stack slide theo system khi khởi động |
| ADR-009 — kiểm chứng | 4 suites/73 tests pass, lint/format/typecheck pass; có kiểm tra NativeWind thật và composition, không nới kỳ vọng thành kiểm tra className đơn thuần |

## Ranh giới style native còn giữ

`style` không bị cấm tuyệt đối bởi ADR. Nó còn dùng cho CSS variables, safe-area/keyboard geometry, shadow native, hairline theo pixel density và override caller; SVG, placeholder và spinner dùng prop native. Các giá trị màu lấy từ cùng token/theme. Không import CSS trình duyệt vào app, không tạo palette mới và không sửa design hoặc ADR đã đóng băng.

## Kiểm chứng

Command `npm run check`; log `build-logs/ui-adr-check-final.log`: lint 0 errors/0 warnings, format và tsc pass, 73/73 tests. Con số này là số Jest tests hiện tại; không thay bảng mapping 71 TC của design.

Các test mới kiểm tra: caller override font size/family/color độc lập; Button asChild forward ref và onPress, layout và TextClassContext; Text asChild giữ style ở RNText con. Jest compile Tailwind thật qua PostCSS/CSS interop.

Lượt Maestro đầu mất thiết bị khi emulator dừng. Lượt kế tiếp được dừng sau khi flow 01 chờ app quá thời hạn trong lần Metro compile cold. Các lượt này không tính pass; kết quả cuối được cập nhật sau chạy lại.

Native iOS, VoiceOver/TalkBack đầy đủ, FPS và các OS khác chưa được chứng minh từ Android/Jest. Không ghi chúng thành pass. API và E2E tích hợp vẫn chờ approve UI.


## Kết quả bổ sung về variants và reduced motion

Đã thêm 2 regression cho variant nhỏ và caption: trước sửa cn(), nút sm bị giữ min-height 52/radius 99 và caption giữ line-height 21. Sau mở rộng nhóm spacing/radius/line-height cho tailwind-merge, nút sm nhận 44/22 và padding trên/dưới 8; caption nhận line-height 18. 73 tests pass trên source sau sửa.

Reduced motion trên Pixel_8 Android 17/API 37, Reanimated 3.19.5: giá trị native và hook thực đọc false với cài đặt hệ thống 1.0, true sau đặt TRANSITION_ANIMATION_SCALE=0 và cold start; khôi phục setting 1.0/cold start thì cả hai trở lại false. Đọc qua Hermes inspector tại runtime thật, không dùng mock của Jest. Source thư viện hiện tại đọc transition scale; chỉ đặt animator scale=0 chưa bật flag. Đã khôi phục cả animator/transition scale về 1.0. Logs: `build-logs/ui-adr-motion-{default,reduced,restored}.log`; ảnh `build-logs/phase-0/ui-adr-reduced-motion.png`. Không dùng kết quả này để tuyên bố FPS hoặc live cập nhật setting khi app đang mở; hook thư viện lấy giá trị lúc khởi động.

Lượt Maestro trước sửa cn(): flow 01/03/04 pass; flow 02 đã về Login sau logout đúng nhưng fail thời hạn 15 giây ở bước cold reopen (ảnh/hierarchy đã có Login tại lúc thu artifact). Đổi timeout của cold reopen thành 30 giây, giữ nguyên assertions; dừng lượt cũ trước flow 05 để chạy lại trên source cuối. Các log cũ là lịch sử, không ghi thành full-suite pass.


Nguồn kiểm chứng không có commit mới: snapshot SHA256 của 26 file UI/runtime tại `build-logs/ui-adr-source-snapshot.json`. Native dependencies không đổi trong refactor; chỉ bổ sung PostCSS 8.5.32 (đúng bản đã có trong lockfile) thành dev dependency trực tiếp cho setup compile Tailwind của Jest. RN 0.80.1, Reanimated 3.19.5, NativeWind 4.2.7 và Native Stack 7.3.21 giữ nguyên.


## Kết quả native cuối — 30/10/2026

`maestro test .maestro/phase-000-foundation-auth/ui-mock --format junit --output build-logs/phase-0/ui-adr-maestro-complete.xml --test-output-dir build-logs/phase-0/ui-adr-maestro-complete` đã pass **5/5 flow trong cùng một lượt, 10m35s**, trên cùng source cuối (snapshot khớp sau chạy):

| Flow UI mock | Kết quả |
| --- | --- |
| 01 — login validation/roles | Pass · 1m38s |
| 02 — settings/preferences/logout | Pass · 1m33s |
| 03 — login/bootstrap errors | Pass · 4m20s |
| 04 — logout errors/expired | Pass · 1m31s |
| 05 — keyboard/focus/root back | Pass · 1m33s |

XML không có failure/error; log `build-logs/ui-adr-maestro-complete.log`. Pixel_8, emulator-5554, Android 17 API37, APK Debug hiện có + Metro phục vụ UI refactor; không có thay đổi native dependency trong lượt refactor. Đã chụp và xem Login/Settings dark, sheet; 22 screenshot lấy từ lượt pass được copy vào `build-logs/phase-0/ui-adr/`. Đây là UI mock; E2E API tích hợp chưa được mở hoặc hoàn tất.


Production Android JS bundle pass (exit 0) bằng `react-native bundle --platform android --dev false --entry-file index.js --bundle-output build-logs/phase-0/ui-adr-production/index.android.bundle --assets-dest build-logs/phase-0/ui-adr-production/assets --max-workers 2`; đã copy 20 assets. Log `build-logs/ui-adr-production-bundle.log`. Đây là kiểm chứng bundle, không phải build/QA APK release mới. Đã kiểm tra lại system dark + font scale 130% sau cold start trên UI NativeWind: subtitle/footer xuống dòng, form/nút đọc được; ảnh mới tại `build-logs/phase-0/ui-adr/system-dark-font-130.png`. Đã trả font_scale về 1.0 và night mode về no, mở lại Login. Giới hạn live font-scale đã ghi trước đây không được suy là đã sửa từ kiểm tra cold start này.
