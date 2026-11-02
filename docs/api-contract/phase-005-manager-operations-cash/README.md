# P5 — Contract Manager Operations and Cash

Ngày đối chiếu: 02/11/2026. [Design Claude](../../design/manager-operations-cash/design.md), [quyết định P5](../../adr/ADR-027-phase-5-direct-api-implementation.md). UI và API triển khai cùng lượt theo chỉ thị người dùng; không cần duyệt UI riêng. Không sửa backend.

Source cố định: `docs/api-contract/legacy/2026-11-02-operations/`, 14 file controller/DTO/service sao chép nguyên byte; [manifest SHA-256](../legacy/2026-11-02-operations/manifest.json). Snapshot là căn cứ source; kiểm chứng HTTP thật/simulation ghi riêng trong [hồ sơ tích hợp](../../implement/phase-005-manager-operations-cash/api-integration.md).

| Slice | Contract                                     |
| ----- | -------------------------------------------- |
| S1    | [Dạy thay](substitute-assignment.md)         |
| S2    | [Dời buổi](reschedule-session.md)            |
| S3    | [Hủy và replacement](replacement-session.md) |
| S4    | [Danh sách CASH](cash-orders.md)             |
| S5    | [Xác nhận CASH](cash-order-detail.md)        |

Cookie session dùng withCredentials; 401 khôi phục phiên single flight rồi retry request cũ nếu vẫn đúng tài khoản MANAGER; hết phiên quay Login. Auth identity mới vô hiệu response cũ. Role/scope cuối cùng do backend quyết định; màn/route P5 chỉ đăng ký ở stack Manager. Không fallback mock; mock chỉ trong chế độ review development chủ động chọn.

Schema Zod tại src/modules/operations/services/schemas.ts; adapter tại operationsService.ts. UUID tài nguyên, version dương, số tiền nguyên an toàn, enum status và timestamp có timezone được kiểm; response sai resource bị từ chối. Response mutation không đọc được là kết quả chưa rõ. Body mutation dùng whitelist schema nên không gửi kind/id/key nội bộ hay trường ngoài DTO.

GET phân trang page ≥1, pageSize 1–100; UI dùng 20. Query theo account/resource/filter; đổi query không hiện hàng của query trước, ghép trang khử trùng id. Lỗi tải thêm giữ hàng cũ/retry đúng trang. Dữ liệu RAM, không lưu thiết bị, không tự replay mutation khi reconnect.

HTTP 401/403 → denied (và xóa dữ liệu/form); 404 → notFound; 409/422 → mã lỗi nghiệp vụ riêng + requestId. Timeout/5xx/malformed success sau mutation → uncertain; GET lỗi giữ cache cùng query nếu không mất quyền. Message backend không đưa thẳng lên UI. Ngày/giờ hiển thị UTC+7; Date header của response đơn là nguồn kiểm hạn, thiếu mới fallback đồng hồ máy. Server vẫn quyết định transaction cuối.
