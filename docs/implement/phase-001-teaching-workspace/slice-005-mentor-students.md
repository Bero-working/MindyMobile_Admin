# P1-S5 — Roster lớp cho Mentor chính

**API 31/10/2026:** Đã nối slice này theo yêu cầu “Triển khai API cho phase 1”; [contract 7 slice](../../api-contract/phase-001-teaching-workspace/README.md) và [kết quả tích hợp](api-integration.md) là trạng thái hiện hành. Các checklist/kết luận chưa triển khai bên dưới giữ làm kế hoạch lịch sử, không phải kết quả kiểm chứng. Chưa nghiệm thu phase.

**Cập nhật triển khai 31/10/2026:** Người dùng yêu cầu “Triển khai phase 1”. Đã có design Claude toàn phase và câu trả lời Q-CLASS-01/02 tại design cấp phase; triển khai UI mock 7 màn; Android build và Maestro UI smoke pass. API 0/7, UI chưa approve. Xem [hồ sơ review](ui-review.md), [kiểm chứng](ui-verification.md) và [smoke native](e2e-ui.md). Các ghi nhận chưa có design/chưa có chỉ thị code bên dưới là snapshot lịch sử của kế hoạch.
Ngày tách kế hoạch: 31/10/2026 (Asia/Bangkok). Người lập: Codex.

**Trạng thái: tài liệu slice đã tách theo yêu cầu “Duyệt và tách slice đi”. Chưa triển khai UI/API.** Kế hoạch tổng đã được duyệt; việc tách tài liệu không thay thế chỉ thị implement, design Claude hoặc approve UI toàn phase.

## 1. Phạm vi, căn cứ và phụ thuộc

- BR/UC: BR-TEACH-02, BR-ENR-02; UC-M-03.
- Phụ thuộc: P1-S3 và quyền CLASS; UI-04. Mentor thay dùng context S4/roster buổi được cấp, không đi qua roster CLASS.
- Task tổng: UI-04; API-03; UI-06/07 và API-05 áp dụng chung.
- Điểm chờ trực tiếp: Q-DESIGN-01; policy dữ liệu không cho phép tự bật persistence roster.
- [Kế hoạch tổng](phase-001-teaching-workspace.md) quản lý cổng và công việc chung; [progress P1](../../progress/phase/phase-001-teaching-workspace.md) quản lý tiến độ/bằng chứng.

## 2. Design và ranh giới thực hiện

Design cần Claude cung cấp: `docs/design/teaching-workspace/mentor-students/design.md`, cùng design cấp phase `docs/design/teaching-workspace/design.md`. **Chưa có design/test case Claude để mapping** tại lúc tách slice. Codex không tự đặt ID TC-P1 hoặc thay yêu cầu kiểm tra dưới đây thành test case design đã duyệt.

Mentor chính từ workspace lớp S3 → roster lớp → đọc thông tin enrollment/payment được cấp. Slice chỉ đọc, không thêm enrollment, thu tiền hoặc điểm danh.

Chỉ code UI khi có chỉ thị implement và đủ design cả 7 slice/câu trả lời trực tiếp. Mock ở service boundary, có nhận diện development; không gọi HTTP, viết schema wire hoặc query hook thật trong bước UI. Tất cả UI phải được duyệt trước bước API, kể cả khi slice này đã pass test.

## 3. Task UI — TDD sau khi đủ cổng

- [ ] Đọc design, giữ nguyên ID/điều kiện/thao tác/kỳ vọng của test case Claude và mapping từng case tới Jest/RNTL hoặc native.
- [ ] Render học viên và trạng thái enrollment/payment được phép; null không chuyển thành 0 hoặc trạng thái đã thanh toán.
- [ ] Ẩn entry và chặn route đối với SESSION; mock phải kiểm được cả truy cập trực tiếp.
- [ ] Không diễn giải payment pending hoặc redirect thành đủ điều kiện học; nhãn theo design và BR-ENR-02.
- [ ] Bộ lọc/tìm kiếm/tải thêm chỉ theo design/contract; giữ trạng thái rỗng riêng với lỗi và không quyền.
- [ ] Test hành vi fail → implement mock → pass; đủ loading/empty/error/offline/success/no-permission theo design. Conflict chỉ áp dụng nếu có căn cứ, nếu không ghi lý do.
- [ ] Kiểm tra vi/en, light/dark/system, accessibility label, vùng chạm, font scale, cuộn/safe area và motion theo design; không tự đặt layout/token mới.
- [ ] Kiểm native Android, ảnh và giới hạn thực; cập nhật mapping/UI review toàn phase. Không đánh dấu pass từ tài liệu.

## 4. Yêu cầu kiểm chứng cần đối chiếu design

Bảng sau là yêu cầu từ BR/kế hoạch tổng, **chưa phải test case Claude hoặc kết quả đã chạy**. Sau khi có design, bổ sung mapping ID thật và đường dẫn test/flow vào hồ sơ verification; khác biệt phải xử lý trước phần phụ thuộc.

| Điều kiện / thao tác | Kết quả cần chứng minh |
| --- | --- |
| Mentor chính có roster nhiều trạng thái | Thông tin đúng, payment/enrollment chỉ đọc và không suy điều kiện học. |
| Mentor thay mở route trực tiếp | Bị chặn; service roster CLASS không được gọi. |
| Roster rỗng hoặc trường nullable | Empty rõ ràng; không bịa học viên hoặc mặc định paid/ACTIVE. |
| Logout/chuyển account hoặc mất CLASS | Dữ liệu roster cũ bị xóa/chặn, không lộ cho account tiếp theo. |
| Loading, empty, lỗi server và mất mạng/thử lại | Trạng thái theo design, không dùng mock fallback ở bản tích hợp; không lộ dữ liệu ngoài scope. |
| vi/en, dark/light và accessibility | Nội dung/label/khả năng thao tác đúng design trên native; Jest không thay bằng chứng thiết bị. |

## 5. Task API — sau approve UI cả 7 slice

Nguồn khảo sát: `GET /mentor/classes/:classId/students`. Path sau `/api/v1`; xem [mapping nguồn](../../api-contract/README.md#p1-s5). Chưa có contract slice/runtime P1 được kiểm chứng.

Chốt guard CLASS, trường học viên/payment được phép, enum enrollment và pagination. Test enabled gate để SESSION không phát request; key theo account/role/classId/scope/filter/page. Không persist roster, không log PII; xóa dữ liệu nhạy cảm khi logout hoặc quyền bị thu hồi.

Contract đích dự kiến: `docs/api-contract/phase-001-teaching-workspace/mentor-students.md` — chưa tạo trong bước tách tài liệu.

- [ ] Nhập legacy nguyên byte kèm nguồn/ngày/SHA-256 và đối chiếu controller/guard → DTO → service/domain → runtime; không sửa backend/collection nguồn.
- [ ] Viết contract gồm wire shape/nullability, quyền, query/pagination, error, mapping, query key, staleTime/gcTime/invalidation và policy retry; không tự suy TTL/route.
- [ ] Test schema/service/query fail → pass cho payload đúng/sai/null và mã lỗi được contract xác nhận; dùng HTTP/cookie/refresh/error adapter P0.
- [ ] Nối UI đã duyệt; kiểm race, refetch, account/role/resource isolation và mất quyền. Logout/chuyển account không để response/cache cũ xuất hiện.
- [ ] Không persist roster/toàn query cache hoặc token vào MMKV; không fallback mock khi HTTP lỗi, không log PII/secret.

## 6. Native, E2E và điều kiện hoàn thành

- Dataset cần chuẩn bị: CLASS roster rỗng/nhiều trang, enrollment/payment khác nhau theo enum thật, Mentor chỉ SESSION.
- Nhóm E2E trong kế hoạch tổng: **E2E-01, E2E-02, E2E-04, E2E-07**. Đây là mã nhóm kế hoạch, chưa phải flow đã tạo/chạy.
- Khi triển khai, mapping slice/BR/UC → flow → expected result → kết quả thực trong `e2e.md`; dùng bộ `.maestro/phase-001-teaching-workspace/` và lệnh `npm run test:e2e:phase-1` theo ADR-020 Accepted. Không tạo flow/lệnh rỗng ở bước tài liệu.
- Sau tích hợp: cleanup, `npm run lint` (0 error/0 warning), `npm test -- --runInBand`, native build và Maestro tích hợp toàn phase/hồi quy liên quan phải pass. UI mock/Jest/build không thay E2E backend thật.
- Ghi build, backend, thiết bị/OS, dataset, lệnh và report/log/screenshot đã loại secret; Android là cổng trước mắt, iOS theo Q-PLAT-01 với bằng chứng riêng.
- UI chỉ hoàn thành khi đủ test/design và được duyệt cùng toàn phase; API chỉ hoàn thành khi contract/tích hợp/kiểm chứng đủ. Chỉ người dùng nghiệm thu mới chuyển phase Done.

Các task code/kiểm chứng đều chưa thực hiện. Tài liệu này không chốt câu hỏi nghiệp vụ mở, không bổ sung design hoặc thay đổi ADR đã Accepted.
