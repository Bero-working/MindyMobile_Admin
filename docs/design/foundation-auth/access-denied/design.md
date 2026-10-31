# P0-S3 — access-denied · Thông báo không đủ quyền vào app

Ngày: 30/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-AUTH-01, BR-SCOPE-03; UC-M-01, UC-MG-01. Endpoint tham chiếu: `POST /auth/logout`.

## 1. Mục tiêu

Tài khoản đăng nhập hợp lệ nhưng role không phải MENTOR/MANAGER (ADMIN, STUDENT, role lạ) được báo rõ là không dùng được app này, và có một lối ra duy nhất: đăng xuất để dùng tài khoản khác. Không vòng lặp điều hướng, không lộ dữ liệu workspace.

## 2. Bố cục

`Screen` biến thể `login`, **header auth giống Login** (wordmark + tagline + linh vật) để người dùng hiểu vẫn đang ở cửa vào app. Dưới là `GlassCard` overlap −64px, padding 24/16/20, gap 16.

```
┌──────────────────────────────┐
│▓ Mindy                  🐸   ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ┌──────────────────────────┐ │
│ │      (🔒 icon tròn đỏ)    │ │  56px, nền --mdy-danger-bg, glyph lock_person 26px --mdy-danger-fg
│ │ Tài khoản này không dùng  │ │  17/600, căn giữa
│ │ được ứng dụng Mindy       │ │
│ │ Ứng dụng dành cho Mentor  │ │  14 secondary, căn giữa
│ │ và Quản lý của trung tâm. │ │
│ │ ┌──────────────────────┐ │ │  hộp tài khoản: nền --mdy-surface-muted, radius 14, padding 12
│ │ │ ha.nguyen@mindy.vn    │ │ │  14/500 ink, cắt 1 dòng giữa
│ │ │ [Quản trị viên]       │ │ │  Chip neutral
│ │ └──────────────────────┘ │ │
│ │ Nếu bạn cho rằng đây là   │ │  13 secondary, căn giữa
│ │ nhầm lẫn, hãy liên hệ     │ │
│ │ trung tâm.                │ │
│ │ (  Đăng xuất và dùng tài )│ │  primary 52px, icon logout
│ │ (  khoản khác            )│ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Tên role trên chip: ADMIN → "Quản trị viên" / "Administrator"; STUDENT → "Học viên" / "Student"; role lạ → ẩn chip (không hiện mã thô).

Không hiển thị `displayName`, số điện thoại hay dữ liệu nào khác ngoài email và nhãn role.

## 3. Trạng thái

| # | Trạng thái | Hiển thị | Hành vi |
| --- | --- | --- | --- |
| S3-A | Mặc định | Như bố cục | Back Android thoát app (không về Login/Bootstrap/Workspace) |
| S3-B | Đang đăng xuất | Nút: spinner + "Đang đăng xuất…", chặn bấm lặp | — |
| S3-C | Đăng xuất thành công | — | Xóa phiên/dữ liệu người dùng trong bộ nhớ, thay stack → Login (trống, không toast) |
| S3-D | Phiên đã hết hạn khi đăng xuất (401) | — | Coi như đã đăng xuất: như S3-C |
| S3-E | Đăng xuất lỗi mạng / timeout / 5xx | Hộp `error` compact ngay trên nút: "Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại."; 5xx thêm "Mã hỗ trợ" | Giữ nguyên màn; nút trở lại bình thường để thử lại |
| S3-F | Mở lại app khi vẫn còn phiên role không hợp lệ | — | Bootstrap đưa về S3-A (không vào workspace, không lặp) |

Không có loading/empty/offline khi vào màn: màn chỉ nhận dữ liệu đã xác minh từ S1/S2. Offline chỉ ảnh hưởng hành động đăng xuất (S3-E).

## 4. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `auth.denied.title` | Tài khoản này không dùng được ứng dụng Mindy | This account can't use the Mindy app |
| `auth.denied.body` | Ứng dụng dành cho Mentor và Quản lý của trung tâm. | This app is for the center's mentors and managers. |
| `auth.denied.help` | Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ trung tâm. | If you think this is a mistake, contact your center. |
| `auth.denied.logout` / `.loggingOut` | Đăng xuất và dùng tài khoản khác / Đang đăng xuất… | Sign out and use another account / Signing out… |
| `auth.denied.logoutError` | Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại. | Couldn't sign out. Check your connection and try again. |
| `common.role.ADMIN` / `.STUDENT` | Quản trị viên / Học viên | Administrator / Student |

## 5. Accessibility

Tiêu đề `accessibilityRole="header"`, được focus đầu tiên khi màn mở. Hộp tài khoản đọc thành một cụm: "Đang đăng nhập bằng {email}, vai trò {role}". Nút báo `busy` khi đang đăng xuất.

## 6. testID

`denied-screen`, `denied-title`, `denied-email`, `denied-role-chip`, `denied-logout-button`, `denied-error`.

## 7. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P0-S3-01 | User ADMIN `ha.nguyen@mindy.vn` | Mở màn | Tiêu đề, mô tả, email, chip "Quản trị viên", nút đăng xuất; không có thành phần workspace |
| TC-P0-S3-02 | User STUDENT | Mở màn | Chip "Học viên" |
| TC-P0-S3-03 | User role lạ | Mở màn | Không có `denied-role-chip`; không crash |
| TC-P0-S3-04 | User có displayName/phone | Mở màn | Không render displayName và phone |
| TC-P0-S3-05 | Logout chưa resolve | Bấm nút 2 lần | "Đang đăng xuất…"; service logout gọi 1 lần |
| TC-P0-S3-06 | Logout → thành công | Bấm nút | Đích Login, 2 ô trống; dữ liệu user trong bộ nhớ đã xóa |
| TC-P0-S3-07 | Logout → 401 | Bấm nút | Như TC-P0-S3-06 |
| TC-P0-S3-08 | Logout → mất mạng | Bấm nút | Hiện `denied-error`; vẫn ở màn; nút bấm lại được |
| TC-P0-S3-09 | Logout → 500 requestId "req-7" | Bấm nút | Lỗi kèm "Mã hỗ trợ: req-7" |
| TC-P0-S3-10 | Đang ở màn | Nhấn back Android | App thoát (không điều hướng tới Login/Workspace) |
| TC-P0-S3-11 | Ngôn ngữ en, theme tối | Mở màn | Chữ tiếng Anh, chip "Administrator", màu theo bảng tối |

Ứng viên Maestro E2E: đăng nhập tài khoản ADMIN → TC-P0-S3-01 → TC-P0-S3-06; mở lại app sau khi đăng nhập ADMIN mà không đăng xuất → vẫn S3 (S3-F).
