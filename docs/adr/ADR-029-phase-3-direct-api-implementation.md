# ADR-029 — P3 triển khai UI và API không chờ duyệt UI riêng

## Status

**Accepted — 02/11/2026 (Asia/Bangkok).** Nguồn: người dùng yêu cầu trực tiếp “Triển khai phase 3, bỏ qua UI accept, tích hợp API vào luôn”, sau đó “Tiếp tục”. Chỉ thị mới cho phép thực hiện UI/API P3 trong cùng lượt; không phải ghi nhận người dùng đã duyệt UI hoặc nghiệm thu phase.

## Context

ADR-009/016 đặt cổng duyệt UI trước API. Đã có kế hoạch tổng, 6 checklist slice và design Claude P3. Người dùng đã chốt trong chat: “Mentor: FILE, VIDEO, ARTICLE; Manager: duyệt/từ chối”. Design được thêm sau đó mô tả phạm vi khác (Mentor FILE/VIDEO, Manager thêm publish/unpublish). Chỉ thị người dùng trong chat này được ưu tiên khi triển khai.

## Decision

- P3 được triển khai UI và API trực tiếp, không dừng ở cổng approve UI. Giữ kiểm chứng schema/service/UI, cleanup, lint/typecheck, build, Maestro và nghiệm thu riêng.
- Mentor tạo/sửa FILE, VIDEO và ARTICLE. ARTICLE dùng `contentText` theo contract backend, server escape và sanitize; metadata chỉnh độc lập giữ nội dung cũ khi không gửi content. Không tự thêm editor HTML có thực thi script.
- Manager chỉ duyệt/từ chối; approve đồng thời công bố. Không thêm authoring, delete, publish/unpublish riêng vào mobile trong lượt này.
- Giữ privacy trong design: form/upload/signed URL trong RAM, không queue/replay tự động, không upload nền; file tạm trong cache riêng được dọn khi rời màn. Giữ quyền/revision và không gửi credential backend sang storage. Từ chối URL storage cùng hostname API vì cookie native dùng chung giữa các cổng; cần kiểm chứng credential trên thiết bị thật.
- Giữ nguyên design nguồn Claude để truy vết. Các khác biệt nêu trên được ghi tại kế hoạch/hồ sơ P3 và mapping test; không gán các TC cho chức năng bị loại là đã pass.

## Quan hệ thay thế

Thay cổng chờ duyệt UI trong ADR-009/016 **chỉ cho lượt triển khai P3 này** theo chỉ thị trực tiếp. Không sửa hồi tố ADR Accepted. Không mở cổng của phase khác hoặc tự chuyển phase Done.

## Alternatives

Chờ duyệt UI lại hoặc triển khai mọi action trong design dù khác phạm vi chat: không chọn vì trái chỉ thị hiện hành.

## Consequences và kiểm chứng

Hồ sơ ghi “bỏ bước chờ duyệt UI theo chỉ thị”, không ghi “UI được duyệt”. API/native tests phải có kết quả thật; chạy còn thiếu hoặc lỗi thì không tính nghiệm thu. Phạm vi thay đổi: P3-S1–S6, entry point P0/P1 và BR-MAT/BR-FILE theo mapping hiện hành; không thay state machine backend.
