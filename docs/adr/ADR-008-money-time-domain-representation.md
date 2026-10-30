# ADR-008 — Biểu diễn tiền, điểm và thời gian

## Status

**Proposed** — chưa được người dùng duyệt; chưa được dùng để implement.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Yêu cầu VND integer, điểm integer ×100, thời gian UTC/Asia_Ho_Chi_Minh. BE quiz trả decimal string; ngày lớp/nghỉ là calendar date. Backend hiện dùng Order, chưa có Invoice riêng được xác nhận.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất giữ DTO đúng wire; adapter dùng integer VND và integer score hundredths nội bộ, parse decimal string chính xác và validate safe bounds. Tách calendar date YYYY-MM-DD khỏi ISO instant; dùng deadline/asOf/timeZone backend, hiển thị timezone nghiệp vụ. Không tự đổi Order thành Invoice. Luật notice nghỉ theo ngày lịch và thuật ngữ Invoice cần người dùng chốt.

## Alternatives

Tiền/điểm float; dùng timezone máy; chuyển mọi date-only thành UTC midnight; tự tạo state machine Invoice. Không chọn vì sai boundary hoặc bịa domain.

## Consequences

Test trước/đúng/sau deadline, không dùng 48 giờ từ start thay cutoff lịch. null rate/progress giữ nguyên, không chuyển thành 0. Hóa đơn/biên nhận riêng nếu cần phải ghi khoảng trống API/ADR mới.

## BR-slice bị ảnh hưởng

BR: `BR-TIME-01`, `BR-ATT-06`, `BR-LEAVE-02`, `BR-PAY-02`, `BR-PAY-06`, `BR-QUIZ-03`, `BR-REPORT-01` — xem [business-rules](../business-rules.md).
Slice: P1-S1/P1-S4; P2-S1; P4-S2/P4-S5; P5-S4/P5-S5; P6-S3; P7-S1/P7-S2 — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-LEAVE-01, Q-PAY-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
