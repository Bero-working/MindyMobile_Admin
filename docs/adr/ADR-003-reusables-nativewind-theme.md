# ADR-003 — React Native Reusables, NativeWind và theme

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Chốt tất cả adr 1->9”. Chấp nhận nội dung Decision của ADR này; các câu hỏi còn mở và cổng duyệt riêng tiếp tục giữ nguyên, phần phụ thuộc chưa được triển khai khi chưa đủ điều kiện.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Yêu cầu chỉ định React Native Reusables + NativeWind, CSS variables/dark mode; hiện package có rn-kit và chưa NativeWind. Claude sở hữu toàn bộ design.md.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất đặt UI primitives tại src/components/ui, alias @components/ui, cn() ở @utils; dùng theme CSS variables và dark mode theo design Claude. Kiểm tra version tương thích RN/Reanimated trước cài đặt, kết hợp withNativeWind với SVG transformer. vi/en và font/layout phải theo design. defaultTheme chưa quyết định (Q-THEME-01).

## Alternatives

Giữ rn-kit; tự xây design system; tự dựng layout thay Claude. Không chọn vì khác yêu cầu/phân vai.

## Consequences

Cần migrate dần component cũ sau duyệt; không viết file design hoặc tự chốt token. Mọi lệch design phải có ADR mới Accepted. TDD UI toàn phase phải có tất cả trạng thái quy định.

## BR-slice bị ảnh hưởng

BR: `BR-SCOPE-01` — xem [business-rules](../business-rules.md).
Slice: P0-S1–P0-S4; toàn bộ slice UI — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-THEME-01, Q-DESIGN-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
