# Phase 0 — rà soát và dọn dẹp

31/10/2026 (Asia/Bangkok). Người dùng yêu cầu “Duyệt phase 1, kiểm tra và dọn dẹp”, sau đó đính chính “Tôi nhầm, duyệt phase 0”. Ghi nhận duyệt phase 0; không yêu cầu duyệt lại UI hoặc API.

## Kết quả rà soát

- Đã đọc service auth, AuthProvider, root navigation, Bootstrap/Login/Denied, Settings/Profile, dialog và storage. Không phát hiện lỗi sản phẩm mới cần sửa trong phạm vi rà soát và các test hiện có.
- Phát hiện flow Maestro signed-out kiểm `workspace-screen`, một selector không tồn tại trong app hiện tại. Assertion này có thể pass dù app vào workspace sai. Đã thay bằng cả `workspace-mentor-root` và `workspace-manager-root`, đồng thời kiểm không vào `denied-screen`.
- Thay `hideKeyboard` bằng `scrollUntilVisible` tới nút đăng nhập, đồng bộ với cách đã chạy thành công ở flow authenticated. Timeout bootstrap/relaunch debug là 120 giây, giống flow 02; timeout HTTP của app vẫn 10 giây.
- Đồng bộ trạng thái đầu trang và bảng hiện hành trong mục lục docs, kế hoạch/triển khai và tiến độ. Giữ nhật ký cũ với ngữ cảnh lịch sử; không dùng kết quả cũ làm bằng chứng mới.
- Không sửa design Claude, ADR Accepted, backend, credentials/env local hoặc xóa tài nguyên demo/fixture còn phục vụ hồi quy. Không tạo commit.

## Kiểm chứng

`npm run check` PASS: ESLint 0 error/0 warning, Prettier, `tsc --noEmit`, Jest 8 suites/102 tests, không skipped. Bộ test bao gồm schema/cookie identity/refresh single flight, role gate, lỗi/offline, cache khi logout, dialog busy/cancel/error và vi/en/theme.

Kiểm tra liên kết file tương đối trong 8 tài liệu Markdown đã sửa: PASS, không có file đích bị thiếu. `npm run lint` chạy lại sau dọn tài liệu: PASS. `git diff --check`: PASS.

### Maestro API thật

Lệnh chạy thành công:

```powershell
maestro --device emulator-5554 test --debug-output build-logs/phase-0-review-maestro-driver-reset .maestro/phase-000-foundation-auth/api/01-signed-out-and-invalid-login.yaml
```

**PASS 1/1**, process exit 0: signed-out → form validation → sai thông tin → Login/error, không vào workspace Mentor/Manager hoặc Denied → stop/relaunch → Login. Pixel_8 Android 17/API 37, Maestro 2.11.0/Java 21; dùng APK Debug hiện có và JS qua Metro 8081. Không thay code native nên không build lại APK. Chỉ dùng dữ liệu đăng nhập cố ý sai đã có trong flow.

Bằng chứng: `build-logs/phase-0-review-maestro-driver-reset.log` và thư mục debug cùng tên. Lượt `phase-0-review-maestro` bị dừng ở khởi tạo, lượt `phase-0-review-maestro-rerun` bị dừng khi chờ driver viewHierarchy; cả hai có lỗi file lock heartbeat trên Windows, không tính pass. Khởi động lại riêng driver `dev.mobile.maestro`/`dev.mobile.maestro.test`, lượt cuối hoàn tất dù vẫn có cảnh báo heartbeat. Giữ log và thread dump của các lượt để phân biệt vấn đề harness với kết quả flow; không quy nguyên nhân lỗi app từ cảnh báo này.

## Giới hạn còn theo dõi

Không có credentials test trong môi trường process của lượt này nên không chạy lại flow authenticated Mentor/Manager. Bằng chứng Mentor/dialog mới và Manager trước đổi dialog vẫn nằm trong [cập nhật S4](settings-profile-update.md); không tuyên bố đã rerun toàn bộ E2E.

iOS chưa build/run trên macOS. Native access-cookie expiry/refresh rotation chưa có bằng chứng thiết bị; service Jest và HTTP backend không thay thế kiểm chứng này. Duyệt của người dùng được ghi nhận riêng với độ bao phủ kiểm thử; không đóng các nhánh còn thiếu bằng chứng.
