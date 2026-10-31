# Phase 1 — E2E API

31/10/2026 (Asia/Bangkok). Android Pixel_8, emulator-5554, x86_64, API_URL HTTPS development hiện có. Tài khoản kiểm thử lấy từ file local bị gitignore; không ghi credential vào flow hoặc tài liệu.

Chạy `npm run test:api:phase-1` trước để xác minh adapter và tạo dataset ID local, sau đó `npm run test:e2e:phase-1`. Flow chính `.maestro/phase-001-teaching-workspace/phase-1.yaml`; login dùng `api/login.yaml`. Các flow `ui-mock/` là bằng chứng UI cũ, không dùng làm kết quả API.

| Slice/nhóm | Flow và expected result |
| --- | --- |
| S1, Home | Mentor login → lịch thật, không badge mock, range/ngày hiển thị |
| S2/S3 | Mentor lớp IN_PROGRESS theo ID backend → chi tiết/capability đọc roster |
| S4 | Buổi theo ID backend → context đúng, tab roster đọc được |
| S5 | Roster lớp có rows thật, không lỗi/fixture |
| S6/S7 | Login Manager → list/detail → tab lịch và học viên thật |
| Scope | Home không mở entry role kia; nhánh substitute kiểm scope alert và không có class roster button khi dataset có SESSION |
| Hồi quy P0 | `npm run test:e2e:phase-0`: login/settings/profile/logout/persisted-session cho hai role |

Lượt đầu dừng do biến ID không có tiền tố MAESTRO_ nên runner không đưa vào Maestro; đã sửa runner/flow dùng MAESTRO_MENTOR_CLASS_ID và các biến tương ứng. Đây là lỗi harness, không tính là kết quả pass. **Kết quả P1 cuối: pass exit 0**, `npm run test:e2e:phase-1`, report `C:/Users/admin/.maestro/tests/2026-10-31_202502`. Đã đi qua 7 màn với dữ liệu backend thật; nhánh substitute SKIPPED vì dataset không có lớp SESSION IN_PROGRESS. Đã xem cả 6 ảnh: schedule, mentor-class, mentor-roster, session-roster, manager-class, manager-roster. Ảnh mentor-class được chụp khi request timetable còn tải (skeleton); không dùng ảnh này làm bằng chứng số buổi bằng 0. Các bước sau đó đã chờ và mở đúng buổi backend theo ID.

Logs local: `build-logs/phase-1-api-maestro.log`; screenshots nằm trong thư mục report ở `P1 API - seven screens with authenticated backend data/takeScreenshot/build-logs/phase-1/api/`; Maestro report trong thư mục `.maestro/tests` của user. Chỉ ảnh đã kiểm mới dùng làm bằng chứng layout. Screenshot/log local có thể có dữ liệu tài khoản kiểm thử nên không commit.


## Hồi quy P0 — kết quả cuối

`npm run test:e2e:phase-0`, report `2026-10-31_202749`: phần đăng nhập sai và toàn bộ Mentor pass. Khi bắt đầu Manager, màn native kẹt “Loading from 10.0.2.2:8081”, timeout trước login. Không ghi lượt tổng này là pass. Đã kiểm ảnh/hierarchy lỗi; Metro status vẫn HTTP 200 nhưng bundle request không hoàn tất, không có lỗi ReactNativeJS. Khởi động lại đúng process Metro với `npm start -- --reset-cache` và giữ ADB reverse 8081.

Sau đó chạy riêng flow có sẵn `api/02-session-settings-logout.yaml` với account Manager, EXPECTED_WORKSPACE=workspace-manager-root, LOGOUT_ROW=settings-logout-all-row: **pass exit 0**, report `2026-10-31_204004`, log `build-logs/phase-1-manager-regression.log`. Login → persisted session → language/theme → profile → hủy/xác nhận logout-all → mở lại app vẫn login đều pass. Tất cả nhánh P0 đã được kiểm qua hai lượt; không sửa code auth/API để xử lý lỗi tải Metro. Android thực tế là 17 / API 37.
