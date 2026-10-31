# P0-S2 — login · Đăng nhập email/mật khẩu

Ngày: 30/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-AUTH-01, BR-AUTH-02, BR-AUTH-03; UC-M-01, UC-MG-01. Endpoint tham chiếu: `POST /auth/login` (body `email` ≤320 ký tự, `password` 1–128 ký tự, `deviceName` tùy chọn).
Mẫu gốc: `docs/design/Login.html` [L], token/class `.mdy-login` tại [global.css.md](../../global.css.md) mục 5.1.

## 1. Mục tiêu

Mentor/Quản lý đăng nhập bằng tài khoản trung tâm cấp, vào đúng workspace theo role. Sai thông tin hoặc tài khoản không hoạt động không vào được workspace.

## 2. Thay đổi so với mẫu [L]

| Phần của mẫu | Quyết định | Lý do |
| --- | --- | --- |
| Nút "Tiếp tục với Google" + đường "hoặc" | Bỏ | BR-AUTH-02: Google để sau |
| "Ghi nhớ đăng nhập" | Bỏ | Phiên dùng cookie HttpOnly, thời hạn do backend/ADR Auth quyết định |
| "Quên mật khẩu?" | Giữ, mở sheet hướng dẫn liên hệ trung tâm | Backend chưa có API đặt lại mật khẩu; không giả gửi email như mẫu |
| Toast "Đăng nhập thành công" rồi chờ 900ms | Điều hướng ngay; toast hiện trên workspace | Không giữ người dùng ở màn đăng nhập |
| Footer màu tertiary | Dùng `--mdy-text-secondary` | Đạt tương phản (xem design phase mục 3.1) |
| Còn lại (header, thẻ kính, field, nút, hộp lỗi, toast) | Giữ nguyên số đo của mẫu | — |

## 3. Bố cục

```
┌──────────────────────────────┐
│▓ Mindy                       ▓│  header auth: padding 56/24/96
│▓ Khởi đầu nhỏ.         🐸    ▓│  linh vật right 20, bottom 63, rộng 96
│▓ Bứt phá lớn.                ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ┌──────────────────────────┐ │  GlassCard overlap −64, padding 24/16/20, gap 16
│ │ Đăng nhập                 │ │  20/600
│ │ Dùng tài khoản trung tâm  │ │  13 secondary
│ │ đã cấp cho bạn            │ │
│ │ [! hộp thông báo/lỗi]     │ │  chỉ khi có
│ │ Email                     │ │
│ │ (✉ ten@mindy.vn         ) │ │  52px pill
│ │ Mật khẩu                  │ │
│ │ (🔒 Nhập mật khẩu     👁 ) │ │
│ │              Quên mật khẩu?│ │  nút text căn phải, margin-top −4
│ │ (      Đăng nhập         ) │ │  primary 52px
│ └──────────────────────────┘ │
│                              │
│ Chưa có tài khoản? Liên hệ   │  footer 12px, margin-top auto
│ trung tâm để được cấp.       │
└──────────────────────────────┘
```

- Toàn màn trong `ScrollView`, `keyboardShouldPersistTaps="handled"`. Khi bàn phím mở, cuộn để ô đang nhập và nút Đăng nhập cùng hiện; header được phép cuộn khuất. Không thu nhỏ/đổi bố cục header.
- Footer luôn ở đáy khi đủ chỗ; khi bàn phím mở thì nằm sau thẻ.

## 4. Field

| Field | Thuộc tính |
| --- | --- |
| Email | icon `mail`; placeholder "ten@mindy.vn"; bàn phím email; không viết hoa tự động, không tự sửa; autofill username/email; phím return "Tiếp" → focus Mật khẩu; tối đa 320 ký tự; cắt khoảng trắng hai đầu khi kiểm tra và khi gửi |
| Mật khẩu | icon `lock`; placeholder "Nhập mật khẩu"; ẩn ký tự mặc định; autofill mật khẩu; phím return "Đăng nhập" → gửi; tối đa 128 ký tự; **không** cắt khoảng trắng; nút mắt 40px bên phải (`visibility` ↔ `visibility_off`) |

Kiểm tra phía app chỉ chạy khi bấm Đăng nhập (giống mẫu), sau đó cập nhật theo từng lần gõ:

- Email trống → "Nhập email"; sai dạng `x@y.z` → "Email không hợp lệ".
- Mật khẩu trống → "Nhập mật khẩu".
- Không kiểm tra độ dài tối thiểu mật khẩu ở app (backend chỉ yêu cầu ≥1).
- Có lỗi field → không gửi, focus vào field lỗi đầu tiên.

## 5. Trạng thái

| # | Trạng thái | Hiển thị | Hành vi |
| --- | --- | --- | --- |
| S2-A | Mặc định | Hai ô trống, không hộp thông báo | Nút Đăng nhập luôn bật |
| S2-B | Lỗi field | Viền ô lỗi `--mdy-danger-border`, chữ lỗi 12px dưới ô | Gõ vào ô xóa lỗi của ô đó khi giá trị hợp lệ |
| S2-C | Đang gửi | Nút nền `--mdy-brand-700`, spinner + "Đang đăng nhập…"; hai ô và nút mắt, "Quên mật khẩu?" bị khóa (opacity 1, không nhận nhập) | Ẩn bàn phím; bấm lặp không gửi thêm; back Android bị bỏ qua |
| S2-D | Sai thông tin | Hộp `error` đầu thẻ: "Email hoặc mật khẩu không đúng. Vui lòng thử lại."; viền cả hai ô màu lỗi | Giữ email, **xóa mật khẩu** và focus ô Mật khẩu. Gõ vào bất kỳ ô nào ẩn hộp lỗi |
| S2-E | Mất mạng / timeout / 5xx / sai định dạng | Hộp `error` với chữ lỗi chung (design phase mục 8); 5xx thêm "Mã hỗ trợ" | Giữ cả email và mật khẩu; viền ô không đổi; bấm Đăng nhập để thử lại |
| S2-F | Thành công, role MENTOR/MANAGER | — | Thay stack → workspace; toast `success` "Đăng nhập thành công" trên workspace |
| S2-G | Thành công, role khác | — | Thay stack → Access denied (S3); không toast |
| S2-H | Đến từ bootstrap: phiên hết hạn | Hộp `warning` đầu thẻ: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." | Ẩn khi bấm Đăng nhập |
| S2-I | Đến từ bootstrap: tài khoản ngừng hoạt động | Hộp `warning`: "Tài khoản không còn hoạt động. Liên hệ trung tâm nếu cần hỗ trợ." | Ẩn khi bấm Đăng nhập |
| S2-J | Đến sau đăng xuất | Hai ô **trống** (không điền sẵn email cũ); toast `success` "Đã đăng xuất" hoặc "Đã đăng xuất khỏi mọi thiết bị" | — |
| S2-K | Sheet "Quên mật khẩu?" mở | Xem mục 6 | — |
| S2-L | Thiếu cấu hình (development) | Hộp `error` "Ứng dụng chưa được cấu hình địa chỉ máy chủ." | Không gửi request |

Ghi chú nghiệp vụ:

- Tài khoản bị khóa/chưa kích hoạt: backend trả cùng lỗi với sai mật khẩu (`INVALID_CREDENTIALS`), nên UI hiện đúng S2-D, không tiết lộ tình trạng tài khoản.
- Nếu backend về sau trả 429 (giới hạn số lần), dùng hộp `error`: "Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại." — chỉ áp dụng khi contract có mã này.
- Chỉ có một thông báo đầu thẻ tại một thời điểm; lỗi mới thay thông báo cũ.
- Không có trạng thái empty/không quyền riêng: "không quyền" là S2-G.

## 6. Sheet "Quên mật khẩu?"

`BottomSheet` biến thể `info`: tay kéo; icon tròn 56px `--mdy-brand-tint-2` glyph `help` `--mdy-brand-800`; tiêu đề 17/600 "Quên mật khẩu?"; mô tả 14px secondary "Liên hệ quản lý hoặc bộ phận hỗ trợ của trung tâm để được đặt lại mật khẩu."; nút `primary` 52px "Đã hiểu" đóng sheet. Không gọi API.

## 7. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `auth.login.title` | Đăng nhập | Sign in |
| `auth.login.subtitle` | Dùng tài khoản trung tâm đã cấp cho bạn | Use the account your center gave you |
| `auth.login.email` / `.emailPlaceholder` | Email / ten@mindy.vn | Email / name@mindy.vn |
| `auth.login.password` / `.passwordPlaceholder` | Mật khẩu / Nhập mật khẩu | Password / Enter your password |
| `auth.login.showPassword` / `.hidePassword` | Hiện mật khẩu / Ẩn mật khẩu | Show password / Hide password |
| `auth.login.forgot` | Quên mật khẩu? | Forgot password? |
| `auth.login.submit` / `.submitting` | Đăng nhập / Đang đăng nhập… | Sign in / Signing in… |
| `auth.login.footer` | Chưa có tài khoản? Liên hệ trung tâm để được cấp. | No account yet? Ask your center to create one. |
| `auth.login.errors.emailRequired` | Nhập email | Enter your email |
| `auth.login.errors.emailInvalid` | Email không hợp lệ | Enter a valid email |
| `auth.login.errors.passwordRequired` | Nhập mật khẩu | Enter your password |
| `auth.login.errors.invalidCredentials` | Email hoặc mật khẩu không đúng. Vui lòng thử lại. | Incorrect email or password. Please try again. |
| `auth.login.errors.tooManyAttempts` | Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại. | Too many attempts. Please wait a moment and try again. |
| `auth.login.notice.sessionExpired` | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. | Your session has expired. Please sign in again. |
| `auth.login.notice.accountInactive` | Tài khoản không còn hoạt động. Liên hệ trung tâm nếu cần hỗ trợ. | This account is no longer active. Contact your center for help. |
| `auth.login.toast.success` | Đăng nhập thành công | Signed in |
| `auth.forgot.title` / `.body` / `.ok` | Quên mật khẩu? / Liên hệ quản lý hoặc bộ phận hỗ trợ của trung tâm để được đặt lại mật khẩu. / Đã hiểu | Forgot password? / Contact your manager or the center's support team to reset your password. / Got it |

## 8. Accessibility

- Label field gắn với ô nhập (`accessibilityLabel` = label; lỗi đọc kèm qua `accessibilityHint` hoặc thông báo).
- Hộp `error` dùng `accessibilityRole="alert"`; khi xuất hiện, screen reader đọc ngay.
- Nút mắt đổi `accessibilityLabel` theo trạng thái; nút Đăng nhập báo `busy` khi đang gửi.
- Thứ tự focus: Email → Mật khẩu → nút mắt → Quên mật khẩu? → Đăng nhập.

## 9. testID

`login-screen`, `login-email-input`, `login-email-error`, `login-password-input`, `login-password-error`, `login-password-toggle`, `login-forgot-button`, `login-submit-button`, `login-alert`, `login-support-code`, `forgot-sheet`, `forgot-sheet-ok`, `toast`.

## 10. Test case

Mock tại service boundary đăng nhập. Ghi chú "gửi" = service đăng nhập được gọi.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P0-S2-01 | — | Mở Login | Có tiêu đề, phụ đề, 2 ô, "Quên mật khẩu?", nút Đăng nhập, footer; **không** có nút Google, "hoặc", "Ghi nhớ đăng nhập" |
| TC-P0-S2-02 | — | Bấm Đăng nhập khi 2 ô trống | Hiện "Nhập email" và "Nhập mật khẩu"; không gửi; focus ô Email |
| TC-P0-S2-03 | — | Email "linh.tran", mật khẩu "x", bấm Đăng nhập | "Email không hợp lệ"; không gửi |
| TC-P0-S2-04 | Đang hiện lỗi email | Sửa thành "linh.tran@mindy.vn" | Lỗi email biến mất ngay |
| TC-P0-S2-05 | — | Email "  linh.tran@mindy.vn  ", mật khẩu " p@ss ", gửi | Service nhận email đã cắt khoảng trắng, mật khẩu giữ nguyên " p@ss " |
| TC-P0-S2-06 | Service chưa resolve | Gửi hợp lệ, bấm Đăng nhập lần 2 | Nút "Đang đăng nhập…" + spinner; ô bị khóa; service chỉ được gọi 1 lần |
| TC-P0-S2-07 | Service → INVALID_CREDENTIALS | Gửi | Hộp lỗi "Email hoặc mật khẩu không đúng…"; email giữ, mật khẩu trống, focus Mật khẩu; không điều hướng |
| TC-P0-S2-08 | Đang hiện hộp lỗi sai thông tin | Gõ vào ô Mật khẩu | Hộp lỗi biến mất |
| TC-P0-S2-09 | Service → mất mạng | Gửi | Hộp lỗi mất mạng; email và mật khẩu giữ nguyên |
| TC-P0-S2-10 | Service → timeout | Gửi | Hộp lỗi timeout |
| TC-P0-S2-11 | Service → 503 requestId "req-9" | Gửi | Hộp lỗi hệ thống + "Mã hỗ trợ: req-9" |
| TC-P0-S2-12 | Service → MENTOR | Gửi | Đích `workspace-mentor-root`; toast "Đăng nhập thành công"; back không về Login |
| TC-P0-S2-13 | Service → MANAGER | Gửi | Đích `workspace-manager-root` |
| TC-P0-S2-14 | Service → ADMIN | Gửi | Đích Access denied; không toast thành công |
| TC-P0-S2-15 | Service → STUDENT | Gửi | Đích Access denied |
| TC-P0-S2-16 | — | Bấm nút mắt 2 lần | Mật khẩu hiện rồi ẩn; label đổi "Hiện mật khẩu" ↔ "Ẩn mật khẩu" |
| TC-P0-S2-17 | — | Bấm "Quên mật khẩu?" rồi "Đã hiểu" | Sheet mở với nội dung mục 6, đóng lại; không gọi service nào |
| TC-P0-S2-18 | Vào từ bootstrap với `sessionExpired` | Mở Login | Hộp cảnh báo phiên hết hạn; bấm Đăng nhập thì ẩn |
| TC-P0-S2-19 | Vào từ bootstrap với `accountInactive` | Mở Login | Hộp cảnh báo tài khoản ngừng hoạt động |
| TC-P0-S2-20 | Vào sau đăng xuất | Mở Login | Hai ô trống; toast "Đã đăng xuất" |
| TC-P0-S2-21 | Ô Email đang focus | Bấm phím "Tiếp" | Focus ô Mật khẩu; phím return ở Mật khẩu gửi form |
| TC-P0-S2-22 | Thiếu cấu hình | Gửi hợp lệ | Hộp lỗi cấu hình; service HTTP không được gọi |
| TC-P0-S2-23 | Ngôn ngữ en, theme tối | Gửi khi 2 ô trống | Chữ tiếng Anh theo bảng mục 7; màu theo bảng tối |

Ứng viên Maestro E2E: TC-P0-S2-02, -07, -12, -13, -14 (cần tài khoản thử MENTOR, MANAGER, ADMIN trên backend tích hợp).
