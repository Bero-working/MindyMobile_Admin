# ADR-006 — Draft và queue điểm danh offline

## Status

**Proposed** — chưa được người dùng duyệt; chưa được dùng để implement.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Người dùng đề xuất offline sau khi buổi đã start online và roster đã tải; API có version/key, roster phân trang và có guest. Chính sách lưu trên thiết bị được trả lời là chưa chốt.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất chỉ đánh dấu/sửa draft offline; start/sync/finalize luôn online. Serialize mutation theo session; tách draft chưa gửi khỏi request cố định payload/key/version đã gửi. Retry cùng thao tác giữ nguyên; 409 dừng và đối chiếu, không tự đổi expectedVersion rồi replay dưới key cũ. Chưa quyết định queue persist, mã hóa, TTL hoặc xử lý logout.

## Alternatives

Last-write-wins; tự rebase queue; cho start/finalize offline; bỏ toàn bộ draft sau lỗi. Chưa chọn vì xung đột nghiệp vụ hoặc có thể mất thay đổi chưa được chấp nhận.

## Consequences

Cần chốt tải đủ roster hay chỉ phần đã tải, batch nhiều thay đổi, app-kill/mất response và account isolation. Mọi thay đổi assignment/trạng thái/hạn phải backend kiểm lúc nhận. Không mở rộng offline sang note/CASH/approval. ADR còn Proposed không cho triển khai queue/persist.

## BR-slice bị ảnh hưởng

BR: `BR-OFF-01`, `BR-OFF-02`, `BR-DATA-02`, `BR-ATT-08`, `BR-ATT-11` — xem [business-rules](../business-rules.md).
Slice: P2-S1–P2-S6; UI conflict nằm trong editor, không tự tạo màn mới — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-DATA-01, Q-OFF-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
