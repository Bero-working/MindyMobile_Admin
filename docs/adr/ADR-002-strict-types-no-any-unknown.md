# ADR-002 — TypeScript strict và cấm kiểu any/unknown tường minh

## Status

**Proposed** — chưa được người dùng duyệt; chưa được dùng để implement.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Người dùng cấm any/unknown trong mã mobile quản lý. Source boilerplate còn unknown trong HTTP, logger, utility và declaration; strict đã bật nhưng chưa đủ để áp dụng policy.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất áp dụng source, test, mock và boilerplate được giữ lại/chỉnh sửa; loại trừ dependencies/lockfile/generated. Cấm cả annotation, assertion và alias chứa any/unknown; catch(error) để TypeScript suy ra rồi thu hẹp. Dùng DTO cụ thể, constrained generic, discriminated union, Result<T,AppError> và field errors Record<string,string[]> sau normalize. Không sao chép nguyên kiểu unknown của BE sang mobile.

## Alternatives

Cho exception ở test/boundary hoặc cho viết unknown để validate. Không chọn vì không khớp ràng buộc người dùng; có vướng mắc thực tế phải tạo ADR mới, không lách bằng assertion.

## Consequences

Bổ sung no-explicit-any:error và no-restricted-syntax cho TSUnknownKeyword, rà cả TSAnyKeyword/assertion. Đưa **tests** vào typecheck nếu đang bị thiếu. Có thể cần thay declaration/utility của boilerplate bằng kiểu cụ thể. Không coi type thư viện tự suy ra là lỗi viết tường minh.

## BR-slice bị ảnh hưởng

BR: `BR-DATA-01` — xem [business-rules](../business-rules.md).
Slice: P0-S1; mọi source/test/mock sau đó — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Phạm vi được người dùng mô tả là đề xuất; cần chấp nhận ADR trước bật luật.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
