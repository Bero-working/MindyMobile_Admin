# Phase 3 — Kế hoạch triển khai Material Review

**Hiện hành 02/11/2026:** đã triển khai UI/API trực tiếp theo [ADR-029](../../adr/ADR-029-phase-3-direct-api-implementation.md); không chờ duyệt UI riêng theo chỉ thị mới. Đã có design Claude; phạm vi chat ưu tiên: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối. Xem [hồ sơ triển khai và kiểm chứng](api-integration.md). E2E dừng theo yêu cầu người dùng, chưa nghiệm thu. Các trạng thái chờ trong bản kế hoạch ban đầu bên dưới được giữ để truy vết.

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**02/11/2026 — người dùng yêu cầu “Triển khai phase 3” sau khi nhận kế hoạch tổng; đã tách 6 kế hoạch slice và ghi nhận chỉ thị implement. Q-MAT-01 đã chốt: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối; approve đồng thời công bố. Chưa có design Claude/test case nên UI TDD chưa bắt đầu theo ADR-009.**

Bản kế hoạch ban đầu bên dưới giữ để truy vết; những dòng chờ duyệt tổng/tách slice/chỉ thị implement và Q-MAT-01 đã được cập nhật bằng ghi nhận hiện hành này. Policy dữ liệu/offline vẫn chờ, không suy chỉ thị implement thành duyệt policy hoặc UI/API.

**Kế hoạch ban đầu:** Lập theo yêu cầu “Lập implement phase 3”; tại thời điểm lập chưa tách kế hoạch slice, chưa triển khai code, design hoặc contract. UI **0/6**, API **0/6**, slice hoàn chỉnh **0/6**. Theo [ADR-017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md), sau duyệt tổng mới tách tài liệu slice; chỉ thị implement và duyệt UI toàn phase vẫn là các cổng riêng theo [ADR-016](../../adr/ADR-016-plan-before-implementation.md).

## 1. Mục tiêu và phạm vi

Mentor xem tài liệu theo chương, tạo/sửa bản nháp của mình, upload và gửi duyệt. Manager xem hàng chờ, preview đúng revision, approve/công bố hoặc reject có lý do. Hai vai trò truy cập file riêng tư qua kiểm quyền. Giữ **6 slice**, ưu tiên sản phẩm P0, phụ thuộc P0/P1 theo [baseline P3](../../implementation-plan.md#p3-material-review).

| Slice                          | Kết quả cần đạt                                                                 | BR / UC                                     | Phụ thuộc                      |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------ |
| P3-S1 — mentor-materials       | Danh sách theo lớp/chương, trạng thái và scope CLASS/SESSION                    | BR-MAT-01/02/06; UC-M-08                    | P1-S3                          |
| P3-S2 — material-editor        | Tạo/sửa draft của mình; upload → complete → kiểm trạng thái file                | BR-MAT-02/03/05, BR-FILE-01/03; UC-M-08     | S1; loại nội dung chờ Q-MAT-01 |
| P3-S3 — mentor-material-detail | Đọc nội dung/kết quả duyệt, gửi đúng revision; REJECTED phải EDIT trước gửi lại | BR-MAT-03/04/05; UC-M-08                    | S1; S2 khi tạo/sửa             |
| P3-S4 — material-review-queue  | Queue Manager theo trạng thái, filter và phân trang đúng nguồn                  | BR-MAT-03; UC-MG-04                         | P0-S1                          |
| P3-S5 — material-review-detail | Xem nội dung/tác động dùng chung, approve hoặc reject đúng revision             | BR-MAT-01/03/04/05; UC-MG-04                | S4                             |
| P3-S6 — material-preview       | Preview nội dung/file theo vai trò, scope và revision; xử lý URL hết hạn        | BR-FILE-01/02, BR-MAT-06; UC-M-08, UC-MG-04 | S3/S5                          |

Confirmation, upload progress, processing, conflict, loading/empty/error/offline/success/no-permission là trạng thái của các slice, không tăng số UI. S6 dùng chung giữa hai vai trò. Có thể làm component preview trước để phục vụ S3/S5 mà không đổi phụ thuộc nghiệp vụ.

Phạm vi đề xuất ban đầu cho Manager là queue → detail → approve/reject; approve đã đồng thời công bố. Tạo/sửa/xóa, publish/unpublish riêng và tự duyệt tài liệu Manager tạo chưa được đưa vào UI, chờ Q-MAT-01. Không tự thêm ZIP, external video URL, release/unlock ClassUnit, UI Student/Admin, quiz hoặc nghiệp vụ phase sau.

## 2. Hiện trạng và căn cứ

- P0 đã được người dùng duyệt; giới hạn nền tảng theo [progress P0](../../progress/phase/phase-000-foundation-auth.md). P1 đã nghiệm thu, UI/API 7/7 theo [progress P1](../../progress/phase/phase-001-teaching-workspace.md). P2 đã nối API và còn chờ E2E theo [bảng tiến độ](../../progress/README.md); P2 không phải phụ thuộc bắt buộc của P3.
- Đã có auth/cookie, HTTP, query, theme/i18n và primitives; P1 có class detail và tab tài liệu trong session context. Phải đối chiếu các entry point thật khi implement, không biến placeholder hiện tại thành bằng chứng P3 hoàn tất.
- Chưa có `src/modules/materials/`, design Claude P3, contract từng slice hoặc runner E2E P3 trong checkout tại lượt lập kế hoạch. Chưa có thư viện chọn file trong dependencies hiện tại; giải pháp picker/upload/preview native phải được đánh giá sau khi chốt loại nội dung, qua ADR nếu thay kiến trúc.
- Đã đọc source backend cạnh repo ngày 02/11/2026: [Mentor controller](../../../../Mindy-BE/src/modules/materials/controllers/mentor-materials.controller.ts), [Manager controller](../../../../Mindy-BE/src/modules/materials/controllers/manager-materials.controller.ts), [input DTO](../../../../Mindy-BE/src/modules/materials/dtos/manager-material-input.dto.ts), [state contract](../../../../Mindy-BE/src/modules/materials/domain/material-contract.ts), [file access DTO](../../../../Mindy-BE/src/modules/materials/dtos/material-file-access.dto.ts), [file controller](../../../../Mindy-BE/src/modules/files/controllers/files.controller.ts), [upload DTO](../../../../Mindy-BE/src/modules/files/dtos/create-upload-intent.dto.ts), [upload policy](../../../../Mindy-BE/src/modules/files/domain/file-upload-policy.ts). Đây là khảo sát source, chưa xác minh backend deploy/runtime hoặc thực hiện mutation.
- Quy tắc và use case lấy từ [business rules](../../business-rules.md#tài-liệu-và-file), [mapping API P3](../../api-contract/README.md#p3-s1). Không lấy source backend làm quyết định phạm vi mobile.

Áp dụng ADR-003/004/005/006/007/008/009, ADR-012/016/017/018/019/020/025/026; hiệu lực và tên file tra tại [sổ ADR](../../adr/README.md). Giữ nguyên ADR Accepted. Không sử dụng kết quả test P0/P1/P2 làm bằng chứng P3.

## 3. Cổng đầu vào và quyết định còn chờ

| Cổng                | Nội dung cần có                                                                                                            | Phần phụ thuộc                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Duyệt kế hoạch tổng | Người dùng đọc và duyệt tài liệu này                                                                                       | Trước tách tài liệu slice theo ADR-017                                      |
| Q-MAT-01            | Mentor cần FILE, VIDEO, ARTICLE nào; Manager chỉ approve/reject hay cần thêm authoring/publish/unpublish                   | Trước design/editor và chốt phạm vi; không tự chọn đủ mọi chức năng BE      |
| Design toàn phase   | Claude cung cấp design chung và đủ 6 slice, trạng thái/quyền, vi/en, light/dark, accessibility và test case                | Trước UI TDD; Codex không tự viết/sửa design                                |
| Chỉ thị implement   | Người dùng yêu cầu triển khai sau bước đọc kế hoạch                                                                        | Trước code theo ADR-016                                                     |
| Q-DATA-01 / offline | Chốt draft form, metadata, file tạm, cache, mất mạng/app-kill/logout và dọn dữ liệu                                        | Trước phần phụ thuộc; không tự áp chính sách RAM riêng P2 cho P3            |
| Duyệt UI toàn phase | Người dùng approve UI mock đủ 6 slice                                                                                      | Trước contract/schema/service/hook và API thật                              |
| Q-ENV-01 / storage  | Kế thừa auth/native đã kiểm P0 nhưng kiểm riêng Origin material, provider upload, signed URL, worker kiểm file và thiết bị | Trước tích hợp/E2E upload/preview; không mặc định auth pass là storage pass |
| Q-PLAT-01           | Xác nhận mốc Android/iOS và thiết bị/OS tối thiểu                                                                          | Trước nghiệm thu; ghi rõ phần chưa có bằng chứng                            |
| Contract / dataset  | Snapshot legacy nguyên bản, DTO/error/scope/phân trang, tài khoản và dữ liệu thử phù hợp                                   | Trước API/E2E; không tự sửa backend hay tạo lịch sử giả                     |

Đề xuất dữ liệu P3: form, metadata và signed URL giữ trong RAM; không persist query chứa dữ liệu nhạy cảm, không queue/replay upload hoặc quyết định duyệt; file tạm chỉ phục vụ thao tác hiện tại và được dọn theo policy được chốt. Đây là đề xuất chờ xác nhận/design, chưa là quyết định đã duyệt. Gửi/duyệt và xin URL cần online theo baseline; không mở rộng offline mutation. Xử lý mất kết nối khi upload đang chạy, rời màn và app-kill phải có design rõ trước code.

## 4. Hồ sơ và cấu trúc dự kiến

Sau duyệt tổng sẽ tách `slice-001-mentor-materials.md`, `slice-002-material-editor.md`, `slice-003-mentor-material-detail.md`, `slice-004-material-review-queue.md`, `slice-005-material-review-detail.md`, `slice-006-material-preview.md` trong folder này. Đã tạo 6 file theo chỉ thị “Triển khai phase 3”; xem [mục lục](README.md#kế-hoạch-theo-slice). Chưa mapping TC vì thiếu design nguồn.

Design dự kiến, **chưa tồn tại**: `docs/design/material-review/design.md` và `docs/design/material-review/<slice-slug>/design.md`. Khi Claude cung cấp, đối chiếu đủ test case và cập nhật link file thật; không tự gán mã TC hoặc dùng HTML tham khảo thay design.

| Vị trí dự kiến                                      | Trách nhiệm                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/modules/materials/screens/`                    | 6 UI và kết nối navigation theo role                                                  |
| `src/modules/materials/components/`                 | Hàng tài liệu, status, form, upload feedback, review confirmation, preview dùng chung |
| `src/modules/materials/types/`, `messages.ts`       | Model UI rõ kiểu, vi/en; mock model tách wire DTO                                     |
| `src/modules/materials/services/`                   | Mock boundary cho UI; schema/HTTP thật chỉ sau duyệt UI                               |
| `src/modules/materials/hooks/`                      | Query theo account/scope/filter/revision, mutation và invalidation có giới hạn        |
| `docs/api-contract/phase-003-material-review/`      | Contract theo slice sau duyệt UI; tham chiếu snapshot legacy nguyên bản               |
| `__tests__/`, `.maestro/phase-003-material-review/` | UI/API tests, flow native và hồi quy liên quan                                        |
| `scripts/e2e-phase-3.cjs`                           | Runner công khai duy nhất: preflight → dataset → API → Maestro → báo cáo              |

Tái sử dụng primitives/token/feedback và auth hiện hữu; không refactor rộng P0–P2. Chỉ sửa entry point liên quan được design chốt.

## 5. Kế hoạch UI mock toàn phase

| Task   | Công việc                                                                                        | Điều kiện hoàn thành                                                      |
| ------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| PRE-01 | Chốt Q-MAT-01, dữ liệu/offline, nhận đủ design/TC và duyệt tổng                                  | Không còn câu hỏi chặn phần thực hiện; tách 6 kế hoạch slice sau duyệt    |
| UI-00  | Mapping TC thật → UI test; thống nhất mock scenarios, entry point, component và model            | Design đủ; có chỉ thị implement; test fail đúng hành vi                   |
| UI-01  | S1: list theo chương/scope, trạng thái, filter/phân trang                                        | Test pass đúng nguồn mock; không release route, không tổng giả            |
| UI-02  | S2: form nội dung được chốt, chọn file, upload/processing/READY/FAILED, save và dirty Back       | Mock rõ; chặn action không hợp lệ; không upload thật                      |
| UI-03  | Component S6 và S3: detail, preview, submit, rejection reason, revision và quyền edit            | REJECTED phải edit về DRAFT; firstApprovedAt/canEdit đúng                 |
| UI-04  | S4/S5: queue → detail → approve/reject, confirmation và stale revision                           | Reason bắt buộc; thể hiện tác động material dùng chung và approve/công bố |
| UI-05  | Hoàn thiện S6 cho hai role, URL expiry/quyền/renderer; kiểm đủ trạng thái và hồi quy entry point | vi/en, light/dark, keyboard, vùng chạm, loading/offline theo design       |
| UI-06  | Cleanup và bàn giao UI toàn phase, mapping TC → test/native evidence                             | Lint/typecheck/Jest và kiểm native phù hợp; chờ người dùng approve 6/6    |

Tất cả UI dùng mock boundary rõ ràng. UI-06 không cho phép API sớm; không tạo contract/service thật chỉ vì một slice đã hoàn tất UI.

## 6. Tải dữ liệu, cache và quyền

Các lựa chọn ban đầu dưới đây là đề xuất để Claude/người dùng chốt trong design, theo [ADR-025](../../adr/ADR-025-shared-ui-data-loading-and-verification-rules.md).

| UI  | Lựa chọn ban đầu và lúc tải                                                                                                                              | Phân trang/cache/invalidation                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Nhận classId/classUnitId từ chương đã chọn; chưa chọn chương thì chờ chọn, không tải mọi chương. Mặc định danh sách server cho phép, chưa lọc trạng thái | Key có account/role/class/unit/filter/page; tải thêm khi list đang mở; không suy totals từ một trang                                  |
| S2  | Create dùng context đã chọn; edit đọc detail hiện hành trước cho sửa. Chỉ xin upload intent sau khi chọn file hợp lệ và thực hiện thao tác theo design   | Không giữ response lớp/file cũ dưới context mới; polling file chỉ trong tác vụ đang hoạt động, dừng khi terminal/rời tác vụ/mất quyền |
| S3  | Tải detail khi mở; không xin signed URL cho mọi file trước                                                                                               | Sau save/submit cập nhật detail và invalidate list liên quan; không ghi đè form dirty bằng refetch                                    |
| S4  | Mặc định PENDING_REVIEW, page đầu; đổi status/filter mới tải tương ứng                                                                                   | Filter chỉ theo DTO thực, không tự thêm filter class/search; tổng của query từ server, badge status chưa tải không gán 0              |
| S5  | Tải detail khi mở và kiểm lại revision/quyền trước quyết định                                                                                            | Sau review cập nhật detail, queue đúng filter và list material liên quan; không refetch toàn app                                      |
| S6  | Xin quyền/URL khi mở file hoặc asset đang cần render, gắn materialId/fileId/revision                                                                     | URL chỉ trong RAM, có expiresAt; hết hạn xin lại qua backend và kiểm quyền; không dùng URL cũ khi revision đổi                        |

Giữ rows khi refresh/load-more lỗi chỉ với đúng query; đổi filter/resource/account không hiển thị dữ liệu cũ dưới lựa chọn mới. Query cũ không được ghi đè query mới. Hết phiên/đổi role/mất assignment phải xử lý theo ADR-005/019, xóa dữ liệu thuộc tài khoản trước. Khả năng xem cache metadata offline chờ policy ở mục 3; action cần online bị chặn. Offline có warning và không Retry trong phần offline; reconnect/focus phục hồi đọc theo policy, không tự gửi mutation.

Skeleton theo kích thước nội dung; lỗi theo phần, giữ phần độc lập nếu còn quyền. Điều hướng/Back/tab trực tiếp, không animation hoặc swipe chuyển màn; spacing và vùng chạm theo token/design. Không gọi API từng hàng để dựng thông tin phụ hoặc suy APPROVED là luôn khả dụng: publication, revision, availableAt, file READY và scope vẫn cần được kiểm.

## 7. Hợp đồng API cần xác minh sau duyệt UI

Route dưới đây là khảo sát source, **chưa phải contract mobile hoặc bằng chứng runtime**. Dùng base path HTTP cấu hình hiện hữu, không hardcode host. Snapshot legacy phải giữ nguyên byte, có nguồn/ngày/hash theo [quy trình contract](../../api-contract/README.md).

| Slice | Route khảo sát                                                                                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | GET `/mentor/classes/:classId/units/:unitId/materials`                                                                                                                                                                          |
| S2    | POST `/mentor/classes/:classId/units/:unitId/materials`; PATCH `/mentor/classes/:classId/materials/:materialId`; POST `/files/upload-intents`; upload storage theo intent; POST `/files/:fileId/complete`; GET `/files/:fileId` |
| S3    | GET `/mentor/classes/:classId/materials/:materialId`; POST `/mentor/classes/:classId/materials/:materialId/submit`                                                                                                              |
| S4    | GET `/manager/materials`                                                                                                                                                                                                        |
| S5    | GET `/manager/materials/:materialId`; POST `/manager/materials/:materialId/approve`; POST `/manager/materials/:materialId/reject`                                                                                               |
| S6    | GET `/mentor/classes/:classId/materials/:materialId/preview` hoặc `/assets/:fileId/access`; Manager tương ứng dưới `/manager/materials/:materialId`; query `expectedRevision`                                                   |

Source còn có POST `.../files/:fileId/access` không nhận revision trong body; không coi các route access là tương đương. Ưu tiên xác minh route GET có `expectedRevision` để preview đúng bản đang duyệt. Nếu deploy không khớp, ghi gap và giải quyết trước tích hợp, không âm thầm bỏ revision. Publish/unpublish/DELETE và Manager authoring có trong BE nhưng chờ phạm vi Q-MAT-01.

Các điểm bắt buộc khi lập contract:

- Phân biệt classUnitId ở route Mentor với courseUnitId chủ sở hữu material và sessionId tùy chọn. Không giả material là bản sao riêng từng lớp; giữ scope CLASS/SESSION và quyền Mentor chính/mentor thay đúng server.
- Source hỗ trợ FILE/VIDEO/ARTICLE; `contentType` không đổi qua PATCH hiện tại. Chỉ đưa loại nội dung đã chốt vào editor. ARTICLE cần quy tắc sanitize/canonical HTML, references và renderer an toàn; không render HTML tùy ý bằng quyền cookie của backend.
- DTO khảo sát: title tối đa 250, description 5000; reject reason không trắng, tối đa 2000; `expectedRevision` số nguyên từ 1. ARTICLE có giới hạn canonical HTML 48 KiB UTF-8, không chỉ đếm ký tự. Đối chiếu đầy đủ validation/domain tại bước contract.
- EDIT tăng revision, về DRAFT, mất hiệu lực duyệt/công bố cũ; REJECTED cần EDIT rồi SUBMIT. Mentor chỉ sửa bản của mình trước firstApprovedAt; capability server phải được tôn trọng. Approve đồng thời đặt publication, không buộc Manager bấm publish lần hai.
- File: validate extension/MIME/size theo allowlist, thông thường 25 MiB, MP4 200 MiB; không chỉ dựa extension hoặc upload HTTP thành công. Chuỗi `PENDING_UPLOAD → PROCESSING → READY/FAILED`; complete có thể 202 hoặc 200. Chỉ save/submit references phù hợp policy server và READY theo contract.
- Upload intent có courseUnitId, classId/classUnitId theo vai trò; đối chiếu đủ headers/method/expiry từ response. Storage dùng client riêng, không cookie/Authorization/Origin mặc định của HTTP backend. Không log/persist signed URL hoặc upload credentials. Tránh đọc cả video lớn thành base64 trong RAM.
- Material có Origin guard; xác minh method nào bị kiểm và cấu hình native thật. Files controller khác guard, không sao chép header/key của attendance sang mọi mutation.
- Query hiện có reviewStatus/contentType, Manager thêm courseUnitId; page/size/totals và thứ tự phải đối chiếu DTO thực. Không giả backend hỗ trợ filter khác.
- 409 revision conflict phải refetch và cho đọc lại, không tự replay quyết định trên bản mới. Double tap khóa theo intent; mất response sau create/upload/review phải đối soát kết quả trước retry. Không tự gán UUID idempotency attendance cho material.

## 8. Thứ tự tích hợp và kiểm chứng

| Task      | Công việc                                                                             | Điều kiện / phụ thuộc                                                      |
| --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| API-00    | Nhập legacy, lập contract đủ 6 slice, đối chiếu route/DTO/error/Origin/storage và gap | Người dùng đã approve UI toàn phase; policy/type nội dung đã chốt          |
| API-01    | Schema/service/query tests fail → pass; account isolation, permission và errors       | API-00; không fallback mock khi API lỗi                                    |
| API-02    | Tích hợp list/detail S1/S3/S4/S5 phần đọc, phân trang và lazy loading                 | API-01; xử lý scope và response cũ                                         |
| API-03    | Picker/upload S2: intent → storage → complete → status → READY, save/PATCH            | API-01; provider/worker hoạt động; memory, cancel/retry/expiry theo policy |
| API-04    | S6: preview có revision, asset references, expiry và renderer theo loại được chốt     | API-02/03; tách credential BE/storage, kiểm quyền lại                      |
| API-05    | Submit/approve/reject, conflict và invalidation đúng list/detail; kết quả hai role    | API-02–04; file READY, reason/revision, publication và shared material     |
| VERIFY-01 | Cleanup, lint 0 error/0 warning, typecheck, Jest và native build/UI review            | API-05; source cuối, ghi kết quả thật và giới hạn                          |
| E2E-01    | Runner P3, dataset mới, API checks → Maestro cả phase và hồi quy liên quan            | VERIFY-01; mọi bước bắt buộc pass                                          |
| ACCEPT-01 | Bàn giao bằng chứng, demo hai role và trình người dùng nghiệm thu                     | E2E-01; chỉ Done sau người dùng nghiệm thu                                 |

## 9. Ma trận kiểm chứng tối thiểu

| Nhóm                | Case bắt buộc                                                                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope/quyền         | Mentor chính, mentor thay, tác giả khác; sai class/unit/session; deep link trái quyền; đổi assignment/hết phiên khi đang mở; CourseUnit dùng chung nhiều lớp                                                                                        |
| Trạng thái/revision | DRAFT → PENDING_REVIEW → APPROVED hoặc REJECTED; edit trước gửi lại; firstApprovedAt khóa quyền Mentor; stale edit/submit/review; approve đã công bố; availableAt và scope vẫn kiểm                                                                 |
| Upload              | Picker cancel; MIME/extension/size không hợp lệ; file rỗng, 25 MiB/MP4 200 MiB và vượt giới hạn; intent hết hạn; storage fail; complete 202/200; PROCESSING kéo dài/FAILED; mất mạng/rời màn/app-kill theo policy; worker chưa chạy không giả READY |
| Preview             | Primary/inline/attachment đúng reference và revision; file không READY; signed URL hết hạn; backend 403/404/409/503; mất quyền sau mở; refresh URL kiểm lại quyền; cookie BE không sang storage                                                     |
| Nội dung            | Các loại Q-MAT-01 đã chọn; FILE/VIDEO không dùng URL ngoài giả file; ARTICLE nếu có kiểm UTF-8, sanitize và references, script/navigation không được phép                                                                                           |
| Mutation            | Double tap, mất response sau commit, không tự replay, conflict giữ dữ liệu chưa chấp nhận theo design; reject trắng/quá dài; invalidation queue/detail/list đúng scope                                                                              |
| Dữ liệu/UI          | Chưa tải khác empty/0; phân trang nhiều trang; lỗi refresh/load more; đổi filter/query/account không lẫn dữ liệu; offline warning; vi/en, light/dark, keyboard, accessibility, skeleton, spacing, Back trực tiếp                                    |
| Hồi quy             | P0 login/logout/session expiry; P1 class/chương/session context và Back; luồng attendance P2 ở entry point dùng chung nếu bị sửa                                                                                                                    |

Mapping TC cụ thể chỉ bổ sung từ design thật. Unit/UI mock, contract/API thật, build và Maestro là các lớp bằng chứng riêng. Case bắt buộc failed/skipped/blocked chưa được tính pass hoặc trình nghiệm thu.

## 10. Command, E2E và bàn giao

Lượt lập kế hoạch chỉ kiểm tra tài liệu: format, liên kết tương đối và diff; không chạy test ứng dụng hoặc ghi tăng tiến độ.

Khi triển khai, dùng `npm run lint` (đã gồm format và typecheck) và `npm test -- --runInBand`, native build phù hợp theo mốc nền tảng; ghi command, ngày, môi trường, source/dataset, kết quả và giới hạn thật. Không chạy trùng typecheck khi đã có bằng chứng từ lint trừ khi cần chẩn đoán.

Command E2E công khai duy nhất dự kiến là **`npm run test:e2e:phase-3`**, hiện chưa có trong package.json. Theo [ADR-026](../../adr/ADR-026-single-e2e-command-per-phase.md), runner phải kiểm cấu hình/backend/storage/worker/tài khoản, tạo và xác minh dataset mới, kiểm API rồi chạy Maestro P3 cùng hồi quy liên quan theo [quy ước E2E](../e2e-maestro.md). Không thêm command công khai `:ui`/`:api` hoặc yêu cầu ghép bước thủ công.

Dataset cần Mentor chính/mentor thay, Manager, lớp/chương/buổi hợp lệ, material từng trạng thái/revision, chưa/đã firstApprovedAt, shared CourseUnit, file READY/FAILED và tình huống nhiều trang. Upload/review dùng dữ liệu thử được phép; không sửa backend hoặc nội dung thật để tạo case. Thiếu provider/worker/dataset bắt buộc phải dừng bước phụ thuộc và báo blocked; không dùng dataset cũ khi setup mới lỗi. Lỗi preflight/API/flow/interruption trả exit code khác 0. Credentials chỉ ở cấu hình local, không vào Git/log/report.

Trước nghiệm thu cần đủ contract 6 slice, mapping design → UI/API/native test, ảnh native đã xem, hồ sơ API/E2E trên source cuối, cleanup đạt chuẩn và các câu hỏi ảnh hưởng đã giải quyết. Theo dõi tại [progress P3](../../progress/phase/phase-003-material-review.md), giữ mẫu số 6 và trạng thái kế hoạch/UI/API/nghiệm thu độc lập.
