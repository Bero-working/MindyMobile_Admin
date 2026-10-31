# P1-S6 — Manager xem lớp hiện hữu

**API 31/10/2026:** Đã nối slice này theo yêu cầu “Triển khai API cho phase 1”; [contract 7 slice](../../api-contract/phase-001-teaching-workspace/README.md) và [kết quả tích hợp](api-integration.md) là trạng thái hiện hành. Các checklist/kết luận chưa triển khai bên dưới giữ làm kế hoạch lịch sử, không phải kết quả kiểm chứng. Chưa nghiệm thu phase.

**Cập nhật triển khai 31/10/2026:** Người dùng yêu cầu “Triển khai phase 1”. Đã có design Claude toàn phase và câu trả lời Q-CLASS-01/02 tại design cấp phase; triển khai UI mock 7 màn; Android build và Maestro UI smoke pass. API 0/7, UI chưa approve. Xem [hồ sơ review](ui-review.md), [kiểm chứng](ui-verification.md) và [smoke native](e2e-ui.md). Các ghi nhận chưa có design/chưa có chỉ thị code bên dưới là snapshot lịch sử của kế hoạch.
Ngày tách kế hoạch: 31/10/2026 (Asia/Bangkok). Người lập: Codex.

**Trạng thái: tài liệu slice đã tách theo yêu cầu “Duyệt và tách slice đi”. Chưa triển khai UI/API.** Kế hoạch tổng đã được duyệt; việc tách tài liệu không thay thế chỉ thị implement, design Claude hoặc approve UI toàn phase.

## 1. Phạm vi, căn cứ và phụ thuộc

- BR/UC: BR-SCOPE-02, BR-SCOPE-03, BR-CLASS-02; UC-MG-02.
- Phụ thuộc: P0-S1; UI-00/01. Chọn lớp đi tới P1-S7.
- Task tổng: UI-05; API-04; UI-06/07 và API-05 áp dụng chung.
- Điểm chờ trực tiếp: Q-DESIGN-01; Q-CLASS-01 nếu hiển thị delivery mode; cần xác định nguồn Manager/management ở bước contract.
- [Kế hoạch tổng](phase-001-teaching-workspace.md) quản lý cổng và công việc chung; [progress P1](../../progress/phase/phase-001-teaching-workspace.md) quản lý tiến độ/bằng chứng.

## 2. Design và ranh giới thực hiện

Design cần Claude cung cấp: `docs/design/teaching-workspace/manager-classes/design.md`, cùng design cấp phase `docs/design/teaching-workspace/design.md`. **Chưa có design/test case Claude để mapping** tại lúc tách slice. Codex không tự đặt ID TC-P1 hoặc thay yêu cầu kiểm tra dưới đây thành test case design đã duyệt.

Workspace Manager → danh sách lớp hiện hữu → chi tiết S7. Không có chọn chi nhánh, tạo lớp hoặc route Admin.

Chỉ code UI khi có chỉ thị implement và đủ design cả 7 slice/câu trả lời trực tiếp. Mock ở service boundary, có nhận diện development; không gọi HTTP, viết schema wire hoặc query hook thật trong bước UI. Tất cả UI phải được duyệt trước bước API, kể cả khi slice này đã pass test.

## 3. Task UI — TDD sau khi đủ cổng

- [ ] Đọc design, giữ nguyên ID/điều kiện/thao tác/kỳ vọng của test case Claude và mapping từng case tới Jest/RNTL hoặc native.
- [ ] Render danh sách và lifecycle DRAFT/OPEN/IN_PROGRESS/COMPLETED/CANCELLED theo BR-CLASS-02 và design.
- [ ] Filter/search/pagination theo design; phân biệt empty do bộ lọc với lỗi tải và không quyền.
- [ ] Đi tới đúng classId, kiểm quyền ở màn đích; không dùng UI Manager để mở tính năng Admin.
- [ ] Tái sử dụng primitives/theme/vi-en P0; không tự tạo dashboard/tổng số ngoài dữ liệu được cấp.
- [ ] Test hành vi fail → implement mock → pass; đủ loading/empty/error/offline/success/no-permission theo design. Conflict chỉ áp dụng nếu có căn cứ, nếu không ghi lý do.
- [ ] Kiểm tra vi/en, light/dark/system, accessibility label, vùng chạm, font scale, cuộn/safe area và motion theo design; không tự đặt layout/token mới.
- [ ] Kiểm native Android, ảnh và giới hạn thực; cập nhật mapping/UI review toàn phase. Không đánh dấu pass từ tài liệu.

## 4. Yêu cầu kiểm chứng cần đối chiếu design

Bảng sau là yêu cầu từ BR/kế hoạch tổng, **chưa phải test case Claude hoặc kết quả đã chạy**. Sau khi có design, bổ sung mapping ID thật và đường dẫn test/flow vào hồ sơ verification; khác biệt phải xử lý trước phần phụ thuộc.

| Điều kiện / thao tác | Kết quả cần chứng minh |
| --- | --- |
| Manager có lớp ở nhiều lifecycle | Nhãn trạng thái chính xác, lớp hủy/kết thúc rõ ràng. |
| Bộ lọc rỗng hoặc nhiều trang | Hiển thị empty/tải thêm phù hợp, không trùng hoặc dùng kết quả bộ lọc cũ. |
| Mentor/Admin/Student mở route Manager | Root/resource gate chặn theo quyền đã duyệt. |
| Chọn lớp hoặc backend từ chối | Đi đúng lớp; 403/404 theo contract không chuyển sang endpoint khác để vượt quyền. |
| Loading, empty, lỗi server và mất mạng/thử lại | Trạng thái theo design, không dùng mock fallback ở bản tích hợp; không lộ dữ liệu ngoài scope. |
| vi/en, dark/light và accessibility | Nội dung/label/khả năng thao tác đúng design trên native; Jest không thay bằng chứng thiết bị. |

## 5. Task API — sau approve UI cả 7 slice

Nguồn khảo sát: `GET /management/classes` hoặc `GET /manager/classes` — chọn theo quyền/DTO thực. Path sau `/api/v1`; xem [mapping nguồn](../../api-contract/README.md#p1-s6). Chưa có contract slice/runtime P1 được kiểm chứng.

Đối chiếu hai namespace về role/guard/DTO rồi chọn nguồn đáp ứng design. Không thử route khác như fallback quyền. Chốt lifecycle/filter/pagination và schema; key theo account/role/namespace/filter/page; adapter tách nếu phải dùng cả hai nguồn cho mục đích khác nhau.

Contract đích dự kiến: `docs/api-contract/phase-001-teaching-workspace/manager-classes.md` — chưa tạo trong bước tách tài liệu.

- [ ] Nhập legacy nguyên byte kèm nguồn/ngày/SHA-256 và đối chiếu controller/guard → DTO → service/domain → runtime; không sửa backend/collection nguồn.
- [ ] Viết contract gồm wire shape/nullability, quyền, query/pagination, error, mapping, query key, staleTime/gcTime/invalidation và policy retry; không tự suy TTL/route.
- [ ] Test schema/service/query fail → pass cho payload đúng/sai/null và mã lỗi được contract xác nhận; dùng HTTP/cookie/refresh/error adapter P0.
- [ ] Nối UI đã duyệt; kiểm race, refetch, account/role/resource isolation và mất quyền. Logout/chuyển account không để response/cache cũ xuất hiện.
- [ ] Không persist roster/toàn query cache hoặc token vào MMKV; không fallback mock khi HTTP lỗi, không log PII/secret.

## 6. Native, E2E và điều kiện hoàn thành

- Dataset cần chuẩn bị: Manager được cấp lớp nhiều lifecycle, dữ liệu rỗng, nhiều trang và tài khoản không được vào Manager.
- Nhóm E2E trong kế hoạch tổng: **E2E-03, E2E-05, E2E-06, E2E-07**. Đây là mã nhóm kế hoạch, chưa phải flow đã tạo/chạy.
- Khi triển khai, mapping slice/BR/UC → flow → expected result → kết quả thực trong `e2e.md`; dùng bộ `.maestro/phase-001-teaching-workspace/` và lệnh `npm run test:e2e:phase-1` theo ADR-020 Accepted. Không tạo flow/lệnh rỗng ở bước tài liệu.
- Sau tích hợp: cleanup, `npm run lint` (0 error/0 warning), `npm test -- --runInBand`, native build và Maestro tích hợp toàn phase/hồi quy liên quan phải pass. UI mock/Jest/build không thay E2E backend thật.
- Ghi build, backend, thiết bị/OS, dataset, lệnh và report/log/screenshot đã loại secret; Android là cổng trước mắt, iOS theo Q-PLAT-01 với bằng chứng riêng.
- UI chỉ hoàn thành khi đủ test/design và được duyệt cùng toàn phase; API chỉ hoàn thành khi contract/tích hợp/kiểm chứng đủ. Chỉ người dùng nghiệm thu mới chuyển phase Done.

Các task code/kiểm chứng đều chưa thực hiện. Tài liệu này không chốt câu hỏi nghiệp vụ mở, không bổ sung design hoặc thay đổi ADR đã Accepted.
