# Phase 1 — Native UI smoke

Ngày 31/10/2026 (Asia/Bangkok). Flow: `.maestro/phase-001-teaching-workspace/ui-mock/phase-1-ui.yaml`. Lệnh: `npm run test:e2e:phase-1:ui`.

Auth P0 dùng server deploy; 7 màn P1 dùng fixture, không có dữ liệu P1 từ backend. Tài khoản lấy từ biến môi trường `MAESTRO_MENTOR_EMAIL/PASSWORD`, `MAESTRO_MANAGER_EMAIL/PASSWORD`, hoặc file local bị ignore `.maestro/accounts.local.json`; runner không ghi credentials ra console.

Thiết bị: emulator-5554 (Pixel_8), Android debug x86_64. Metro cổng 8081; `adb reverse tcp:8081 tcp:8081`. Android SDK từ `ANDROID_HOME`, JDK Android Studio jbr khi build.

Suite bao gồm S1 lịch → S4 context/học viên; S2 lớp → S3 workspace → S5 roster; scope SESSION không có roster CLASS, có link/context riêng; S6 Manager → S7 lịch/học viên/liên hệ. Ảnh ở `build-logs/phase-1/ui/`, log `build-logs/phase-1-ui-maestro.log` (local, gitignore).

Lượt đầu fail tại bước `hideKeyboard`/tap nút login: artifact cho thấy đã về launcher. Flow sửa dùng `scrollUntilVisible` tới nút submit như suite P0. Chưa ghi pass từ lượt thất bại; kết quả lượt cuối sẽ được bổ sung.

Bộ E2E tích hợp API P1 theo ADR-020 chỉ được viết/chạy sau approve UI và nối API, với dataset riêng cho mentor chính/thay/Manager, thu hồi assignment và các nhánh lỗi thật. Smoke này không thay cổng E2E đó, không phải nghiệm thu phase.

## Kết quả cuối

**PASS, exit 0** — lượt `2026-10-31_091807` của Maestro 2.11.0, Android 17, thiết bị `sdk_gphone16k_x86_64`/emulator-5554 (Pixel_8). Chạy lại toàn flow sau khi bỏ tên/mã lớp bị lặp trong phần thân. Lượt trước `2026-10-31_091421` cũng pass 7 màn cơ bản; lượt cuối bổ sung Settings en/dark, tìm không có kết quả/xóa lọc, lỗi riêng tab học viên và tóm tắt vẫn đọc được.

Report gốc: `C:/Users/admin/.maestro/tests/2026-10-31_091807/`. Ảnh từ `takeScreenshot/build-logs/phase-1/ui/` được copy về workspace để review; không đưa dữ liệu đăng nhập hoặc report auth vào Git.

| UI | Ảnh đã rà |
| --- | --- |
| S1 Lịch | [schedule.png](../../../build-logs/phase-1/ui/schedule.png) |
| S2 Lớp Mentor | [mentor-classes.png](../../../build-logs/phase-1/ui/mentor-classes.png) |
| S3 Workspace | [mentor-class-detail.png](../../../build-logs/phase-1/ui/mentor-class-detail.png) |
| S4 Context | [session.png](../../../build-logs/phase-1/ui/session.png) |
| S4 Học viên buổi | [session-students.png](../../../build-logs/phase-1/ui/session-students.png) |
| S4 Mentor thay | [substitute-session.png](../../../build-logs/phase-1/ui/substitute-session.png) |
| S5 Roster Mentor | [mentor-students.png](../../../build-logs/phase-1/ui/mentor-students.png) |
| S6 Lớp Manager | [manager-classes.png](../../../build-logs/phase-1/ui/manager-classes.png) |
| S7 Chi tiết Manager | [manager-class-detail.png](../../../build-logs/phase-1/ui/manager-class-detail.png) |
| S7 Roster Manager | [manager-students.png](../../../build-logs/phase-1/ui/manager-students.png) |
| English/dark | [manager-dark-en.png](../../../build-logs/phase-1/ui/manager-dark-en.png) |
| Lỗi riêng tab học viên, English/dark | [manager-students-error-dark-en.png](../../../build-logs/phase-1/ui/manager-students-error-dark-en.png) |

Không chạy iOS, không khẳng định đã kiểm screen reader hoặc mọi mức font scale. API P1 0/7, người dùng chưa approve UI hoặc nghiệm thu phase.


## Home — kết quả bổ sung 31/10/2026

- `npm run test:e2e:phase-1:ui`: **PASS, exit 0**, report `C:/Users/admin/.maestro/tests/2026-10-31_094806/`, Maestro 2.11.0, Pixel_8/emulator-5554 Android 17, debug x86_64 và Metro 8081. Log `build-logs/home-maestro.log`.
- Flow bổ sung assertion nhóm/tile đúng role, Home sau stop/launch (restore), avatar → Profile → back, ảnh Mentor/Manager vi/light, Manager en/dark; hồi quy đủ 7 UI P1, scope CLASS/SESSION, search và lỗi riêng roster. Auth thật P0; dữ liệu P1 vẫn fixture.
- Lượt `094526` fail khi đang sửa JS/Metro reload giữa smoke; ảnh bước 45 cho thấy đã quay về Home. Lượt sau chạy trên code chốt đã pass cùng bước đó và toàn flow. Không ghi lượt fail là pass.
- `maestro test .maestro/phase-001-teaching-workspace/ui-mock/home-layout.yaml`: **PASS, exit 0**, report `C:/Users/admin/.maestro/tests/2026-10-31_095121/`, log `build-logs/home-layout-maestro.log`. Flow yêu cầu phiên Manager hợp lệ đã có. Trước chạy dùng `adb shell wm size 945x2100` tại density 420 (360dp), `adb shell settings put system font_scale 1.3`; sau chạy khôi phục `wm size reset` và font_scale `1.0`, đã xác minh.

Ảnh đã copy về workspace và rà trực tiếp:

| Biến thể | Ảnh |
| --- | --- |
| Mentor vi/light | [home-mentor-vi-light.png](../../../build-logs/phase-1/ui/home-mentor-vi-light.png) |
| Manager vi/light | [home-manager-vi-light.png](../../../build-logs/phase-1/ui/home-manager-vi-light.png) |
| Manager en/dark | [home-manager-en-dark.png](../../../build-logs/phase-1/ui/home-manager-en-dark.png) |
| Manager en/dark, 360dp/font 130% | [home-manager-en-dark-360-font130.png](../../../build-logs/phase-1/ui/home-manager-en-dark-360-font130.png) |

Kết quả rà: đúng tile theo role; linh vật không che nhóm; nhãn tile không chồng nhau; tiêu đề nhóm English đầy đủ kể cả 360dp/130%; email rút gọn một dòng và nút Settings không bị đẩy khỏi màn. Chưa kiểm native tên rất dài, TalkBack/focus và mọi tổ hợp role/theme/language/font; giảm chuyển động đã kiểm bằng Jest, chưa kiểm thiết bị. iOS chưa chạy. Không thay bộ E2E tích hợp API P1 hoặc cổng duyệt UI/nghiệm thu.

## UI mới và chỉnh layout theo ảnh — 31/10/2026

- `npm run test:e2e:phase-1:ui`: PASS exit 0, lượt `2026-10-31_165317`; log `build-logs/phase-1-ui-new-smoke-final.log`.
- Đủ 7 màn; smoke Mentor CLASS/SESSION, roster buổi, Manager ba tab, vi/light, en/dark, tìm kiếm/xóa từ khóa và lỗi roster độc lập. Selector học viên Manager chuyển sang hàng tối giản, không còn contact.
- Flow `home-today-layout.yaml`: PASS, lượt `164913`; log `build-logs/phase-1-home-compact-native.log`. Kiểm Xem lịch mở S1 và vùng buổi mở S4. Rà ảnh `home-today-compact.png`: Xem lịch gần ngang chip, không có hàng trống phía trên.
- Các ảnh của lượt cuối đã copy về `build-logs/phase-1/ui/`; đã rà `session.png` sau sửa tab đầu và gap header 12px; `manager-classes.png`, `manager-class-detail.png`, `manager-students.png`, `manager-dark-en.png`.
- Đây là UI mock; auth P0 thật, API P1 chưa tích hợp. Không suy ra E2E backend, TalkBack, iOS hoặc mọi cỡ chữ đều pass.
