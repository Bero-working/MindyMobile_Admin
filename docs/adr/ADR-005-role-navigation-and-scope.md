# ADR-005 — Navigation một role và scope theo backend

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Chốt tất cả adr 1->9”. Chấp nhận nội dung Decision của ADR này; các câu hỏi còn mở và cổng duyệt riêng tiếp tục giữ nguyên, phần phụ thuộc chưa được triển khai khi chưa đủ điều kiện.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Yêu cầu gốc có bước chọn vai trò, chi nhánh và HYBRID, nhưng người dùng xác định một role/tài khoản, chưa có mô hình chi nhánh; enum backend chỉ ONLINE/OFFLINE.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất bootstrap xác minh cookie/me rồi điều hướng role MENTOR hoặc MANAGER; bỏ bước chọn role và chi nhánh. Dùng capabilities/permissions và assignment backend để giới hạn CLASS/SESSION. Không tạo route Admin/Student hoặc quyền Manager không được API cấp. HYBRID, sửa meeting, đổi mentor chính và placement P0 còn chờ câu hỏi phạm vi.

## Alternatives

Cho chọn role local; app Manager bao toàn bộ Admin; mô hình chi nhánh giả lập. Không chọn vì không có quyền/contract backend.

## Consequences

Deep link cũng kiểm scope; Mentor thay không reuse roster toàn lớp. Mapping manager và management giữ đúng DTO/route. Danh sách slice là đề xuất cần Claude thiết kế, không phải phê duyệt giao diện.

## BR-slice bị ảnh hưởng

BR: `BR-AUTH-01`, `BR-SCOPE-02`, `BR-SCOPE-03`, `BR-CLASS-03`, `BR-TEACH-02`, `BR-OPS-01` — xem [business-rules](../business-rules.md).
Slice: P0-S1/P0-S3; P1-S1–P1-S7; P4-S6/P4-S7; P5-S1 — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-CLASS-01, Q-CLASS-02, Q-MAKEUP-01, Q-P1-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
