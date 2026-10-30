# ADR-009 — TDD theo phase, phân vai và các cổng duyệt

## Status

**Proposed** — chưa được người dùng duyệt; chưa được dùng để implement.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Người dùng quy định Claude chỉ thiết kế, Codex viết tài liệu/code, UI toàn phase được duyệt trước API; cho phép tạo tài liệu nháp và hỏi theo domain.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất áp dụng nguyên quy trình: tất cả design phase → UI TDD toàn phase → người dùng duyệt UI → contract/API TDD toàn phase → cleanup/lint/tsc/test → người dùng nghiệm thu. Trước mỗi luồng chốt câu hỏi trực tiếp và ADR liên quan. Chỉ người dùng chuyển quyết định sang Accepted hoặc phase Done qua phản hồi rõ ràng.

## Alternatives

Làm UI rồi API từng màn; Codex tự tạo design; coi test pass là nghiệm thu. Không chọn vì trái cổng duyệt/phân vai.

## Consequences

Tài liệu có nguồn và trạng thái, progress Todo/0% lúc đầu; không ghi pass từ lịch sử BE cho mobile. Draft bổ sung được ghi nguồn, nhưng luật đã duyệt chỉ đổi qua ADR Accepted và changelog + phase log. Android thực và iOS có bằng chứng/mốc riêng. Không tự tạo commit/PR trong workspace chưa có .git.

## BR-slice bị ảnh hưởng

BR: `BR-SCOPE-01`, `BR-QUIZ-04` — xem [business-rules](../business-rules.md).
Slice: Mọi phase/slice trong implementation-plan.md — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-DESIGN-01, Q-PLAT-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
