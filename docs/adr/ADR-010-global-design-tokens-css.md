# ADR-010 — Tập trung token và CSS mẫu trong design/global.css

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt adr 10 và 11, sau đó hoàn thành adr 11 đi”. Đã thực hiện ngày 30/10/2026 theo yêu cầu “Đọc adr 10 và hoàn thành”. Các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Thư mục `docs/design` có các mẫu HTML: `Login.html`, `Mentor Mobile UI.html` và `Thiết kế Home UI.html`. Cần một nguồn tập trung cho toàn bộ design token và CSS của các mẫu để các màn hình dùng thống nhất, tránh sao chép rồi chỉnh lệch giữa các file.

Người dùng yêu cầu: “Viết adr trong design có 1 file md lưu tất cả token, css của mẫu trong folder design tên global.css”. Diễn giải: ADR là tài liệu Markdown; file chứa token và CSS dùng định dạng CSS, tên `docs/design/global.css`.

Nguồn: [ADR-003](ADR-003-reusables-nativewind-theme.md), [ADR-009](ADR-009-phase-tdd-and-ownership.md), [phân vai](../README.md).

## Decision

Đề xuất dùng duy nhất `docs/design/global.css` làm nguồn chuẩn cho toàn bộ token và CSS được trích từ các mẫu trong `docs/design`.

- Tập trung token màu sắc, typography, spacing, kích thước, border, radius, shadow, opacity, layer và motion có trong mẫu; khai báo bằng CSS custom properties khi phù hợp. Chỉ thêm giá trị có căn cứ từ mẫu hoặc design đã duyệt.
- Tập trung CSS nền tảng, class dùng chung và style riêng từng mẫu trong cùng file; style riêng phải có phạm vi rõ ràng để tránh ảnh hưởng mẫu khác. Gộp các khai báo tương đương, giữ khác biệt có chủ đích.
- Các mẫu HTML tham chiếu `global.css` khi được chuẩn hóa; không duy trì bản sao token hoặc stylesheet cạnh tranh trong từng mẫu. Thuộc tính style động theo dữ liệu, nếu có, vẫn tham chiếu token chung.
- Ghi nguồn mẫu và mục đích của các nhóm token/style bằng comment CSS. Khi mẫu dùng giá trị mâu thuẫn cho cùng một ý nghĩa, ghi nhận để người phụ trách design quyết định; không tự chọn hoặc trộn giá trị.
- Các file `design.md` của slice tham chiếu nguồn chung này, chỉ mô tả cách áp dụng và khác biệt cần thiết; không sao chép toàn bộ token/CSS vào từng file Markdown.
- Khi triển khai React Native, ánh xạ token đã duyệt sang theme CSS variables/NativeWind theo ADR-003. CSS dành cho trình duyệt trong mẫu cần được chuyển đổi phù hợp với React Native; `docs/design/global.css` không tự trở thành stylesheet runtime của ứng dụng.

Claude tiếp tục phụ trách quyết định thiết kế và token; Codex dùng tài liệu đã duyệt để triển khai theo ADR-003/ADR-009. ADR này quy định nơi lưu và cách tham chiếu, không tự duyệt giá trị token, layout hoặc giao diện.

## Alternatives

Giữ CSS và token riêng trong từng HTML; lưu CSS trong `global.css.md`; tạo nhiều bộ token độc lập theo màn hình. Không chọn vì dễ sai lệch, khó tái sử dụng hoặc không đúng định dạng stylesheet được yêu cầu.

## Consequences

Cần rà toàn bộ mẫu, lập nguồn token/style, xử lý xung đột và kiểm tra hiển thị khi chuyển CSS sang file chung. Giữ nguyên các trạng thái, responsive và theme có trong mẫu; không tự tạo dark palette hoặc chọn defaultTheme khi Q-THEME-01 chưa chốt.

Việc viết ADR chưa thực hiện trích xuất CSS, sửa HTML hoặc tạo token mới. Khi triển khai phải đối chiếu mẫu trước/sau và tuân theo cổng duyệt design/UI hiện có.

Đã thực hiện ngày 30/10/2026: giải nén bundle của 3 mẫu, thống kê toàn bộ style inline/khối `<style>`/giá trị trong script và tạo [`docs/design/global.css`](../design/global.css) gồm: token (màu thương hiệu, trung tính, trạng thái, alpha/scrim, gradient, typography, icon, spacing, kích thước, border/radius, shadow/blur, layer, motion), CSS nền tảng, class dùng chung tiền tố `.mdy-` và style riêng có phạm vi cho Đăng nhập, Trang chủ Mentor/Quản lý, trang con Mentor. Đã kiểm tra mọi mã màu hex/rgba trong 3 mẫu đều có trong file. Bỏ qua khung thiết bị và image-slot của công cụ design. Bảy xung đột (vị trí quầng sáng nền, accent trên nền tối, bo góc chip, cỡ/pressed nút chính…) được ghi ở mục 6 của file, chờ người phụ trách design quyết định.

Chưa sửa 3 file HTML: đây là bundle tự giải nén (style inline trong template JSON), chỉnh tay để tham chiếu `global.css` dễ làm hỏng mẫu; việc chuẩn hóa mẫu thực hiện khi xuất lại từ công cụ design. Chưa ánh xạ token sang NativeWind (chờ Q-THEME-01 và cổng duyệt UI).

## BR-slice bị ảnh hưởng

BR: `BR-SCOPE-01` — xem [business-rules](../business-rules.md).
Slice: P0-S1–P0-S4 và toàn bộ slice UI — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-DESIGN-01, Q-THEME-01 và 7 xung đột token ghi tại mục 6 của `global.css`.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận ADR không tự giải quyết các câu hỏi còn mở hoặc thay thế cổng duyệt UI/nghiệm thu phase.
