# Phase 0 — Mapping kiểm chứng UI

Ngày: 30/10/2026 (Asia/Bangkok). Người thực hiện: Codex.

## Bằng chứng hiện tại

- `npm run check -- --json --outputFile=build-logs/phase-0-jest-results.json`: pass ESLint 0 error/0 warning, Prettier, typecheck và **63/63 tests, 3 suites**. Gồm 56 UI tests và 7 tests nền/env. JSON kết quả và transcript nằm trong `build-logs`.
- Test UI: [auth-ui.test.tsx](../../../__tests__/auth-ui.test.tsx), mock ở service boundary, dùng navigator/component thật trong Jest. Native keyboard-controller dùng mock chính thức ở unit tests; hành vi bàn phím được kiểm tra riêng bằng Maestro.
- Android bản mới có keyboard-controller: `./android/gradlew.bat -p android :app:assembleDebug -PreactNativeArchitectures=x86_64 --console=plain` **BUILD SUCCESSFUL**, 5m6s, 394 tasks (20 executed). Log `build-logs/phase-0-android-keyboard.log`. Kiểm chứng bản mới giới hạn ABI emulator x86_64, không suy thành 4 ABI hoặc release pass.
- Môi trường: Windows 11, JBR Java 21, RN 0.80.1, emulator Pixel_8 / sdk_gphone16k_x86_64, Android 17 API 37, 1080×2400, density 420. Đây là máy kiểm tra, không tự chốt OS tối thiểu của sản phẩm.
- Dependency thực: Native Stack 7.3.21, screens 4.14.0, Gesture Handler 2.32.0, Reanimated 3.19.5, keyboard-controller 1.18.5. Giữ RN/React major hiện tại. Keyboard-aware scroll dùng native/Reanimated để xử lý input/layout khi IME mở; không thay design hay thêm API.
- Windows build dùng CMake object-path limit 250 và staging `%TEMP%/mdy` để tránh Ninja/MAX_PATH. Không sửa node_modules hoặc tắt New Architecture để né lỗi.
- Base HEAD `94c45c2`, working tree có nhiều thay đổi chưa commit; không tạo commit/PR. SHA256 APK mới: `0D39877ACB4EE7ACE7D5D0FD48F5C868525B72B8B177885E4D9AB81CA7512880`.
- APK development lấy JS từ Metro của working tree, không phải bản production độc lập. Mock không gọi backend và không dùng tài khoản thật; release không mở workspace bằng mock.
- Maestro `05-keyboard-and-root-back` trên APK mới đã **pass 1m42s**, gồm Next/Go, invalid-credentials focus và back Denied. Báo cáo `build-logs/phase-0/maestro-keyboard-native.xml`.
- Luồng 01/02/04 đã pass ở APK/lượt trước khi thêm phụ thuộc native bàn phím; 03/05 đã pass lại trên APK mới sau sửa các lỗi liên quan. **Không có tuyên bố toàn bộ 5 flow chạy trong cùng một lượt hoặc trên cùng APK mới nhất.** Các thay đổi bàn phím/focus được kiểm tra lại trên APK mới, các nhánh role/preferences/logout có unit regression pass. Full-suite API tích hợp vẫn phải chạy riêng sau approve UI.

| Flow UI mock | Kết quả | Lượt/báo cáo | Phạm vi build |
| --- | --- | --- | --- |
| 01 login-and-roles | Pass 3m02s | `build-logs/phase-0/maestro-ui-final.xml` | APK trước native keyboard-controller |
| 02 settings-and-cleanup | Pass 1m27s | Cùng báo cáo trên | APK trước native keyboard-controller |
| 04 logout-recovery | Pass 1m21s | Cùng báo cáo trên | APK trước native keyboard-controller |
| 05 keyboard-and-root-back | Pass 1m42s | `build-logs/phase-0/maestro-keyboard-native.xml` | APK mới; log `phase-0-maestro-keyboard-native.log` |
| 03 error-states | Pass 4m56s | `build-logs/phase-0/maestro-errors-native.xml` | APK mới; log `phase-0-maestro-errors-native.log` |

Lượt suite đầu có 2 flow fail; giữ nguyên report gốc, không sửa thành pass. Các báo cáo rerun chứng minh lỗi đã được khắc phục. Windows Maestro có lỗi ghi heartbeat do file locking trong log; các flow vẫn hoàn tất với kết quả trên. Helper lặp cuộn có nhánh điều kiện không cần chạy khi mục đã hiện; không tính những nhánh này thành test case pass hoặc dùng test skipped làm bằng chứng.

## Kiểm tra hệ thống bổ sung

Đã đổi Android system night mode từ no → yes: app đang dùng theme system đổi sang dark. Sau đổi font scale 1.0 → 1.3 và mở lại app, Login/field/nút/footer đọc được, subtitle/footer xuống dòng đúng; ảnh `build-logs/phase-0/system-dark-font-130.png`. Khi đổi font scale ngay trong phiên đang mở trên emulator này, đã quan sát thấy text layout cũ có thể bị cắt đến khi mở lại app; không tuyên bố live font-scale change đã pass. Đã trả thiết bị về font scale 1.0, night mode no và mở lại app.

Chưa kiểm tra TalkBack/VoiceOver hoặc đo FPS; giảm motion được xử lý bằng Reanimated/useReducedMotion, không suy hiệu năng hoặc spoken-output pass từ screenshot/Jest.

## Các lần fail và sửa

1. Red ban đầu: module UI chưa tồn tại trong lượt viết bản nháp trước; không dùng kết quả đó làm nghiệm thu hiện tại.
2. Thêm test cảnh báo gradient: fail vì offset `.55`; sửa thành số hợp lệ và bọc SVG trong View absoluteFill để gradient phủ đủ parent có padding.
3. Native screenshot phát hiện Button/Row mất bố cục khi dùng style callback trong runtime NativeWind; chuyển sang style object/array và pressed state qua press events.
4. Thêm regression cho nhãn `Tiếng Việt` và chiều cao/hàng ngang của radio: fail trước sửa, pass sau sửa encoding/layout. Lưu red tại `build-logs/phase-0-settings-red.log`.
5. Native flow keyboard phát hiện focus password không thuộc native input sau khi nó bị disabled: RN giữ focus JS cũ. Thay riêng password input bằng instance mới, autofocus khi enabled, giữ email và password mới gõ sau lỗi. `05-keyboard-and-root-back` đã pass sau sửa; không bỏ assertion focus để né lỗi.
6. Keyboard-aware scroll: thay cách dựa vào event/resize RN chưa đủ bằng native keyboard-controller 1.18.5; tắt preload để tránh nháy bàn phím lúc mở app. Cần cập nhật Pods trên macOS cho iOS.
7. Native build từng fail vì đường dẫn C++ >260 ký tự; đã sửa staging và CMake limit, build lại thành công. Jest có 2 timeout khi chạy cùng native compilation; chạy lại bản cuối sau build đã pass toàn bộ 63 tests.
8. Test system theme từng fail vì preset RN thay hook bằng constant. Giữ hook thật, mock Appearance boundary để kiểm tra đổi theme trong trang; hiện pass, không sửa code theme để chiều test.

## Mapping đủ 71 test case design

Bảng nêu test Jest đại diện và flow native bổ sung; các assertion của cùng TC có thể nằm trong nhiều test. ID/expected gốc giữ tại kế hoạch slice và design Claude. Pass Jest chỉ chứng minh hành vi UI với mock; focus/back/visual/native cần bằng chứng riêng.

| Test case design | Test Jest đại diện đã pass | Flow native UI mock | Giới hạn/kết quả |
| --- | --- | --- | --- |
| TC-P0-S1-01 | `TC-P0-S1-01/02 checking starts at 600ms in vi` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-02 | `TC-P0-S1-01/02 checking starts at 600ms in vi` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-03 | `TC-P0-S1-03 and TC-P0-S2-01 guest opens a blank login without unsupported actions` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-04 | `S1 routes verified MENTOR safely` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass; back/focus bổ sung bởi flow 01 trước và flow 05 trên APK mới đã pass. |
| TC-P0-S1-05 | `S1 routes verified MANAGER safely` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-06 | `TC-P0-S1-06/07 ignores a cached Mentor when current verification returns MANAGER` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-07 | `TC-P0-S1-06/07 ignores a cached Mentor when current verification returns offline` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-08 | `S1 routes verified ADMIN safely` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-09 | `S1 routes verified STUDENT safely` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-10 | `S1 routes verified NEW_ROLE safely` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-11 | `S1 shows sessionExpired on login` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-12 | `TC-P0-S1-12 inactive clears private memory and shows the correct notice` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-13 | `S1 handles timeout errors` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-14 | `S1 handles server errors` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-15 | `S1 handles invalidResponse errors` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-16 | `S1 handles config errors` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-17 | `S1 config has no retry; offline retries once and clears the root stack` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-18 | `TC-P0-S1-17 retry locks duplicates and TC-P0-S1-18 unlocks after another failure` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S1-19 | `TC-P0-S1-19 dark English offline error stays outside all workspaces` | 03-error-states; root/role checks bổ sung ở 01/04 | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-01 | `TC-P0-S1-03 and TC-P0-S2-01 guest opens a blank login without unsupported actions` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-02 | `S2 validates on submit and revalidates on typing without sending` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass; back/focus bổ sung bởi flow 01 trước và flow 05 trên APK mới đã pass. |
| TC-P0-S2-03 | `S2 validates on submit and revalidates on typing without sending` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-04 | `S2 validates on submit and revalidates on typing without sending` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-05 | `S2 trims email only, locks duplicate submission and routes success` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-06 | `S2 trims email only, locks duplicate submission and routes success` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-07 | `S2 handles invalidCredentials and retains the right fields` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass; back/focus bổ sung bởi flow 01 trước và flow 05 trên APK mới đã pass. |
| TC-P0-S2-08 | `S2 handles invalidCredentials and retains the right fields` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-09 | `S2 handles offline and retains the right fields` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-10 | `S2 handles timeout and retains the right fields` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-11 | `S2 handles server and retains the right fields` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-12 | `TC-P0-S2-12–15 routes login role MENTOR and clears the previous root` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-13 | `TC-P0-S2-12–15 routes login role MANAGER and clears the previous root` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-14 | `TC-P0-S2-12–15 routes login role ADMIN and clears the previous root` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-15 | `TC-P0-S2-12–15 routes login role STUDENT and clears the previous root` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-16 | `TC-P0-S2-16 toggle changes accessibility label twice without editing password` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-17 | `S2 toggles password and shows contact-only forgot sheet` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-18 | `TC-P0-S2-18 submitting dismisses expired notice even when validation fails` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-19 | `S1 shows accountInactive on login` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-20 | `TC-P0-S4-11/12 expired logout clears private cache (all=false)` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-21 | `TC-P0-S2-21 keyboard password submit uses the same validation and login boundary` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass; back/focus bổ sung bởi flow 01 trước và flow 05 trên APK mới đã pass. |
| TC-P0-S2-22 | `S2 handles config and retains the right fields` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S2-23 | `TC-P0-S2-23 validation is translated with the dark palette` | 01-login-and-roles; 03-error-states; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-01 | `S3 hides personal details, retains user after failed logout, retries expired session` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-02 | `S1 routes verified STUDENT safely` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-03 | `S1 routes verified NEW_ROLE safely` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-04 | `TC-P0-S3-04 and 11 hide profile information and translate denied dark mode` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-05 | `TC-P0-S3-05 denied logout is single-flight` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-06 | `TC-P0-S3-05 denied logout is single-flight` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-07 | `S3 hides personal details, retains user after failed logout, retries expired session` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-08 | `S3 hides personal details, retains user after failed logout, retries expired session` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S3-09 | `S3 hides personal details, retains user after failed logout, retries expired session` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest giữ màn/pass cleanup; requestId/logout server có flow 04 pass ở lượt trước. |
| TC-P0-S3-10 | `S1 routes verified ADMIN safely` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass; back/focus bổ sung bởi flow 01 trước và flow 05 trên APK mới đã pass. |
| TC-P0-S3-11 | `TC-P0-S3-04 and 11 hide profile information and translate denied dark mode` | 01-login-and-roles; 04-logout-recovery; 05-keyboard-and-root-back | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-01 | `S4 changes language/theme in place; cancel does not logout; logout-all clears cache` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-02 | `TC-P0-S4-18 dark manager settings use translated role and danger confirmation` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-03 | `TC-P0-S4-03 default radios are Vietnamese/system and version comes from the build` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-04 | `S4 changes language/theme in place; cancel does not logout; logout-all clears cache` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-05 | `TC-P0-S4-05/08 keeps preferences across a new app mount without keeping user data` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-06 | `TC-P0-S4-05/08 keeps preferences across a new app mount without keeping user data` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-07 | `TC-P0-S4-07 system color changes apply without navigating away` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-08 | `TC-P0-S4-05/08 keeps preferences across a new app mount without keeping user data` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-09 | `S4 changes language/theme in place; cancel does not logout; logout-all clears cache` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-10 | `TC-P0-S4-10 locks sheet cancel, scrim and back while logging out exactly once` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-11 | `S4 changes language/theme in place; cancel does not logout; logout-all clears cache` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-12 | `TC-P0-S4-11/12 expired logout clears private cache (all=false)` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-13 | `S4 failed logout stays open and unlocks cancel` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-14 | `TC-P0-S4-14 server logout error is copyable and leaves the account in place` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-15 | `S4 changes language/theme in place; cancel does not logout; logout-all clears cache` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-16 | `TC-P0-S4-16 user B never sees A after logout and login` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-17 | `TC-P0-S4-17 back returns to the same workspace without rechecking session` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |
| TC-P0-S4-18 | `TC-P0-S4-18 dark manager settings use translated role and danger confirmation` | 02-settings-and-cleanup; 04-logout-recovery | Jest pass ở boundary UI; native/ảnh bổ sung theo flow. |

## Chưa được chứng minh ở bước UI

Cookie/refresh, HTTP/error contract thật, Origin/CSRF, API auth, relaunch với phiên server, logout nhiều thiết bị và E2E tích hợp vẫn chờ approve UI/ADR Auth/môi trường. Mở lại demo sau stopApp không khôi phục user từ persistence; chỉ ngôn ngữ/theme được lưu.

iOS chưa build/chạy trên macOS; linking font/splash và privacy cover có source, chưa có bằng chứng native iOS. Android API 24–32 chưa kiểm chứng; không suy kết quả API 37 thành hỗ trợ mọi OS. Chưa tuyên bố TalkBack/VoiceOver hoặc FPS đã đạt từ Jest/Maestro.

## Kết luận bàn giao UI

4 slice UI mock được bàn giao để người dùng review qua [ui-review.md](ui-review.md). Chờ approve UI toàn phase; chưa gọi HTTP auth, chưa viết API contract/service tích hợp và chưa nghiệm thu phase. Design Claude và các ADR đã Accepted được kiểm tra hash, giữ nguyên trong lượt triển khai.


## Sửa lệnh npm run android — 30/10/2026

Người dùng báo lệnh mặc định lỗi. Đã tái hiện lỗi Ninja `Filename longer than 260 characters` ở arm64-v8a: `CMAKE_OBJECT_PATH_MAX=250` đủ với x86_64 nhưng tên object đã hash của ARM64 dài 250 ký tự nên CMake không áp dụng được giới hạn đó và giữ nguyên đường dẫn dài. Đổi giới hạn thành 259, giữ staging ngắn và cả 4 ABI. Đường dẫn object ARM64 sau sửa dài 250 ký tự, dưới giới hạn Windows. Không sửa node_modules hoặc vô hiệu New Architecture. Kết quả chạy lệnh lưu tại `build-logs/android-run-fix.log`.

Kiểm chứng sau sửa: chạy lại chính `npm run android` thành công (exit 0), `BUILD SUCCESSFUL in 2m 5s`, 419 tasks; build đủ armeabi-v7a/arm64-v8a/x86/x86_64, cài APK trên Pixel_8 Android 17 và khởi chạy MainActivity qua Metro. Log cuối: `build-logs/android-run-fix-final.log`; ảnh mở app: `build-logs/android-fix-launch.png`. UI vẫn chờ approve; không gắn API.


## Đính chính role từ người dùng — 30/10/2026

Chỉ có MENTOR và MANAGER; không có role thứ ba, kể cả guest. UI mock đã bỏ fixture role ADMIN/STUDENT/NEW_ROLE và các nhãn tương ứng. Trạng thái phiên chưa đăng nhập được đổi từ `guest` sang `signedOut`, hiển thị “Chưa đăng nhập”. Màn Denied chỉ là phòng vệ cho phiên không hợp lệ, không định nghĩa role bổ sung. Tài khoản demo: mentor@mindy.vn và manager@mindy.vn, mật khẩu bất kỳ không trống. Design/ADR và báo cáo trước đó giữ nguyên để bảo toàn lịch sử; phần role giả trong tài liệu cũ được thay thế bởi đính chính trực tiếp này. Maestro flow đã cập nhật; kết quả pass trước thay đổi không phải bằng chứng cho flow mới. Chưa tích hợp API, UI vẫn chờ duyệt.


30/10/2026 — Người dùng đính chính chỉ có hai role MENTOR/MANAGER, không có role guest. Đã bỏ role giả trong UI mock/review; `signedOut` chỉ biểu thị chưa đăng nhập. Denied dùng fixture phiên không hợp lệ, không gán thêm role. `npm run check` pass lint/format/typecheck và 68/68 tests (3 suites), log `build-logs/phase-0-role-correction-check-final.log`. Maestro đã sửa flow nhưng chưa chạy lại sau đính chính; kết quả trước đó là lịch sử. Chưa approve UI hoặc tích hợp API.


## Kiểm chứng sau hoàn thiện ADR UI

Hồ sơ hiện hành tại [ui-adr-completion.md](ui-adr-completion.md): NativeWind/Reusables/token/Zod đã hoàn thiện, lint/format/typecheck và 73 tests pass; toàn bộ 5 flow Maestro UI mock pass cùng lượt/source cuối (10m35s). Báo cáo này thay cho phần chưa rerun sau sửa role hoặc bằng chứng chia nhiều lượt ở trên. Lịch sử fail giữ nguyên. Reduced motion đã có kết quả native true/false và được khôi phục cài đặt; không suy thành iOS/FPS/E2E API pass.
