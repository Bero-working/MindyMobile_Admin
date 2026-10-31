# P0-S1 — bootstrap · Khôi phục phiên và mở workspace

Ngày: 30/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-AUTH-01, BR-AUTH-03, BR-AUTH-04; UC-M-01, UC-MG-01. Endpoint tham chiếu (contract do Codex lập): `GET /auth/me`, `POST /auth/refresh`.

## 1. Mục tiêu

Khi mở app, xác minh phiên với backend rồi đưa người dùng tới đúng nơi: Đăng nhập, workspace theo role, hoặc màn Không đủ quyền. Không bao giờ mở workspace bằng dữ liệu đã lưu trên máy.

## 2. Bố cục

Dùng `Screen` biến thể `login` và **đúng header của màn Đăng nhập** (wordmark, tagline, linh vật) để chuyển sang Login liền mạch. Phần dưới header thay đổi theo trạng thái.

```
┌──────────────────────────────┐
│▓ Mindy                       ▓│
│▓ Khởi đầu nhỏ.         🐸    ▓│  header auth (giống Login)
│▓ Bứt phá lớn.                ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                              │
│        ◌  (spinner teal)     │  trạng thái checking
│  Đang kiểm tra phiên đăng    │
│  nhập…                       │
│                              │
└──────────────────────────────┘
```

Splash native (Android/iOS) dùng nền `#123236` và wordmark trắng để không nháy màu trắng trước khi JS chạy.

## 3. Trạng thái

| # | Trạng thái | Điều kiện | Hiển thị | Kết thúc |
| --- | --- | --- | --- | --- |
| S1-A | Checking | Mặc định khi mở app | Chỉ header trong 600ms đầu (tránh nháy). Sau 600ms: spinner `on-light` 18px giữa vùng dưới, cách header 48px; dưới spinner 8px là chữ 14px `--mdy-text-secondary` "Đang kiểm tra phiên đăng nhập…" | — |
| S1-B | Không có phiên | Chưa từng đăng nhập trên máy / không có cookie phiên | Không hiển thị gì thêm | Thay stack → Login, không thông báo |
| S1-C | Phiên hết hạn | Có phiên trước đó nhưng xác minh và làm mới đều không còn hiệu lực (401 sau refresh) | — | Thay stack → Login kèm thông báo `sessionExpired` (xem Login S2-H) |
| S1-D | Tài khoản ngừng hoạt động | `me` trả lỗi tài khoản không còn hoạt động (theo source: 404 `USER_NOT_FOUND` khi tài khoản không ACTIVE) | — | Xóa phiên cục bộ, thay stack → Login kèm thông báo `accountInactive` |
| S1-E | Role được phép | `me` thành công, role MENTOR hoặc MANAGER | — | Thay stack → workspace tương ứng (fade 0.25s) |
| S1-F | Role không được phép | `me` thành công, role ADMIN, STUDENT hoặc giá trị lạ | — | Thay stack → Access denied (S3) |
| S1-G | Mất mạng | Không có kết nối khi kiểm tra | Thẻ lỗi (mục 4), icon `cloud_off` | Thử lại → S1-A |
| S1-H | Timeout | Quá thời gian chờ | Thẻ lỗi, icon `cloud_off` | Thử lại → S1-A |
| S1-I | Lỗi máy chủ / phản hồi sai định dạng | 5xx hoặc payload không hợp lệ | Thẻ lỗi, icon `dns`, kèm "Mã hỗ trợ" nếu có `requestId` | Thử lại → S1-A |
| S1-J | Thiếu cấu hình | Development thiếu API_URL (lỗi config) | Thẻ lỗi, icon `settings_alert`, **không có** nút Thử lại | Sửa cấu hình rồi mở lại app |

Không có trạng thái empty/success riêng: thành công chính là điều hướng (S1-E/F). Trạng thái "không quyền" chuyển sang S3.

Quy tắc:

- Tuyệt đối không mở workspace ở S1-G/H/I/J dù máy còn dữ liệu user cũ.
- Trong S1-A không có nút nào; back Android thoát app.
- Thử lại: nút chuyển loading (spinner + "Đang thử lại…") cho tới khi có kết quả; không tự thử lại ngầm theo chu kỳ.
- Nếu app về foreground khi đang ở thẻ lỗi: không tự thử lại; người dùng bấm Thử lại.

## 4. Thẻ lỗi (S1-G → S1-J)

`GlassCard` overlap header −64px như Login, padding 24/16/20, gap 16, nội dung `StatusBlock` căn giữa:

- Icon tròn 56px nền `--mdy-surface-muted`, glyph 26px `--mdy-text-secondary`.
- Tiêu đề 17/600 `--mdy-ink`; mô tả 14px `--mdy-text-secondary`, line-height 1.45, căn giữa.
- Nút `primary` 52px toàn chiều rộng "Thử lại" (icon `refresh` 20px trước chữ).
- S1-I: dòng "Mã hỗ trợ: {requestId}" 12px dưới mô tả, chữ chọn/copy được.

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `auth.brand.tagline` | Khởi đầu nhỏ. Bứt phá lớn. | Start small. Grow big. |
| `auth.bootstrap.checking` | Đang kiểm tra phiên đăng nhập… | Checking your session… |
| `auth.bootstrap.offline.title` | Không có kết nối mạng | You're offline |
| `auth.bootstrap.offline.body` | Cần kết nối để xác minh tài khoản. Kiểm tra mạng rồi thử lại. | We need a connection to verify your account. Check your network and try again. |
| `auth.bootstrap.timeout.title` | Máy chủ phản hồi chậm | The server is slow to respond |
| `auth.bootstrap.timeout.body` | Chưa xác minh được phiên đăng nhập. Vui lòng thử lại. | We couldn't verify your session yet. Please try again. |
| `auth.bootstrap.server.title` | Hệ thống đang gặp sự cố | Something went wrong |
| `auth.bootstrap.server.body` | Chưa thể xác minh phiên đăng nhập. Vui lòng thử lại sau. | We couldn't verify your session. Please try again later. |
| `auth.bootstrap.config.title` | Chưa cấu hình máy chủ | Server not configured |
| `auth.bootstrap.config.body` | Ứng dụng chưa được cấu hình địa chỉ máy chủ. Liên hệ nhóm phát triển. | The app has no server address configured. Contact the development team. |
| `common.retry` / `common.retrying` | Thử lại / Đang thử lại… | Try again / Trying again… |
| `common.supportCode` | Mã hỗ trợ: {{code}} | Support code: {{code}} |

## 6. Accessibility

- S1-A: vùng trạng thái `accessibilityLiveRegion="polite"`, đọc "Đang kiểm tra phiên đăng nhập".
- Thẻ lỗi: tiêu đề `accessibilityRole="header"`; focus screen reader chuyển vào tiêu đề khi thẻ xuất hiện.
- Linh vật và quầng nền không được focus.

## 7. testID

`bootstrap-screen`, `bootstrap-checking`, `bootstrap-error-card`, `bootstrap-error-title`, `bootstrap-retry-button`, `bootstrap-support-code`.

## 8. Test case

Mock tại service boundary (phiên/`me`), không gọi mạng thật ở UI test. "Đích" = route gốc sau khi reset stack.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P0-S1-01 | Kiểm tra phiên đang chờ (promise chưa resolve) | Mở app, chưa đủ 600ms | Có `bootstrap-screen`, header; **chưa** có `bootstrap-checking` |
| TC-P0-S1-02 | Như trên | Chờ quá 600ms | Hiện `bootstrap-checking` với chữ đúng ngôn ngữ (vi và en) |
| TC-P0-S1-03 | Không có phiên | Mở app | Đích là Login; không có thông báo phiên hết hạn |
| TC-P0-S1-04 | `me` → MENTOR ACTIVE | Mở app | Đích là `workspace-mentor-root`; back không về bootstrap |
| TC-P0-S1-05 | `me` → MANAGER ACTIVE | Mở app | Đích là `workspace-manager-root` |
| TC-P0-S1-06 | Máy còn lưu user MENTOR cũ; `me` → MANAGER | Mở app | Đích là workspace Quản lý (role từ server, không từ cache) |
| TC-P0-S1-07 | Máy còn lưu user cũ; kiểm tra phiên lỗi mất mạng | Mở app | Hiện thẻ lỗi offline; **không** render workspace nào |
| TC-P0-S1-08 | `me` → ADMIN | Mở app | Đích là Access denied |
| TC-P0-S1-09 | `me` → STUDENT | Mở app | Đích là Access denied |
| TC-P0-S1-10 | `me` → role ngoài enum đã biết | Mở app | Đích là Access denied (không crash, không vào workspace) |
| TC-P0-S1-11 | Phiên hết hạn (refresh không hợp lệ) | Mở app | Đích là Login, hiện cảnh báo `sessionExpired` |
| TC-P0-S1-12 | `me` → 404 USER_NOT_FOUND | Mở app | Phiên cục bộ bị xóa; đích Login với cảnh báo `accountInactive` |
| TC-P0-S1-13 | Timeout | Mở app | Thẻ lỗi timeout, có nút Thử lại |
| TC-P0-S1-14 | 500 có requestId "req-123" | Mở app | Thẻ lỗi server, hiện "Mã hỗ trợ: req-123" |
| TC-P0-S1-15 | Payload `me` sai định dạng | Mở app | Thẻ lỗi server (sai định dạng); không vào workspace |
| TC-P0-S1-16 | Thiếu cấu hình API | Mở app | Thẻ lỗi cấu hình; không có `bootstrap-retry-button` |
| TC-P0-S1-17 | Lần 1 offline, lần 2 MENTOR | Bấm Thử lại | Nút chuyển "Đang thử lại…", bấm thêm không gửi yêu cầu thứ hai; sau đó vào workspace Mentor |
| TC-P0-S1-18 | Lần 1 offline, lần 2 vẫn offline | Bấm Thử lại | Quay lại thẻ lỗi offline, nút hết loading |
| TC-P0-S1-19 | Theme tối, ngôn ngữ en | Hiện thẻ lỗi | Màu theo bảng tối; chữ tiếng Anh |

Ứng viên Maestro E2E: TC-P0-S1-03, -04, -05, -07 (bật chế độ máy bay), -08.
