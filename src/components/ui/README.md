# UI primitives

Phase 0 áp dụng ADR-003/010/013/014 qua NativeWind và cấu trúc React Native Reusables. Button/Text được quản lý trong source của repo theo cấu trúc composition của React Native Reusables.

- `text.tsx`, `button.tsx`: `forwardRef`, `asChild` qua Slot, TextClassContext, CVA variants và `cn()`; caller có thể override class. Button giữ busy/disabled/pressed, icon và nhãn theo design.
- `classes.ts`: class recipes dùng chung cho screen/header/card/row/sheet và typography; màn auth dùng `className`, không duy trì bản sao `StyleSheet.create`.
- `tokens.json`: ánh xạ runtime từ design Claude đã có: màu sáng/tối, spacing/kích thước, font/line-height/radius/letter-spacing và motion. Không sửa nguồn design để hợp thức hóa code.
- `theme.tsx`: cấp CSS variables cho toàn cây UI; mặc định system, preferences lưu MMKV. Modal có root variables riêng vì tách khỏi cây native.
- `tailwind.config.js`: đọc cùng tokens để tạo utility; `src/global.css` là entry runtime. `cn()` biết các nhóm font tùy chỉnh để không gộp nhầm font size với màu hoặc font family với font weight.
- `primitives.tsx`: Screen, gradient/header/card, alert/avatar/chip, row, focus heading, sheet và toast; re-export primitive để giữ đường import của màn hình.
- `text-field.tsx`: label/error dùng NativeWind; TextInput giữ autofill, ref focus và placeholder color native.
- `icon.tsx`, `symbols.json`, `symbols-filled.json`: SVG Material Symbols Rounded 300, checked radio và theme được chọn dùng FILL 1; thêm settings/call theo design S4. License tại `assets/MaterialSymbols-LICENSE.txt`.
- `theme-card.tsx`: thẻ chọn giao diện với preview sáng/tối/chia đôi cố định theo design, radio state và nhãn xuống dòng; không tải ảnh runtime. Màu preview là minh họa, không thay palette UI.
- `confirmation-dialog.tsx`: hộp thoại giữa màn hình cho logout theo ảnh người dùng, có scrim, danger icon, focus/return focus, reduced motion và nội dung cuộn theo vùng an toàn. Khóa dismiss khi busy; Sheet vẫn dùng cho thông tin quên mật khẩu.

Chỉ giữ `style`/native props cho CSS variables, safe area và keyboard geometry, hairline theo mật độ máy, SVG/placeholder/spinner, shadow native và override do caller truyền. Chúng dùng cùng palette/token; không dùng một bộ màu theme cạnh tranh. Container Reanimated, Gesture Handler, KeyboardAwareScrollView và Slot được đăng ký `cssInterop` rõ ràng.

Login dùng `modules/auth/schemas/login.schema.ts` và `z.infer` cho dữ liệu form. Email được trim; password giữ nguyên whitespace. Đây là validation UI, không phải schema response hoặc contract API.

`jest.ui-setup.js` biên dịch config Tailwind thật và nạp kết quả vào CSS interop; không mock class thành một style viết tay. Kiểm tra composition bao gồm ref/asChild, text context, font family/size/color độc lập. Test Jest không thay bằng chứng animation native.

Nguồn: `docs/design/foundation-auth/design.md`, `docs/design/global.css.md`. UI phase 0 đã được duyệt và auth đã nối API. S4 đã cập nhật thành Cài đặt/Hồ sơ theo design mới; kết quả native, ảnh và giới hạn tại `docs/implement/phase-000-foundation-auth/settings-profile-update.md`. Chưa nghiệm thu phase.
