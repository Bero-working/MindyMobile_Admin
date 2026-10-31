# Phase 0 — Hướng dẫn xem và duyệt UI mock

Ngày: 30/10/2026 (Asia/Bangkok). Phạm vi review: Bootstrap, Login, Access denied, Settings và khung workspace tối thiểu của Mentor/Quản lý. Không có API thật.

## Mở ứng dụng

Tại root repository, chạy `npm start`; ở terminal khác chạy `npm run android`. Với emulator/thiết bị USB cần Metro, dùng `adb reverse tcp:8081 tcp:8081` khi kết nối chưa được CLI thiết lập. Dependencies và Android Debug APK đã build trong lượt triển khai này. APK development dùng Metro; không phải gói phát hành production độc lập.

App hiện nhãn **UI MOCK · P0**. Dữ liệu hoàn toàn giả; không nhập mật khẩu thật. Hai tài khoản mock dưới đây dùng mật khẩu bất kỳ không trống:

| Email giả | Kết quả |
| --- | --- |
| mentor@mindy.vn | Workspace Mentor |
| manager@mindy.vn | Workspace Quản lý |

## Xem từng trạng thái

Bấm nhãn **UI MOCK · P0** ở phía trên để mở công cụ review (chỉ development):

| Nhóm | Chọn | Điều cần xem |
| --- | --- | --- |
| Bootstrap | Chưa đăng nhập, MENTOR, MANAGER, Phiên không hợp lệ | Đích Login/workspace/Denied tương ứng; chọn fixture sẽ khởi động lại root UI |
| Bootstrap lỗi | offline, timeout, server, invalidResponse, config | Thẻ lỗi, retry và mã hỗ trợ; config không có retry |
| Thông báo Login | sessionExpired, accountInactive | Cảnh báo đúng nội dung; ẩn khi submit |
| Login lỗi | login-invalidCredentials, login-offline, login-timeout, login-server, login-invalidResponse, login-config | Sau khi điền form và submit: đúng lỗi, giữ/xóa field theo design |
| Logout | ok, expired, offline, timeout, server ở nhóm Logout mock | Chọn kết quả rồi đóng công cụ; thực hiện logout trong Denied hoặc Settings |

`Chưa đăng nhập` (`signedOut`) đưa về luồng đăng nhập bình thường, không phải role. Chỉ có hai role MENTOR và MANAGER. `Phiên không hợp lệ` (`accessDenied`) là fixture dữ liệu phiên lỗi để kiểm tra màn phòng vệ, không tạo role thứ ba. Các scenario lỗi giữ kết quả cho đến khi chọn scenario khác. Chọn `ok` ở Logout mock để trở về kiểm tra logout thành công sau khi thử lỗi.

## Luồng cần duyệt

1. Login: layout header/linh vật/form; nhập trống hoặc sai email; hiện/ẩn password; bàn phím Next/Go; hướng dẫn Quên mật khẩu.
2. Đăng nhập Mentor/Manager: vào đúng workspace tối thiểu; avatar mở Tài khoản; back quay đúng workspace.
3. Settings: đổi vi/en và system/light/dark ngay trong trang; đóng/mở lại vẫn giữ preference; kiểm tra hai sheet logout và logout-all, nút hủy và thông báo lỗi.
4. Logout: Login không giữ email/password/tên/avatar cũ; không back về workspace. Đăng nhập user khác chỉ hiện dữ liệu user mới.
5. Denied: fixture phiên không hợp lệ không vào workspace; màn chỉ hiện email và không gán role giả; logout lỗi giữ màn để thử lại.
6. Bootstrap: xem thẻ lỗi và kiểm tra retry; không mở workspace bằng dữ liệu user cũ.

## Ảnh native local

Ảnh hiện hành sau refactor NativeWind được chụp từ emulator Android, nằm trong thư mục `build-logs` bị gitignore. Ảnh dùng dữ liệu giả; không phải screenshot được dựng từ HTML.

| Màn | Ảnh |
| --- | --- |
| Login sáng | [login-light.png](../../../build-logs/phase-0/ui-adr/login-light.png) |
| Workspace Mentor | [workspace-mentor.png](../../../build-logs/phase-0/ui-adr/workspace-mentor.png) |
| Workspace Quản lý | [manager.png](../../../build-logs/phase-0/ui-adr/manager.png) |
| Access denied | [invalid-session.png](../../../build-logs/phase-0/ui-adr/invalid-session.png) |
| Settings sáng | [settings-light.png](../../../build-logs/phase-0/ui-adr/settings-light.png) |
| Settings tối/en | [settings-dark.png](../../../build-logs/phase-0/ui-adr/settings-dark.png) |
| Logout mọi phiên tối | [logout-all-dark.png](../../../build-logs/phase-0/ui-adr/logout-all-dark.png) |
| Keyboard/focus sau sai thông tin | [invalid-credentials-focused.png](../../../build-logs/phase-0/ui-adr/invalid-credentials-focused.png) |
| Theme hệ thống tối, cỡ chữ 130% sau mở lại | [system-dark-font-130.png](../../../build-logs/phase-0/ui-adr/system-dark-font-130.png) |
| Login tối sau logout | [login-dark-after-logout.png](../../../build-logs/phase-0/ui-adr/login-dark-after-logout.png) |

Bổ sung NativeWind/Reusables/Zod và kiểm chứng hiện tại: [ui-adr-completion.md](ui-adr-completion.md).

Mapping 71 TC và kết quả kỹ thuật tại [ui-verification.md](ui-verification.md). Hồ sơ thực hiện ở [README](README.md); tiến độ và cổng duyệt tại [phase-000-foundation-auth](../../progress/phase/phase-000-foundation-auth.md).

## Kết quả và giới hạn

Bản UI NativeWind/Reusables/Zod hiện tại: lint/format/typecheck và 73 tests pass. Kết quả native mới nhất và reduced motion xem [ui-adr-completion.md](ui-adr-completion.md); các báo cáo trước refactor được giữ làm lịch sử. Chưa có E2E API tích hợp hoặc native iOS. Live đổi font scale trên Android 17 có thể cần mở lại app để text reflow; ảnh 130% đã chụp sau mở lại. Các giới hạn này không được ghi thành test pass.

## Cổng sau review

Chờ người dùng approve **UI toàn phase 0**. Nếu cần sửa, tiếp tục sửa UI và trình lại. Không suy việc duyệt kế hoạch hoặc yêu cầu implement thành approve UI. API/contract/auth cookie và E2E tích hợp chỉ bắt đầu sau cổng UI và các điều kiện liên quan được chốt. Phase chưa Done hoặc được nghiệm thu từ việc có bản UI mock.


Đính chính của người dùng: chỉ có MENTOR/MANAGER, không có role guest/ADMIN/STUDENT. Các ảnh/report cũ trong hồ sơ là lịch sử trước đính chính; flow Maestro sau refactor và đính chính đã pass 5/5 cùng lượt; xem hồ sơ hiện hành.
