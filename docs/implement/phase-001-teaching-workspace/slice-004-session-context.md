# P1-S4 — Context buổi học theo quyền

**API 31/10/2026:** Đã nối slice này theo yêu cầu “Triển khai API cho phase 1”; [contract 7 slice](../../api-contract/phase-001-teaching-workspace/README.md) và [kết quả tích hợp](api-integration.md) là trạng thái hiện hành. Các checklist/kết luận chưa triển khai bên dưới giữ làm kế hoạch lịch sử, không phải kết quả kiểm chứng. Chưa nghiệm thu phase.

**Cập nhật triển khai 31/10/2026:** Người dùng yêu cầu “Triển khai phase 1”. Đã có design Claude toàn phase và câu trả lời Q-CLASS-01/02 tại design cấp phase; triển khai UI mock 7 màn; Android build và Maestro UI smoke pass. API 0/7, UI chưa approve. Xem [hồ sơ review](ui-review.md), [kiểm chứng](ui-verification.md) và [smoke native](e2e-ui.md). Các ghi nhận chưa có design/chưa có chỉ thị code bên dưới là snapshot lịch sử của kế hoạch.
Ngày tách kế hoạch: 31/10/2026 (Asia/Bangkok). Người lập: Codex.

**Trạng thái: tài liệu slice đã tách theo yêu cầu “Duyệt và tách slice đi”. Chưa triển khai UI/API.** Kế hoạch tổng đã được duyệt; việc tách tài liệu không thay thế chỉ thị implement, design Claude hoặc approve UI toàn phase.

## 1. Phạm vi, căn cứ và phụ thuộc

- BR/UC: BR-TEACH-01, BR-TIME-01, BR-AUTH-04; UC-M-02, UC-MG-02; BR-TEACH-02 cho scope SESSION.
- Phụ thuộc: P1-S1 hoặc P1-S3; Manager từ P1-S7. UI-04; nối nhánh Manager tại UI-05.
- Task tổng: UI-04/05; API-03/04; UI-06/07 và API-05 áp dụng chung.
- Điểm chờ trực tiếp: Q-CLASS-02, Q-DESIGN-01; Q-CLASS-01 khi hiển thị delivery mode.
- [Kế hoạch tổng](phase-001-teaching-workspace.md) quản lý cổng và công việc chung; [progress P1](../../progress/phase/phase-001-teaching-workspace.md) quản lý tiến độ/bằng chứng.

## 2. Design và ranh giới thực hiện

Design cần Claude cung cấp: `docs/design/teaching-workspace/session-context/design.md`, cùng design cấp phase `docs/design/teaching-workspace/design.md`. **Chưa có design/test case Claude để mapping** tại lúc tách slice. Codex không tự đặt ID TC-P1 hoặc thay yêu cầu kiểm tra dưới đây thành test case design đã duyệt.

Mở buổi từ lịch/lớp Mentor hoặc chi tiết lớp Manager → đọc context theo quyền hiện tại → quay về đúng nơi gọi. Không thêm editor điểm danh/ghi chú/meeting trong slice đọc.

Chỉ code UI khi có chỉ thị implement và đủ design cả 7 slice/câu trả lời trực tiếp. Mock ở service boundary, có nhận diện development; không gọi HTTP, viết schema wire hoặc query hook thật trong bước UI. Tất cả UI phải được duyệt trước bước API, kể cả khi slice này đã pass test.

## 3. Task UI — TDD sau khi đủ cổng

- [ ] Đọc design, giữ nguyên ID/điều kiện/thao tác/kỳ vọng của test case Claude và mapping từng case tới Jest/RNTL hoặc native.
- [ ] Render thời gian, trạng thái, người dạy và thông tin được cấp theo design, giữ version từ boundary.
- [ ] Buổi SCHEDULED theo effective assignment; buổi đã start giữ snapshot lịch sử theo BR-TEACH-01.
- [ ] Chỉ hiện roster buổi nếu design yêu cầu và contract cấp quyền; không dùng roster toàn lớp để bù dữ liệu SESSION.
- [ ] Khi mất assignment/không đủ quyền: chặn nội dung nhạy cảm và action; không giữ thông tin cũ làm căn cứ cho phép.
- [ ] Test hành vi fail → implement mock → pass; đủ loading/empty/error/offline/success/no-permission theo design. Conflict chỉ áp dụng nếu có căn cứ, nếu không ghi lý do.
- [ ] Kiểm tra vi/en, light/dark/system, accessibility label, vùng chạm, font scale, cuộn/safe area và motion theo design; không tự đặt layout/token mới.
- [ ] Kiểm native Android, ảnh và giới hạn thực; cập nhật mapping/UI review toàn phase. Không đánh dấu pass từ tài liệu.

## 4. Yêu cầu kiểm chứng cần đối chiếu design

Bảng sau là yêu cầu từ BR/kế hoạch tổng, **chưa phải test case Claude hoặc kết quả đã chạy**. Sau khi có design, bổ sung mapping ID thật và đường dẫn test/flow vào hồ sơ verification; khác biệt phải xử lý trước phần phụ thuộc.

| Điều kiện / thao tác | Kết quả cần chứng minh |
| --- | --- |
| Mentor chính, Mentor thay và Manager | Cùng sessionId nhưng thông tin/action theo quyền thực của mỗi vai trò. |
| Thiếu snapshot legacy hoặc giá trị null | Giữ ngữ nghĩa thiếu; không suy mentor từ lớp hiện tại. |
| Assignment thay đổi khi đang xem | Refetch bị từ chối phải chặn dữ liệu; route/back không mở lại quyền cũ. |
| Giờ buổi ở timezone khác thiết bị | Instant hiển thị theo Asia/Ho_Chi_Minh; giữ version đúng, không tự tăng. |
| Loading, empty, lỗi server và mất mạng/thử lại | Trạng thái theo design, không dùng mock fallback ở bản tích hợp; không lộ dữ liệu ngoài scope. |
| vi/en, dark/light và accessibility | Nội dung/label/khả năng thao tác đúng design trên native; Jest không thay bằng chứng thiết bị. |

## 5. Task API — sau approve UI cả 7 slice

Nguồn khảo sát: `GET /class-sessions/:sessionId/context`. Path sau `/api/v1`; xem [mapping nguồn](../../api-contract/README.md#p1-s4). Chưa có contract slice/runtime P1 được kiểm chứng.

Xác minh role/guard, context shape, version, effective mentor/snapshot, capabilities và nguồn roster buổi. Nếu thiếu nguồn được cấp thì ghi gap, không bịa endpoint. Key theo account/role/sessionId và scope thích hợp; test 401/403/404 theo contract, cache eviction khi mất quyền và race response.

Contract đích dự kiến: `docs/api-contract/phase-001-teaching-workspace/session-context.md` — chưa tạo trong bước tách tài liệu.

- [ ] Nhập legacy nguyên byte kèm nguồn/ngày/SHA-256 và đối chiếu controller/guard → DTO → service/domain → runtime; không sửa backend/collection nguồn.
- [ ] Viết contract gồm wire shape/nullability, quyền, query/pagination, error, mapping, query key, staleTime/gcTime/invalidation và policy retry; không tự suy TTL/route.
- [ ] Test schema/service/query fail → pass cho payload đúng/sai/null và mã lỗi được contract xác nhận; dùng HTTP/cookie/refresh/error adapter P0.
- [ ] Nối UI đã duyệt; kiểm race, refetch, account/role/resource isolation và mất quyền. Logout/chuyển account không để response/cache cũ xuất hiện.
- [ ] Không persist roster/toàn query cache hoặc token vào MMKV; không fallback mock khi HTTP lỗi, không log PII/secret.

## 6. Native, E2E và điều kiện hoàn thành

- Dataset cần chuẩn bị: Buổi scheduled/đã start/hủy theo enum thật, version khác nhau, legacy thiếu người dạy và assignment bị thu hồi.
- Nhóm E2E trong kế hoạch tổng: **E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06**. Đây là mã nhóm kế hoạch, chưa phải flow đã tạo/chạy.
- Khi triển khai, mapping slice/BR/UC → flow → expected result → kết quả thực trong `e2e.md`; dùng bộ `.maestro/phase-001-teaching-workspace/` và lệnh `npm run test:e2e:phase-1` theo ADR-020 Accepted. Không tạo flow/lệnh rỗng ở bước tài liệu.
- Sau tích hợp: cleanup, `npm run lint` (0 error/0 warning), `npm test -- --runInBand`, native build và Maestro tích hợp toàn phase/hồi quy liên quan phải pass. UI mock/Jest/build không thay E2E backend thật.
- Ghi build, backend, thiết bị/OS, dataset, lệnh và report/log/screenshot đã loại secret; Android là cổng trước mắt, iOS theo Q-PLAT-01 với bằng chứng riêng.
- UI chỉ hoàn thành khi đủ test/design và được duyệt cùng toàn phase; API chỉ hoàn thành khi contract/tích hợp/kiểm chứng đủ. Chỉ người dùng nghiệm thu mới chuyển phase Done.

Các task code/kiểm chứng đều chưa thực hiện. Tài liệu này không chốt câu hỏi nghiệp vụ mở, không bổ sung design hoặc thay đổi ADR đã Accepted.
