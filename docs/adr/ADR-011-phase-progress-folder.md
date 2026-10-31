# ADR-011 — Gom tài liệu phase vào thư mục phase

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt adr 10 và 11, sau đó hoàn thành adr 11 đi”. Các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Chín file tiến độ phase P0–P8 đang nằm trực tiếp trong `docs/progress`, cùng với trang tổng hợp và changelog nghiệp vụ. Người dùng yêu cầu thêm ADR-011 để tạo folder `phase` và đưa tất cả phase vào đó.

Nguồn: [tiến độ](../progress/README.md), [kế hoạch](../implementation-plan.md), [ADR-009](ADR-009-phase-tdd-and-ownership.md).

## Decision

Tạo thư mục `docs/progress/phase/` và đặt toàn bộ file tiến độ phase trong thư mục này. Theo yêu cầu bổ sung của người dùng ngày 30/10/2026, tên file dùng `phase-NNN-<slug>.md`: số thứ tự ba chữ số theo thứ tự phase trong `implementation-plan.md` (P0 → 001, …, P8 → 009), slug giữ đúng tên phase trong kế hoạch:

| Phase | File trong `docs/progress/phase/` |
| ----- | -------------------------------- |
| P0 | `phase-001-foundation-auth.md` |
| P1 | `phase-002-teaching-workspace.md` |
| P2 | `phase-003-attendance-and-notes.md` |
| P3 | `phase-004-material-review.md` |
| P4 | `phase-005-leave-and-makeup.md` |
| P5 | `phase-006-manager-operations-cash.md` |
| P6 | `phase-007-mentor-quiz.md` |
| P7 | `phase-008-attendance-progress-reports.md` |
| P8 | `phase-009-chat-notifications.md` |

Các file tiến độ phase tạo về sau cũng phải đặt trong thư mục này. `docs/progress/README.md` tiếp tục là trang tổng hợp; `docs/progress/business-rules-changelog.md` tiếp tục là changelog chung. Các mục phase trong `implementation-plan.md` và tài liệu design giữ vai trò hiện có.

Khi chuyển file, cập nhật tất cả liên kết tới phase trong bộ tài liệu và các liên kết tương đối bên trong từng file phase. Không giữ bản sao ở đường dẫn cũ để tránh hai nguồn tiến độ.

## Alternatives

Giữ tất cả file trực tiếp trong `docs/progress`; tạo một thư mục riêng cho từng phase. Không chọn vì yêu cầu hiện tại là một thư mục `phase` tập trung cho toàn bộ tài liệu tiến độ phase.

## Consequences

Đường dẫn file phase thay đổi; cần kiểm tra liên kết nội bộ sau khi di chuyển. Nội dung nghiệp vụ, nhật ký, mã phase/slice, trạng thái Todo/Done, phần trăm tiến độ và bằng chứng kiểm thử phải được giữ nguyên.

ADR này chỉ tổ chức lại tài liệu, không thay đổi quy trình hoặc các cổng duyệt của ADR-009. Đã thực hiện ngày 30/10/2026: chuyển đủ 9 file P0–P8 vào `docs/progress/phase/`, cập nhật liên kết và ghi nhật ký từng phase. Đã kiểm tra không còn file phase tại đường dẫn cũ; tiến độ UI/API giữ nguyên.

## BR-slice bị ảnh hưởng

Không thay đổi quy tắc nghiệp vụ. Ảnh hưởng cách lưu tài liệu tiến độ của toàn bộ phase P0–P8 và các slice trong [kế hoạch](../implementation-plan.md).

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Phê duyệt tổ chức thư mục không thay thế duyệt UI hoặc nghiệm thu phase.

## Bổ sung quy ước tên — 30/10/2026

Người dùng yêu cầu đặt tên `phase-001-…` theo phase của implementation-plan. Đã đổi tên đủ 9 file và cập nhật liên kết. Quy ước này thay phần giữ nguyên tên file trong quyết định trước; mã P0–P8 và mã slice giữ nguyên.
