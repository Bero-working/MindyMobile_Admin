# Danh mục triển khai theo phase

Ngày tạo: 30/10/2026 (Asia/Bangkok). Người soạn: Codex. Danh mục này được lập theo yêu cầu người dùng để xác định folder cần tạo khi triển khai từng phase.

## Cổng trước khi triển khai

Theo [ADR-016](../adr/ADR-016-plan-before-implementation.md) và [ADR-017](../adr/ADR-017-phase-plan-name-and-slice-breakdown.md), mỗi phase phải có kế hoạch tổng với tên file trùng tên folder (`phase-NNN-<slug>.md`) để người dùng đọc duyệt; sau duyệt mới tách kế hoạch chi tiết theo slice trong folder phase, và code vẫn chờ yêu cầu implement. Sau đó chỉ làm UI mock toàn phase; dừng chờ người dùng approve UI trước khi gắn API. Tiếp tục kiểm chứng và nghiệm thu theo ADR-009.

Phase 0: kế hoạch và UI đã duyệt, API thật đã tích hợp 4/4. Ngày 31/10/2026 người dùng xác nhận duyệt phase 0 và yêu cầu kiểm tra, dọn dẹp; xem [hồ sơ rà soát](phase-000-foundation-auth/review-cleanup.md). Hướng dẫn UI mock phía dưới thuộc lịch sử.

## Cách sử dụng

1. Chọn phase trong bảng bên dưới; thứ tự `000`–`008` tương ứng P0–P8 trong [implementation-plan](../implementation-plan.md). Mã phase và slice hiện có giữ nguyên.
2. Đọc kế hoạch, câu hỏi còn chờ, ADR liên quan và design đã duyệt của phase. Tuân thủ quy trình [ADR-009](../adr/ADR-009-phase-tdd-and-ownership.md).
3. Khi bắt đầu triển khai phase, tạo đúng folder `docs/implement/<tên-folder>/` được ghi trong bảng. Các folder phase chưa tạo trong lần lập danh mục này.
4. Tạo `README.md` trong folder phase để ghi phạm vi/slice đang thực hiện, liên kết design và contract, các bước thực hiện, câu hỏi phụ thuộc và kết quả kiểm tra thực tế. Hồ sơ hỗ trợ và bằng chứng của phase đặt cùng folder, chỉ tạo khi cần.
5. Cập nhật tiến độ và nhật ký tại file tương ứng trong `docs/progress/phase/`; danh mục này dùng để tra cứu folder và phạm vi, không duy trì bảng tiến độ thứ hai. Mã nguồn ứng dụng tiếp tục đặt theo kiến trúc feature module.

6. Trước trình nghiệm thu, viết và chạy E2E bằng Maestro cho toàn phase và hồi quy liên quan; lưu mapping và bằng chứng theo [quy ước Maestro](e2e-maestro.md). Mốc E2E phải pass, không thay bằng unit test hoặc build thành công.

Tên folder phải trùng tên file tiến độ bỏ phần `.md`: `phase-NNN-<slug>`. Khi thêm hoặc đổi tên phase, đồng bộ danh mục này, implementation-plan, file tiến độ và các liên kết liên quan. Các folder chưa tồn tại được ghi bằng đường dẫn văn bản; chỉ thêm liên kết tới hồ sơ sau khi file thật đã được tạo.

## Danh sách phase

| Phase                                                                                               | Folder trong `docs/implement/`           | Số slice | Tài liệu đối chiếu                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [P0 — Nền tảng → đăng nhập → đúng workspace](#phase-000-foundation-auth)                            | `phase-000-foundation-auth/`             | 4        | [Kế hoạch](../implementation-plan.md#p0-foundation-auth) · [Tiến độ](../progress/phase/phase-000-foundation-auth.md)                         |
| [P1 — Mentor xem lịch/lớp → Manager theo dõi lớp](#phase-001-teaching-workspace)                    | `phase-001-teaching-workspace/`          | 7        | [Kế hoạch](../implementation-plan.md#p1-teaching-workspace) · [Tiến độ](../progress/phase/phase-001-teaching-workspace.md)                   |
| [P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction](#phase-002-attendance-and-notes)   | `phase-002-attendance-and-notes/`        | 7        | [Kế hoạch](../implementation-plan.md#p2-attendance-and-notes) · [Tiến độ](../progress/phase/phase-002-attendance-and-notes.md)               |
| [P3 — Mentor tải tài liệu → Manager duyệt/công bố](#phase-003-material-review)                      | `phase-003-material-review/`             | 6        | [Kế hoạch](../implementation-plan.md#p3-material-review) · [Tiến độ](../progress/phase/phase-003-material-review.md)                         |
| [P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật](#phase-004-leave-and-makeup)              | `phase-004-leave-and-makeup/`            | 7        | [Kế hoạch](../implementation-plan.md#p4-leave-and-makeup) · [Tiến độ](../progress/phase/phase-004-leave-and-makeup.md)                       |
| [P5 — Manager phân công/xử lý lịch → xác nhận CASH](#phase-005-manager-operations-cash)             | `phase-005-manager-operations-cash/`     | 5        | [Kế hoạch](../implementation-plan.md#p5-manager-operations-cash) · [Tiến độ](../progress/phase/phase-005-manager-operations-cash.md)         |
| [P6 — Mentor tạo quiz → công bố → theo dõi trạng thái](#phase-006-mentor-quiz)                      | `phase-006-mentor-quiz/`                 | 3        | [Kế hoạch](../implementation-plan.md#p6-mentor-quiz) · [Tiến độ](../progress/phase/phase-006-mentor-quiz.md)                                 |
| [P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa](#phase-007-attendance-progress-reports) | `phase-007-attendance-progress-reports/` | 2        | [Kế hoạch](../implementation-plan.md#p7-attendance-progress-reports) · [Tiến độ](../progress/phase/phase-007-attendance-progress-reports.md) |
| [P8 — Mentor trao đổi → nhận thông báo/push đúng quyền](#phase-008-chat-notifications)              | `phase-008-chat-notifications/`          | 3        | [Kế hoạch](../implementation-plan.md#p8-chat-notifications) · [Tiến độ](../progress/phase/phase-008-chat-notifications.md)                   |

P0–P5 thuộc MVP; P6–P8 là roadmap, phạm vi chi tiết vẫn theo các quyết định còn chờ trong kế hoạch. Việc tạo danh mục không làm tăng tiến độ UI/API hoặc thay thế duyệt UI/nghiệm thu phase.

<a id="phase-000-foundation-auth"></a>

## phase-000-foundation-auth

P0 — Nền tảng → đăng nhập → đúng workspace.

Folder khi triển khai: `docs/implement/phase-000-foundation-auth/`.

Phạm vi công việc: `P0-S1 — bootstrap`; `P0-S2 — login`; `P0-S3 — access-denied`; `P0-S4 — settings`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p0-foundation-auth) và [tiến độ/cổng còn chờ](../progress/phase/phase-000-foundation-auth.md) trước khi bắt đầu.

<a id="phase-001-teaching-workspace"></a>

## phase-001-teaching-workspace

P1 — Mentor xem lịch/lớp → Manager theo dõi lớp.

Đã tạo [hồ sơ phase 1](phase-001-teaching-workspace/README.md) và [kế hoạch tổng](phase-001-teaching-workspace/phase-001-teaching-workspace.md) ngày 31/10/2026. Người dùng đã duyệt kế hoạch tổng qua yêu cầu “Duyệt và tách slice đi”; đã tách 7 kế hoạch slice ngày 31/10/2026. Chưa triển khai code; design và chỉ thị implement còn chờ. UI 0/7, API 0/7.

Phạm vi công việc: `P1-S1 — mentor-schedule`; `P1-S2 — mentor-classes`; `P1-S3 — mentor-class-detail`; `P1-S4 — session-context`; `P1-S5 — mentor-students`; `P1-S6 — manager-classes`; `P1-S7 — manager-class-detail`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p1-teaching-workspace) và [tiến độ/cổng còn chờ](../progress/phase/phase-001-teaching-workspace.md) trước khi bắt đầu.

<a id="phase-002-attendance-and-notes"></a>

## phase-002-attendance-and-notes

P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction.

Folder khi triển khai: `docs/implement/phase-002-attendance-and-notes/`.

Phạm vi công việc: `P2-S1 — attendance-editor`; `P2-S2 — teaching-note-editor`; `P2-S3 — incomplete-sessions`; `P2-S4 — manager-attendance`; `P2-S5 — attendance-correction`; `P2-S6 — attendance-recovery`; `P2-S7 — attendance-audits`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p2-attendance-and-notes) và [tiến độ/cổng còn chờ](../progress/phase/phase-002-attendance-and-notes.md) trước khi bắt đầu.

<a id="phase-003-material-review"></a>

## phase-003-material-review

P3 — Mentor tải tài liệu → Manager duyệt/công bố.

Folder khi triển khai: `docs/implement/phase-003-material-review/`.

Phạm vi công việc: `P3-S1 — mentor-materials`; `P3-S2 — material-editor`; `P3-S3 — mentor-material-detail`; `P3-S4 — material-review-queue`; `P3-S5 — material-review-detail`; `P3-S6 — material-preview`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p3-material-review) và [tiến độ/cổng còn chờ](../progress/phase/phase-003-material-review.md) trước khi bắt đầu.

<a id="phase-004-leave-and-makeup"></a>

## phase-004-leave-and-makeup

P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật.

Folder khi triển khai: `docs/implement/phase-004-leave-and-makeup/`.

Phạm vi công việc: `P4-S1 — mentor-leave-list`; `P4-S2 — leave-plan-editor`; `P4-S3 — mentor-leave-detail`; `P4-S4 — leave-review-queue`; `P4-S5 — leave-review-detail`; `P4-S6 — makeup-conflicts`; `P4-S7 — makeup-placement-editor`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p4-leave-and-makeup) và [tiến độ/cổng còn chờ](../progress/phase/phase-004-leave-and-makeup.md) trước khi bắt đầu.

<a id="phase-005-manager-operations-cash"></a>

## phase-005-manager-operations-cash

P5 — Manager phân công/xử lý lịch → xác nhận CASH.

Folder khi triển khai: `docs/implement/phase-005-manager-operations-cash/`.

Phạm vi công việc: `P5-S1 — substitute-assignment`; `P5-S2 — reschedule-session`; `P5-S3 — replacement-session`; `P5-S4 — cash-orders`; `P5-S5 — cash-order-detail`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p5-manager-operations-cash) và [tiến độ/cổng còn chờ](../progress/phase/phase-005-manager-operations-cash.md) trước khi bắt đầu.

<a id="phase-006-mentor-quiz"></a>

## phase-006-mentor-quiz

P6 — Mentor tạo quiz → công bố → theo dõi trạng thái.

Folder khi triển khai: `docs/implement/phase-006-mentor-quiz/`.

Phạm vi công việc: `P6-S1 — quiz-list`; `P6-S2 — quiz-editor`; `P6-S3 — quiz-detail`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p6-mentor-quiz) và [tiến độ/cổng còn chờ](../progress/phase/phase-006-mentor-quiz.md) trước khi bắt đầu.

<a id="phase-007-attendance-progress-reports"></a>

## phase-007-attendance-progress-reports

P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa.

Folder khi triển khai: `docs/implement/phase-007-attendance-progress-reports/`.

Phạm vi công việc: `P7-S1 — mentor-attendance-report`; `P7-S2 — manager-attendance-report`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p7-attendance-progress-reports) và [tiến độ/cổng còn chờ](../progress/phase/phase-007-attendance-progress-reports.md) trước khi bắt đầu.

<a id="phase-008-chat-notifications"></a>

## phase-008-chat-notifications

P8 — Mentor trao đổi → nhận thông báo/push đúng quyền.

Folder khi triển khai: `docs/implement/phase-008-chat-notifications/`.

Phạm vi công việc: `P8-S1 — conversations`; `P8-S2 — conversation-detail`; `P8-S3 — notifications`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p8-chat-notifications) và [tiến độ/cổng còn chờ](../progress/phase/phase-008-chat-notifications.md) trước khi bắt đầu.

30/10/2026 — Người dùng đã duyệt kế hoạch tổng phase 0; đã tách 4 kế hoạch slice. Xem [mục lục phase 0](phase-000-foundation-auth/phase-000-foundation-auth.md). Code vẫn chờ yêu cầu implement; API chờ approve UI toàn phase.

## API phase 0 — 30/10/2026

Người dùng “Duyệt UI, gắn API vào đi”: cổng UI đã mở, đã nối service API thật cho bốn slice. Tra [contract](../api-contract/phase-000-foundation-auth/README.md), [hồ sơ kiểm chứng](phase-000-foundation-auth/api-integration.md) và [E2E](phase-000-foundation-auth/e2e.md). Những dòng chờ approve UI/API trong bản ghi trước là lịch sử, không yêu cầu duyệt lại. Chưa nghiệm thu phase.

## Cài đặt / Hồ sơ và dialog đăng xuất — 31/10/2026

Đã cập nhật S4 theo design mới và ảnh dialog người dùng: xem [hồ sơ cập nhật S4](phase-000-foundation-auth/settings-profile-update.md) để biết phạm vi, ảnh native, 102 tests và kết quả Maestro hiện hành. Emulator được mở dạng UI theo yêu cầu. Không thay cổng nghiệm thu phase.
