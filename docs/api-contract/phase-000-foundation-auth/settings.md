# P0-S4 — Settings / Logout

**Cập nhật UI 30/10/2026:** S4 có hai trang riêng theo design mới. Cài đặt chỉ chứa ngôn ngữ/giao diện; Hồ sơ hiển thị tài khoản và chứa logout/logout-all. Avatar workspace mở Profile, bánh răng mở Settings; contract auth bên dưới giữ nguyên. `phone: string | null` từ UserDto được validate và đưa vào view model; khi null hiển thị Chưa cập nhật/Not provided. Cả hai trang dùng phiên đã xác minh, không gọi API khi mở và không có endpoint sửa hồ sơ. Xem [hồ sơ cập nhật UI](../../implement/phase-000-foundation-auth/settings-profile-update.md).

**Xác nhận theo ảnh người dùng, hoàn thiện 31/10/2026:** logout/logout-all dùng dialog giữa màn hình thay bottom sheet. Mô tả ghi email và đúng phạm vi đăng xuất; thao tác xác nhận/Hủy, lỗi, busy và contract API bên dưới không đổi. Selector `logout-sheet` được giữ để tương thích test, không phản ánh cách hiển thị mới.

Email/displayName/role lấy từ phiên xác minh; ngôn ngữ/theme vẫn lưu preferences local. Không tạo endpoint cập nhật profile/settings không tồn tại trong backend.

`POST /auth/logout` hoặc `POST /auth/logout-all`, không body, gửi credentials. 204 → xóa Query cache/user trong bộ nhớ và thay navigator về login, không quay lại màn tài khoản bằng Back. Server revoke session và xóa cả cookie đúng path.

401 → refresh một lần. Refresh thành công → retry endpoint một lần; refresh hết phiên hoặc retry tiếp tục 401 → về login với sessionExpired, không toast thành công logout-all. Refresh/server/offline/timeout lỗi → giữ tài khoản và trả lỗi có thể retry. Hủy xác nhận không gọi API. [Schema/error chung](README.md).
