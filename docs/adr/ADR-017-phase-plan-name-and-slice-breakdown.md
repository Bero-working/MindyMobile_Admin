# ADR-017 — Tên kế hoạch tổng và tách kế hoạch theo slice

## Status

**Accepted** — theo chỉ thị trực tiếp của người dùng ngày 30/10/2026 (Asia/Bangkok): đổi tên plan.md trùng tên folder phase; sau khi người dùng duyệt mới tách chi tiết theo các slice. Ghi nhận rồi đóng băng theo ADR-012.

## Ngày

30/10/2026. Người ghi: Codex.

## Context

ADR-016 đặt tên kế hoạch là plan.md. Người dùng yêu cầu tên kế hoạch tổng trùng tên folder và bổ sung bước duyệt trước khi tách kế hoạch slice.

## Decision

- Kế hoạch tổng: `docs/implement/phase-NNN-<slug>/phase-NNN-<slug>.md`.
- Phase 0 dùng `docs/implement/phase-000-foundation-auth/phase-000-foundation-auth.md`; cập nhật liên kết tới file hiện hành.
- Người dùng duyệt kế hoạch tổng trước; sau duyệt mới tách kế hoạch chi tiết theo các slice bên trong folder phase. Hiện chưa thực hiện bước tách.
- Duyệt kế hoạch tổng cho phép tách tài liệu slice, không tự cho phép code. Code vẫn chờ người dùng yêu cầu implement; triển khai UI mock trước và chờ approve UI toàn phase trước API.

## Quan hệ thay thế

Thay thế tên plan.md trong ADR-016, bổ sung cổng duyệt kế hoạch tổng trước tách slice. Giữ nguyên phần còn lại của ADR-016 và ADR-009. Không sửa file ADR Accepted cũ; tên plan.md trong ADR-016 là lịch sử.

## Alternatives

Giữ plan.md hoặc tách slice trước duyệt: không chọn vì khác chỉ thị người dùng.

## Consequences

Đổi tên file và liên kết; không đổi phạm vi nghiệp vụ, không tách slice trong lượt đổi tên và không tiếp tục code.

## BR-slice bị ảnh hưởng

Không đổi BR. Tổ chức tài liệu triển khai theo phase; trước mắt P0-S1–S4.
