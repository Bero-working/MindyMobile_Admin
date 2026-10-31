# P0-S4 — settings · Cài đặt và Hồ sơ (Mentor + Quản lý)

Ngày: 30/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-AUTH-03, BR-DATA-01, BR-DATA-02; UC-M-01, UC-MG-01. Endpoint tham chiếu: `POST /auth/logout`, `POST /auth/logout-all` (204); ngôn ngữ/giao diện lưu cục bộ; hồ sơ dùng `UserDto` đã có từ `login`/`me`.
Mẫu gốc: trang `settings` và `profile` trong `docs/design/Mentor Mobile UI.html` bản 30/10/2026 20:21 (nội dung mẫu là tài khoản Quản lý).

## 0. Thay đổi so với bản design trước

Bản này **thay thế** bản một trang "Tài khoản" trước đó. UI mock hiện có của S4 làm theo bản cũ nên cần sửa lại.

| Nội dung | Bản trước | Bản này |
| --- | --- | --- |
| Cấu trúc | 1 trang "Tài khoản" | 2 trang: **Cài đặt** và **Hồ sơ** |
| Điểm vào | Avatar | Avatar → Hồ sơ; nút bánh răng trên header → Cài đặt |
| Đăng xuất | Trong trang chung | Trong Hồ sơ |
| Chọn giao diện | Hàng radio | 3 thẻ có hình xem trước, thêm dòng ghi chú |
| Hàng ngôn ngữ | Nhãn + radio | Thêm ô mã VI/EN và phụ đề |
| Toast đổi giao diện | Không | Có |
| Phiên bản app | Có | Bỏ (mẫu không có) |
| Chevron hàng đăng xuất | Có | Bỏ (mẫu không có) |

Giữ nguyên từ bản trước: sheet xác nhận và xử lý lỗi đăng xuất, xóa dữ liệu trước khi điều hướng.

## 1. Mục tiêu và phạm vi role

Mentor và Quản lý dùng **chung hai trang, cùng bố cục và hành vi**. Chỉ khác dữ liệu tài khoản và nhãn vai trò. Vẫn là một slice P0-S4; Hồ sơ và Cài đặt không tách thành slice riêng.

| | Mentor | Quản lý |
| --- | --- | --- |
| Phụ đề header workspace | Mentor · {email} | Quản lý · {email} |
| Chip vai trò ở Hồ sơ | Mentor | Quản lý (en: Manager) |

## 2. Điểm vào và điều hướng

- Avatar 52px trên header workspace → push **Hồ sơ**. Nút kính `settings` 44px trên header → push **Cài đặt**. Áp dụng cho cả hai role.
- Hai trang trượt từ phải 0.32s; nút back hoặc back Android về workspace.
- Hai trang không dẫn sang nhau.
- Từ P1, tiện ích "Tài khoản" trong "Tất cả tiện ích" cũng mở Hồ sơ. P0 chưa có màn này.

## 3. Khung chung của hai trang

- `Screen` biến thể `app`.
- Header gradient **không bo đáy**, padding 16/16/48. Nút back 44px nền trong suốt, lệch trái −10px, glyph `arrow_back` 22px weight 400, pressed `--mdy-white-a24`. Tiêu đề 18/600; phụ đề 13 `--mdy-on-brand-muted`.
- Panel margin-top −28px, bo đỉnh 28px, nền quầng sáng `app`. Vùng cuộn padding 20/16/32, gap 12.
- Nhãn nhóm 12/600 `--mdy-text-tertiary`, chữ hoa, tracking 0.04em, padding 4 ngang; nhóm thứ hai trở đi padding-top 12.
- Thẻ danh sách: `GlassCard` padding 6, các hàng radius 14, padding 10, gap 12.

## 4. Trang Cài đặt

Tiêu đề "Cài đặt", phụ đề "Ngôn ngữ và giao diện".

```
┌──────────────────────────────┐
│▓ ←  Cài đặt                  ▓│
│▓    Ngôn ngữ và giao diện    ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ NGÔN NGỮ                     │
│ ┌──────────────────────────┐ │
│ │ (VI) Tiếng Việt       (●) │ │  hàng chọn nền tint-1
│ │      Ngôn ngữ mặc định    │ │
│ │ (EN) English          (○) │ │
│ │      Tiếng Anh            │ │
│ └──────────────────────────┘ │
│ GIAO DIỆN                    │
│ ┌───────┐ ┌───────┐ ┌───────┐│
│ │ hình  │ │ hình  │ │ hình  ││  3 thẻ, thẻ chọn viền 2px
│ │☀ Sáng │ │☾ Tối  │ │◐ Hệ   ││
│ └───────┘ └───────┘ └─thống─┘│
│ ⓘ Áp dụng cho tất cả màn hình│
│   trên thiết bị này.         │
└──────────────────────────────┘
```

### 4.1 Hàng ngôn ngữ

- Ô mã tròn 40px nền `--mdy-brand-tint-2`, chữ `--mdy-brand-800` 12/700, tracking 0.04em.
- Nhãn 14/500; phụ đề 12. Dùng `--mdy-text-secondary` cho phụ đề thay vì tertiary của mẫu, vì tertiary không đạt tương phản (design phase mục 3.1). Quy tắc này áp dụng cho mọi phụ đề ở S4.
- Radio 22px: chọn `radio_button_checked` FILL 1 `--mdy-brand-800`; chưa chọn `radio_button_unchecked` `--mdy-icon-disabled`.
- Hàng đang chọn nền `--mdy-brand-tint-1`; pressed `--mdy-surface-muted`.
- Nhãn "Tiếng Việt" và "English" không dịch.

### 4.2 Thẻ giao diện

Lưới 3 cột bằng nhau, gap 8, thứ tự Sáng → Tối → Hệ thống.

- Thẻ: nền `--mdy-surface`, radius 18, padding 8/8/10, gap 10, bóng 0 6px 18px rgba(31,79,85,.08), viền 2px (chọn `--mdy-brand-800`, chưa chọn trong suốt), pressed scale 0.97.
- Hình xem trước: cao 84, radius 12, viền 1px `--mdy-border`, gồm thanh trên cao 24 và 2 vạch (cao 14 radius 7; rộng 60% cao 8 radius 4), cách lề 8, gap 6.
- Nhãn căn giữa: icon 18px + chữ 13/600, gap 4. Icon `light_mode`, `dark_mode`, `contrast`; thẻ chọn FILL 1 `--mdy-brand-800`, chưa chọn FILL 0 `--mdy-text-secondary`.

Màu hình xem trước **cố định ở cả hai theme**, chỉ mang tính minh họa:

| Thẻ | Nền | Thanh trên | Vạch |
| --- | --- | --- | --- |
| Sáng | #f6f5f2 | #1f4f55 | #ffffff |
| Tối | #1a1d1d | #0f2a2d | #2c3131 |
| Hệ thống | chia đôi dọc #f6f5f2 / #1a1d1d | #1f4f55 | #b9c4c2 |

Dòng ghi chú: icon `info` 16px `--mdy-link` + chữ 12 `--mdy-text-secondary`, line-height 1.45, padding 4 ngang. Nội dung đổi theo lựa chọn (mục 8).

### 4.3 Hành vi

- Chọn là áp dụng ngay, không có nút Lưu, không reload, giữ vị trí trang. Bấm lại mục đang chọn không làm gì và không toast.
- Đổi ngôn ngữ: toast bằng **ngôn ngữ mới**. Đổi giao diện: toast "Đã đổi giao diện: {tên}".
- "Hệ thống" theo dõi thay đổi theme của máy khi app đang mở.
- Lựa chọn là thiết lập của thiết bị: lưu cục bộ, giữ sau đăng xuất, áp dụng cả ở Bootstrap/Login, dùng chung khi đổi tài khoản.
- Không gọi API nên không có loading/lỗi. Lưu cục bộ thất bại vẫn áp dụng cho phiên đang chạy, không báo lỗi.
- Mặc định lần đầu: Tiếng Việt và Hệ thống.

## 5. Trang Hồ sơ

Tiêu đề "Hồ sơ", phụ đề "Thông tin tài khoản".

```
┌──────────────────────────────┐
│▓ ←  Hồ sơ                    ▓│
│▓    Thông tin tài khoản      ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ┌──────────────────────────┐ │
│ │           (MH)            │ │  avatar 84px
│ │       Phạm Minh Hà        │ │  18/600
│ │     ha.pham@mindy.vn      │ │  13 secondary
│ │        [Quản lý]          │ │  chip
│ └──────────────────────────┘ │
│ THÔNG TIN                    │
│ ┌──────────────────────────┐ │
│ │ (✉) Email                 │ │
│ │     ha.pham@mindy.vn      │ │
│ │ (☎) Số điện thoại         │ │
│ │     0912 345 678          │ │
│ └──────────────────────────┘ │
│ PHIÊN ĐĂNG NHẬP              │
│ ┌──────────────────────────┐ │
│ │ (⇥) Đăng xuất             │ │
│ │     Thoát khỏi thiết bị này│ │
│ │ (▣) Đăng xuất mọi phiên   │ │  chữ đỏ
│ │     Thoát khỏi tất cả …   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Thẻ tóm tắt: `GlassCard` căn giữa, padding 24/16/20, gap 10. Avatar 84px nền `--mdy-brand-tint-3`, chữ cái 28/600. Chip cao 24, pill, padding 10 ngang, nền `--mdy-brand-tint-2`, chữ `--mdy-brand-800` 12/600.
- Hàng thông tin: icon tròn 40px nền `--mdy-brand-tint-2`, glyph 20px `--mdy-link`; nhãn 12 secondary; giá trị 14/500. Chỉ đọc, không bấm được, cho phép chọn/copy giá trị.
- Hàng đăng xuất: nhãn 14/500, phụ đề 12, không có chevron. "Đăng xuất": icon nền `--mdy-brand-tint-2`, chữ `--mdy-ink`. "Đăng xuất mọi phiên": icon nền `--mdy-danger-bg-soft`, chữ `--mdy-danger-fg`.
- Tên/email dài: tên tối đa 2 dòng, email 1 dòng cắt giữa, vẫn đọc đủ qua screen reader.

### 5.1 Dữ liệu hiển thị

Chỉ hiển thị trường backend có thật trong `UserDto`:

| Mục | Nguồn | Khi trống |
| --- | --- | --- |
| Avatar, tên | `displayName` | Không trống theo DTO |
| Email | `email` | Không trống theo DTO |
| Chip vai trò | `role` | Chỉ MENTOR/MANAGER vào được trang này |
| Số điện thoại | `phone` (nullable) | "Chưa cập nhật", màu `--mdy-text-secondary`, weight 400 |

Hai hàng **"Cơ sở"** và **"Mã nhân viên"** trong mẫu bị bỏ: `UserDto` không có hai trường này và ADR-005 nêu chưa có mô hình chi nhánh. Không hiển thị dữ liệu giả. Nếu backend bổ sung sau, chỉ cần thêm hàng cùng kiểu.

Hồ sơ chỉ đọc. Backend chưa có API để người dùng tự sửa thông tin nên không có nút Sửa, đổi ảnh hay đổi mật khẩu. Trang dùng user đã xác minh lúc bootstrap/đăng nhập, không tự gọi API khi mở.

## 6. Đăng xuất (trong Hồ sơ)

### 6.1 Thiết bị này

1. Bấm "Đăng xuất" → `BottomSheet` confirm: tiêu đề 17/600 "Đăng xuất khỏi thiết bị này?"; mô tả 14 secondary "Bạn sẽ cần đăng nhập lại để tiếp tục dùng Mindy."; nút `primary` 52 "Đăng xuất"; nút `secondary` 52 "Hủy", cách 8px. Mẫu đăng xuất ngay không hỏi; design giữ bước xác nhận để tránh bấm nhầm và có chỗ báo lỗi.
2. Bấm "Đăng xuất" → nút spinner + "Đang đăng xuất…"; "Hủy", chạm scrim, kéo sheet và back đều bị khóa.
3. Thành công hoặc 401 → xóa toàn bộ dữ liệu người dùng trong bộ nhớ và cache truy vấn **trước khi** điều hướng; thay stack → Login (2 ô trống) + toast "Đã đăng xuất". Back không về workspace.
4. Mất mạng / timeout / 5xx → sheet giữ nguyên, hiện hộp `error` compact trên hai nút: "Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại." (5xx thêm "Mã hỗ trợ"); nút trở lại "Đăng xuất"; "Hủy" mở khóa. **Không** báo đã đăng xuất khi server chưa xác nhận.

### 6.2 Mọi phiên

Như 6.1, khác: tiêu đề "Đăng xuất khỏi mọi thiết bị?"; mô tả "Mọi phiên đăng nhập của tài khoản này, kể cả trên thiết bị khác, sẽ kết thúc."; nút xác nhận biến thể `danger` "Đăng xuất mọi phiên"; toast trên Login "Đã đăng xuất khỏi mọi thiết bị".

### 6.3 Dữ liệu sau đăng xuất (BR-DATA-01/02)

- Login sau đăng xuất không điền sẵn email, tên hay avatar cũ.
- Workspace, Hồ sơ và Cài đặt không còn trong stack; recent apps không giữ ảnh chụp có dữ liệu cũ khi đã về Login.
- P0 chưa có draft/dữ liệu offline. Khi phase sau có draft, sheet đăng xuất sẽ bổ sung cảnh báo theo quyết định Q-DATA-01.

## 7. Trạng thái

| # | Trạng thái | Ghi chú |
| --- | --- | --- |
| S4-A | Cài đặt mặc định | Lựa chọn hiện tại được đánh dấu |
| S4-B | Hồ sơ mặc định | Có số điện thoại |
| S4-C | Hồ sơ không có số điện thoại | Hiện "Chưa cập nhật" |
| S4-D | Sheet xác nhận mở | Mục 6 bước 1 |
| S4-E | Đang đăng xuất | Mục 6 bước 2 |
| S4-F | Đăng xuất lỗi | Mục 6 bước 4 |
| S4-G | Đăng xuất xong | Chuyển Login |
| Loading/empty khi vào trang | Không áp dụng | Không tự gọi API |
| Không quyền | Không áp dụng | Chỉ vào được từ workspace của role hợp lệ |
| Offline | Cài đặt dùng bình thường; Hồ sơ xem được | Chỉ đăng xuất cần mạng (S4-F) |

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `settings.title` / `.subtitle` | Cài đặt / Ngôn ngữ và giao diện | Settings / Language and appearance |
| `profile.title` / `.subtitle` | Hồ sơ / Thông tin tài khoản | Profile / Account information |
| `common.back` | Quay lại | Back |
| `common.role.MENTOR` / `.MANAGER` | Mentor / Quản lý | Mentor / Manager |
| `settings.language.title` | NGÔN NGỮ | LANGUAGE |
| `settings.language.vi` / `.viSub` | Tiếng Việt / Ngôn ngữ mặc định | Tiếng Việt / Default language |
| `settings.language.en` / `.enSub` | English / Tiếng Anh | English / Alternate language |
| `settings.language.changed` | Đã chuyển sang Tiếng Việt | Language set to English |
| `settings.theme.title` | GIAO DIỆN | APPEARANCE |
| `settings.theme.light` / `.dark` / `.system` | Sáng / Tối / Hệ thống | Light / Dark / System |
| `settings.theme.changed` | Đã đổi giao diện: {{name}} | Appearance set to {{name}} |
| `settings.theme.noteFixed` | Áp dụng cho tất cả màn hình trên thiết bị này. | Applies to every screen on this device. |
| `settings.theme.noteSystem` | Giao diện tự đổi theo cài đặt sáng/tối của thiết bị. | Follows your device's light or dark setting. |
| `profile.info.title` | THÔNG TIN | INFORMATION |
| `profile.email` / `.phone` / `.phoneEmpty` | Email / Số điện thoại / Chưa cập nhật | Email / Phone number / Not provided |
| `profile.session.title` | PHIÊN ĐĂNG NHẬP | SESSIONS |
| `profile.logout.label` / `.sub` | Đăng xuất / Thoát khỏi thiết bị này | Sign out / Sign out of this device |
| `profile.logoutAll.label` / `.sub` | Đăng xuất mọi phiên / Thoát khỏi tất cả thiết bị đang đăng nhập | Sign out everywhere / Sign out of every signed-in device |
| `profile.logout.confirmTitle` / `.confirmBody` | Đăng xuất khỏi thiết bị này? / Bạn sẽ cần đăng nhập lại để tiếp tục dùng Mindy. | Sign out of this device? / You'll need to sign in again to keep using Mindy. |
| `profile.logoutAll.confirmTitle` / `.confirmBody` | Đăng xuất khỏi mọi thiết bị? / Mọi phiên đăng nhập của tài khoản này, kể cả trên thiết bị khác, sẽ kết thúc. | Sign out of all devices? / Every session for this account, including on other devices, will end. |
| `profile.logout.confirm` / `profile.logoutAll.confirm` | Đăng xuất / Đăng xuất mọi phiên | Sign out / Sign out everywhere |
| `profile.logout.loading` | Đang đăng xuất… | Signing out… |
| `profile.logout.error` | Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại. | Couldn't sign out. Check your connection and try again. |
| `profile.logout.done` / `profile.logoutAll.done` | Đã đăng xuất / Đã đăng xuất khỏi mọi thiết bị | Signed out / Signed out of all devices |
| `common.cancel` | Hủy | Cancel |

## 9. Accessibility

- Nhóm Ngôn ngữ và Giao diện là `radiogroup`; mỗi hàng/thẻ `accessibilityRole="radio"` với `accessibilityState.checked`. Hình xem trước không được focus.
- Nút header: avatar "Hồ sơ" / "Profile"; bánh răng "Cài đặt" / "Settings".
- Hàng thông tin đọc thành một cụm: "Số điện thoại, 0912 345 678".
- Hàng đăng xuất `accessibilityRole="button"`, label gồm nhãn + phụ đề.
- Sheet confirm nhận focus vào tiêu đề khi mở; khi đóng, focus trở lại hàng đã bấm.
- Toast đổi ngôn ngữ được đọc bằng ngôn ngữ mới. Thẻ giao diện giữ đủ 3 cột khi phóng chữ; nhãn được xuống dòng.

## 10. testID

Cài đặt: `settings-screen`, `settings-back-button`, `settings-language-vi`, `settings-language-en`, `settings-theme-light`, `settings-theme-dark`, `settings-theme-system`, `settings-theme-note`.

Hồ sơ: `profile-screen`, `profile-back-button`, `profile-avatar`, `profile-name`, `profile-email`, `profile-role-chip`, `profile-info-email`, `profile-info-phone`, `profile-logout-row`, `profile-logout-all-row`.

Dùng chung: `workspace-account-button`, `workspace-settings-button`, `logout-sheet`, `logout-sheet-confirm`, `logout-sheet-cancel`, `logout-sheet-error`, `toast`.

## 11. Test case

ID cũ giữ nguyên nhưng nội dung được cập nhật theo bản này; TC-P0-S4-19 trở đi là mới.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P0-S4-01 | Workspace Mentor, user "Trần Thị Linh" | Bấm avatar | Mở `profile-screen`; tên, email, chip "Mentor" |
| TC-P0-S4-02 | Workspace Quản lý | Bấm avatar | Mở `profile-screen`; chip "Quản lý" (vi) / "Manager" (en) |
| TC-P0-S4-03 | Mặc định lần đầu | Bấm bánh răng | Mở `settings-screen`; đã chọn "Tiếng Việt" và "Hệ thống"; ghi chú theo Hệ thống |
| TC-P0-S4-04 | Đang vi | Chọn English | Toàn bộ chữ trang đổi sang tiếng Anh; toast "Language set to English"; radio English checked |
| TC-P0-S4-05 | Đã chọn English, khởi động lại app | Mở Login | Login hiển thị tiếng Anh |
| TC-P0-S4-06 | Theme máy = sáng | Chọn Tối | Màu nền/chữ đổi sang bảng tối ngay; toast "Đã đổi giao diện: Tối"; thẻ Tối có viền chọn; ghi chú đổi sang "Áp dụng cho tất cả màn hình…" |
| TC-P0-S4-07 | Đang "Hệ thống" | Mô phỏng máy đổi sang dark | App đổi sang tối không cần mở lại |
| TC-P0-S4-08 | Đã chọn Tối, đăng xuất | Tới Login | Login vẫn tối |
| TC-P0-S4-09 | Ở Hồ sơ | Bấm "Đăng xuất" rồi "Hủy" | Sheet mở với chữ đúng; đóng; không gọi service |
| TC-P0-S4-10 | Logout chưa resolve | Xác nhận, bấm lại, bấm scrim, nhấn back | Chỉ 1 lần gọi service; sheet không đóng; nút "Đang đăng xuất…" |
| TC-P0-S4-11 | Logout → thành công | Xác nhận | Đích Login, 2 ô trống, toast "Đã đăng xuất"; cache truy vấn và user trong bộ nhớ đã xóa; back không về workspace |
| TC-P0-S4-12 | Logout → 401 | Xác nhận | Như TC-P0-S4-11 |
| TC-P0-S4-13 | Logout → mất mạng | Xác nhận | `logout-sheet-error` hiện; vẫn ở Hồ sơ, user vẫn đăng nhập; "Hủy" dùng được |
| TC-P0-S4-14 | Logout → 500 requestId "req-5" | Xác nhận | Lỗi kèm "Mã hỗ trợ: req-5" |
| TC-P0-S4-15 | Logout-all → thành công | Bấm "Đăng xuất mọi phiên", xác nhận | Sheet dùng nút danger, chữ mục 6.2; gọi service logout-all (không gọi logout); Login + toast "Đã đăng xuất khỏi mọi thiết bị" |
| TC-P0-S4-16 | User A đăng xuất, user B đăng nhập | Mở Hồ sơ | Chỉ thấy tên/email/SĐT của B; không còn dữ liệu A ở bất kỳ màn nào |
| TC-P0-S4-17 | Lần lượt ở Hồ sơ và Cài đặt, mỗi role | Bấm back / back Android | Về workspace đúng role |
| TC-P0-S4-18 | Theme tối, en | Mở lần lượt hai trang | Toàn bộ chữ và màu đúng bảng; màu hình xem trước không đổi |
| TC-P0-S4-19 | Mentor và Quản lý | Xem header workspace | Có avatar và `workspace-settings-button`; không có chuông; phụ đề "{vai trò} · {email}" đúng role |
| TC-P0-S4-20 | User có `phone` = null | Mở Hồ sơ | `profile-info-phone` hiện "Chưa cập nhật" (en: "Not provided"), không hiện "null" hay ô rỗng |
| TC-P0-S4-21 | User có `phone` | Mở Hồ sơ | Hiện đúng số; **không** có "Cơ sở", "Mã nhân viên", nút Sửa |
| TC-P0-S4-22 | Mở Hồ sơ và Cài đặt | Theo dõi service | Không có lời gọi API nào khi mở trang |
| TC-P0-S4-23 | Đang chọn Tiếng Việt và Sáng | Bấm lại đúng các mục đó | Không có toast, không đổi trạng thái |
| TC-P0-S4-24 | Lưu cục bộ lỗi | Chọn Tối | Vẫn áp dụng tối trong phiên; không báo lỗi |
| TC-P0-S4-25 | Mặc định | Mở Cài đặt, nhìn thẻ Hệ thống | Hình xem trước chia đôi sáng/tối; thẻ được đọc là radio đã chọn |

Ứng viên Maestro E2E: TC-P0-S4-01, -02, -04, -06, -11, -15, -16 (cần 2 tài khoản thử), và chạy lại TC-P0-S1-03 sau -11 để xác nhận mở lại app không vào workspace.
