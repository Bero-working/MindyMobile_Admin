# Storage

`localStore.service.ts` giữ theme/ngôn ngữ trong MMKV. Không ghi credentials tại đây.

`secureStorage.ts` cung cấp `setItem(key, value)`, `getItem(key)` và `removeItem(key)` qua Keychain/Keystore. Import `{ secureStorage }` từ `@/services/storage/secureStorage`. Mỗi key có service namespace riêng; get trả `null` khi không tồn tại. Lỗi native được reject cho caller xử lý, không log dữ liệu hoặc fallback sang storage không mã hóa. Key phải không rỗng; giá trị chịu giới hạn của native credential storage, chỉ dùng cho secret nhỏ.

Chưa nối service này vào cookie auth hoặc lưu phiên mock. Việc chọn dữ liệu phiên nào được persist phải theo contract auth sau duyệt UI. Không lưu mật khẩu đăng nhập, query cache, roster hoặc draft vào đây theo suy đoán.

Sau khi cài dependency cần rebuild native; trên macOS chạy `npm run pod-install` trước iOS build. Kiểm thử Jest mock không chứng minh bảo mật trên thiết bị. Xem [ADR-018](../../../docs/adr/ADR-018-secure-storage-network-and-lazy-loading.md).
