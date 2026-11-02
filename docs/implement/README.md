# Danh mục triển khai theo phase

**P5 hiện hành — 02/11/2026:** Đã triển khai UI/API 5/5, bỏ cổng UI accept riêng theo ADR-027 và E2E theo ADR-030; chưa nghiệm thu. [Kiểm chứng/giới hạn](phase-005-manager-operations-cash/api-integration.md). Các ghi nhận P5 chờ design/code bên dưới là lịch sử.

**P3 hiện hành — 02/11/2026:** đã triển khai mã UI/API trực tiếp theo chỉ thị bỏ chờ UI accept; xem [hồ sơ và bằng chứng](phase-003-material-review/api-integration.md). E2E đã dừng theo yêu cầu người dùng, sẽ chạy lại khi được yêu cầu; chưa nghiệm thu. Các ghi nhận chờ design/Q-MAT-01 trước đó là lịch sử.

**P3 — cập nhật chỉ thị triển khai 02/11/2026:** Người dùng yêu cầu “Triển khai phase 3”; đã ghi nhận chỉ thị và tách 6 kế hoạch slice. Q-MAT-01 đã chốt: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối. Chưa có design Claude/test case nên UI TDD chờ theo ADR-009; UI/API 0/6. Các dòng chờ duyệt kế hoạch tổng hoặc Q-MAT-01 bên dưới là lịch sử trước chỉ thị này.

## Chuẩn chung áp dụng cho các phase

Áp dụng [ADR-025 — Accepted](../adr/ADR-025-shared-ui-data-loading-and-verification-rules.md) khi lập kế hoạch, triển khai hoặc sửa màn: xác định lựa chọn ban đầu và thời điểm tải theo status/ngày/tab; phân biệt dữ liệu chưa tải/rỗng/lỗi; quy định skeleton, feedback, cache/offline, spacing, quyền và kiểm chứng source hiện tại. Mở màn/Back/chuyển tab trực tiếp, không animation. Áp dụng trong phạm vi công việc được giao, không tự refactor phase khác; chi tiết nghiệp vụ/design vẫn theo kế hoạch đã duyệt.

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

**Done — người dùng nghiệm thu 01/11/2026; UI/API 7/7, slice hoàn chỉnh 7/7.** [Hồ sơ phase 1](phase-001-teaching-workspace/README.md) · [Kế hoạch tổng](phase-001-teaching-workspace/phase-001-teaching-workspace.md) · [Rà soát và dọn dẹp](phase-001-teaching-workspace/review-cleanup.md).

Phạm vi công việc: `P1-S1 — mentor-schedule`; `P1-S2 — mentor-classes`; `P1-S3 — mentor-class-detail`; `P1-S4 — session-context`; `P1-S5 — mentor-students`; `P1-S6 — manager-classes`; `P1-S7 — manager-class-detail`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p1-teaching-workspace) và [tiến độ/cổng còn chờ](../progress/phase/phase-001-teaching-workspace.md) trước khi bắt đầu.

<a id="phase-002-attendance-and-notes"></a>

## phase-002-attendance-and-notes

P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction.

**01/11/2026 — đã có design, tách kế hoạch và triển khai mã [UI mock 7/7 để review](phase-002-attendance-and-notes/ui-review.md).** [Hồ sơ phase 2](phase-002-attendance-and-notes/README.md) · [Kế hoạch tổng](phase-002-attendance-and-notes/phase-002-attendance-and-notes.md). UI được người dùng duyệt 7/7 ngày 02/11/2026 theo chỉ thị “Duyệt UI phase 2”; đã nối API 7/7 theo yêu cầu “Tích hợp api đi”, xem [hồ sơ P2](phase-002-attendance-and-notes/api-integration.md).

Phạm vi công việc: `P2-S1 — attendance-editor`; `P2-S2 — teaching-note-editor`; `P2-S3 — incomplete-sessions`; `P2-S4 — manager-attendance`; `P2-S5 — attendance-correction`; `P2-S6 — attendance-recovery`; `P2-S7 — attendance-audits`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p2-attendance-and-notes) và [tiến độ/cổng còn chờ](../progress/phase/phase-002-attendance-and-notes.md) trước khi bắt đầu.

<a id="phase-003-material-review"></a>

## phase-003-material-review

P3 — Mentor tải tài liệu → Manager duyệt/công bố.

**02/11/2026 — đã lập kế hoạch tổng, chờ người dùng duyệt; chưa tách slice hoặc triển khai code.** [Hồ sơ phase 3](phase-003-material-review/README.md) · [Kế hoạch tổng](phase-003-material-review/phase-003-material-review.md). Q-MAT-01 và design Claude còn chờ; UI/API 0/6.

Phạm vi công việc: `P3-S1 — mentor-materials`; `P3-S2 — material-editor`; `P3-S3 — mentor-material-detail`; `P3-S4 — material-review-queue`; `P3-S5 — material-review-detail`; `P3-S6 — material-preview`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p3-material-review) và [tiến độ/cổng còn chờ](../progress/phase/phase-003-material-review.md) trước khi bắt đầu.

<a id="phase-004-leave-and-makeup"></a>

## phase-004-leave-and-makeup

P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật.

Đã lập [kế hoạch tổng](phase-004-leave-and-makeup/phase-004-leave-and-makeup.md) ngày 02/11/2026, **chờ người dùng duyệt**; [hồ sơ phase](phase-004-leave-and-makeup/README.md). Chưa tách kế hoạch slice, chưa có design Claude hoặc code P4; UI/API 0/7. Q-LEAVE-01 và Q-MAKEUP-01 còn mở, S6/S7 placement vẫn là đề xuất.

Phạm vi công việc: `P4-S1 — mentor-leave-list`; `P4-S2 — leave-plan-editor`; `P4-S3 — mentor-leave-detail`; `P4-S4 — leave-review-queue`; `P4-S5 — leave-review-detail`; `P4-S6 — makeup-conflicts`; `P4-S7 — makeup-placement-editor`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p4-leave-and-makeup) và [tiến độ/cổng còn chờ](../progress/phase/phase-004-leave-and-makeup.md) trước khi bắt đầu.

<a id="phase-005-manager-operations-cash"></a>

## phase-005-manager-operations-cash

P5 — Manager phân công/xử lý lịch → xác nhận CASH.

**Hiện hành 02/11/2026:** Đã nhận yêu cầu triển khai, chốt phạm vi dạy thay theo buổi/đơn thanh toán tiền mặt và chuẩn bị [5 checklist slice](phase-005-manager-operations-cash/README.md#kế-hoạch-theo-slice). Chờ [design Claude/test case](phase-005-manager-operations-cash/design-handoff.md) trước code; UI/API 0/5. Ghi nhận “chờ duyệt/chưa tách” của lượt lập tổng bên dưới là lịch sử.

**02/11/2026 — đã lập kế hoạch tổng, chờ người dùng đọc duyệt; UI/API 0/5.** [Hồ sơ phase 5](phase-005-manager-operations-cash/README.md) · [Kế hoạch tổng](phase-005-manager-operations-cash/phase-005-manager-operations-cash.md). Chưa tách slice, chưa có design Claude và chưa triển khai code.

Phạm vi công việc: `P5-S1 — substitute-assignment`; `P5-S2 — reschedule-session`; `P5-S3 — replacement-session`; `P5-S4 — cash-orders`; `P5-S5 — cash-order-detail`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p5-manager-operations-cash) và [tiến độ/cổng còn chờ](../progress/phase/phase-005-manager-operations-cash.md) trước khi bắt đầu.

<a id="phase-006-mentor-quiz"></a>

## phase-006-mentor-quiz

P6 — Mentor tạo quiz → công bố → theo dõi trạng thái.

**02/11/2026 — đã nối UI/API 3/3; chưa nghiệm thu.** [Hồ sơ API](phase-006-mentor-quiz/api-integration.md) · [Kế hoạch tổng](phase-006-mentor-quiz/phase-006-mentor-quiz.md). Chỉ thị “Tích hợp luôn api” mở cổng API theo ADR-032; E2E tiếp tục miễn theo yêu cầu người dùng.

Phạm vi công việc: `P6-S1 — quiz-list`; `P6-S2 — quiz-editor`; `P6-S3 — quiz-detail`.

Đối chiếu [kế hoạch chi tiết](../implementation-plan.md#p6-mentor-quiz) và [tiến độ/cổng còn chờ](../progress/phase/phase-006-mentor-quiz.md) trước khi bắt đầu.

<a id="phase-007-attendance-progress-reports"></a>

## phase-007-attendance-progress-reports

P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa.

**02/11/2026 — người dùng đã duyệt kế hoạch tổng; đã tách [hai kế hoạch slice](phase-007-attendance-progress-reports/README.md#kế-hoạch-theo-slice), UI/API 0/2.** [Hồ sơ phase 7](phase-007-attendance-progress-reports/README.md) · [Kế hoạch tổng](phase-007-attendance-progress-reports/phase-007-attendance-progress-reports.md). Không sử dụng SpecKit; chưa có chỉ thị implement hoặc code. Q-P1-01 cho báo cáo/KPI, policy và design/test case Claude còn chờ.

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
