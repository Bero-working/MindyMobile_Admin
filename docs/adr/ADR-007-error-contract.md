# ADR-007 — Chuẩn hóa lỗi theo contract thực

## Status

**Proposed** — chưa được người dùng duyệt; chưa được dùng để implement.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Exception filter BE trả statusCode/code/message/requestId và details nhiều hình dạng; Swagger DTO không đủ bảo đảm mọi error response cùng shape.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất Axios boundary chuẩn hóa AxiosError<ApiErrorResponse> sang AppError, phân biệt network/timeout/401/403/404/422/409/5xx/config. Parse các shape có căn cứ, giữ code/requestId, normalize field errors cụ thể; không dùng Record<string,unknown>, z.any hoặc z.unknown. Thông báo UI qua i18n. Không tự bịa mã lỗi business để gắn vào response BE.

## Alternatives

Đưa raw Axios error hoặc raw message thẳng UI; ép mọi details thành field errors; retry toàn bộ lỗi. Không chọn vì làm sai nghĩa và khó phục hồi.

## Consequences

Mỗi UI contract liệt kê mã lỗi và cách xử lý. 409 version/revision khác 409 trạng thái và CASH closed; 401 refresh/logout cần ADR Auth riêng. Unexpected payload có lỗi decode rõ ràng, không fallback mock hoặc bỏ validate.

## BR-slice bị ảnh hưởng

BR: `BR-ATT-11`, `BR-PAY-02`, `BR-PAY-04` — xem [business-rules](../business-rules.md).
Slice: P0-S2/P0-S3 và tất cả API — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Chưa xác minh payload runtime; phải đối chiếu legacy và từng endpoint.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
