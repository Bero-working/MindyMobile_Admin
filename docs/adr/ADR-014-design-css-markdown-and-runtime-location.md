# ADR-014 — Tài liệu CSS Markdown và stylesheet trong src

## Status

**Accepted** — theo chỉ thị triển khai trực tiếp của người dùng ngày 30/10/2026 (Asia/Bangkok): “đổi global.css thành global.css.md để tạo md sau đó chuyển global.css vào trong src code”. Phạm vi được chỉ định là tên/định dạng tài liệu và vị trí stylesheet runtime. Ghi nhận quyết định rồi đóng băng file theo ADR-012.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Repo có hai file khác vai trò: `docs/design/global.css` chứa token/CSS trích từ mẫu trình duyệt; `global.css` ở root là entry Tailwind của NativeWind. Người dùng yêu cầu tài liệu Markdown và đưa stylesheet vào source code.

## Decision

- Đổi tài liệu design thành `docs/design/global.css.md`. Dùng Markdown giới thiệu nguồn/phạm vi, giữ nguyên CSS mẫu trong fenced code block `css`, gồm cả ghi nhận xung đột chờ xử lý.
- Chuyển stylesheet runtime từ root vào `src/global.css`; cập nhật input NativeWind tại Metro và import từ app entry.
- Tài liệu Markdown là nguồn tham chiếu design, không được import vào Metro. Runtime chỉ chứa CSS phù hợp NativeWind/React Native. Không sao chép nguyên CSS trình duyệt, font URL hoặc selector của mẫu vào runtime.
- Giữ nguyên các câu hỏi theme/design, không tự chọn palette hoặc ánh xạ token chưa được duyệt. Vị trí mới không tự phê duyệt UI.
- Cập nhật tham chiếu trong tài liệu có thể sửa và mã nguồn. File ADR đã Accepted giữ nguyên theo ADR-012; đường dẫn cũ trong ADR-010 là lịch sử, tra đường dẫn hiện tại tại ADR-014 và sổ ADR.

## Quan hệ thay thế

Thay thế một phần [ADR-010](ADR-010-global-design-tokens-css.md): tên/định dạng nguồn design `docs/design/global.css` chuyển thành `docs/design/global.css.md`, và lựa chọn không dùng `.css.md` trong Alternatives cũ không còn áp dụng. Các quy tắc nguồn token, xử lý xung đột, quyền quyết định design và chuyển đổi CSS cho React Native tiếp tục có hiệu lực.

Bổ sung [ADR-003](ADR-003-reusables-nativewind-theme.md) về vị trí entry runtime `src/global.css`. Không sửa ADR cũ; ADR-014 được ưu tiên trong phạm vi đường dẫn/định dạng này theo [ADR-012](ADR-012-immutable-approved-adrs-and-precedence.md).

## Alternatives

Giữ tài liệu dưới dạng `.css` hoặc import nguyên stylesheet trình duyệt vào app. Không chọn vì không đáp ứng yêu cầu Markdown hoặc đưa CSS chưa chuyển đổi vào runtime native.

## Consequences

Cần cập nhật Metro/import và tham chiếu tài liệu. Nội dung CSS mẫu được bảo toàn để đối chiếu, runtime vẫn có entry riêng trong src. Liên kết đường dẫn cũ trong ADR đóng băng được giải thích qua mapping thay thế, không sửa lịch sử.

## BR-slice bị ảnh hưởng

Không đổi BR nghiệp vụ; ảnh hưởng cấu hình nền P0 và nguồn tham chiếu UI của các phase. Các cổng design/UI/API/Maestro/nghiệm thu giữ nguyên.

## Kiểm chứng yêu cầu

Kiểm tra CSS trong code block giữ nguyên nội dung trước chuyển đổi, entry runtime được di chuyển không đổi chức năng, Metro/import trỏ đúng file và lint/typecheck pass. Kết quả thực tế ghi tại hồ sơ P0, không bổ sung vào file ADR sau duyệt.

## Quy tắc sau duyệt

File này đóng băng sau ghi nhận Accepted. Mọi thay đổi tiếp theo phải tạo ADR mới; trạng thái hiệu lực và quan hệ thay thế cập nhật tại sổ ADR.
