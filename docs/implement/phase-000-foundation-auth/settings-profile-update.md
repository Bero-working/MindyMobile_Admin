# S4 — cập nhật Cài đặt / Hồ sơ

30/10/2026 (Asia/Bangkok). Người dùng vừa sửa design và yêu cầu cập nhật UI. Nguồn hiện hành: [design S4](../../design/foundation-auth/settings/design.md) và [design phase](../../design/foundation-auth/design.md), bản cập nhật khoảng 20:26. Không sửa hai tài liệu design hoặc HTML mẫu.

## Phạm vi và thứ tự

1. Đối chiếu design mới với màn Tài khoản cũ, giữ service auth/cookie/refresh/logout đã tích hợp.
2. Tách hai màn lazy Native Stack: avatar workspace → Hồ sơ; bánh răng → Cài đặt. Cả hai back về đúng workspace, không dẫn sang nhau.
3. Cài đặt: mã VI/EN và phụ đề; ba thẻ Sáng/Tối/Hệ thống với hình xem trước cố định, trạng thái radio, ghi chú theo lựa chọn và toast khi đổi. Bấm lại mục đã chọn không toast. Không còn tài khoản/phiên đăng nhập/phiên bản app ở đây.
4. Hồ sơ: avatar 84px, tên/email/role căn giữa, thông tin email/phone có thể copy. `phone` nullable lấy từ UserDto đã xác minh; khi trống hiện Chưa cập nhật/Not provided. Không gọi lại API khi mở màn, không thêm Cơ sở/Mã nhân viên hoặc chức năng sửa hồ sơ.
5. Chuyển các hàng logout sang Hồ sơ, giữ sheet/loading/lỗi/chống bấm lặp và xóa cache trước điều hướng. Không đổi xử lý phiên hết hạn của ADR-019.
6. Cập nhật hồi quy Jest và flow Maestro API cho hai đường vào, chạy lint/format/typecheck và kiểm tra native với tài khoản test cả hai role. Kiểm ảnh Cài đặt tối/Hồ sơ thực tế.

## Mã nguồn

- `screens/SettingsScreen.tsx`, `screens/ProfileScreen.tsx`, `screens/WorkspaceScreen.tsx`, `AuthApp.tsx`.
- `components/AccountPage.tsx`: header subpage và panel dùng chung.
- `components/ui/theme-card.tsx`: preview vector/native shapes; không tải ảnh runtime. Màu preview cố định theo design, màu UI theo theme.
- Primitives Card hỗ trợ class override; Avatar có cỡ profile; Row hỗ trợ ô mã/compact/không chevron. Dùng NativeWind và tokens hiện hữu, thêm token kích thước cần thiết.
- Bổ sung glyph settings/call và fill-1 cho theme cards từ [Google Material Design Icons](https://github.com/google/material-design-icons/tree/master/symbols/web), Material Symbols Rounded weight 300; không thay bằng icon khác.
- Service auth giữ `phone` sau validate nullable để UI dùng dữ liệu thật. Không thêm endpoint hoặc persist tài khoản.

## Kiểm chứng

- Ngày 30/10: `npm run check` pass 8 suites/100 tests, log `build-logs/settings-profile-check-final.log`.
- Maestro API thật với UI tách hai trang: Mentor/logout PASS 1/1, 2m18s (`settings-profile-mentor-final.xml`); Manager/logout-all PASS 1/1, 2m01s (`settings-profile-manager-final.xml`). Các lượt này dùng sheet cũ, không chứng minh dialog giữa màn hình ở cập nhật bên dưới.
- Ảnh native đã kiểm: ngôn ngữ VI/EN, preview theme tối, Hồ sơ với phone backend. Đã sửa đường cắt nền Cài đặt bằng panel grow tới đáy và bố trí safe area ở nội dung.
- Lượt Mentor đầu `settings-profile-mentor.xml` fail sau hideKeyboard, ảnh ở launcher; thay bước hideKeyboard bằng scroll tới nút đăng nhập, lượt rerun pass. Giữ artifact lịch sử, không suy từ ảnh thành crash app.

Báo cáo API/UI trước 20:26 thuộc design cũ, không dùng làm bằng chứng hình thức UI mới. Các giới hạn iOS/native access expiry của [hồ sơ API](api-integration.md) vẫn giữ nguyên. Không tự nghiệm thu phase hoặc tạo commit.

## Chỉ thị đổi xác nhận đăng xuất — tiếp tục 31/10/2026

Người dùng cung cấp [ảnh tham chiếu](assets/logout-confirm-reference.png) và yêu cầu thay modal xác nhận logout theo ảnh. Đây là chỉ thị trực tiếp thay phần xác nhận kiểu bottom sheet trong design S4; không sửa design nguồn đã bàn giao để hợp thức hóa code.

- Dùng `ConfirmationDialog` giữa màn hình: nền scrim, card bo 28px, icon logout trong nền danger mềm, tiêu đề căn giữa, mô tả có email tài khoản, nút danger và nút Hủy có viền.
- Cùng hình thức cho logout và logout-all, nhưng tiêu đề/mô tả/nút giữ đúng phạm vi thiết bị hiện tại hoặc mọi phiên. Không lấy dữ liệu giả trong ảnh làm thông tin hồ sơ.
- Hỗ trợ vi/en, theme sáng/tối, reduced motion, focus tiêu đề và trả focus về hàng vừa bấm. Dialog cuộn khi nội dung/chữ lớn vượt vùng màn hình an toàn.
- Khi đang gửi, khóa xác nhận lặp, Hủy, scrim và Android Back; khi lỗi giữ dialog và tài khoản để retry. API/cookie/cache/expired-session theo ADR-019 giữ nguyên.
- Selector `logout-sheet` và các selector con được giữ để không phá consumer kiểm thử; component mới không có tay kéo hoặc pan-to-dismiss. Forgot-password vẫn dùng Sheet riêng.

### Kết quả dialog mới — 31/10/2026

- `npm run check`: lint/format/typecheck và 8 suites/102 tests PASS; `build-logs/logout-dialog-check-final.log`. Đã kiểm lại riêng typecheck/ESLint cho test mới sau khi hoàn thiện file. Hai ca thêm kiểm email/phạm vi bằng vi/en và Android Back trước xác nhận; hồi quy busy/lỗi/logout-all/cache vẫn pass.
- Maestro API thật, Mentor/logout: **PASS 1/1, 2m19s**, `build-logs/logout-dialog-ui-mentor.xml` và `.log`. Gồm đúng workspace, relaunch giữ phiên, vào Cài đặt/Hồ sơ, đổi vi/en/theme, mở dialog, Hủy, xác nhận logout, Back không lộ Hồ sơ và relaunch về Login.
- Đã xem ảnh native: [dialog mới](../../../build-logs/ui-review/logout-dialog.png), [Cài đặt tối](../../../build-logs/ui-review/auth-api-settings-dark.png), [Hồ sơ](../../../build-logs/ui-review/auth-api-profile.png). Đối chiếu dialog với ảnh người dùng: card giữa màn hình, icon đỏ nền mềm, mô tả email, nút danger và Hủy viền.
- Emulator Pixel_8 Android 17/API 37 chạy dạng cửa sổ UI theo yêu cầu người dùng, app Debug hiện có được cài lại và tải source cuối qua Metro 8081. Không tuyên bố build mới native cho thay đổi chỉ gồm JS/UI.
- Lượt đầu trên emulator chạy nền vượt 45 giây chờ Login; Metro đang biên dịch bundle, sau đó UI hierarchy có Login. Giữ `logout-dialog-mentor`/`logout-dialog-mentor-rerun` làm lịch sử fail. Tăng giới hạn chờ bootstrap/relaunch của harness lên 120 giây; timeout HTTP app vẫn 10 giây. Lượt `logout-dialog-mentor-final` bị dừng để chuyển emulator sang UI theo yêu cầu, không tính pass/fail sản phẩm.
- Credentials truyền lúc chạy, không đưa vào flow/source; artifacts text được quét cả folder ẩn bằng `-Force` và redact password, không lưu cookie/token.

Native E2E mới trực tiếp xác nhận Mentor/logout. Logout-all đã có hồi quy unit với dialog mới và bằng chứng Manager/API ở lần trước; chưa chạy lại Maestro Manager với dialog mới. iOS và native access-cookie expiry/rotation vẫn chưa kiểm chứng, phase chưa nghiệm thu/Done.

## Ẩn mã hỗ trợ trong thông báo lỗi — 31/10/2026

Theo yêu cầu người dùng và ảnh lỗi đăng nhập, Alert dùng chung không còn nhận/render requestId/supportLabel/supportID. Đã bỏ các prop tương ứng ở Login, Denied và Profile; thông báo chỉ giữ icon và nội dung lỗi đã dịch. Metadata requestId trong service/contract không đổi; màn lỗi Bootstrap riêng không thuộc toast/Alert trong yêu cầu này. Cập nhật hồi quy sẵn có để xác nhận lỗi login/logout không hiển thị mã và vẫn giữ hành vi form/tài khoản. Lệnh kiểm chứng: npm run check, log build-logs/hide-alert-support-code-check.log.
