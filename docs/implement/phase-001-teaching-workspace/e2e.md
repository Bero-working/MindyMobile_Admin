# Phase 1 — E2E API

**Trạng thái hiện hành 01/11/2026:** Người dùng đã nghiệm thu Phase 1, UI/API 7/7, **Done**. [Rà soát source hiện tại và giới hạn kiểm chứng](review-cleanup.md). Nội dung theo ngày bên dưới là hồ sơ lịch sử; các câu chờ duyệt/API 0/7 không còn là trạng thái hiện hành.

31/10/2026 (Asia/Bangkok). Android Pixel_8, emulator-5554, x86_64, API_URL HTTPS development hiện có. Tài khoản kiểm thử lấy từ file local bị gitignore; không ghi credential vào flow hoặc tài liệu.

Chỉ chạy `npm run test:e2e:phase-1` theo [ADR-026](../../adr/ADR-026-single-e2e-command-per-phase.md). Command tự kiểm adapter API, tạo lại dataset ID local, kiểm đủ class/session ID của hai role rồi chạy Maestro; lỗi bước nào trả exit code khác 0 và dừng bước phụ thuộc. Tài khoản lấy từ biến môi trường hoặc file local; app native phải kết nối cùng backend và có Metro/emulator sẵn sàng. Flow chính `.maestro/phase-001-teaching-workspace/phase-1.yaml`; login dùng `api/login.yaml`. Các flow `ui-mock/` là bằng chứng UI cũ, không dùng làm kết quả API.

| Slice/nhóm | Flow và expected result                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| S1, Home   | Mentor login → lịch thật, không badge mock, range/ngày hiển thị                                                        |
| S2/S3      | Mentor lớp IN_PROGRESS theo ID backend → chi tiết/capability đọc roster                                                |
| S4         | Buổi theo ID backend → context đúng, tab roster đọc được                                                               |
| S5         | Roster lớp có rows thật, không lỗi/fixture                                                                             |
| S6/S7      | Login Manager → list/detail → tab lịch và học viên thật                                                                |
| Scope      | Home không mở entry role kia; nhánh substitute kiểm scope alert và không có class roster button khi dataset có SESSION |
| Hồi quy P0 | `npm run test:e2e:phase-0`: login/settings/profile/logout/persisted-session cho hai role                               |

Lượt đầu dừng do biến ID không có tiền tố MAESTRO\_ nên runner không đưa vào Maestro; đã sửa runner/flow dùng MAESTRO_MENTOR_CLASS_ID và các biến tương ứng. Đây là lỗi harness, không tính là kết quả pass. **Kết quả P1 cuối: pass exit 0**, `npm run test:e2e:phase-1`, report `C:/Users/admin/.maestro/tests/2026-10-31_202502`. Đã đi qua 7 màn với dữ liệu backend thật; nhánh substitute SKIPPED vì dataset không có lớp SESSION IN_PROGRESS. Đã xem cả 6 ảnh: schedule, mentor-class, mentor-roster, session-roster, manager-class, manager-roster. Ảnh mentor-class được chụp khi request timetable còn tải (skeleton); không dùng ảnh này làm bằng chứng số buổi bằng 0. Các bước sau đó đã chờ và mở đúng buổi backend theo ID.

Logs local: `build-logs/phase-1-api-maestro.log`; screenshots nằm trong thư mục report ở `P1 API - seven screens with authenticated backend data/takeScreenshot/build-logs/phase-1/api/`; Maestro report trong thư mục `.maestro/tests` của user. Chỉ ảnh đã kiểm mới dùng làm bằng chứng layout. Screenshot/log local có thể có dữ liệu tài khoản kiểm thử nên không commit.

## Kiểm chứng command duy nhất — 01/11/2026

Theo ADR-026, đã bỏ `test:e2e:phase-1:ui` và `test:api:phase-1` khỏi package.json, xóa launcher UI mock không còn dùng. Helper kiểm API được command tổng gọi nội bộ. Flow mock và kết quả cũ giữ để truy vết.

- `npm run test:e2e:phase-1`: **PASS, exit 0** trên Pixel_8. Command thực tế tự kiểm API thật cho Mentor/Manager, ghi dataset mới rồi chạy `.maestro/phase-001-teaching-workspace/phase-1.yaml` đến hết. Report: `C:/Users/admin/.maestro/tests/2026-11-01_084431/`; ảnh tại thư mục `P1 API - seven screens with authenticated backend data/takeScreenshot/build-logs/phase-1/api/` trong report.
- API: Mentor classes/class/units/sessions/students/context/sessionStudents/schedule và Manager classes/class/units/sessions/students/context/sessionStudents đều trả success. Không ghi credentials vào hồ sơ.
- Native: đăng nhập theo hai role, lịch Mentor, lớp/chi tiết/roster, context và roster buổi Mentor, lớp/chi tiết/lịch/roster và hai tab buổi Manager đạt các assertion hiện có. Không có badge mock.
- **Skipped:** nhánh Mentor dạy thay do dataset không có `substituteClassId`; không ghi nhánh này là pass. Không chạy lại hồi quy P0 hoặc iOS trong lượt gộp command. Flow pass không bổ sung độ bao phủ cho nhánh chưa có dữ liệu hoặc kết luận chất lượng bố cục ngoài assertion.
- Kiểm tra orchestration bằng Node VM với tiến trình/filesystem giả lập: đúng thứ tự API → dataset → Maestro; biến môi trường ưu tiên file local; chạy được khi chỉ có biến môi trường; thiếu tài khoản/ID chặn bước phụ thuộc; API lỗi hoặc bị ngắt không mở Maestro; native lỗi/bị ngắt trả mã thất bại; lỗi spawn không chạy bước sau; chọn launcher Windows/POSIX đúng. Kiểm tra package.json chỉ còn một command P1 đạt.
- ESLint hai script sửa đổi: pass, 0 warning. Prettier README/package.json/hai script, `node --check` hai script, liên kết local trong tài liệu chính và `git diff --check`: pass. Không sửa source ứng dụng hoặc chạy lại toàn bộ Jest/TypeScript vì thay đổi thuộc launcher/tài liệu.

## Hồi quy P0 — kết quả cuối

`npm run test:e2e:phase-0`, report `2026-10-31_202749`: phần đăng nhập sai và toàn bộ Mentor pass. Khi bắt đầu Manager, màn native kẹt “Loading from 10.0.2.2:8081”, timeout trước login. Không ghi lượt tổng này là pass. Đã kiểm ảnh/hierarchy lỗi; Metro status vẫn HTTP 200 nhưng bundle request không hoàn tất, không có lỗi ReactNativeJS. Khởi động lại đúng process Metro với `npm start -- --reset-cache` và giữ ADB reverse 8081.

Sau đó chạy riêng flow có sẵn `api/02-session-settings-logout.yaml` với account Manager, EXPECTED_WORKSPACE=workspace-manager-root, LOGOUT_ROW=settings-logout-all-row: **pass exit 0**, report `2026-10-31_204004`, log `build-logs/phase-1-manager-regression.log`. Login → persisted session → language/theme → profile → hủy/xác nhận logout-all → mở lại app vẫn login đều pass. Tất cả nhánh P0 đã được kiểm qua hai lượt; không sửa code auth/API để xử lý lỗi tải Metro. Android thực tế là 17 / API 37.
