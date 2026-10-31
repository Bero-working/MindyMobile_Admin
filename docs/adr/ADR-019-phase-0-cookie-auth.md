# ADR-019 — API auth cookie phase 0

## Status

**Accepted for implementation** — 30/10/2026 (Asia/Bangkok), chỉ thị trực tiếp: “Duyệt UI, gắn API vào đi”. Cho phép nối API cho bốn slice UI phase 0 đã bàn giao. Chưa phải nghiệm thu phase hoặc xác nhận cookie đã chạy đủ trên hai nền tảng.

## Decision

- Dùng API_URL hiện có trong env development: HTTPS, bao gồm `/api/v1`. Không sửa backend, tự thêm Origin, Bearer hoặc endpoint. Release lấy env riêng và vẫn bắt buộc HTTPS.
- Đối chiếu controller/DTO/backend source đã lưu nguyên byte tại [legacy](../api-contract/legacy/README.md). Contract theo UI tại [phase 0](../api-contract/phase-000-foundation-auth/README.md).
- Axios gửi `withCredentials: true`; native React Native networking giữ cookie HttpOnly trong cookie jar của hệ điều hành. Không đọc Set-Cookie hoặc đưa token vào JS, Keychain hay MMKV. Keychain facade hiện hữu không thay native cookie jar.
- Bootstrap gọi me; 401 gọi refresh, dùng một promise chung cho các restore đồng thời. Không refresh lại chính refresh; không retry tự động login/refresh khi timeout hoặc lỗi mạng vì chưa biết mutation có thành công hay không.
- Login validate payload trả về rồi gọi me để kiểm access cookie thực sự được lưu/gửi, đối chiếu id cùng tài khoản trước khi mở workspace. Không tự suy role từ email. MENTOR/MANAGER vào workspace; role wire không được hỗ trợ bị chặn bởi UI Denied, không bổ sung role sản phẩm.
- Logout/logout-all nhận 204; 401 thử refresh và gọi lại một lần. Refresh hết phiên đưa về login, không báo đã thu hồi mọi phiên. Lỗi mạng/server giữ UI để retry. Server chịu trách nhiệm revoke phiên và xóa access cookie path `/`, refresh cookie path `/api/v1/auth/refresh` đúng scope.
- Zod kiểm DTO trước khi dùng; status khác ACTIVE không mở workspace. Backend dùng USER_NOT_FOUND cho me khi tài khoản không còn hoạt động; chuyển về login với thông báo accountInactive. Chỉ hiển thị lỗi dịch sẵn và requestId, không log body/password/cookie.
- Cache Query được xóa trước khi thay navigator khi hết phiên hoặc logout. Hiện chưa có private draft nghiệp vụ; không mở rộng chính sách persistence.

## Verification boundary

Native cookie jar cần kiểm chứng riêng: login/me, relaunch, rotation, logout và logout-all với tài khoản test trên Android/iOS. Unit tests chỉ xác nhận điều phối service; Maestro dùng API thật chỉ chứng minh các nhánh đã chạy. Nếu cookie native không hoạt động, login không vào workspace. Không coi curl hoặc Axios mock là bằng chứng persistence native. iOS cần macOS; không nới network security để vượt lỗi kết nối.

## Consequences

App mặc định dùng API thật cả Debug/Release; thiếu API_URL hiển thị lỗi cấu hình. Mock/review panel vẫn là fixture cho test, không mount trong app chính và không fallback khi API lỗi. Hồi quy UI bằng Jest được giữ; flow Maestro UI mock lịch sử không chạy với entry API mới. Không sửa ADR Accepted 001–018 hoặc design đã duyệt.
