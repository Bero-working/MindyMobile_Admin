# Phase 5 — Kế hoạch triển khai Manager Operations and Cash

**Hiện hành 02/11/2026:** Đã triển khai UI/API 5/5 theo [ADR-027](../../adr/ADR-027-phase-5-direct-api-implementation.md); người dùng bỏ qua E2E theo [ADR-030](../../adr/ADR-030-phase-5-e2e-waiver.md). [Kết quả tích hợp/giới hạn](api-integration.md) · [Cách xem UI](ui-review.md). Chưa nghiệm thu hoặc Done. Mô tả chờ design/UI/API trong bản kế hoạch ban đầu bên dưới là lịch sử, không yêu cầu duyệt lại.

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Hiện hành 02/11/2026:** Người dùng yêu cầu “Triển khai phase 5” và chốt “Giữ phạm vi này”: chỉ dạy thay theo buổi, dùng tên “đơn thanh toán tiền mặt”; không đổi mentor chính, sửa meeting URL hoặc xuất hóa đơn/biên nhận riêng. Đã nhận chỉ thị implement và tách [5 checklist slice](README.md#kế-hoạch-theo-slice). Chưa có design Claude/test case toàn phase; code UI chờ đầu vào theo ADR-009. Policy dữ liệu cần được chốt trong design; phụ thuộc P4 và Q-PLAT-01 vẫn còn. Không cần xin lại chỉ thị implement. Các ghi nhận “chờ duyệt/chưa tách/chưa chốt Q-CLASS-02/Q-PAY-01” trong bản lập ban đầu bên dưới là lịch sử. UI/API giữ 0/5, chưa có code/test runtime P5. Xem [bàn giao design](design-handoff.md).

**Kế hoạch tổng chờ duyệt.** Lượt này chỉ lập tài liệu theo yêu cầu “Lập implement phase 5”; chưa tách kế hoạch slice, viết UI, nhập contract hoặc tích hợp API. UI 0/5, API 0/5, slice hoàn chỉnh 0/5 (0%); [tiến độ thực tế](../../progress/phase/phase-005-manager-operations-cash.md).

## 1. Mục tiêu và phạm vi

Manager phân công hoặc xóa dạy thay theo buổi, dời buổi tương lai, hủy buổi và tạo replacement đúng chuỗi; xem đơn CASH và xác nhận đã nhận đủ tiền. Giữ **5 slice** của [baseline P5](../../implementation-plan.md#p5-manager-operations-cash), ưu tiên sản phẩm P0, phụ thuộc P0/P1/P2/P4.

| Slice                         | Kết quả cần đạt                                                                           | BR / UC                                      | Phụ thuộc    |
| ----------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- | ------------ |
| P5-S1 — substitute-assignment | Đọc candidates, chọn hoặc xóa mentor dạy thay, nhập lý do, xác nhận và tải lại lịch/quyền | BR-TEACH-01/03, BR-OPS-01; UC-MG-08          | P1-S7        |
| P5-S2 — reschedule-session    | Dời SCHEDULED tương lai, kiểm giờ/lịch/nghỉ/class period, lý do và version                | BR-OPS-01, BR-TIME-01, BR-TEACH-03; UC-MG-07 | P1-S7        |
| P5-S3 — replacement-session   | Hủy có lịch sử, tạo replacement từ leaf bị hủy mới nhất, xác nhận tác động                | BR-OPS-01, BR-MAKEUP-01; UC-MG-07            | P1-S7, P4-S5 |
| P5-S4 — cash-orders           | Danh sách CASH phân trang gồm đơn cần xử lý và lịch sử trạng thái đóng                    | BR-PAY-01/05; UC-MG-09                       | P0-S1        |
| P5-S5 — cash-order-detail     | Đọc người mua, lớp, tiền, hạn và trạng thái; xác nhận đủ toàn bộ tiền khi online          | BR-PAY-01–04/06; UC-MG-09                    | P5-S4        |

Confirmation/loading/empty/error/offline/conflict/denied/success là trạng thái của slice, không tăng số UI. Không thêm tạo enrollment/order/invoice, thu một phần/trả góp, xuất hóa đơn/biên nhận, đối soát payOS Admin, đổi mentor chính của lớp hoặc sửa meeting URL khi chưa chốt scope. Guest placement khác lớp thuộc P4, không gộp với replacement P5.

## 2. Hiện trạng và căn cứ

- P0 đã được người dùng xác nhận duyệt; P1 Done theo [progress](../../progress/phase/phase-001-teaching-workspace.md). P2 đã nối API 7/7 nhưng chưa nghiệm thu; P4 còn Todo theo [progress P4](../../progress/phase/phase-004-leave-and-makeup.md). Lập kế hoạch P5 không xác nhận các phụ thuộc đã hoàn tất.
- Có auth/role gate, HTTP cookie, teaching context/lớp/lịch, module attendance, primitives, vi/en và theme. Chưa có `src/modules/operations/`, design Claude P5 hay contract từng slice P5 tại thời điểm khảo sát.
- Đã đọc source backend cạnh repo ngày 02/11/2026: [teaching management controller](../../../../Mindy-BE/src/modules/classes/controllers/teaching-management.controller.ts), [teaching query/assignment DTO](../../../../Mindy-BE/src/modules/classes/dtos/teaching-query.dto.ts), [session operations controller](../../../../Mindy-BE/src/modules/classes/controllers/session-operations.controller.ts), [operations DTO](../../../../Mindy-BE/src/modules/classes/dtos/session-operations.dto.ts), [cash controller](../../../../Mindy-BE/src/modules/payments/controllers/cash-payments.controller.ts), [confirm DTO](../../../../Mindy-BE/src/modules/payments/dtos/confirm-cash.dto.ts), [cash service](../../../../Mindy-BE/src/modules/payments/services/cash-payments.service.ts), [order settlement service](../../../../Mindy-BE/src/modules/commerce/services/order-settlement.service.ts), [manager controller](../../../../Mindy-BE/src/modules/manager-operations/manager-operations.controller.ts). Đây là căn cứ lập kế hoạch; chưa xác minh deploy/runtime, chưa chạy mutation backend.
- Working tree đang có thay đổi P1/P2 và các tài liệu liên quan; giữ nguyên. Chỉ bổ sung hồ sơ P5 và liên kết danh mục trong lượt này.

Áp dụng ADR-004/005/007/008/009 về dữ liệu, quyền, lỗi, tiền/thời gian và TDD; ADR-016/017 về cổng kế hoạch; ADR-018/019 về lazy loading/security; ADR-020/025/026 về kiểm chứng và command E2E. Tra [sổ ADR](../../adr/README.md) để đối chiếu hiệu lực. Không sửa ADR Accepted hoặc dùng source backend làm phê duyệt nghiệp vụ.

## 3. Cổng đầu vào và quyết định còn chờ

| Cổng / câu hỏi       | Nội dung cần chốt                                                                                         | Phần phụ thuộc                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Duyệt kế hoạch tổng  | Người dùng đọc/duyệt bản này trước khi tách chi tiết slice                                                | Chưa duyệt; không tạo 5 kế hoạch slice trong lượt lập tổng                                        |
| Q-CLASS-02           | Chỉ dạy thay từng buổi hay cần đổi mentor chính/sửa meeting URL?                                          | Đề xuất giữ scope S1 theo buổi; tính năng ngoài baseline cần quyết định/ADR phù hợp               |
| Q-PAY-01             | Dùng thuật ngữ “đơn thanh toán tiền mặt” thay Invoice? Có cần biên nhận/xuất hóa đơn riêng?               | Chốt trước UI/contract S4–S5; chưa có Invoice riêng để dựng UI                                    |
| Design toàn phase    | Claude cung cấp design chung và 5 slice, đầy đủ trạng thái/quyền/test case                                | Chưa có; HTML tham khảo không thay design. Codex không tự viết/sửa design Claude                  |
| Phụ thuộc phase      | Rà P2 và P4, đặc biệt P4-S5/source leave, version và lịch bù                                              | S3 không tự mô phỏng luồng P4 chưa triển khai thành tích hợp thật; không tự bỏ phụ thuộc baseline |
| Cache/draft nhạy cảm | Xác nhận policy dữ liệu tiền/người mua và form lý do/ngày giờ của P5 trong design                         | Đề xuất RAM, không persist, không queue/replay; quyết định riêng P2 không tự áp cho P5            |
| Chỉ thị implement    | Người dùng yêu cầu triển khai sau khi đọc kế hoạch; đủ design/test case và quyết định ảnh hưởng trực tiếp | Trước code UI mock                                                                                |
| Duyệt UI toàn phase  | Người dùng approve cả 5 slice                                                                             | Trước tạo contract/schema/service/hook API thật và tích hợp                                       |
| Contract/dataset     | Snapshot legacy bất biến, route/DTO/quyền và dữ liệu phù hợp từng case                                    | Trước API và E2E thật; không tự sửa backend hoặc tạo giao dịch bằng dữ liệu thật ngoài scope      |
| Q-PLAT-01            | Mốc Android/iOS, thiết bị/OS tối thiểu và bằng chứng native                                               | Chốt trước nghiệm thu; không lấy bằng chứng P1/P2 thay P5                                         |

Các đề xuất trong bản này chưa phải quyết định đã duyệt. Chỉ duyệt kế hoạch cho phép tách tài liệu slice theo ADR-017; code vẫn qua ADR-016, UI toàn phase vẫn qua cổng duyệt trước API. Thay luật/scope đã duyệt cần ADR Accepted và changelog trước code.

## 4. Hồ sơ và cấu trúc dự kiến

Sau duyệt tổng mới tạo `slice-001-substitute-assignment.md`, `slice-002-reschedule-session.md`, `slice-003-replacement-session.md`, `slice-004-cash-orders.md`, `slice-005-cash-order-detail.md` trong folder này, có mapping test case và tiêu chí từng slice.

Design đích chờ Claude: `docs/design/manager-operations-cash/design.md` và `docs/design/manager-operations-cash/<slice-slug>/design.md`. Contract đích sau duyệt UI: `docs/api-contract/phase-005-manager-operations-cash/README.md` và `<slice-slug>.md`; legacy snapshot theo [quy ước API](../../api-contract/README.md). Các đường dẫn này chưa tồn tại; không tạo link giả.

| Vị trí dự kiến                                                          | Trách nhiệm                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/modules/operations/screens/`                                       | 5 UI; entry point Manager từ lớp/context P1 và workspace theo design             |
| `src/modules/operations/components/`                                    | Mentor candidate, chọn giờ, impact summary, đơn CASH, confirmation và feedback   |
| `src/modules/operations/types/`                                         | Model UI, form và mutation intent rõ kiểu; mock không phải wire DTO              |
| `src/modules/operations/services/`, `schemas/`                          | Mock boundary ở UI; Zod/wire HTTP sau duyệt UI                                   |
| `src/modules/operations/hooks/`                                         | Query resource/filter/page, mutation, version/key cho lịch; CASH có cơ chế riêng |
| `src/modules/operations/index.ts`                                       | Public exports; tránh import sâu xuyên feature                                   |
| `src/modules/auth/AuthApp.tsx`, `src/navigation/`, module messages      | Route/params/role/entry point và vi/en theo cấu trúc code hiện hành              |
| `__tests__/`, `scripts/`, `.maestro/phase-005-manager-operations-cash/` | UI/API tests, runner/dataset và flow native khi tới bước tương ứng               |

Giữ React Native/TypeScript strict, không explicit `any`/`unknown`; screen không gọi HTTP trực tiếp, service không điều hướng. Tái sử dụng primitives, token, auth/error adapter. Không nâng dependency hoặc refactor phase khác để lập kế hoạch.

## 5. Quy tắc nghiệp vụ và mutation

1. Candidates dạy thay phản ánh mentor active, lịch và nghỉ đã duyệt tại lúc đọc; mutation vẫn có thể từ chối khi dữ liệu đổi. Xóa override gửi `mentorId: null` theo DTO, không ghi đè `teachingMentorId` lịch sử. Đổi mentor chính không thuộc S1 mặc định.
2. S1 dùng `expectedVersion`, reason trim 1–1000 ký tự và UUID key theo contract. Kiểm trạng thái/quyền từ backend hiện hành; không tự cho sửa lịch sử vì đang có role Manager.
3. S2 chỉ dời SCHEDULED tương lai. Form hiển thị lịch cũ/mới và lý do; validate giờ kết thúc sau bắt đầu, timezone và xung đột. Timestamp gửi có offset/Z hợp lệ; ngày nghiệp vụ theo UTC+7/ADR-008, không ép calendar date qua UTC midnight.
4. S3 hủy SCHEDULED hoặc IN_PROGRESS theo backend, bảo toàn attendance/lịch sử. Hủy và tạo replacement là **hai mutation riêng**: tạo mới thất bại sau hủy thì hiển thị buổi đã hủy, không báo rollback hoặc tự lặp lại cancel.
5. Replacement chỉ tạo từ leaf bị hủy mới nhất, không nhánh từ tổ tiên. Form có classUnitId, title, startsAt/endsAt, mentorId tùy chọn theo DTO và lý do/version nguồn mới nhất. Không copy attendance/actual times. Hiển thị tác động classEndDate server trả, đối chiếu tương tác leave/makeup P4.
6. Mutation lịch dùng version/key/reason theo từng route. Intent đã gửi giữ nguyên body/key/version khi retry mất response; thao tác mới sau đối chiếu là key mới. 409 version cần tải mới và đối chiếu, không tự overwrite/rebase. Lỗi trạng thái/conflict khác không gộp thành lỗi version.
7. CASH là Order/PaymentTransaction hiện hữu. Bất kỳ Manager active hợp lệ có thể xác nhận, không đòi phụ trách lớp. ADMIN/Mentor không tự được quyền CASH. Đơn chia theo mentor snapshot; hạn lấy từ `expiresAt` server, không dựng countdown 48 giờ từ lúc mở màn.
8. S4 đọc tất cả đơn CASH, gồm trạng thái đóng. Controller hiện chỉ nhận PageOptionsDto; service lọc paymentType=CASH, sắp createdAt giảm dần và id tăng dần. Không thêm filter status/search/ngày hoặc badge tổng pending khi endpoint chưa hỗ trợ; không lọc một trang rồi mô tả là toàn bộ lịch sử.
9. S5 đọc lại chi tiết đúng orderId trước xác nhận, hiển thị người mua/lớp/tổng/hạn/trạng thái. `receivedAmount` là số nguyên VND từ 1 tới MAX_SAFE_INTEGER và phải bằng toàn bộ totalAmount. Không float/thu một phần; cách nhập/xác nhận cụ thể chờ design/Q-PAY-01.
10. CASH confirm **không nhận expectedVersion hoặc Idempotency-Key**. Khóa gửi lặp khi request đang chạy; mất response phải kiểm trạng thái đơn trước khi quyết định retry, không tự thu lại. Đơn PAID hợp lệ trả trạng thái đã xác nhận, không sinh giao dịch mới; không chỉ nhìn HTTP timeout rồi kết luận chưa thu.
11. Phân biệt `CASH_CONFIRMATION_INVALID`, `CASH_ORDER_CLOSED`, `CASH_HOLD_INVALID`, lỗi phiên/quyền và lỗi mạng theo error contract. Backend từ chối sai tiền, sai phương thức, hết hạn, đơn đóng/lớp hủy, hold không hợp lệ. Countdown/disabled UI không thay kiểm tra transaction server.
12. Mọi mutation P5 chỉ online; không queue/replay khi reconnect, không optimistic success cho thu tiền hoặc thay lịch. Sau thành công dùng dữ liệu server/refetch, không tự tạo enrollment ACTIVE hay payment SUCCEEDED ở client.

## 6. Tải dữ liệu, trạng thái ban đầu và cache

Lựa chọn dưới đây là đề xuất cho design, áp dụng ADR-025. Page size dự kiến 20, phải đối chiếu giới hạn từng DTO ở bước contract.

| Slice | Lựa chọn ban đầu / thời điểm tải                                                                                                   | Phân trang và refresh                                                                                                                             |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | Mở đúng sessionId: tải context/quyền/version; search trống, candidate chưa chọn; chỉ tải candidates khi mở vùng chọn               | Theo search/page của candidates; đổi search reset trang. Sau gán/xóa refresh context, danh sách buổi, lịch và assignment liên quan                |
| S2    | Tải buổi/version khi mở, điền lịch hiện tại, reason trống; chỉ tải lookup cần cho nội dung đang mở                                 | Không preload mọi lịch mentor/ngày. Sau dời invalidate ngày cũ/mới, context và lịch/lớp liên quan hai vai trò                                     |
| S3    | Tải context/chuỗi nguồn cần thiết khi mở; không tự chọn tổ tiên; giờ mới và lý do trống, phần title/unit theo design và nguồn thật | Lookup unit/mentor chỉ khi mở phần chọn. Sau cancel refetch version nguồn; sau replacement cập nhật leaf, classEndDate và dữ liệu P4/P2 liên quan |
| S4    | Mặc định tất cả CASH, trang 1; chưa có lựa chọn status/search phía server                                                          | Load more chỉ danh sách mở; retry đúng trang và giữ hàng cũ. Refresh sau S5; tổng chỉ lấy meta đúng phạm vi CASH                                  |
| S5    | Tải chi tiết khi mở orderId; form xác nhận chưa được chấp thuận; không preload chi tiết từng hàng S4                               | Không phân trang nếu DTO detail không yêu cầu. Sau confirm/mất response refetch đúng đơn và invalidate S4/dữ liệu enrollment liên quan            |

Query key gồm tài khoản/role, resource ID, filter và page. Đổi session/search/order/tài khoản không hiển thị dữ liệu cũ dưới nhãn mới; response cũ không ghi đè lựa chọn mới. Invalidate dữ liệu của role khác khi tái truy cập qua cơ chế server/refetch hiện hành, không giả cập nhật cache trên thiết bị người khác. Không gọi API từng hàng để trang trí hoặc đếm status chưa mở.

Đề xuất chỉ RAM cho cache/form, không persist thông tin người mua/tài chính; logout/đổi tài khoản xóa cache/draft. Offline giữ dữ liệu đã tải của đúng query ở chế độ read-only và ghi rõ có thể cũ; chưa tải thì hiện trạng thái chưa có dữ liệu offline, không giả empty/0. Ẩn/khóa mutation khi offline; không Retry trong warning offline. Khi online/focus trở lại refetch cần thiết, không tự gửi form. Mất quyền/phiên phải che/xóa dữ liệu theo auth boundary, dù còn cache.

Skeleton bám nội dung từng phần; load more giữ hàng cũ. Nội dung/empty trước warning/Retry. Lỗi phần độc lập không khóa toàn màn trừ auth/quyền. Điều hướng mở/Back/tab trực tiếp, không animation/gesture chuyển màn; spacing, vùng chạm, keyboard, reduced motion và accessibility theo hệ thống/design. Dirty form/Back cần design và test, không âm thầm mất lý do hoặc đánh dấu đã gửi.

## 7. Thứ tự triển khai UI mock sau khi đủ đầu vào

| Task      | Công việc                                                                                      | Phụ thuộc / điều kiện hoàn thành                                                                       |
| --------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| UI-00     | Đối chiếu design Claude, BR/ADR, câu hỏi và mapping test case 5 slice                          | Duyệt tổng/tách slice, đủ design/test case, có chỉ thị implement và các quyết định ảnh hưởng trực tiếp |
| UI-01     | Module/mock fixture rõ nhãn, route/role, shared feedback, vi/en/theme, entry point theo design | UI-00; giữ hồi quy P0/P1/P2 và phần P4 liên quan                                                       |
| UI-02     | S1 candidate/search/phân trang, chọn/xóa override, reason, confirmation, conflict/mất quyền    | UI-01; UI test fail → mock UI pass                                                                     |
| UI-03     | S2 giờ cũ/mới, validate/timezone/reason, conflict và tải lại                                   | UI-01; UI test fail → pass, không auto-submit khi đổi giờ                                              |
| UI-04     | S3 cancel/replacement, leaf, tác động/lịch sử và trạng thái thành công một phần                | UI-03 và đủ đầu vào P4-S5; test fail → pass                                                            |
| UI-05     | S4 danh sách mọi trạng thái, phân trang và S5 chi tiết/confirm online                          | UI-01; fail → pass, sai tiền/hết hạn/hold/mất response/Manager khác đã thu                             |
| UI-06     | Toàn phase: trạng thái, vi/en/light/dark, accessibility/keyboard/Back và native review         | UI-02–05; mapping test case đủ, chụp và xem ảnh native                                                 |
| UI-REVIEW | Cleanup, lint/typecheck/Jest, bàn giao review cả 5 slice                                       | UI-06; chờ người dùng approve UI trước API                                                             |

Mock chỉ ở boundary của bước UI, không fallback mock khi API thật lỗi. Chưa tick hoàn tất task nào trong lượt lập kế hoạch.

## 8. API sau khi UI toàn phase được duyệt

[Mapping API khảo sát P5](../../api-contract/README.md#p5-s1) và source đọc ở mục 2 không phải contract đã kiểm chứng. Path dưới đây tương đối với API base/prefix cấu hình, không tự hardcode host.

| Slice | Route cần đóng gói/kiểm chứng                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| S1    | GET `/management/class-sessions/:sessionId/available-mentors`; PATCH `/management/class-sessions/:sessionId/mentor` |
| S2    | PATCH `/management/class-sessions/:sessionId/schedule`                                                              |
| S3    | POST `/management/class-sessions/:sessionId/cancel`; POST `/management/class-sessions/:sessionId/makeups`           |
| S4    | GET `/manager/cash-orders`                                                                                          |
| S5    | GET `/manager/orders/:orderId`; POST `/manager/cash-orders/:orderId/confirm`                                        |

1. Đọc lại controller/DTO/service/guard và OpenAPI runtime; chốt route đọc context/lookup còn cần từ P1/P4, cookie/Origin/error/status/header và paging. Snapshot legacy bất biến, contract cho 5 UI; thiếu endpoint thì ghi gap thay vì bịa hoặc tự sửa BE.
2. Viết test schema/service/hook fail trước code: đúng body/header, nullable override, version/key, error codes, paging, role/scope, stale response, invalidation. CASH detail có thể khác shape response confirm; validate và map riêng theo nguồn thật.
3. Nối S1 → S2 → S3 theo phụ thuộc, sau đó S4 → S5; từng mutation dùng semantics mục 5. Không bật API trước duyệt UI toàn phase dù một slice đã xong mock.
4. Kiểm backend thật bằng tài khoản/dataset thử được phép: replay cùng intent lịch, stale version, thay đổi candidates, leaf conflict; CASH đúng/sai tiền, hết hạn/hold, hai Manager và mất response. Kiểm không sinh payment/enrollment/giao dịch trùng; không coi test mock là bằng chứng transaction backend.
5. Ghi command/kết quả/source hiện hành, giới hạn và requestId không chứa PII/secret; không log cookie/token/credentials. Chuẩn bị dataset thử tái lập được, kiểm ID trước flow phụ thuộc.

## 9. Kiểm chứng, E2E và nghiệm thu

| Nhóm            | Bằng chứng cần đạt                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI              | Mapping toàn bộ test case design cho 5 slice; loading/empty/error/offline/success/denied/conflict, dirty Back, vi/en/dark, navigation/keyboard/accessibility                                                                           |
| Lịch            | Đúng quyền/candidates, xóa override, lịch/nghỉ đổi sau preview, stale version/replay, SCHEDULED tương lai, timezone/class period, cancel IN_PROGRESS giữ lịch sử, leaf và replacement không copy attendance                            |
| CASH            | Mọi trạng thái có thể đọc, phân trang không bỏ lịch sử; Manager active ngoài assignment, Mentor/Admin bị chặn; đầy đủ tiền nguyên VND, order closed/hold invalid, đã PAID, double tap/hai Manager, timeout/refetch/retry không thu đôi |
| Bảo mật/dữ liệu | Deep link sai role/scope, hết phiên/mất quyền giữa thao tác, logout/đổi tài khoản, không lộ cache hoặc ghi nhạy cảm ra storage/log                                                                                                     |
| Hồi quy         | Auth P0, lớp/context/lịch P1, attendance/history P2 và leave/makeup P4 bị ảnh hưởng; không ghi đè người dạy/thời gian/điểm danh lịch sử                                                                                                |
| Chất lượng      | ESLint 0 error/0 warning, format, `tsc --noEmit`, Jest toàn bộ; native build và kiểm UI trên thiết bị theo nền tảng đã chốt                                                                                                            |

Lệnh kiểm chất lượng hiện có: `npm run check` (lint/format/typecheck và Jest). Không chạy/lấy kết quả ứng dụng để tuyên bố hoàn tất trong lượt chỉ tài liệu này.

Khi triển khai mới bổ sung **một command E2E công khai**: `npm run test:e2e:phase-5` theo ADR-020/026, tự kiểm API/chuẩn bị dataset mới → kiểm đủ ID → chạy Maestro toàn phase và hồi quy liên quan. Không thêm command `:ui`/`:api` công khai, không tạo command rỗng trước runtime. API/dataset/thiết bị/flow lỗi hoặc bị ngắt phải trả non-zero và dừng bước phụ thuộc; không dùng dataset cũ khi chuẩn bị lỗi.

Flow phải phủ đường đi Manager từ lớp/context tới S1–S3, kiểm lịch/quyền Mentor sau thay đổi, cùng S4 → S5 → đơn PAID và lịch sử. Tạo mapping test case → test/flow → kết quả, ảnh native đã xem, môi trường backend/build/tài khoản role đã ẩn nhạy cảm. Test mock/build/API pass không thay E2E native thật. Trường hợp thiếu dataset hoặc P4 chưa sẵn sàng phải ghi blocked, chưa trình nghiệm thu.

Chỉ trình người dùng nghiệm thu sau cleanup/check, native build và Maestro toàn phase/hồi quy bắt buộc pass. Phase chỉ Done khi người dùng nghiệm thu; cập nhật từng mốc và ngày/bằng chứng tại progress P5, giữ UI/API/slice hoàn chỉnh độc lập.

## 10. Sản phẩm bàn giao của lượt lập kế hoạch

- Kế hoạch tổng và README phase thật, liên kết từ danh mục implement/kế hoạch chung/progress.
- Ghi nhận mốc lập kế hoạch ngày 02/11/2026; giữ UI/API và slice hoàn chỉnh 0/5.
- Chờ người dùng đọc/duyệt tổng trước tách slice theo ADR-017; chờ design/quyết định và chỉ thị implement trước code theo ADR-016. Không tự mở cổng API hoặc nghiệm thu.
