# Kế hoạch triển khai

**Hiện hành 31/10/2026:** Phase 0 đã được duyệt kế hoạch/UI và tích hợp API thật 4/4; người dùng xác nhận duyệt phase 0, yêu cầu kiểm tra và dọn dẹp. Tra [tiến độ P0](progress/phase/phase-000-foundation-auth.md) và [hồ sơ rà soát](implement/phase-000-foundation-auth/review-cleanup.md). Trạng thái Todo/chờ duyệt trong bản kế hoạch ban đầu bên dưới là lịch sử.

**Cập nhật 30/10/2026:** [ADR-016](adr/ADR-016-plan-before-implementation.md) bổ sung cổng: kế hoạch trong folder phase → người dùng đọc và yêu cầu implement → UI mock → người dùng approve UI → API. [Kế hoạch phase 0](implement/phase-000-foundation-auth/phase-000-foundation-auth.md) đang chờ đọc/implement; đã có [design Claude P0](design/foundation-auth/design.md). Tên hồ sơ phase-000–008 theo ADR-015. Những ghi nhận thiếu design/ADR trong bản nháp ban đầu bên dưới là lịch sử, tra progress hiện tại trước thực hiện.

**Bản nháp 30/10/2026.** Chưa duyệt ADR, chưa có design Claude, chưa implement. Phân rã màn/slice và thứ tự dưới đây là **đề xuất**, không phải tiến độ hoặc scope đã phê duyệt. [BR/UC và câu hỏi](business-rules.md), [kiến trúc](architecture.md), [ADR](adr/README.md), [tiến độ](progress/README.md).

## Quy tắc phase và slice

Một slice = một UI có mục tiêu riêng; confirmation/loading/empty/error/offline/conflict/no-permission là trạng thái của UI đó, không tự nhân thành màn mới. Claude có thể đề nghị điều chỉnh ranh giới; nếu thay baseline đã duyệt thì qua ADR.

Mỗi slice có hai phần độc lập về tiến độ: **UI** với mock và **API** thật. Tất cả UI trong phase phải hoàn thành TDD và được người dùng duyệt trước khi bắt đầu API của phase đó. Phụ thuộc slice không cho phép làm API sớm. Công việc nền (config, aliases, strict lint, primitives) phục vụ P0, không giả là UI riêng; không thực hiện trước ADR/design/cổng phù hợp.

Cổng đầu vào: giải quyết câu hỏi ảnh hưởng trực tiếp, ADR liên quan Accepted, Claude hoàn tất **mọi design của phase** và test case. Design không có test case hoặc thiếu trạng thái thì trả Claude/người dùng bổ sung; Codex không tự sửa design.

Tiêu chí chung mỗi slice: đúng design, BR/UC/quyền, loading/empty/error/offline/success/không quyền, vi/en/dark mode theo design; UI test fail → pass; API service/schema/hook fail → pass, contract kiểm chứng, lint 0 error/0 warning, tsc --noEmit và Jest pass. Khi trạng thái không áp dụng phải ghi lý do trong design/test; không bỏ qua âm thầm.

Cổng trước nghiệm thu mỗi phase: cleanup/lint/typecheck/Jest pass → **E2E Maestro toàn phase và hồi quy liên quan pass** → người dùng nghiệm thu. Android emulator/thiết bị có bằng chứng chạy; iOS theo Q-PLAT-01. Fail/blocked/skipped ảnh hưởng tiêu chí thì chưa trình nghiệm thu. Theo bổ sung ADR-009 ngày 30/10/2026; xem [quy ước Maestro](implement/e2e-maestro.md).

## Thứ tự và phạm vi

| Phase                                 | Luồng                                                     | Ưu tiên | Số UI | Phụ thuộc                                        | Trạng thái |
| ------------------------------------- | --------------------------------------------------------- | ------- | ----: | ------------------------------------------------ | ---------- |
| [P0](#p0-foundation-auth)             | Nền tảng → đăng nhập → đúng workspace                     | P0      |     4 | Không                                            | Todo       |
| [P1](#p1-teaching-workspace)          | Mentor xem lịch/lớp → Manager theo dõi lớp                | P0      |     7 | P0                                               | Todo       |
| [P2](#p2-attendance-and-notes)        | Mentor điểm danh/ghi chú → Manager theo dõi và correction | P0      |     7 | P0, P1                                           | Todo       |
| [P3](#p3-material-review)             | Mentor tải tài liệu → Manager duyệt/công bố               | P0      |     6 | P0, P1                                           | Todo       |
| [P4](#p4-leave-and-makeup)            | Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật        | P0      |     7 | P0, P1, P2                                       | Todo       |
| [P5](#p5-manager-operations-cash)     | Manager phân công/xử lý lịch → xác nhận CASH              | P0      |     5 | P0, P1, P2, P4                                   | Todo       |
| [P6](#p6-mentor-quiz)                 | Mentor tạo quiz → công bố → theo dõi trạng thái           | P1      |     3 | P0, P1, P2; P0 sản phẩm được nghiệm thu trước P1 | Todo       |
| [P7](#p7-attendance-progress-reports) | Mentor/Manager đọc chuyên cần và progress đúng nghĩa      | P1      |     2 | P1, P2, P4; KPI được chốt                        | Todo       |
| [P8](#p8-chat-notifications)          | Mentor trao đổi → nhận thông báo/push đúng quyền          | P1      |     3 | P0, P1; discovery P1 và UC chi tiết trước design | Todo       |

P0–P5 là MVP dự kiến. P6–P8 chỉ discovery/roadmap cho đến khi chốt Q-P1-01; chưa đủ điều kiện thiết kế hoặc implement, chưa có UC chi tiết chat/push. Không có phase ZIP/chứng chỉ/Student/Admin hoặc tạo enrollment/invoice.

## Đường dẫn design và contract

Chưa tạo bất kỳ `design.md`, contract từng UI hoặc legacy snapshot nào. Các path trong từng slice dưới đây là **đích dự kiến, chưa phải file tồn tại**. Không tạo link hỏng để giả rằng tài liệu đã có. Link API trỏ về [mapping hiện hữu](api-contract/README.md#mapping-ui--endpoint-khảo-sát), nơi ghi endpoint có căn cứ và khoảng thiếu. Sau khi Claude cung cấp và nhập legacy, cập nhật sang link file thật trước thực hiện.

## Hồ sơ triển khai theo phase

Tra cứu [danh mục triển khai](implement/README.md) để lấy tên folder `phase-NNN-<slug>`. Khi bắt đầu phase, tạo folder tương ứng trong `docs/implement/` và ghi hồ sơ triển khai; trạng thái, nhật ký và bằng chứng hoàn tất vẫn được theo dõi tại file tiến độ phase.

<a id="p0-foundation-auth"></a>

## P0 — Nền tảng → đăng nhập → đúng workspace

Ưu tiên: P0. Phụ thuộc phase: Không. Cổng còn chờ: Q-ENV-01, Q-PLAT-01, Q-DESIGN-01, Q-THEME-01; ADR Auth chưa tạo.
ADR liên quan: [ADR-001](adr/ADR-001-boilerplate-feature-modules.md), [ADR-002](adr/ADR-002-strict-types-no-any-unknown.md), [ADR-003](adr/ADR-003-reusables-nativewind-theme.md), [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-000-foundation-auth.md).

| Slice / mục tiêu (1 UI)                  | BR / UC                                            | Phụ thuộc | UI                  | API                  |
| ---------------------------------------- | -------------------------------------------------- | --------- | ------------------- | -------------------- |
| P0-S1 — Khôi phục phiên và mở workspace  | BR-AUTH-01 BR-AUTH-03 BR-AUTH-04; UC-M-01 UC-MG-01 | Không     | UI mock — chờ duyệt | Todo — contract, TDD |
| P0-S2 — Đăng nhập email/mật khẩu         | BR-AUTH-01 BR-AUTH-02 BR-AUTH-03; UC-M-01 UC-MG-01 | P0-S1     | UI mock — chờ duyệt | Todo — contract, TDD |
| P0-S3 — Thông báo không đủ quyền vào app | BR-AUTH-01 BR-SCOPE-03; UC-M-01 UC-MG-01           | P0-S1     | UI mock — chờ duyệt | Todo — contract, TDD |
| P0-S4 — Ngôn ngữ, theme và đăng xuất     | BR-AUTH-03 BR-DATA-01 BR-DATA-02; UC-M-01 UC-MG-01 | P0-S1     | UI mock — chờ duyệt | Todo — contract, TDD |

### P0-S1 — bootstrap

- Mục tiêu: Khôi phục phiên và mở workspace.
- Design dự kiến, **chờ Claude**: `docs/design/foundation-auth/bootstrap/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/bootstrap.md`; [mapping P0-S1](api-contract/README.md#p0-s1).
- Tiêu chí nghiệm thu riêng: Không mở workspace bằng role cache; có loading/offline/expired.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-AUTH → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P0-S2 — login

- Mục tiêu: Đăng nhập email/mật khẩu.
- Design dự kiến, **chờ Claude**: `docs/design/foundation-auth/login/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/login.md`; [mapping P0-S2](api-contract/README.md#p0-s2).
- Tiêu chí nghiệm thu riêng: Sai thông tin/khóa tài khoản không vào workspace; cookie được kiểm chứng native.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-AUTH → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P0-S3 — access-denied

- Mục tiêu: Thông báo không đủ quyền vào app.
- Design dự kiến, **chờ Claude**: `docs/design/foundation-auth/access-denied/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/access-denied.md`; [mapping P0-S3](api-contract/README.md#p0-s3).
- Tiêu chí nghiệm thu riêng: ADMIN/STUDENT không được vào workspace; không vòng lặp điều hướng.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-AUTH → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P0-S4 — settings

- Mục tiêu: Ngôn ngữ, theme và đăng xuất.
- Design dự kiến, **chờ Claude**: `docs/design/foundation-auth/settings/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/settings.md`; [mapping P0-S4](api-contract/README.md#p0-s4).
- Tiêu chí nghiệm thu riêng: vi/en/theme; logout không để lộ dữ liệu tài khoản trước; draft policy chờ chốt.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-AUTH → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p1-teaching-workspace"></a>

## P1 — Mentor xem lịch/lớp → Manager theo dõi lớp

Ưu tiên: P0. Phụ thuộc phase: P0. Cổng còn chờ: Q-CLASS-01, Q-CLASS-02, Q-DESIGN-01.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-008](adr/ADR-008-money-time-domain-representation.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-001-teaching-workspace.md).

| Slice / mục tiêu (1 UI)                  | BR / UC                                             | Phụ thuộc   | UI               | API                  |
| ---------------------------------------- | --------------------------------------------------- | ----------- | ---------------- | -------------------- |
| P1-S1 — Lịch dạy theo assignment         | BR-TEACH-01 BR-TEACH-02 BR-TIME-01; UC-M-02         | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P1-S2 — Danh sách lớp được giao          | BR-TEACH-02; UC-M-02                                | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P1-S3 — Workspace lớp và chương/buổi     | BR-TEACH-01 BR-TEACH-02 BR-CLASS-03; UC-M-02        | P1-S2       | Todo — mock, TDD | Todo — contract, TDD |
| P1-S4 — Chi tiết buổi học theo quyền     | BR-TEACH-01 BR-TIME-01 BR-AUTH-04; UC-M-02 UC-MG-02 | P1-S1 P1-S3 | Todo — mock, TDD | Todo — contract, TDD |
| P1-S5 — Roster toàn lớp cho Mentor chính | BR-TEACH-02 BR-ENR-02; UC-M-03                      | P1-S3       | Todo — mock, TDD | Todo — contract, TDD |
| P1-S6 — Manager xem lớp hiện hữu         | BR-SCOPE-02 BR-SCOPE-03 BR-CLASS-02; UC-MG-02       | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P1-S7 — Manager đọc lịch và học viên lớp | BR-TEACH-01 BR-CLASS-02; UC-MG-02                   | P1-S6       | Todo — mock, TDD | Todo — contract, TDD |

### P1-S1 — mentor-schedule

- Mục tiêu: Lịch dạy theo assignment.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/mentor-schedule/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-schedule.md`; [mapping P1-S1](api-contract/README.md#p1-s1).
- Tiêu chí nghiệm thu riêng: Đúng timezone, phân trang/khoảng, phân biệt PRIMARY/SUBSTITUTE.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CLASS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P1-S2 — mentor-classes

- Mục tiêu: Danh sách lớp được giao.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/mentor-classes/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-classes.md`; [mapping P1-S2](api-contract/README.md#p1-s2).
- Tiêu chí nghiệm thu riêng: Chỉ lớp được giao; thể hiện scope CLASS/SESSION từ server.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-WORKSPACE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P1-S3 — mentor-class-detail

- Mục tiêu: Workspace lớp và chương/buổi.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/mentor-class-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-class-detail.md`; [mapping P1-S3](api-contract/README.md#p1-s3).
- Tiêu chí nghiệm thu riêng: Capabilities kiểm soát action; không dựng người dạy legacy; không mở khóa chương.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-WORKSPACE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P1-S4 — session-context

- Mục tiêu: Chi tiết buổi học theo quyền.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/session-context/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/session-context.md`; [mapping P1-S4](api-contract/README.md#p1-s4).
- Tiêu chí nghiệm thu riêng: Dùng context thật và version; mất assignment bị chặn; meeting edit chưa trong baseline.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CLASS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P1-S5 — mentor-students

- Mục tiêu: Roster toàn lớp cho Mentor chính.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/mentor-students/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-students.md`; [mapping P1-S5](api-contract/README.md#p1-s5).
- Tiêu chí nghiệm thu riêng: Không gọi roster CLASS với scope SESSION; trạng thái payment chỉ đọc.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-WORKSPACE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P1-S6 — manager-classes

- Mục tiêu: Manager xem lớp hiện hữu.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/manager-classes/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/manager-classes.md`; [mapping P1-S6](api-contract/README.md#p1-s6).
- Tiêu chí nghiệm thu riêng: Không có tạo lớp/Admin action hoặc branch selector.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS SRC-MANAGER → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P1-S7 — manager-class-detail

- Mục tiêu: Manager đọc lịch và học viên lớp.
- Design dự kiến, **chờ Claude**: `docs/design/teaching-workspace/manager-class-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/manager-class-detail.md`; [mapping P1-S7](api-contract/README.md#p1-s7).
- Tiêu chí nghiệm thu riêng: Phân biệt route đọc và route vận hành; roster đúng quyền, trạng thái hủy rõ.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS SRC-MANAGER → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p2-attendance-and-notes"></a>

## P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction

Ưu tiên: P0. Phụ thuộc phase: P0, P1. Cổng còn chờ: Q-DATA-01, Q-OFF-01, Q-ATT-01, Q-PLAT-01.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-006](adr/ADR-006-attendance-offline-queue.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-008](adr/ADR-008-money-time-domain-representation.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-002-attendance-and-notes.md).

| Slice / mục tiêu (1 UI)                           | BR / UC                                                                                                                                          | Phụ thuộc | UI               | API                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------------- | -------------------- |
| P2-S1 — Start, roster, đánh dấu, sync và finalize | BR-ATT-01 BR-ATT-02 BR-ATT-03 BR-ATT-04 BR-ATT-05 BR-ATT-06 BR-ATT-07 BR-ATT-08 BR-ATT-09 BR-ATT-11 BR-OFF-01 BR-OFF-02; UC-M-04 UC-M-05 UC-M-06 | P1-S4     | Todo — mock, TDD | Todo — contract, TDD |
| P2-S2 — Lưu ghi chú nội bộ buổi                   | BR-NOTE-01 BR-NOTE-02 BR-ATT-06; UC-M-07                                                                                                         | P1-S4     | Todo — mock, TDD | Todo — contract, TDD |
| P2-S3 — Manager theo dõi buổi cần xử lý           | BR-ATT-01 BR-ATT-05 BR-REPORT-01; UC-MG-02 UC-MG-03                                                                                              | P1-S6     | Todo — mock, TDD | Todo — contract, TDD |
| P2-S4 — Manager đọc điểm danh và hành động hợp lệ | BR-ATT-03 BR-ATT-10 BR-REPORT-01; UC-MG-03                                                                                                       | P2-S3     | Todo — mock, TDD | Todo — contract, TDD |
| P2-S5 — Sửa điểm danh có lý do                    | BR-ATT-08 BR-ATT-10 BR-ATT-11; UC-MG-03                                                                                                          | P2-S4     | Todo — mock, TDD | Todo — contract, TDD |
| P2-S6 — Khôi phục dữ liệu thiếu bằng bằng chứng   | BR-ATT-10 BR-ATT-08; UC-MG-03                                                                                                                    | P2-S4     | Todo — mock, TDD | Todo — contract, TDD |
| P2-S7 — Xem lịch sử correction/recovery           | BR-ATT-10; UC-MG-03                                                                                                                              | P2-S4     | Todo — mock, TDD | Todo — contract, TDD |

### P2-S1 — attendance-editor

- Mục tiêu: Start, roster, đánh dấu, sync và finalize.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/attendance-editor/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/attendance-editor.md`; [mapping P2-S1](api-contract/README.md#p2-s1).
- Tiêu chí nghiệm thu riêng: Bulk mọi trang/guest; finalize cảnh báo UNMARKED; conflict không ghi đè; offline chỉ sau chốt policy.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-ATT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P2-S2 — teaching-note-editor

- Mục tiêu: Lưu ghi chú nội bộ buổi.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/teaching-note-editor/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/teaching-note-editor.md`; [mapping P2-S2](api-contract/README.md#p2-s2).
- Tiêu chí nghiệm thu riêng: Note version riêng; hạn sửa, nội dung/nextSteps và lỗi conflict đúng; không hứa offline note.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-NOTE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P2-S3 — incomplete-sessions

- Mục tiêu: Manager theo dõi buổi cần xử lý.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/incomplete-sessions/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/incomplete-sessions.md`; [mapping P2-S3](api-contract/README.md#p2-s3).
- Tiêu chí nghiệm thu riêng: Mặc định toàn backlog unresolved overdue theo API; không giới hạn tuần ngầm; không coi chưa start là ABSENT.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CORRECTION → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P2-S4 — manager-attendance

- Mục tiêu: Manager đọc điểm danh và hành động hợp lệ.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/manager-attendance/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/manager-attendance.md`; [mapping P2-S4](api-contract/README.md#p2-s4).
- Tiêu chí nghiệm thu riêng: Hiện permission/totals server, regular/guest; phân biệt correction và recovery.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-ATT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P2-S5 — attendance-correction

- Mục tiêu: Sửa điểm danh có lý do.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/attendance-correction/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/attendance-correction.md`; [mapping P2-S5](api-contract/README.md#p2-s5).
- Tiêu chí nghiệm thu riêng: Reason bắt buộc, record hiện hữu, conflict và audit; không giả Mentor hay đổi hạn.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-ATT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P2-S6 — attendance-recovery

- Mục tiêu: Khôi phục dữ liệu thiếu bằng bằng chứng.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/attendance-recovery/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/attendance-recovery.md`; [mapping P2-S6](api-contract/README.md#p2-s6).
- Tiêu chí nghiệm thu riêng: Insert-only, bằng chứng/actual times hợp lệ, body limit; không dựng snapshot lịch sử.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CORRECTION → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P2-S7 — attendance-audits

- Mục tiêu: Xem lịch sử correction/recovery.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-and-notes/attendance-audits/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/attendance-audits.md`; [mapping P2-S7](api-contract/README.md#p2-s7).
- Tiêu chí nghiệm thu riêng: Phân trang/filter trong scope; chỉ trình bày audit thật, không tự dựng before/after.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CORRECTION → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p3-material-review"></a>

## P3 — Mentor tải tài liệu → Manager duyệt/công bố

Ưu tiên: P0. Phụ thuộc phase: P0, P1. Cổng còn chờ: Q-MAT-01, Q-ENV-01.
ADR liên quan: [ADR-003](adr/ADR-003-reusables-nativewind-theme.md), [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-003-material-review.md).

| Slice / mục tiêu (1 UI)                         | BR / UC                                                      | Phụ thuộc   | UI               | API                  |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------- | ---------------- | -------------------- |
| P3-S1 — Danh sách tài liệu theo chương          | BR-MAT-01 BR-MAT-02 BR-MAT-06; UC-M-08                       | P1-S3       | Todo — mock, TDD | Todo — contract, TDD |
| P3-S2 — Tạo/sửa draft và upload                 | BR-MAT-02 BR-MAT-03 BR-MAT-05 BR-FILE-01 BR-FILE-03; UC-M-08 | P3-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P3-S3 — Preview, submit và xem kết quả duyệt    | BR-MAT-03 BR-MAT-04 BR-MAT-05; UC-M-08                       | P3-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P3-S4 — Manager xem queue duyệt                 | BR-MAT-03; UC-MG-04                                          | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P3-S5 — Preview và approve/reject đúng revision | BR-MAT-01 BR-MAT-03 BR-MAT-04 BR-MAT-05; UC-MG-04            | P3-S4       | Todo — mock, TDD | Todo — contract, TDD |
| P3-S6 — Xem nội dung/file riêng tư theo vai trò | BR-FILE-01 BR-FILE-02 BR-MAT-06; UC-M-08 UC-MG-04            | P3-S3 P3-S5 | Todo — mock, TDD | Todo — contract, TDD |

### P3-S1 — mentor-materials

- Mục tiêu: Danh sách tài liệu theo chương.
- Design dự kiến, **chờ Claude**: `docs/design/material-review/mentor-materials/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-materials.md`; [mapping P3-S1](api-contract/README.md#p3-s1).
- Tiêu chí nghiệm thu riêng: Scope CLASS/SESSION đúng; không có release unit route.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-MAT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P3-S2 — material-editor

- Mục tiêu: Tạo/sửa draft và upload.
- Design dự kiến, **chờ Claude**: `docs/design/material-review/material-editor/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/material-editor.md`; [mapping P3-S2](api-contract/README.md#p3-s2).
- Tiêu chí nghiệm thu riêng: Không submit file chưa READY; revision conflict; loại nội dung chờ Q-MAT-01.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-MAT SRC-FILE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P3-S3 — mentor-material-detail

- Mục tiêu: Preview, submit và xem kết quả duyệt.
- Design dự kiến, **chờ Claude**: `docs/design/material-review/mentor-material-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-material-detail.md`; [mapping P3-S3](api-contract/README.md#p3-s3).
- Tiêu chí nghiệm thu riêng: REJECTED phải edit về DRAFT trước submit; sau firstApprovedAt không tự sửa như draft cũ.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-MAT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P3-S4 — material-review-queue

- Mục tiêu: Manager xem queue duyệt.
- Design dự kiến, **chờ Claude**: `docs/design/material-review/material-review-queue/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/material-review-queue.md`; [mapping P3-S4](api-contract/README.md#p3-s4).
- Tiêu chí nghiệm thu riêng: Queue theo trạng thái/revision; không lấy tổng từ một trang.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-MAT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P3-S5 — material-review-detail

- Mục tiêu: Preview và approve/reject đúng revision.
- Design dự kiến, **chờ Claude**: `docs/design/material-review/material-review-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/material-review-detail.md`; [mapping P3-S5](api-contract/README.md#p3-s5).
- Tiêu chí nghiệm thu riêng: Reject có lý do; approve đồng thời công bố; xem tác động tài liệu dùng chung; edit/unpublish chờ phạm vi.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-MAT → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P3-S6 — material-preview

- Mục tiêu: Xem nội dung/file riêng tư theo vai trò.
- Design dự kiến, **chờ Claude**: `docs/design/material-review/material-preview/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/material-preview.md`; [mapping P3-S6](api-contract/README.md#p3-s6).
- Tiêu chí nghiệm thu riêng: Xin URL theo scope khi cần; hết hạn xin lại; storage upload/download không dùng cookie BE.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-MAT SRC-FILE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p4-leave-and-makeup"></a>

## P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật

Ưu tiên: P0. Phụ thuộc phase: P0, P1, P2. Cổng còn chờ: Q-LEAVE-01, Q-MAKEUP-01; hai slice placement chưa chốt P0.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-008](adr/ADR-008-money-time-domain-representation.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-004-leave-and-makeup.md).

| Slice / mục tiêu (1 UI)                              | BR / UC                                                  | Phụ thuộc   | UI               | API                  |
| ---------------------------------------------------- | -------------------------------------------------------- | ----------- | ---------------- | -------------------- |
| P4-S1 — Xem đơn nghỉ của mình                        | BR-LEAVE-01 BR-LEAVE-04; UC-M-09 UC-M-10                 | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P4-S2 — Preview khoảng nghỉ và chọn đủ phương án bù  | BR-LEAVE-01 BR-LEAVE-02 BR-LEAVE-03 BR-TEACH-03; UC-M-09 | P4-S1 P1-S1 | Todo — mock, TDD | Todo — contract, TDD |
| P4-S3 — Theo dõi kết quả và rút đơn                  | BR-LEAVE-04; UC-M-09 UC-M-10                             | P4-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P4-S4 — Manager xem đơn cần duyệt                    | BR-LEAVE-04; UC-MG-05                                    | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P4-S5 — Duyệt/từ chối và kiểm lịch sau duyệt         | BR-LEAVE-04 BR-LEAVE-05 BR-MAKEUP-01; UC-MG-05           | P4-S4 P1-S7 | Todo — mock, TDD | Todo — contract, TDD |
| P4-S6 — Backlog học viên cần bù khác lớp (đề xuất)   | BR-MAKEUP-02 BR-MAKEUP-03; UC-MG-06                      | P4-S5       | Todo — mock, TDD | Todo — contract, TDD |
| P4-S7 — Xếp/hủy và xếp lại guest placement (đề xuất) | BR-MAKEUP-02 BR-MAKEUP-03; UC-MG-06                      | P4-S6 P2-S1 | Todo — mock, TDD | Todo — contract, TDD |

### P4-S1 — mentor-leave-list

- Mục tiêu: Xem đơn nghỉ của mình.
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/mentor-leave-list/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-leave-list.md`; [mapping P4-S1](api-contract/README.md#p4-s1).
- Tiêu chí nghiệm thu riêng: Chỉ own requests; EXPIRED không được hiện là PENDING có thể duyệt.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-LEAVE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P4-S2 — leave-plan-editor

- Mục tiêu: Preview khoảng nghỉ và chọn đủ phương án bù.
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/leave-plan-editor/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/leave-plan-editor.md`; [mapping P4-S2](api-contract/README.md#p4-s2).
- Tiêu chí nghiệm thu riêng: Ngày lịch/ca/notice đúng; preview cũ bị kiểm lại; đủ sourceVersions/mapping.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-LEAVE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P4-S3 — mentor-leave-detail

- Mục tiêu: Theo dõi kết quả và rút đơn.
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/mentor-leave-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-leave-detail.md`; [mapping P4-S3](api-contract/README.md#p4-s3).
- Tiêu chí nghiệm thu riêng: Withdraw có lý do/version/key; đổi trạng thái đồng thời không bị ghi đè.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-LEAVE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P4-S4 — leave-review-queue

- Mục tiêu: Manager xem đơn cần duyệt.
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/leave-review-queue/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/leave-review-queue.md`; [mapping P4-S4](api-contract/README.md#p4-s4).
- Tiêu chí nghiệm thu riêng: Lọc/phân trang đúng trạng thái; không hứa SLA hoặc push P0.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-LEAVE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P4-S5 — leave-review-detail

- Mục tiêu: Duyệt/từ chối và kiểm lịch sau duyệt.
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/leave-review-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/leave-review-detail.md`; [mapping P4-S5](api-contract/README.md#p4-s5).
- Tiêu chí nghiệm thu riêng: Reason/acknowledgment/version; approve source/replacement và lịch cập nhật; conflict không báo thành công.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-LEAVE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P4-S6 — makeup-conflicts

- Mục tiêu: Backlog học viên cần bù khác lớp (đề xuất).
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/makeup-conflicts/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/makeup-conflicts.md`; [mapping P4-S6](api-contract/README.md#p4-s6).
- Tiêu chí nghiệm thu riêng: Phân biệt replacement/placement; không tự coi conflict là ABSENT; giữ NEEDS_REASSIGNMENT.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P4-S7 — makeup-placement-editor

- Mục tiêu: Xếp/hủy và xếp lại guest placement (đề xuất).
- Design dự kiến, **chờ Claude**: `docs/design/leave-and-makeup/makeup-placement-editor/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/makeup-placement-editor.md`; [mapping P4-S7](api-contract/README.md#p4-s7).
- Tiêu chí nghiệm thu riêng: Candidate đúng chương/còn chỗ; xác nhận nội dung/lý do/version/key; guest credit một lần.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p5-manager-operations-cash"></a>

## P5 — Manager phân công/xử lý lịch → xác nhận CASH

Ưu tiên: P0. Phụ thuộc phase: P0, P1, P2, P4. Cổng còn chờ: Q-CLASS-02, Q-PAY-01; không thêm tạo enrollment/invoice.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-008](adr/ADR-008-money-time-domain-representation.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-005-manager-operations-cash.md).

| Slice / mục tiêu (1 UI)                   | BR / UC                                                     | Phụ thuộc   | UI               | API                  |
| ----------------------------------------- | ----------------------------------------------------------- | ----------- | ---------------- | -------------------- |
| P5-S1 — Phân công/xóa dạy thay theo buổi  | BR-TEACH-01 BR-TEACH-03 BR-OPS-01; UC-MG-08                 | P1-S7       | Todo — mock, TDD | Todo — contract, TDD |
| P5-S2 — Dời buổi tương lai                | BR-OPS-01 BR-TIME-01 BR-TEACH-03; UC-MG-07                  | P1-S7       | Todo — mock, TDD | Todo — contract, TDD |
| P5-S3 — Hủy buổi và tạo replacement       | BR-OPS-01 BR-MAKEUP-01; UC-MG-07                            | P1-S7 P4-S5 | Todo — mock, TDD | Todo — contract, TDD |
| P5-S4 — Xem đơn CASH cần xử lý và lịch sử | BR-PAY-01 BR-PAY-05; UC-MG-09                               | P0-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P5-S5 — Xác nhận đã nhận đủ toàn bộ tiền  | BR-PAY-01 BR-PAY-02 BR-PAY-03 BR-PAY-04 BR-PAY-06; UC-MG-09 | P5-S4       | Todo — mock, TDD | Todo — contract, TDD |

### P5-S1 — substitute-assignment

- Mục tiêu: Phân công/xóa dạy thay theo buổi.
- Design dự kiến, **chờ Claude**: `docs/design/manager-operations-cash/substitute-assignment/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/substitute-assignment.md`; [mapping P5-S1](api-contract/README.md#p5-s1).
- Tiêu chí nghiệm thu riêng: Candidates theo lịch/nghỉ; bảo toàn teachingMentorId; đổi mentor chính chưa mặc định P0.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P5-S2 — reschedule-session

- Mục tiêu: Dời buổi tương lai.
- Design dự kiến, **chờ Claude**: `docs/design/manager-operations-cash/reschedule-session/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/reschedule-session.md`; [mapping P5-S2](api-contract/README.md#p5-s2).
- Tiêu chí nghiệm thu riêng: Đúng SCHEDULED tương lai, version/key/reason, conflict và refetch lịch hai vai trò.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P5-S3 — replacement-session

- Mục tiêu: Hủy buổi và tạo replacement.
- Design dự kiến, **chờ Claude**: `docs/design/manager-operations-cash/replacement-session/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/replacement-session.md`; [mapping P5-S3](api-contract/README.md#p5-s3).
- Tiêu chí nghiệm thu riêng: Hủy có lịch sử; replacement từ leaf; không copy attendance; phạm vi tác động được xác nhận.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-OPS → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P5-S4 — cash-orders

- Mục tiêu: Xem đơn CASH cần xử lý và lịch sử.
- Design dự kiến, **chờ Claude**: `docs/design/manager-operations-cash/cash-orders/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/cash-orders.md`; [mapping P5-S4](api-contract/README.md#p5-s4).
- Tiêu chí nghiệm thu riêng: Nguồn phân trang CASH có cả trạng thái đóng; không giả chỉ pending hoặc lọc server chưa có.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CASH → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P5-S5 — cash-order-detail

- Mục tiêu: Xác nhận đã nhận đủ toàn bộ tiền.
- Design dự kiến, **chờ Claude**: `docs/design/manager-operations-cash/cash-order-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/cash-order-detail.md`; [mapping P5-S5](api-contract/README.md#p5-s5).
- Tiêu chí nghiệm thu riêng: Đúng người/đơn/lớp/tổng/hạn; retry không thu đôi; sai số tiền/hold/hết hạn hiển thị đúng; chỉ online.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CASH SRC-MANAGER → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p6-mentor-quiz"></a>

## P6 — Mentor tạo quiz → công bố → theo dõi trạng thái

Ưu tiên: P1. Phụ thuộc phase: P0, P1, P2; P0 sản phẩm được nghiệm thu trước P1. Cổng còn chờ: Q-P1-01; chưa cam kết results queue hay ZIP grading.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-008](adr/ADR-008-money-time-domain-representation.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-006-mentor-quiz.md).

| Slice / mục tiêu (1 UI)                 | BR / UC                                              | Phụ thuộc   | UI               | API                  |
| --------------------------------------- | ---------------------------------------------------- | ----------- | ---------------- | -------------------- |
| P6-S1 — Xem quiz theo lớp/buổi          | BR-QUIZ-01 BR-QUIZ-04; UC-M-11                       | P1-S3 P1-S4 | Todo — mock, TDD | Todo — contract, TDD |
| P6-S2 — Tạo/sửa draft và câu hỏi        | BR-QUIZ-01; UC-M-11                                  | P6-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P6-S3 — Đọc, publish/archive theo quyền | BR-QUIZ-01 BR-QUIZ-02 BR-QUIZ-03 BR-QUIZ-04; UC-M-11 | P6-S1       | Todo — mock, TDD | Todo — contract, TDD |

### P6-S1 — quiz-list

- Mục tiêu: Xem quiz theo lớp/buổi.
- Design dự kiến, **chờ Claude**: `docs/design/mentor-quiz/quiz-list/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/quiz-list.md`; [mapping P6-S1](api-contract/README.md#p6-s1).
- Tiêu chí nghiệm thu riêng: Assignment thuộc session; scope dạy thay đúng; không hiện chức năng ZIP publish.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-QUIZ → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P6-S2 — quiz-editor

- Mục tiêu: Tạo/sửa draft và câu hỏi.
- Design dự kiến, **chờ Claude**: `docs/design/mentor-quiz/quiz-editor/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/quiz-editor.md`; [mapping P6-S2](api-contract/README.md#p6-s2).
- Tiêu chí nghiệm thu riêng: ABCD một đáp án, số câu hợp lệ, không sửa cấu hình đóng băng.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-QUIZ → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P6-S3 — quiz-detail

- Mục tiêu: Đọc, publish/archive theo quyền.
- Design dự kiến, **chờ Claude**: `docs/design/mentor-quiz/quiz-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/quiz-detail.md`; [mapping P6-S3](api-contract/README.md#p6-s3).
- Tiêu chí nghiệm thu riêng: Đúng trạng thái/quyền; không tự dựng điểm/tổng hợp chưa có endpoint.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-QUIZ → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p7-attendance-progress-reports"></a>

## P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa

Ưu tiên: P1. Phụ thuộc phase: P1, P2, P4; KPI được chốt. Cổng còn chờ: Q-P1-01; dashboard doanh thu/tổng hợp mới cần contract và ADR riêng.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-008](adr/ADR-008-money-time-domain-representation.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-007-attendance-progress-reports.md).

| Slice / mục tiêu (1 UI)                          | BR / UC                                          | Phụ thuộc   | UI               | API                  |
| ------------------------------------------------ | ------------------------------------------------ | ----------- | ---------------- | -------------------- |
| P7-S1 — Mentor đọc chuyên cần và stored progress | BR-REPORT-01 BR-REPORT-02; UC-M-12               | P1-S3 P2-S1 | Todo — mock, TDD | Todo — contract, TDD |
| P7-S2 — Manager đọc chuyên cần theo lớp          | BR-REPORT-01 BR-REPORT-02 BR-REPORT-03; UC-MG-10 | P1-S7 P2-S4 | Todo — mock, TDD | Todo — contract, TDD |

### P7-S1 — mentor-attendance-report

- Mục tiêu: Mentor đọc chuyên cần và stored progress.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-progress-reports/mentor-attendance-report/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/mentor-attendance-report.md`; [mapping P7-S1](api-contract/README.md#p7-s1).
- Tiêu chí nghiệm thu riêng: null khác 0, UNTRACKED, credit/makeupPending đúng; Mentor thay không được báo cáo CLASS.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CORRECTION SRC-WORKSPACE → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P7-S2 — manager-attendance-report

- Mục tiêu: Manager đọc chuyên cần theo lớp.
- Design dự kiến, **chờ Claude**: `docs/design/attendance-progress-reports/manager-attendance-report/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/manager-attendance-report.md`; [mapping P7-S2](api-contract/README.md#p7-s2).
- Tiêu chí nghiệm thu riêng: Công thức server, phân trang/scope, không tự tính toàn bộ bằng một trang; KPI thêm chờ chốt.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-CORRECTION → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

<a id="p8-chat-notifications"></a>

## P8 — Mentor trao đổi → nhận thông báo/push đúng quyền

Ưu tiên: P1. Phụ thuộc phase: P0, P1; discovery P1 và UC chi tiết trước design. Cổng còn chờ: Q-P1-01; API chat/notifications/push hiện không cho MANAGER.
ADR liên quan: [ADR-004](adr/ADR-004-query-mmkv-zod.md), [ADR-005](adr/ADR-005-role-navigation-and-scope.md), [ADR-007](adr/ADR-007-error-contract.md), [ADR-009](adr/ADR-009-phase-tdd-and-ownership.md).
[Nhật ký phase](progress/phase/phase-008-chat-notifications.md).

| Slice / mục tiêu (1 UI)                             | BR / UC                                              | Phụ thuộc   | UI               | API                  |
| --------------------------------------------------- | ---------------------------------------------------- | ----------- | ---------------- | -------------------- |
| P8-S1 — Danh sách hội thoại Mentor (dự kiến)        | BR-AUTH-04 BR-REPORT-03; Chưa chốt UC — discovery P1 | P1-S3       | Todo — mock, TDD | Todo — contract, TDD |
| P8-S2 — Đọc/gửi tin trong scope (dự kiến)           | BR-AUTH-04 BR-REPORT-03; Chưa chốt UC — discovery P1 | P8-S1       | Todo — mock, TDD | Todo — contract, TDD |
| P8-S3 — Thông báo và tùy chọn push Mentor (dự kiến) | BR-AUTH-04 BR-REPORT-03; Chưa chốt UC — discovery P1 | P0-S4 P8-S1 | Todo — mock, TDD | Todo — contract, TDD |

### P8-S1 — conversations

- Mục tiêu: Danh sách hội thoại Mentor (dự kiến).
- Design dự kiến, **chờ Claude**: `docs/design/chat-notifications/conversations/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/conversations.md`; [mapping P8-S1](api-contract/README.md#p8-s1).
- Tiêu chí nghiệm thu riêng: Chỉ dùng role được endpoint cấp; chưa hứa Manager chat hoặc chat staff nội bộ.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-P1 → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P8-S2 — conversation-detail

- Mục tiêu: Đọc/gửi tin trong scope (dự kiến).
- Design dự kiến, **chờ Claude**: `docs/design/chat-notifications/conversation-detail/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/conversation-detail.md`; [mapping P8-S2](api-contract/README.md#p8-s2).
- Tiêu chí nghiệm thu riêng: Quyền/cursor/reconnect/idempotence cần đối chiếu HTTP/socket trước implement.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-P1 → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

### P8-S3 — notifications

- Mục tiêu: Thông báo và tùy chọn push Mentor (dự kiến).
- Design dự kiến, **chờ Claude**: `docs/design/chat-notifications/notifications/design.md`.
- Contract dự kiến, **chưa tạo**: `docs/api-contract/notifications.md`; [mapping P8-S3](api-contract/README.md#p8-s3).
- Tiêu chí nghiệm thu riêng: Xin quyền đúng lúc; token/installation/logout và deep link được kiểm chứng; không mở cho Manager.
- UI: test case từ design → test fail → mock UI pass → duyệt cùng toàn phase.
- API: đối chiếu nguồn SRC-P1 → contract → schema/service/hook test fail → tích hợp thật pass; không fallback mock khi server lỗi.

Kết quả cuối phase: toàn luồng trên cả hai vai trò khi có tương tác; người dùng duyệt UI trước API, kiểm tra cleanup, E2E Maestro pass và nghiệm thu trước Done. Phần chờ quyết định không được tính là tích hợp xong.

## Cổng bàn giao và cách tính tiến độ

Chạy lint với max-warnings=0, tsc --noEmit (bao gồm test) và Jest toàn bộ sau cleanup. Ghi bằng chứng Android thực cho cookie/upload/offline ở phase có liên quan; iOS theo mốc được xác nhận. Không ghi commit/PR nếu workspace chưa có Git.

Tiến độ hiển thị UI x/N, API y/N và % slice hoàn chỉnh = số slice có cả UI/API hoàn tất / N ×100; phase vẫn chờ nghiệm thu, chỉ Done khi người dùng nghiệm thu. Trạng thái P1 dự kiến không đóng góp vào % MVP. Khi thêm/bớt slice sau duyệt phải ghi ADR và cập nhật mẫu số cùng lịch sử.

Sau lần tạo tài liệu này dừng ở cổng rà soát ADR/câu hỏi; không tự cài dependency, viết code, tạo design, nhập/sửa legacy hoặc tích hợp API.

## Cập nhật triển khai P0 — 30/10/2026

Theo yêu cầu “duyệt và triển khai”, UI mock 4/4 đã bàn giao review; [hướng dẫn/ảnh](implement/phase-000-foundation-auth/ui-review.md), [mapping/bằng chứng](implement/phase-000-foundation-auth/ui-verification.md). Người dùng chưa approve UI; API và nghiệm thu giữ nguyên cổng. Các ghi nhận Todo hoặc chưa implement trong baseline lịch sử không thay thế trạng thái tại file progress hiện tại.
