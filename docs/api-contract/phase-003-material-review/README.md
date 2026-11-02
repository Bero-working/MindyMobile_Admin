# P3 — Contract Material Review

Ngày đối chiếu: **02/11/2026 (Asia/Bangkok)**. Nguồn: [snapshot backend nguyên bản](../legacy/2026-11-02-materials/README.md), design Claude và chỉ thị [ADR-029](../../adr/ADR-029-phase-3-direct-api-implementation.md). API đã được phép tích hợp trực tiếp, không ghi giả UI đã được người dùng duyệt.

| Slice                       | Contract                                         |
| --------------------------- | ------------------------------------------------ |
| S1 — mentor-materials       | [Danh sách theo lớp/chương](mentor-materials.md) |
| S2 — material-editor        | [Nháp và upload](material-editor.md)             |
| S3 — mentor-material-detail | [Chi tiết và submit](mentor-material-detail.md)  |
| S4 — material-review-queue  | [Queue Manager](material-review-queue.md)        |
| S5 — material-review-detail | [Approve/reject](material-review-detail.md)      |
| S6 — material-preview       | [Private preview](material-preview.md)           |

Base URL theo `API_URL`; cookie HttpOnly qua client backend. Các mutation material có `Origin: API_ORIGIN`, không có `Idempotency-Key` của attendance. Upload/files theo guard riêng; storage dùng client không có interceptor/cookie/header backend và không theo redirect. Không fallback mock khi API lỗi.

Response có enum lạ hoặc sai resource/revision được từ chối. Metadata material: id/courseUnitId/contentType/title/description/sortOrder/availableAt/sessionId/createdBy/createdInClassId/revision/reviewStatus/approvedRevision/reviewedBy/reviewedAt/firstApprovedAt/rejectionReason/publishedAt/createdAt/updatedAt/canEdit/file. Detail thêm contentHtml/contentSchemaVersion/inlineImages/attachments. ID UUID; revision nguyên dương; instant có offset. List gồm items/page/pageSize/total, mỗi trang tối đa 100.

401 → restore phiên một lần, chỉ retry khi vẫn cùng identity; hết phiên gọi expire. 403 mất quyền/404 xóa nội dung; 403 ORIGIN_NOT_ALLOWED là lỗi cấu hình giữ dữ liệu. 409 MATERIAL_REVIEW_CONFLICT → đọc lại, người dùng quyết định trên bản mới. 409 FILE_NOT_READY không giả thành conflict revision. Timeout/5xx hoặc response mutation sai schema là uncertain: không tự replay; các intent review giữ nguyên revision/body khi người dùng gửi lại. CREATE/PATCH phải đối soát, không retry mù. Có requestId hiển thị mã hỗ trợ, không dùng raw message backend.

Model/schema thực thi ở `src/modules/materials/schema.ts`, service ở `service.ts`. Bằng chứng và giới hạn cập nhật tại [hồ sơ API](../../implement/phase-003-material-review/api-integration.md).
