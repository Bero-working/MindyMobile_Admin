# Sổ quyết định kiến trúc

Ngày khởi tạo: 30/10/2026. **9 ADR Proposed, 0 Accepted.** Tài liệu này chưa phê duyệt bất kỳ lựa chọn nào.

| ADR                                                    | Nội dung                                             | Trạng thái |
| ------------------------------------------------------ | ---------------------------------------------------- | ---------- |
| [ADR-001](ADR-001-boilerplate-feature-modules.md)      | Giữ nền boilerplate và tổ chức feature module        | Proposed   |
| [ADR-002](ADR-002-strict-types-no-any-unknown.md)      | TypeScript strict và cấm kiểu any/unknown tường minh | Proposed   |
| [ADR-003](ADR-003-reusables-nativewind-theme.md)       | React Native Reusables, NativeWind và theme          | Proposed   |
| [ADR-004](ADR-004-query-mmkv-zod.md)                   | TanStack Query, MMKV, Zod và ranh giới dữ liệu       | Proposed   |
| [ADR-005](ADR-005-role-navigation-and-scope.md)        | Navigation một role và scope theo backend            | Proposed   |
| [ADR-006](ADR-006-attendance-offline-queue.md)         | Draft và queue điểm danh offline                     | Proposed   |
| [ADR-007](ADR-007-error-contract.md)                   | Chuẩn hóa lỗi theo contract thực                     | Proposed   |
| [ADR-008](ADR-008-money-time-domain-representation.md) | Biểu diễn tiền, điểm và thời gian                    | Proposed   |
| [ADR-009](ADR-009-phase-tdd-and-ownership.md)          | TDD theo phase, phân vai và các cổng duyệt           | Proposed   |

## Vòng đời

Proposed → Accepted / Rejected / Superseded by ADR-xxx. Chỉ dẫn ADR thay thế sau khi file đã có. Phản hồi người dùng phải ghi rõ quyết định, ngày và phần còn chờ; không coi một câu trả lời nghiệp vụ là chấp nhận tất cả ADR.

Mẫu mỗi ADR: Context / Decision / Alternatives / Consequences / Status / Ngày / BR-slice bị ảnh hưởng. Mọi thay đổi nghiệp vụ/kiến trúc hoặc lệch design phải có ADR Proposed và dừng phần phụ thuộc cho đến Accepted; sau đó cập nhật tài liệu, changelog và phase trước code.

## Auth cookie chưa tạo ADR

Theo giới hạn lần khởi tạo và yêu cầu đọc legacy trước khi quyết định, **chưa tạo ADR Auth**, chưa cấp mã giả hoặc liên kết tới file chưa tồn tại. [Kiến trúc](../architecture.md#auth-cookie-bằng-chứng-và-phần-chưa-quyết-định) chỉ ghi bằng chứng source và vấn đề cần xác minh.

Sau khi nhập legacy nguyên bản, ADR Auth phải bao gồm access/refresh cookie và path/header thực, Origin/CSRF có căn cứ, native jar, refresh/hết hạn, withCredentials, logout/clear cookie, secure storage có/không và thử thiết bị. Q-ENV-01 chưa giải quyết nên không coi đọc controller là đã kiểm chứng native.

## Phạm vi duyệt

Chưa cần duyệt triển khai khi câu hỏi phụ thuộc chưa rõ. Người dùng có thể duyệt/reject từng ADR hoặc yêu cầu sửa; Codex phải cập nhật trạng thái có căn cứ và ghi lịch sử trước dùng. Danh sách câu hỏi domain ở [business-rules](../business-rules.md#khoảng-thiếu-mâu-thuẫn-và-câu-hỏi-mở).
