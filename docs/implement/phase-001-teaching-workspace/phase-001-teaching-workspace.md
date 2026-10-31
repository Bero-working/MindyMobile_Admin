# Phase 1 — Kế hoạch triển khai Teaching Workspace

**API — 31/10/2026:** Chỉ thị “Triển khai API cho phase 1” cho phép thực hiện bước API. Đã tích hợp 7/7 slice; xem [hồ sơ API](api-integration.md) và [E2E API](e2e.md). Các trạng thái API 0/7 ở kế hoạch bên dưới là snapshot lịch sử; phase chưa nghiệm thu.

**Review bổ sung 31/10/2026:** đã sửa spacing, thứ tự content/feedback, offline warning và hướng mở cửa vào bên trái theo yêu cầu tiếp tục. Xem [hồ sơ sửa UI](ui-spacing-feedback-update.md); vẫn chờ duyệt UI phase 1, API 0/7.

**Cập nhật triển khai 31/10/2026:** Người dùng yêu cầu “Triển khai phase 1”. Đã có design Claude toàn phase và câu trả lời Q-CLASS-01/02 tại design cấp phase; triển khai UI mock 7 màn; Android build và Maestro UI smoke pass. API 0/7, UI chưa approve. Xem [hồ sơ review](ui-review.md), [kiểm chứng](ui-verification.md) và [smoke native](e2e-ui.md). Các ghi nhận chưa có design/chưa có chỉ thị code bên dưới là snapshot lịch sử của kế hoạch.
Ngày lập: 31/10/2026 (Asia/Bangkok). Người lập: Codex.

**Trạng thái hiện hành 31/10/2026: người dùng “Duyệt và tách slice đi” đã duyệt kế hoạch tổng; đã tách 7 kế hoạch slice. UI 0/7, API 0/7; chưa triển khai code.** Theo [ADR-017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md), cổng duyệt tổng/tách slice đã hoàn tất. Code chờ chỉ thị implement và đủ design/câu trả lời trực tiếp theo [ADR-016](../../adr/ADR-016-plan-before-implementation.md); API chờ approve UI toàn phase.

## 1. Mục tiêu và phạm vi

Mentor xem lịch dạy và lớp được giao, mở lớp/buổi học đúng assignment và xem học viên đúng scope. Manager theo dõi lớp hiện hữu, lịch và học viên trong quyền backend cấp. Giữ 7 slice của [baseline P1](../../implementation-plan.md#p1-teaching-workspace); ưu tiên sản phẩm P0, phụ thuộc Phase 0.

| Slice | Kết quả cần đạt | BR / UC | Phụ thuộc |
| --- | --- | --- | --- |
| P1-S1 — mentor-schedule | Xem lịch theo khoảng, phân biệt PRIMARY/SUBSTITUTE, mở đúng buổi | BR-TEACH-01/02, BR-TIME-01; UC-M-02 | P0-S1 |
| P1-S2 — mentor-classes | Danh sách lớp được giao, hiển thị scope CLASS/SESSION từ server | BR-TEACH-02; UC-M-02 | P0-S1 |
| P1-S3 — mentor-class-detail | Đọc workspace lớp, chương và buổi; action theo capabilities | BR-TEACH-01/02, BR-CLASS-03; UC-M-02 | P1-S2 |
| P1-S4 — session-context | Đọc context buổi theo quyền hiện tại, giữ version và người dạy lịch sử | BR-TEACH-01, BR-TIME-01, BR-AUTH-04; UC-M-02, UC-MG-02 | P1-S1, P1-S3; Manager từ P1-S7 |
| P1-S5 — mentor-students | Mentor chính đọc roster toàn lớp, trạng thái enrollment/payment chỉ đọc | BR-TEACH-02, BR-ENR-02; UC-M-03 | P1-S3 |
| P1-S6 — manager-classes | Manager xem danh sách lớp hiện hữu đúng lifecycle/quyền | BR-SCOPE-02/03, BR-CLASS-02; UC-MG-02 | P0-S1 |
| P1-S7 — manager-class-detail | Manager đọc lớp, lịch, roster và đi tới context buổi | BR-TEACH-01, BR-CLASS-02; UC-MG-02 | P1-S6 |

Không thêm tạo/sửa/hủy lớp, mở khóa chương, enrollment, thu tiền, điểm danh, ghi chú, tài liệu, nghỉ/bù, phân công hoặc báo cáo vào P1. Không thêm chọn role/chi nhánh, Admin/Student workspace. Sửa meeting URL, đổi mentor chính và HYBRID còn chờ chốt; kế hoạch này không tự đưa vào scope. Các action thuộc phase sau chỉ được thể hiện theo design đã chốt và không gọi mutation của phase sau.

## 2. Hiện trạng và cổng đầu vào

- Phase 0 đã được người dùng duyệt; xem [progress P0](../../progress/phase/phase-000-foundation-auth.md) và [review/cleanup](../phase-000-foundation-auth/review-cleanup.md). Tái sử dụng auth, cookie HTTP, preferences, theme/i18n và primitives hiện có; các giới hạn native/iOS của P0 vẫn phải được theo dõi.
- Chưa có module `src/modules/teaching/`, design P1, contract từng slice hoặc legacy snapshot P1. [Mapping API](../../api-contract/README.md#p1-s1) là khảo sát, chưa phải contract/runtime đã kiểm chứng.
- Các HTML tham khảo trong `docs/design/` không thay thế design cấp phase, đủ 7 slice và test case do Claude cung cấp.
- Working tree có thay đổi P0/E2E từ trước; giữ nguyên, không reset hoặc gộp thành kết quả P1.

| Cổng | Điều cần giải quyết | Ảnh hưởng |
| --- | --- | --- |
| Duyệt kế hoạch tổng | Đã duyệt ngày 31/10/2026: “Duyệt và tách slice đi” | Đã tách đủ 7 kế hoạch slice |
| Q-CLASS-01 | Xác nhận MVP ONLINE/OFFLINE, hoãn HYBRID | Design hiển thị delivery mode ở lớp/buổi |
| Q-CLASS-02 | Chốt có sửa meeting URL hoặc đổi mentor chính hay chỉ dạy thay từng buổi | Ranh giới action ở S3/S4/S7; nếu mở rộng cần ADR phù hợp |
| Q-DESIGN-01 | Claude xác nhận phân rã 7 UI; cung cấp design cấp phase, từng slice, mọi trạng thái và test case | Trước code UI toàn phase |
| Chỉ thị implement | Người dùng yêu cầu triển khai sau khi đọc kế hoạch | Mở UI mock khi đủ design và quyết định trực tiếp |
| Approve UI toàn phase | Người dùng duyệt đủ 7 slice | Trước triển khai contract/schema/service/query hook/API thật |
| Contract/dữ liệu thử | Chốt route, DTO, scope, pagination và môi trường test thực | Trước tích hợp API tương ứng và E2E |

Theo [ADR-009](../../adr/ADR-009-phase-tdd-and-ownership.md), Codex không tự viết/sửa design Claude hoặc coi câu hỏi mở là đã chốt. Nếu design đổi ranh giới slice hoặc luật đã duyệt, ghi khoảng thiếu và ADR Proposed; chỉ thực hiện phần phụ thuộc sau quyết định phù hợp.

ADR áp dụng: [004 — dữ liệu/query](../../adr/ADR-004-query-mmkv-zod.md), [005 — role/scope](../../adr/ADR-005-role-navigation-and-scope.md), [008 — thời gian](../../adr/ADR-008-money-time-domain-representation.md), [009 — TDD/cổng duyệt](../../adr/ADR-009-phase-tdd-and-ownership.md), [016](../../adr/ADR-016-plan-before-implementation.md), [017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md); giữ kiến trúc/type policy, theme, error, motion, security và cookie auth đã được duyệt trong [ADR index](../../adr/README.md).

## 3. Hồ sơ cần có và cấu trúc dự kiến

Đã tách đủ 7 kế hoạch chi tiết sau khi người dùng duyệt tổng ngày 31/10/2026. Design vẫn chờ Claude; các đường dẫn design là đích cần cung cấp, chưa phải file đã có:

| Slice | Kế hoạch chi tiết đã tách | Design cần Claude cung cấp |
| --- | --- | --- |
| P1-S1 | [slice-001-mentor-schedule.md](slice-001-mentor-schedule.md) | `docs/design/teaching-workspace/mentor-schedule/design.md` |
| P1-S2 | [slice-002-mentor-classes.md](slice-002-mentor-classes.md) | `docs/design/teaching-workspace/mentor-classes/design.md` |
| P1-S3 | [slice-003-mentor-class-detail.md](slice-003-mentor-class-detail.md) | `docs/design/teaching-workspace/mentor-class-detail/design.md` |
| P1-S4 | [slice-004-session-context.md](slice-004-session-context.md) | `docs/design/teaching-workspace/session-context/design.md` |
| P1-S5 | [slice-005-mentor-students.md](slice-005-mentor-students.md) | `docs/design/teaching-workspace/mentor-students/design.md` |
| P1-S6 | [slice-006-manager-classes.md](slice-006-manager-classes.md) | `docs/design/teaching-workspace/manager-classes/design.md` |
| P1-S7 | [slice-007-manager-class-detail.md](slice-007-manager-class-detail.md) | `docs/design/teaching-workspace/manager-class-detail/design.md` |

Cần thêm design cấp phase tại `docs/design/teaching-workspace/design.md` cho điều hướng, thành phần dùng chung, token, motion, accessibility và ma trận trạng thái. Đường dẫn chưa có file được ghi dạng văn bản, không tạo liên kết giả.

| Vị trí mã nguồn dự kiến | Trách nhiệm |
| --- | --- |
| `src/modules/teaching/screens/` | 7 UI theo design; context dùng chung khi quyền tương thích |
| `src/modules/teaching/components/` | Thành phần riêng lịch, lớp, chương/buổi, roster; tái sử dụng primitives P0 |
| `src/modules/teaching/hooks/` | View state/bộ lọc; query và cache chỉ ở bước API |
| `src/modules/teaching/services/` | Boundary và mock UI; HTTP thật chỉ sau approve UI |
| `src/modules/teaching/types/` | Model UI; không coi mock model là wire DTO |
| `src/modules/teaching/schemas/` | Zod response schema ở bước API |
| `src/modules/teaching/index.ts` | Public exports; feature khác không import nội bộ |
| `src/navigation/` | Route/params theo role và resource; giữ root auth gate |
| `src/translations/` | Đủ vi/en, status, lỗi, ngày giờ và accessibility label |
| `__tests__/` | Hành vi UI/quyền, navigation, schema/service/query theo từng cổng |

Theo [architecture](../../architecture.md), screen không gọi HTTP trực tiếp; service không điều hướng. Giữ React Native hiện tại, NativeWind/Reusables, TypeScript strict và không explicit `any`/`unknown`. Dùng Native Stack/lazy loading và motion đã duyệt; không tự cài dependency lịch mới hoặc nâng major. Layout lịch, tab/bộ lọc và thông số motion chờ design, không đóng băng từ kế hoạch này.

## 4. Kế hoạch UI mock toàn phase

Mọi task dưới đây chưa thực hiện. Sau chỉ thị implement và đủ đầu vào: test hành vi từ design fail → code mock pass → kiểm tra native. Không tích hợp API theo từng màn trong giai đoạn UI.

| Task | Nội dung | Phụ thuộc | Điều kiện hoàn thành |
| --- | --- | --- | --- |
| UI-00 | Rà baseline P0, đọc design/BR/ADR; mapping từng test case Claude tới test tự động/native; ghi khoảng thiếu | Cổng mục 2 | Đủ mapping 7 slice, quyết định trực tiếp được giải quyết |
| UI-01 | Dựng module teaching, mock boundary/fixtures, route theo role, shared state UI, vi/en/theme | UI-00 | Mock rõ ràng; auth/Settings P0 hoạt động; không mở dữ liệu bằng role cache |
| UI-02 | P1-S1 lịch dạy và P1-S2 lớp được giao | UI-01 | Khoảng/phân trang theo design; PRIMARY/SUBSTITUTE và CLASS/SESSION đúng; chọn item mở đúng resource |
| UI-03 | P1-S3 workspace lớp/chương/buổi | UI-02/S2 | Capabilities điều khiển action, không mở khóa chương hoặc suy người dạy legacy |
| UI-04 | P1-S4 context buổi và P1-S5 roster lớp | UI-02/S1, UI-03 | Context đúng assignment; SESSION bị chặn roster CLASS; payment chỉ đọc |
| UI-05 | P1-S6 danh sách và P1-S7 chi tiết lớp Manager; nối S4 theo quyền | UI-01; S4 để hoàn tất luồng | Lifecycle kể cả CANCELLED rõ; không có tạo lớp/branch/Admin action |
| UI-06 | TDD các trạng thái, accessibility, dark/light, vi/en, font scale, mạng và mất quyền; hồi quy P0 | UI-02–05 | Đủ test case design; trạng thái không áp dụng có lý do; không leak dữ liệu |
| UI-07 | Cleanup/lint/typecheck/Jest, build Android, chụp UI native và lập hồ sơ review | UI-06 | Có bằng chứng thực, mapping trạng thái/test và điểm chưa kiểm chứng |
| UI-GATE | Trình người dùng duyệt toàn bộ 7 UI | UI-07 | Người dùng approve rõ ràng; nếu yêu cầu sửa, sửa và trình lại |

S1/S2 và nhánh S6/S7 có thể thực hiện độc lập sau UI-01; các bước sửa chung navigation/primitives phải phối hợp tuần tự. Không tạo màn riêng cho loading/empty/error/offline/no-permission. Với từng UI phải kiểm tra success và các trạng thái đó theo design; conflict chỉ áp dụng khi có căn cứ, không tự tạo mutation để đủ trạng thái.

Điểm kiểm tra quyền bắt buộc: Mentor chính khác Mentor thay; không để dữ liệu tiền/draft người khác trong fixture scope SESSION; mất assignment khi đang mở màn phải chặn dữ liệu và hành động; vào route trực tiếp/back cũng kiểm quyền. Thiếu snapshot người dạy phải giữ trạng thái thiếu theo design, không lấy mentor lớp hiện tại thay lịch sử.

## 5. Kế hoạch API — chỉ sau approve UI toàn phase

Endpoint dưới đây lấy từ [mapping khảo sát](../../api-contract/README.md#p1-s1), phần path sau `/api/v1`; phải đối chiếu lại source/runtime khi đến bước contract. Không khẳng định DTO hoặc quyền từ tên route.

| Slice | Nguồn endpoint cần xác minh | Điểm phải chốt trước tích hợp |
| --- | --- | --- |
| S1 | `GET /mentor/schedule` | Query khoảng/ngày, pagination, timezone, assignment và snapshot |
| S2 | `GET /mentor/classes` | Scope CLASS/SESSION, bộ lọc/phân trang và trường được trả |
| S3 | `GET /mentor/classes/:classId`, `GET /mentor/classes/:classId/sessions` | Capabilities, chương/buổi, nullable, lifecycle, delivery mode |
| S4 | `GET /class-sessions/:sessionId/context` | Role/assignment, version, effective mentor, roster buổi và đường đọc được cấp |
| S5 | `GET /mentor/classes/:classId/students` | Chỉ CLASS; phân trang, enrollment/payment và trường nhạy cảm |
| S6 | `GET /management/classes` hoặc `GET /manager/classes` | Chọn nguồn theo quyền và dữ liệu design cần; không coi hai DTO tương đương |
| S7 | `GET /management/classes/:classId` hoặc `GET /manager/classes/:classId`; roster qua controller Manager | Xác minh route lịch/roster thực, schema và quyền riêng; không bịa path còn thiếu |

Nếu context chưa cung cấp roster buổi cho Mentor thay, xác minh đường đọc được cấp từ backend; không fallback qua roster CLASS. Nếu quyền Manager không đủ dữ liệu design yêu cầu, ghi gap và xử lý quyết định trước phần phụ thuộc; không dùng route Admin hay ghép DTO tùy ý.

Thứ tự công việc:

1. **API-00 — nguồn/contract:** sau approve UI, nhập legacy P1 nguyên byte kèm nguồn/ngày/SHA-256 theo quy ước; đối chiếu controller/guard → DTO → service/domain → runtime. Tạo contract từng slice trong `docs/api-contract/phase-001-teaching-workspace/` gồm method/query, response/nullability, quyền, lỗi, pagination và dữ liệu mẫu đã loại secret.
2. **API-01 — schema/service:** test fail cho payload hợp lệ/sai shape/null, mapping, lỗi mạng/401/403/404 và lỗi domain có trong contract; viết Zod/service để pass. Dùng HTTP/cookie/refresh/error adapter P0; không fallback mock khi API lỗi.
3. **API-02 — query/cache:** test fail → pass cho account/role/resource/filter/range/page isolation, retry/cancel, refresh và mất quyền. Mỗi contract ghi query key, staleTime/gcTime/invalidation cụ thể; không tự lấy TTL mặc định từ kế hoạch. Không persist roster hoặc toàn query cache vào MMKV.
4. **API-03 — Mentor:** nối S1/S2 → S3 → S4/S5, theo đúng dependency; giữ view state đã duyệt, không làm thay đổi UI âm thầm.
5. **API-04 — Manager:** nối S6 → S7 → S4 theo contract quyền thật; tách adapter hai namespace nếu cần.
6. **API-05 — hồi quy:** hết phiên/refresh thất bại, logout/đổi account, mất assignment và resource biến mất; xóa cache nhạy cảm theo policy. Kiểm tra race request cũ không đưa dữ liệu tài khoản trước lên màn mới.

Instant ISO-8601 có timezone được chuẩn hóa UTC và hiển thị `Asia/Ho_Chi_Minh`, kể cả khi timezone thiết bị khác. Calendar date `YYYY-MM-DD` không ép thành UTC midnight. Test biên ngày, khoảng rỗng/đổi khoảng nhanh, pagination không trùng/mất item theo contract. Giữ null và các enum đúng wire; không tự thêm HYBRID hoặc suy payment pending thành đủ quyền học.

## 6. Kiểm chứng và E2E trước nghiệm thu

Sau API: cleanup → ESLint 0 error/0 warning + format → typecheck → Jest → build native → Maestro toàn phase và hồi quy liên quan → người dùng nghiệm thu. Lệnh hiện có cần chạy ở thời điểm triển khai:

```powershell
npm run lint
npm test -- --runInBand
npm run android
```

`npm run android` phục vụ build/cài bản native kiểm chứng; build thành công chưa phải E2E pass. Chỉ cập nhật command nếu cấu hình thực thay đổi và ghi bằng chứng.

Khi triển khai E2E, tạo flow tại `.maestro/phase-001-teaching-workspace/`, hồ sơ `e2e.md` trong folder kế hoạch và lệnh `npm run test:e2e:phase-1` chạy bộ tích hợp của phase. **Lệnh/flow P1 chưa tồn tại và không được báo đã chạy trong lượt lập kế hoạch.** Thực hiện theo [quy ước Maestro](../e2e-maestro.md), ADR-009 và [ADR-020](../../adr/ADR-020-e2e-suite-per-phase.md) đã được người dùng duyệt ngày 31/10/2026 qua phản hồi “Duyệt adr 20”. Quy định bộ E2E, lệnh chạy và hồ sơ riêng theo phase có hiệu lực; kế hoạch tổng P1 đã được duyệt sau đó qua yêu cầu “Duyệt và tách slice đi”; các cổng code/design/UI giữ riêng.

| Nhóm E2E dự kiến | Phạm vi và kết quả cần chứng minh |
| --- | --- |
| E2E-01 — Mentor chính | Login → lịch/lớp → workspace/chương/buổi → context → roster CLASS; đúng resource và dữ liệu |
| E2E-02 — Mentor thay | Chỉ assignment SESSION; mở buổi được giao; chặn roster toàn lớp và dữ liệu ngoài scope |
| E2E-03 — Manager | Login → danh sách → lớp → lịch/roster/context; lifecycle/hủy đúng; không có action Admin |
| E2E-04 — Thay quyền | Thu hồi assignment/quyền khi màn đang mở hoặc đi lại route; không còn đọc/thao tác trái quyền |
| E2E-05 — Dữ liệu/thời gian | Khoảng lịch, phân trang, danh sách rỗng, nullable/legacy và timezone thiết bị khác nghiệp vụ |
| E2E-06 — Lỗi/mạng/phiên | Mất mạng/thử lại, lỗi server, session expiry theo điều kiện tái hiện thật; không fallback mock |
| E2E-07 — Hồi quy P0 | Bootstrap/login, Settings vi/en/theme, logout và chuyển account không lộ cache P1 |

Cần dataset tái lập cho Mentor chính, Mentor thay, Manager, lớp có nhiều trạng thái, assignment bị thu hồi và tài nguyên thiếu; chuẩn bị qua cơ chế backend cho phép ở bước kiểm thử, không sửa backend trong lượt lập kế hoạch. Case lỗi cần fixture hoặc điều kiện môi trường phải ghi cách tạo; không dùng mock để kết luận E2E tích hợp pass.

Hồ sơ E2E phải mapping BR/UC/slice → flow → expected result → kết quả thực; ghi ngày/lệnh/Maestro version, build, thiết bị/OS, backend, dataset và report/log/screenshot. Không lưu mật khẩu/token vào Git. Android emulator/thiết bị là cổng trước mắt; iOS theo Q-PLAT-01 và phải có bằng chứng riêng. Fail/blocked/skipped ảnh hưởng nghiệm thu cần xử lý trước trình người dùng.

## 7. Bàn giao và theo dõi

- Đã duyệt tổng và tách 7 kế hoạch slice ngày 31/10/2026. Mỗi file có dependency, task UI/API và yêu cầu kiểm chứng; mapping test case Claude còn chờ design, không tự coi việc duyệt tài liệu là chỉ thị code.
- Khi triển khai UI: tạo `ui-verification.md` và `ui-review.md` có mapping test/ảnh native/giới hạn thực tế; dừng ở cổng approve UI toàn phase.
- Khi triển khai API: tạo contract và `api-integration.md`, sau đó `e2e.md` khi bắt đầu E2E; chỉ liên kết file đã có.
- Cập nhật ngày/người thực hiện, lệnh/kết quả và điểm chờ tại [progress P1](../../progress/phase/phase-001-teaching-workspace.md). Mẫu số giữ 7; slice hoàn chỉnh phải có cả UI và API. Chỉ người dùng nghiệm thu mới chuyển phase Done.

Bàn giao hiện hành: kế hoạch tổng đã duyệt, 7 kế hoạch slice và mục lục liên quan. Chưa viết design, tạo contract, sửa code/config/dependency hoặc chạy test ứng dụng; chưa có kết quả UI/API/E2E P1.

## Bổ sung 31/10/2026 — Hoàn thiện Home sau đăng nhập

Theo yêu cầu “Bây giờ trong phase 1 lập thêm implement về hoàn thiện UI home sau khi login vào”, bổ sung [kế hoạch Home](implement-home-after-login.md), gồm hiện trạng, phạm vi header/tiện ích đúng role, task HOME-00–HOME-REVIEW, kiểm chứng và cổng triển khai. Home thuộc khung workspace/UI-01/UI-06/UI-07, không thêm slice; mẫu số vẫn 7. Chỉ lập tài liệu trong lượt này, chưa sửa code Home, chưa approve UI hoặc tích hợp API.
