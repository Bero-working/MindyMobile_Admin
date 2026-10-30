# ADR-004 — TanStack Query, MMKV, Zod và ranh giới dữ liệu

## Status

**Proposed** — chưa được người dùng duyệt; chưa được dùng để implement.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Ba thư viện đã có trong package. Backend trả no-store cho dữ liệu nhạy cảm và error/score có shape cần đối chiếu; người dùng chưa chốt persistence roster/draft.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất TanStack Query quản lý server state, key theo module/account/role/resource/filter/page; Zod validate form và response, kiểu suy ra bằng z.infer. MMKV cho preferences và chỉ persist phần dữ liệu được policy cho phép. Không persist toàn query cache; chưa bật roster/draft persistence. Retry tối đa 3 theo cấu hình nhưng chỉ retry thao tác/lỗi an toàn theo contract.

## Alternatives

Zustand giữ toàn bộ server state; bỏ response validation; persist mọi query. Không chọn vì khó bảo đảm invalidation, quyền và dữ liệu nhạy cảm.

## Consequences

Mỗi contract UI phải có wire DTO, schema, mapping, key và invalidation. Query TTL/retention/mã hóa chưa có default tự đặt. Logout/role đổi phải xóa cache bộ nhớ; cách giữ draft chờ Q-DATA-01. Optimistic update không đồng nghĩa server commit.

## BR-slice bị ảnh hưởng

BR: `BR-DATA-02`, `BR-ATT-08`, `BR-PAY-04`, `BR-QUIZ-03` — xem [business-rules](../business-rules.md).
Slice: Mọi bước API, trực tiếp P2-S1 và P5-S4/P5-S5 — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-DATA-01, Q-ATT-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
