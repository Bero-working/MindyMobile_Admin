# P0-S3 — Access denied

Không có endpoint riêng. User từ me/login/refresh qua schema rồi role gate: MENTOR/MANAGER vào workspace. Giá trị role không được hỗ trợ chỉ vào Denied; không coi là role sản phẩm mới, không cho chọn hoặc sửa role ở UI.

Nút đổi tài khoản gọi `POST /auth/logout`, cùng xử lý refresh/204/lỗi như [settings](settings.md). Chỉ xóa UI/cache và về login khi logout thành công hoặc phiên đã hết hạn. Lỗi mạng giữ màn hình để retry, không báo thành công giả.
