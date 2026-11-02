# P3 — Triển khai UI và API trực tiếp

Ngày: **02/11/2026 (Asia/Bangkok)**. Theo chỉ thị “Triển khai phase 3, bỏ qua UI accept, tích hợp API vào luôn”, tiếp tục triển khai UI/API theo [ADR-029](../../adr/ADR-029-phase-3-direct-api-implementation.md). Không ghi nhận người dùng đã duyệt UI hoặc nghiệm thu phase.

## Phạm vi đã viết

- S1: chọn lớp/chương, capabilities `authorMaterials`, courseUnitId, lọc trạng thái và phân trang tài liệu đúng query; lookup tên của Manager không gọi từng hàng.
- S2: FILE/VIDEO/ARTICLE theo phạm vi người dùng chốt. File picker native, MIME/size/name validation, stream PUT, complete/status polling foreground, chỉ lưu READY, cancel và dọn file tạm. ARTICLE dùng plain text, server escape/sanitize; PATCH metadata giữ nội dung cũ khi không thay. Form/draft chỉ RAM.
- S3: chi tiết Mentor, canEdit/firstApprovedAt, sửa nháp/REJECTED, submit đúng revision và confirmation. REJECTED không gửi lại trực tiếp.
- S4/S5: queue Manager mặc định PENDING_REVIEW, total từ server, detail và approve/reject; reason trim/bắt buộc/giới hạn; nêu tác động CourseUnit dùng chung. Không thêm Manager authoring/publish/unpublish ngoài phạm vi chat.
- S6: đọc detail và pin revision trước preview; PDF/ảnh qua file cache riêng có dọn, video có điều khiển/renew URL giới hạn, file khác mở ứng dụng ngoài sau khi xin quyền. ARTICLE WebView tắt JS/cookie/file access/cache, CSP và asset references đúng revision.
- Entry point: Home theo role, lớp và session context Mentor; Native Stack không animation/gesture. Dữ liệu có schema Zod, scope/query/account isolation; cookie/Origin backend tách storage. URL storage cùng hostname API hoặc HTTPS downgrade bị từ chối. Không dùng mock fallback.

[6 contract](../../api-contract/phase-003-material-review/README.md) dựa trên [14 source snapshot nguyên byte/SHA-256](../../api-contract/legacy/2026-11-02-materials/README.md). Design Claude giữ nguyên để truy vết; những khác biệt FILE/VIDEO/ARTICLE và quyền Manager theo chỉ thị chat được ghi tại ADR-029.

## Kiểm chứng đã thực hiện

| Lớp bằng chứng       | Command / kết quả                                                                                    | Phạm vi thực sự chứng minh                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API/schema/model/UI  | Jest các file `materials-*.test.*`                                                                   | Enum/schema, Origin khác mất quyền, role guard, revision, uncertain/replay, limit file/UTF-8, queue filter/race/permission loss, review confirmation/reason                     |
| API thật             | `node scripts/verify-material-api.cjs` — pass tại các lượt thành công                                | Tạo course/class/mentor riêng; ARTICLE create/submit/reject/edit/resubmit/approve, stale revision, approve replay; upload PDF → worker READY → draft → signed GET có dữ liệu    |
| HTTP simulation      | `node scripts/verify-material-simulation.cjs` với Postman simulation — pass                          | Adapter mobile thật qua HTTP: chọn status, approve đã commit nhưng trả 503, gửi lại cùng revision chỉ một commit, stale revision, HTML 503, denied; có request events trong log |
| Android build        | `gradlew.bat assembleDebug -PreactNativeArchitectures=x86_64 --console=plain` — pass                 | Native picker/blob/PDF/video compile trên emulator ABI. Không suy thành iOS hoặc layout/E2E pass                                                                                |
| Build đa ABI lần đầu | Failed ở configureCMakeDebug[x86], thư mục Temp bị Windows khóa                                      | Đã chạy lại x86_64 thành công, không sửa dependency để vượt kiểm tra                                                                                                            |
| Maestro              | Các lượt thử chưa pass; **đã dừng theo yêu cầu người dùng “Không cần test e2e, tôi sẽ yêu cầu sau”** | Không tăng bằng chứng E2E hoặc nghiệm thu. Có lần dùng chung emulator bị đổi màn từ lượt khác; lượt emulator riêng timeout driver/file lock Maestro 2.11 trên Windows           |

Log ở `build-logs/phase-3-*`, `build-logs/phases-3-4-5-*`; dataset và tài khoản trong `.maestro/*.local.json`, không vào Git. Runner E2E công khai được chuẩn bị là `npm run test:e2e:phase-3`; chưa chạy lại sau yêu cầu dừng. Runner còn cần bổ sung/kiểm chứng native binary picker/PDF/image/video và quan sát cookie storage trước khi được dùng làm bằng chứng toàn phase.

Không coi HTTP upload từ Node là chứng minh native cookie isolation. Các nhánh renderer, URL hết hạn, foreground/background, layout/dark/en/keyboard và iOS còn cần kiểm chứng thiết bị khi người dùng yêu cầu E2E. Unit/UI tests không thay các bằng chứng đó.

## Kiểm tra P3/P4/P5 và lỗi CASH

Người dùng yêu cầu “Test luôn 3 phase 3, 4, 5”; kết quả tổng hợp tại [báo cáo kiểm chứng](../phases-003-005-verification.md). Lỗi CASH hiện khóa dịch được sửa bằng bỏ xung đột `operations/messages.ts` và `messages.json`: dữ liệu chuyển sang `translations.json`. Metro mặc định xét JSON trước TS, còn Jest xét TS trước JSON, nên test ID trước đây không bắt lỗi. Đã kiểm đường resolve Metro về file đăng ký TypeScript và thêm UI assertions tiếng Việt/Anh.

Tình trạng cuối: đã có mã 6 UI và API boundary/integration, còn kiểm chứng và nghiệm thu riêng. Không gán toàn bộ TC design là pass, không đánh dấu phase Done.
