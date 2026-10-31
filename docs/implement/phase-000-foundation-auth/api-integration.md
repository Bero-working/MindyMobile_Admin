# Phase 0 — tích hợp API auth

30/10/2026 (Asia/Bangkok). Người dùng: “Duyệt UI, gắn API vào đi”, sau đó cung cấp hai tài khoản test MENTOR/MANAGER. UI phase 0 được duyệt; không yêu cầu duyệt lại. Chưa nghiệm thu phase.

## Phạm vi đã nối

| Slice | Triển khai |
| --- | --- |
| Bootstrap | me, refresh single flight, kiểm schema/status, thông báo hết phiên/inactive và retry lỗi |
| Login | POST email/password thật, kiểm DTO và xác minh native access cookie bằng me cùng user id |
| Access denied | Giữ role gate từ phiên backend; không cho chọn role; đăng xuất qua API |
| Settings | preferences vi/en/theme local; logout/logout-all 204, refresh một lần khi 401, xóa cache trước thay navigator |

Entry chính dùng `createAuthService`, không mount ReviewControls hoặc mock service kể cả Debug. Mock còn cho test UI ở boundary. Không fallback API lỗi sang mock. Không sửa design, backend, env local, ADR Accepted cũ hoặc tạo commit. `AuthError` chỉ mang mã UI/requestId; password/cookie/body không log hoặc persist.

## Quyết định và kế hoạch thực hiện

Theo cổng API của kế hoạch phase đã duyệt: đối chiếu source backend → ghi contract bốn slice và snapshot có hash → nối service và UI boundary → kiểm tra schema/lỗi/refresh/cache → native build/run → Maestro với dữ liệu test. [ADR-019](../../adr/ADR-019-phase-0-cookie-auth.md), [contract](../../api-contract/phase-000-foundation-auth/README.md), [snapshot](../../api-contract/legacy/README.md).

API_URL development hiện có `https://api.quanh123.id.vn/api/v1`; HTTPS từ emulator, không dùng localhost/HTTP hoặc header Origin tự đặt. Release vẫn lấy `.env.production`, cần cấu hình HTTPS của môi trường release. Không lưu credentials test trong flow; truyền qua biến MAESTRO_TEST_EMAIL/MAESTRO_TEST_PASSWORD lúc chạy, xóa biến sau đó và redact artifacts text chứa password. Không dùng file env backend.

## Kiểm chứng

- `npm run check`: ESLint/Prettier/typecheck và 8 suites/97 tests pass; log cuối `build-logs/auth-api-check-final.log`. Jest giả lập Axios để kiểm điều phối, không chứng minh native jar/TLS.
- Android `:app:assembleDebug -PreactNativeArchitectures=x86_64`: BUILD SUCCESSFUL, 43s, 417 tasks; `build-logs/auth-api-build.log`. Đã cài APK lên emulator-5554, Pixel_8 Android 17/API 37. Debug tải JS source hiện hành từ Metro 8081.
- API thật không credentials: me 401 AUTHENTICATION_REQUIRED; Maestro signed-out/invalid-login/relaunch pass 1/1, 1m07s; `build-logs/auth-api-maestro.xml` và `.log`.
- API thật với Manager, qua PowerShell WebRequestSession: login hai phiên 200, refresh 200 giữ identity, me 200, logout-all 204, me và refresh của phiên thứ hai đều 401. `build-logs/auth-api-live-contract.json` chỉ lưu status, không lưu cookie/token. Đây là bằng chứng HTTP/backend, không phải native networking.
- Lượt Maestro Mentor đầu: login đúng role, relaunch vẫn giữ workspace, settings vi/en/theme, hủy và xác nhận logout, không quay lại Settings bằng Back đều đi qua; bước cuối relaunch gặp bootstrap error và flow fail. Báo cáo giữ nguyên `build-logs/auth-api-mentor.xml`/`.log` và `auth-api-mentor-debug/`; không tính pass toàn flow từ các bước trước. Không kết luận nguyên nhân lỗi bootstrap từ ảnh này.
- Maestro Manager: PASS 1/1, 1m44s trên source cuối; login → đúng workspace → relaunch giữ phiên → settings vi/en/theme → hủy logout-all → xác nhận logout-all → Back không lộ Settings → relaunch về login. `build-logs/auth-api-manager.xml`/`.log`, artifacts dưới `auth-api-manager-debug/`.
- Maestro Mentor chạy lại trên source cuối, không đổi flow: PASS 1/1, 1m49s, gồm bước relaunch cuối sau logout. `build-logs/auth-api-mentor-rerun.xml`/`.log`, artifacts dưới `auth-api-mentor-rerun-debug/`. Tổng kết ba ca API thật hiện hành: signed-out/invalid-login, Mentor/logout, Manager/logout-all đều pass; giữ lượt fail lịch sử và giới hạn native expiry/iOS bên dưới.

## Giới hạn

iOS chưa build/run trên macOS. Native refresh khi access cookie hết hạn nhưng refresh còn hiệu lực cần bằng chứng thiết bị riêng; hiện có kiểm tra service bằng Jest và refresh thật qua HTTP, không suy thành native rotation đã pass. Offline/timeout/server/DTO sai chủ yếu kiểm bằng test service/UI. Denied là phòng vệ phiên không hợp lệ; không tạo role hoặc sửa tài khoản backend để ép nhánh. Không đánh dấu phase Done thay người dùng.

CLI Postman trên PATH là alias ứng dụng desktop; không dùng để tuyên bố đã chạy Postman simulation. Không cần khởi tạo workspace hoặc cài CLI để thay thế kiểm chứng trực tiếp này.
