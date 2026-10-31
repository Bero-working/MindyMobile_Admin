# Phase 0 — Cập nhật skeleton khởi động và cảnh báo phiên

Ngày: 31/10/2026 (Asia/Bangkok). Người thực hiện: Codex.

Trạng thái: **Đã được người dùng duyệt và đóng đợt chỉnh sửa phase 0** qua phản hồi “Duyệt phase 0”, sau các yêu cầu sửa skeleton và cảnh báo phiên trong cùng cuộc trò chuyện.

## Phạm vi đã duyệt

- P0-S1: mở app hiện card skeleton ngay, bỏ spinner và thời gian chờ 600 ms.
- Bootstrap dùng bố cục card đăng nhập thật. Nội dung được giữ trong layout nhưng ẩn và khóa tương tác/accessibility; lớp skeleton phủ tuyệt đối nên không quyết định kích thước card. Giữ padding, margin và kích thước card đăng nhập, không dùng kích thước card skeleton riêng.
- P0-S1/S2: khi khôi phục phiên lúc mở app mà không có người dùng được xác thực trong phiên chạy hiện tại, vào Sign in mà không hiện cảnh báo sessionExpired/accountInactive. Không suy mọi phản hồi 401 lúc khởi động thành một phiên đang dùng bị hết hạn.
- Khi người dùng đang trong app mất phiên (gồm logout/logout-all nhận expired), vẫn xóa cache và hiện cảnh báo đăng nhập lại. Submit vẫn xóa cảnh báo và chạy validation.
- API cookie/DTO và cơ chế refresh giữ nguyên; việc chọn hiển thị cảnh báo được xử lý tại AuthProvider.

## Kiểm chứng đã thực hiện

- `npx jest __tests__/auth-ui.test.tsx __tests__/auth-api.test.ts --runInBand --silent`: PASS, 2 suites / 86 tests.
- `npx tsc --noEmit`: PASS.
- ESLint các file thay đổi: PASS, không warning.
- Prettier các file thay đổi: PASS.
- Hồi quy bao gồm skeleton xuất hiện ngay ở vi/en, chuyển sang lỗi an toàn, không cảnh báo lúc cold start, cache được xóa và cảnh báo vẫn hiện khi phiên đang dùng hết hạn qua logout/logout-all.

Đây là bằng chứng kiểm tra source/unit cho đợt sửa này. Chưa chạy lại native build, Maestro hoặc đo kích thước layout trên emulator sau thay đổi; không coi các kết quả native lịch sử là kiểm chứng cho source mới. Các giới hạn iOS và native access expiry/refresh rotation trong hồ sơ API/rà soát vẫn được theo dõi riêng.

## Đóng phạm vi

Đã ghi progress và cập nhật hồ sơ implement sau khi người dùng duyệt. Đóng đợt sửa phase 0 theo yêu cầu; không ghi mọi nhánh kiểm chứng kỹ thuật đã hoàn tất.

Các yêu cầu còn lại về spacing/loading/error/offline ở teaching workspace và hướng mở UI từ nút bên trái kèm ADR chưa được thực hiện trong đợt sửa này. Quy tắc skeleton không làm đổi kích thước layout áp dụng cho các chỉnh sửa tiếp theo; không ghi nhận đã rà/sửa mọi skeleton của phase 1.
