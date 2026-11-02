# Phase 1 — Rà soát và dọn dẹp sau nghiệm thu

**Cập nhật command 01/11/2026:** Theo ADR-026, chỉ dùng `npm run test:e2e:phase-1` cho bộ E2E hiện hành; command tự kiểm API/tạo dataset rồi chạy UI native với API thật. Các command `test:api:phase-1` và `test:e2e:phase-1:ui` bên dưới là lịch sử đã bỏ khỏi package.json, không phải bước cần chạy thêm. Kết quả kiểm chứng cũ giữ nguyên.

Ngày 01/11/2026 (Asia/Bangkok). Người dùng xác nhận “Tôi duyệt nghiệm thu và đã sửa nhiều chỗ”, yêu cầu kiểm tra, đồng bộ và dọn dẹp. Ghi nhận **phase Done, UI/API 7/7, slice hoàn chỉnh 7/7** theo quyết định nghiệm thu này.

## Source được rà soát

Working tree ban đầu sạch, HEAD `ba3ba56` (`feat(teaching): add teaching workspace and refresh manager session details`). Các sửa đổi người dùng đã có trong commit: tải API theo nhu cầu, lịch theo ngày, Manager Chi tiết buổi với hai tab Tổng quan/Học viên. Không ghi nhận các sửa đổi đó là thay đổi mới của lượt dọn dẹp.

Đối chiếu source, test, design S4 và các hồ sơ API/UI: Manager chỉ tải context khi mở màn, học viên tải khi mở tab; Mentor tab Tài liệu là placeholder, không có query units. Các chức năng attendance/ghi chú/tài liệu thuộc phase sau vẫn nằm ngoài phạm vi P1.

## Thay đổi trong lượt này

- Đồng bộ progress tổng, progress P1, README tài liệu, danh mục triển khai, kế hoạch tổng, 7 kế hoạch slice và mục lục contract sang trạng thái nghiệm thu 01/11.
- Bỏ các khối trạng thái hiện hành mâu thuẫn 0/7/Todo/chờ duyệt; giữ nhật ký và kết quả theo ngày dưới nhãn lịch sử. Không sửa design nguồn Claude hoặc snapshot backend.
- Sửa test Mentor đang kỳ vọng tải units ở tab Tài liệu theo hành vi placeholder P1 hiện có. Test vẫn kiểm tra chưa tải roster trước thao tác, tải khi mở Học viên và không gọi units khi mở Tài liệu. Không bỏ qua test và không đổi runtime để chiều test.
- Bổ sung flow Maestro toàn P1 mở Chi tiết buổi Manager từ lịch, kiểm hai tab và roster. Đây là phần mở rộng độ bao phủ; chỉ được coi pass khi flow chạy qua.
- Sửa mô tả lazy loading đã lỗi thời, bỏ mục `/coverage` lặp trong `.gitignore`, chuẩn hóa định dạng. Giữ flow mock, ảnh nguồn, tài liệu lịch sử và log local phục vụ truy vết.
- MVP ghi nhận 7/36 slice hoàn chỉnh (19,4%); không tự thay số P0 trong lượt nghiệm thu P1, không thay tiến độ P2–P8.

## Kiểm chứng source hiện tại

| Kiểm tra                       | Kết quả / bằng chứng local                                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint / Prettier / TypeScript | **Pass**, ESLint 0 warning; `npm run lint`, `build-logs/phase-1-acceptance-lint.log`; Markdown đã định dạng riêng vì `docs/` nằm trong `.prettierignore`                                                          |
| Jest toàn dự án                | **17 suites, 198/198 tests pass**, không skipped; `npm test -- --runInBand`, `build-logs/phase-1-acceptance-tests-final.log`                                                                                      |
| API backend thật               | **Pass** cả Mentor/Manager, list/detail/units/sessions/roster/context, Mentor schedule; `npm run test:api:phase-1`, `build-logs/phase-1-acceptance-api.log`                                                       |
| Android build                  | **BUILD SUCCESSFUL**, 1m21s; JBR Android Studio, `android/gradlew.bat app:assembleDebug`, `build-logs/phase-1-acceptance-build.log`                                                                               |
| Cài APK                        | `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` thành công trên Pixel_8, emulator-5554, Android 17/API 37                                                                                      |
| Maestro toàn P1 chạy lại       | **Fail tại bootstrap trước login**: không thấy `login-email-input`; màn hiện lỗi không xác minh được phiên. Report `C:/Users/admin/.maestro/tests/2026-11-01_081334`; `build-logs/phase-1-acceptance-maestro.log` |

Lượt kiểm đầu có 197/198 test pass, lỗi kỳ vọng units cũ. Bộ cuối 198/198 pass như bảng trên. Không dùng lượt lỗi làm kết quả cuối.

Đã xem ảnh `build-logs/phase-1-acceptance-current.png`: lỗi bootstrap, không phải ảnh kiểm chứng layout Manager. Backend từ máy trả 401 đúng kỳ vọng cho GET `/auth/me` và POST `/auth/refresh` không cookie; request adapter có đăng nhập vẫn pass. Thử nút Retry bằng flow local vẫn không tới login sau 30 giây, report `2026-11-01_081601`, log `build-logs/phase-1-bootstrap-retry.log`. Chưa xác định nguyên nhân lỗi native, không kết luận do backend hay mạng chỉ từ hai kết quả này.

Liên kết file tương đối trong toàn bộ Markdown thay đổi: **0 liên kết hỏng**. `git diff --check` pass.

## Giới hạn sau nghiệm thu

E2E API ngày 31/10 pass là bằng chứng lịch sử; lượt chạy lại 01/11 chưa xác nhận layout native mới và nhánh Manager bổ sung. iOS, TalkBack/font scale đầy đủ, native expiry/revocation và Mentor dạy thay thiếu dataset vẫn chưa có bằng chứng mới. Không suy các nhánh đó là pass từ unit/API hoặc việc người dùng nghiệm thu.

Log, report, tài khoản và dataset local vẫn được gitignore; không đưa credentials/PII vào tài liệu hoặc Git. Không tạo commit/PR trong lượt này.
