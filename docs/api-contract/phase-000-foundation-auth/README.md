# Phase 0 — hợp đồng API

30/10/2026: người dùng duyệt UI và yêu cầu tích hợp. Nguồn: [backend snapshot và SHA-256](../legacy/README.md), [quyết định auth](../../adr/ADR-019-phase-0-cookie-auth.md). Base URL là API_URL có sẵn trong env, bao gồm `/api/v1`.

| Slice | Contract |
| --- | --- |
| P0-S1 | [bootstrap](bootstrap.md) |
| P0-S2 | [login](login.md) |
| P0-S3 | [access-denied](access-denied.md) |
| P0-S4 | [settings/logout](settings.md) |

Wire user dùng `id` UUID, `email`, `displayName`, `phone` string hoặc null, `role`, `status` ACTIVE/SUSPENDED/PENDING_VERIFICATION. Phone được giữ trong view model cho Hồ sơ theo design S4 mới; các trường backend khác được bỏ qua. Auth response là `{user, accessTokenExpiresAt}` (ISO datetime); me trả user trực tiếp, không bọc data. Chỉ ACTIVE được xét quyền vào workspace.

Error backend `{statusCode, code, message, details?, requestId?}`; UI không hiển thị message/raw body. 429 → tooManyAttempts; timeout → timeout; offline do NetInfo xác nhận → offline; lỗi kết nối/server khác → server; DTO thành công sai cấu trúc → invalidResponse. Request timeout 10 giây, không tự retry mutation khi mất phản hồi. Không gửi Origin/CSRF tự đặt vì các auth route hiện tại không có guard đó.

Trạng thái kiểm chứng thực tế xem [hồ sơ tích hợp](../../implement/phase-000-foundation-auth/api-integration.md); code đã nối không đồng nghĩa đã nghiệm thu E2E.
