# ADR-015 — Đánh số phase từ 0

## Status

**Accepted** — chỉ thị trực tiếp ngày 30/10/2026 (Asia/Bangkok): “Đổi lại tên thành phase 0 cho chính xác và tiếp tục (đã có claude design tương ứng)”. Quyết định này được ghi nhận rồi đóng băng theo ADR-012.

## Context

Tên phase-001 đang chỉ P0, gây nhầm với P1. Người dùng yêu cầu tên đúng phase 0.

## Decision

Tên file tiến độ và folder triển khai dùng số phase ba chữ số: P0 → phase-000-foundation-auth, P1 → phase-001-teaching-workspace, …, P8 → phase-008-chat-notifications. Đồng bộ liên kết và mục lục. Mã P0–P8 và slice giữ nguyên.

## Quan hệ thay thế

Thay thế riêng mapping P0 → 001 … P8 → 009 trong ADR-011. Giữ nguyên thư mục docs/progress/phase và quy trình của ADR-009. Không sửa các ADR Accepted cũ; đường dẫn trong đó là lịch sử, tra mục lục hiện tại.

## Alternatives

Chỉ đổi P0 và giữ offset các phase còn lại: không chọn vì tiếp tục gây nhầm tên với mã phase.

## Consequences

Các đường dẫn hiện hành đổi; nội dung nghiệp vụ và trạng thái nghiệm thu giữ nguyên. Design Claude tại docs/design/foundation-auth được dùng để thực hiện UI mock; yêu cầu tiếp tục không thay thế duyệt UI trước API.

## Ngày

30/10/2026. Người ghi: Codex.

## BR-slice bị ảnh hưởng

Không đổi BR. Đổi tên hồ sơ P0–P8; triển khai UI P0-S1–S4 theo design Claude.
