# Phase 4 — Kế hoạch triển khai Leave and Makeup

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Chỉ thị triển khai 02/11/2026:** Người dùng yêu cầu “Triển khai phase 4”. Đã nhận quyền triển khai UI khi đủ đầu vào, không yêu cầu xác nhận lại chỉ thị implement. Kiểm tra repo vẫn chưa có `docs/design/leave-and-makeup/`; Q-LEAVE-01, Q-MAKEUP-01 và policy dữ liệu còn chờ. Đã hỏi đường dẫn design và quyết định nghiệp vụ; chưa viết UI/API, chưa tách task chi tiết từ design. Đoạn “lượt này chỉ lập tài liệu” bên dưới mô tả lượt lập kế hoạch trước chỉ thị triển khai.

**Kế hoạch tổng chờ duyệt.** Lượt này chỉ lập tài liệu; UI 0/7, API 0/7, slice hoàn chỉnh 0/7. Chưa tách kế hoạch slice, viết design, code hoặc chạy API/mutation. Theo [ADR-016](../../adr/ADR-016-plan-before-implementation.md) và [ADR-017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md), duyệt kế hoạch cho phép tách tài liệu; code cần chỉ thị implement và đủ điều kiện đầu vào. API chỉ triển khai sau khi người dùng approve UI toàn phase.

## 1. Mục tiêu và phạm vi

Mentor xem đơn của mình, preview buổi bị ảnh hưởng, lập phương án bù, gửi đơn và theo dõi/rút đơn. Manager xem hàng đợi, kiểm tra phương án và xung đột, duyệt/từ chối; sau duyệt lịch nguồn và lịch replacement được cập nhật. Giữ **7 slice** theo [baseline P4](../../implementation-plan.md#p4-leave-and-makeup), ưu tiên sản phẩm P0, phụ thuộc P0/P1/P2.

| Slice                           | Kết quả cần đạt                                                | BR / UC                                 | Phụ thuộc                     |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------- | ----------------------------- |
| P4-S1 — mentor-leave-list       | Danh sách đơn thuộc Mentor đang đăng nhập, lọc đúng trạng thái | BR-LEAVE-01/04; UC-M-09/10              | P0-S1                         |
| P4-S2 — leave-plan-editor       | Khoảng ngày/ca → preview → chọn đủ mapping bù → gửi PENDING    | BR-LEAVE-01/02/03, BR-TEACH-03; UC-M-09 | P4-S1, P1-S1                  |
| P4-S3 — mentor-leave-detail     | Chi tiết nguồn/bù/kết quả, rút đơn hợp lệ có lý do             | BR-LEAVE-04; UC-M-09/10                 | P4-S1                         |
| P4-S4 — leave-review-queue      | Manager đọc/lọc/phân trang đơn cần xử lý                       | BR-LEAVE-04; UC-MG-05                   | P0-S1                         |
| P4-S5 — leave-review-detail     | Kiểm nguồn/conflict → approve/reject → kiểm lịch sau duyệt     | BR-LEAVE-04/05, BR-MAKEUP-01; UC-MG-05  | P4-S4, P1-S7                  |
| P4-S6 — makeup-conflicts        | Backlog học viên cần bù khác lớp, trạng thái chính xác         | BR-MAKEUP-02/03; UC-MG-06               | P4-S5; chờ Q-MAKEUP-01        |
| P4-S7 — makeup-placement-editor | Chọn candidate, xếp/hủy/xếp lại guest placement                | BR-MAKEUP-02/03; UC-MG-06               | P4-S6, P2-S1; chờ Q-MAKEUP-01 |

P4-S6/S7 là **đề xuất chưa chốt thuộc P0**. Không coi việc có endpoint là quyết định phạm vi. Nếu người dùng loại hai slice, phải ghi quyết định và đồng bộ baseline/design/tiến độ theo quy trình ADR trước khi đổi mẫu số hoặc duyệt UI toàn phase.

Phân biệt hai nghiệp vụ: **replacement** thay cả buổi nguồn bị hủy; **placement** xếp một học viên sang buổi lớp khác, tạo quyền guest tại buổi nhận. Confirmation, mapping, conflict, loading và feedback thuộc các slice hiện có. Không thêm quản trị Student/Admin, tạo lớp/enrollment/invoice, CASH, push/chat, dashboard KPI hoặc thao tác dời/hủy buổi độc lập của P5. Luồng nghỉ khẩn chưa được chốt, không tự dựng đường tắt bỏ notice.

## 2. Hiện trạng và nguồn đối chiếu

- [P0](../../progress/phase/phase-000-foundation-auth.md) đã được người dùng duyệt; [P1](../../progress/phase/phase-001-teaching-workspace.md) đã nghiệm thu ngày 01/11/2026. [P2](../../progress/phase/phase-002-attendance-and-notes.md) đã duyệt UI/nối API 7/7, còn chờ E2E/nghiệm thu và Q-PLAT-01. Không coi P2 là Done khi lập P4; kiểm lại trạng thái trước triển khai và hồi quy guest/credit.
- Đã có auth gate/cookie HTTP, role navigation, module teaching và attendance, context buổi, vi/en, theme và UI primitives. P4 dự kiến tái sử dụng public exports và entry point đúng role; giữ các thay đổi đang có trong working tree.
- Chưa có folder design `docs/design/leave-and-makeup/`, contract riêng hoặc module runtime P4 tại lúc lập kế hoạch. Codex không tạo/sửa design nguồn Claude.
- Đã đọc source backend cạnh repo ngày 02/11/2026: [Mentor controller](../../../../Mindy-BE/src/modules/teaching-operations/controllers/mentor-leave.controller.ts), [Manager controller](../../../../Mindy-BE/src/modules/teaching-operations/controllers/management-leave.controller.ts), [leave DTO](../../../../Mindy-BE/src/modules/teaching-operations/dtos/leave.dto.ts), [leave calendar](../../../../Mindy-BE/src/modules/teaching-operations/domain/leave-calendar.ts), [makeup controller](../../../../Mindy-BE/src/modules/attendance/controllers/makeup-management.controller.ts), [makeup DTO](../../../../Mindy-BE/src/modules/attendance/dtos/makeup.dto.ts). Chỉ xác minh source để lập kế hoạch, chưa xác minh backend deploy hoặc chạy mutation. Không sửa backend.

Áp dụng ADR-004/005/007/008/009 về dữ liệu, scope, lỗi, thời gian và TDD; ADR-016/017 về kế hoạch; ADR-018/019 về lazy loading và auth; ADR-025 về UI/tải dữ liệu; ADR-020/026 về E2E. Tra hiệu lực tại [sổ ADR](../../adr/README.md); kế hoạch này không thay quyết định Accepted hoặc tự giải quyết câu hỏi nghiệp vụ.

## 3. Cổng đầu vào và điểm cần chốt

| Cổng / câu hỏi            | Nội dung cần xác nhận hoặc bàn giao                                                                            | Phần phụ thuộc                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Duyệt kế hoạch tổng       | Người dùng đọc và duyệt tài liệu này                                                                           | Trước tách kế hoạch chi tiết theo slice                                         |
| Q-LEAVE-01                | Notice theo mốc lịch, tên/ranh giới ca, quy tắc bù; nghỉ khẩn hoặc 0 buổi ảnh hưởng chuyển luồng nào           | Trước design hoàn chỉnh và implement đơn nghỉ S1–S5                             |
| Q-MAKEUP-01               | Học bù khác lớp và hủy/xếp lại có bắt buộc P0 không, hay chỉ replacement cả lớp                                | Chốt phạm vi S6/S7 trước design/UI toàn phase                                   |
| Q-DATA-01 áp dụng P4      | Dữ liệu nào được giữ khi offline, thời hạn, draft form và xử lý app-kill/logout/đổi tài khoản                  | Chốt trong design trước code lưu/cache/draft; quyết định P2 không tự áp sang P4 |
| Design Claude toàn phase  | Design chung và mọi slice thuộc scope đã duyệt, đủ trạng thái, quyền, vi/en, theme, accessibility và test case | Trước UI TDD; thiếu thì bàn giao Claude/người dùng bổ sung                      |
| Chỉ thị implement         | Sau khi người dùng đọc kế hoạch và điều kiện đầu vào đã đủ                                                     | Trước code UI mock                                                              |
| Duyệt UI toàn phase       | Người dùng approve toàn bộ UI trong scope đã chốt                                                              | Trước contract/schema/service/hook/API integration                              |
| Contract và dữ liệu thử   | Snapshot đúng nguồn, DTO/quyền/error/version/key; tài khoản và dataset đúng role                               | Trước API thật và E2E phụ thuộc                                                 |
| Phụ thuộc P2 và Q-PLAT-01 | Kiểm lại E2E/nghiệm thu P2, chốt thiết bị/OS và mốc Android/iOS                                                | Trước kết luận tích hợp P2/guest và trình nghiệm thu P4                         |

Q-LEAVE-01/Q-MAKEUP-01 giữ nguyên tại [business rules](../../business-rules.md). Nếu câu trả lời thay luật đã duyệt, ghi ADR Proposed → người dùng duyệt → Accepted và đồng bộ changelog trước code phụ thuộc. Có thể chuẩn bị tài liệu/đọc source độc lập trong khi chờ; không tự đi qua cổng.

## 4. Ràng buộc nghiệp vụ và contract cần giữ

1. **Ngày và notice:** calendar date là `YYYY-MM-DD`; instant có timezone, chuẩn hóa UTC, hiển thị Asia/Ho_Chi_Minh theo ADR-008. Source hiện yêu cầu gửi trước 00:00 ngày ngay trước ngày buổi đầu tiên; ví dụ buổi 23/10 phải gửi trước 00:00 22/10, không gọi là 48 giờ. Ca MORNING 00–12, AFTERNOON 12–18, EVENING 18–24, FULL_DAY; tối đa 93 ngày và 500 buổi nguồn. Đây là căn cứ implementation chờ Q-LEAVE-01, không tự coi đã được duyệt nghiệp vụ.
2. **Preview và mapping:** đọc `noticeEligible`, `noticeDeadline`, `asOf`, `timeZone`, `affectedSessions`, `sourceVersions`; không tự suy đủ điều kiện từ đồng hồ máy. Slots theo source session/ngày/ca mục tiêu; sửa input liên quan làm preview/slot/mapping cũ hết hiệu lực. Source có `sessionMappings` và legacy `dayMappings` cho FULL_DAY, hai cách loại trừ nhau; cách dùng UI cần design/contract chốt, không tự đổi payload hoặc trộn hai kiểu.
3. **Submit:** đủ mapping cho tập nguồn; giữ version từng nguồn, lý do và key. Slot/candidate preview không giữ chỗ và không bảo đảm mutation thành công. Backend kiểm lại nguồn, lịch, nghỉ đã duyệt và thời lượng khi ghi.
4. **Trạng thái đơn:** PENDING/APPROVED/REJECTED/WITHDRAWN/EXPIRED; EXPIRED không còn là PENDING có thể duyệt/rút. Race approve/reject/withdraw phải theo trạng thái/version server; đồng hồ client chỉ hỗ trợ hiển thị.
5. **Duyệt:** lý do, `expectedVersion`, `Idempotency-Key`; đọc `sourcesCurrent` và conflict hiện hành. `acknowledgeStudentConflicts` là xác nhận tường minh, không mặc định true hoặc ghi nhớ từ đơn khác. Chi tiết Manager có conflict count/list; danh sách/mutation có thể trả `studentConflictCount: null`, không biến null thành 0 hay gọi detail cho từng hàng chỉ để có badge.
6. **Sau duyệt:** source bị hủy, replacement/audit/nghỉ và gia hạn lớp nếu cần nằm trong transaction backend. Chỉ hiển thị thành công theo response thật; tải lại lịch/context liên quan. Giữ chuỗi replacement tuyến tính, không copy điểm danh/thời gian thực sang buổi mới và không tạo nhánh từ source tổ tiên.
7. **Placement nếu được duyệt:** candidate cùng CourseUnit, còn chỗ, không trùng lịch. Create dùng version conflict và `expectedTargetVersion`, `contentMatchConfirmed: true`, lý do/key; cancel dùng version placement, không dùng nhầm version conflict. Xác nhận nội dung phải do người dùng thực hiện. Guest chỉ có quyền buổi nhận; credit hợp lệ tính một lần về nghĩa vụ gốc. Target bị hủy phải xếp lại, không tự tính ABSENT. Conflict status OPEN/MAKEUP_ASSIGNED/RESOLVED khác placement status ASSIGNED/COMPLETED/CANCELLED/NEEDS_REASSIGNMENT.
8. **Retry và lỗi:** cố định payload/version/key của intent đã gửi; retry cùng thao tác theo contract. 409 dừng và đối chiếu dữ liệu mới, không tự đổi version rồi replay. Timeout/mất response là kết quả chưa rõ, cần kiểm trạng thái trước khi tạo intent mới. Không queue approval/placement offline hoặc fallback mock khi API thật lỗi. 401/403/404/409/422 xử lý theo contract/quyền và giữ requestId khi có.

## 5. UI, tải dữ liệu và cache theo ADR-025

Các lựa chọn ban đầu sau là **đề xuất để duyệt và bàn giao Claude**, chưa phải design nguồn. Chỉ load phần đang mở; entry point Home không tự tải toàn bộ P4 hoặc gọi count cho từng status.

| Slice | Lựa chọn ban đầu đề xuất                                                  | Thời điểm tải và phân trang                                                                                                                      |
| ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1    | PENDING                                                                   | Trang đầu status đang chọn; đổi status reset trang, chỉ load status mới; không gán 0 cho tab chưa tải                                            |
| S2    | Ngày bắt đầu/kết thúc hôm nay theo ngày nghiệp vụ, FULL_DAY; chưa preview | Không gọi preview khi chỉ mở form. Bấm preview sau validation; chỉ lấy slots khi mở mapping một source và chọn ngày/ca mục tiêu                  |
| S3    | requestId được chọn, trang đầu items                                      | Tải chi tiết đúng ID; tải thêm items khi đang xem và còn itemCount; không hiểu một trang items là toàn đơn                                       |
| S4    | PENDING; chưa chọn mentorId                                               | Query theo status/mentorId đang dùng; phân trang đúng filter; không prefetch mọi trạng thái hoặc detail từng hàng                                |
| S5    | requestId được chọn, trang đầu items                                      | Đọc detail/current sources/conflict của đơn; dữ liệu chưa tải không được coi đủ để duyệt; kiểm contract phạm vi conflict và phân trang items     |
| S6    | OPEN; chưa chọn classId                                                   | Query backlog theo status/classId; chỉ tải thêm danh sách đang hiển thị                                                                          |
| S7    | conflictId được chọn, trang đầu candidates; chưa chọn target              | Chỉ tải candidates khi mở editor; from/to chỉ gửi khi người dùng đặt; chọn target chưa tự mutation; không tải roster từng candidate để trang trí |

Các list/detail dùng page/pageSize theo DTO; số tổng lấy nguồn server đúng phạm vi. Tải thêm không trùng request, lỗi retry đúng trang và giữ các hàng đã tải. Chi tiết mapping lớn phải hỗ trợ tập nguồn tới giới hạn contract, không cắt âm thầm một trang để submit. Request cũ không ghi đè query mới; tách query theo account/role/resource/status/filter/page, không hiển thị dữ liệu filter cũ dưới nhãn mới.

**Đề xuất dữ liệu P4 chờ Q-DATA-01/design:** chỉ giữ dữ liệu đọc/form trong RAM của tài khoản hiện hành; không persist qua MMKV/AsyncStorage và không queue/replay mutation. Draft mất khi app-kill/logout/đổi tài khoản phải được giải thích trong design. Khi offline chỉ giữ dữ liệu đọc đã tải của đúng query nếu policy được duyệt; ẩn dữ liệu mất quyền, khóa submit/withdraw/approve/reject/placement/cancel. Preview/slots/candidates cũ không được dùng để khẳng định còn khả dụng. Có kết nối thì refetch theo focus/pull-to-refresh; không tự gửi form.

UI phải phân biệt chưa tải/loading/empty/error/offline/no-permission/success/conflict; skeleton theo nội dung và footer chỉ khi tải thêm. Lỗi một phần giữ phần độc lập; empty/content trước warning và Retry. Offline chỉ warning, không Retry. Mở màn/Back/tab trực tiếp, giữ stack thật, không animation/gesture chuyển màn. Dùng spacing, vùng chạm và UI primitives hiện hành; vi/en, light/dark, bàn phím, nhãn trợ năng và reduced motion theo design. Không tự thêm blur/hiệu ứng lên từng hàng.

## 6. Mapping API cho bước sau duyệt UI

Mapping dưới đây đã đối chiếu controller cạnh repo; chưa phải contract/schema mobile hoặc kết quả API chạy thật. Dùng chung auth cookie và quyền server hiện hành; Mentor chỉ own requests, Manager đọc/thao tác management. App không cung cấp workspace ADMIN dù backend có cho ADMIN ở một số route.

| Slice | Route có trong source                                                                                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | `GET /mentor/leave-requests`                                                                                                                                                                                     |
| S2    | `POST /mentor/leave-requests/preview`; `POST /mentor/leave-requests/makeup-slots`; `POST /mentor/leave-requests`                                                                                                 |
| S3    | `GET /mentor/leave-requests/:requestId`; `POST /mentor/leave-requests/:requestId/withdraw`                                                                                                                       |
| S4    | `GET /management/mentor-leave-requests`                                                                                                                                                                          |
| S5    | `GET /management/mentor-leave-requests/:requestId`; `POST /management/mentor-leave-requests/:requestId/approve`; `POST /management/mentor-leave-requests/:requestId/reject`                                      |
| S6    | `GET /management/student-schedule-conflicts`                                                                                                                                                                     |
| S7    | `GET /management/student-schedule-conflicts/:conflictId/makeup-candidates`; `POST /management/student-schedule-conflicts/:conflictId/makeup-placement`; `POST /management/makeup-placements/:placementId/cancel` |

Sau approve UI: snapshot legacy có nguồn/ngày/checksum và phạm vi; đề xuất folder `docs/api-contract/phase-004-leave-and-makeup/` theo cách tổ chức P1/P2. Viết contract từng slice từ source và response thật: query/DTO, status/error code, nullability, pagination, ownership, idempotency/replay và version từng resource. Không dùng snapshot attendance làm bằng chứng đã hoàn chỉnh contract P4. Nếu runtime khác source thì ghi khác biệt và dừng phần phụ thuộc, không tự bịa endpoint hoặc sửa backend.

Mutation thành công cần invalidation có phạm vi: create/withdraw/reject cập nhật list/detail/status liên quan; approve cập nhật thêm lịch Mentor, lớp/buổi Manager, source/replacement và backlog; placement/cancel cập nhật conflict/candidates, roster/attendance guest và lịch/context chịu ảnh hưởng. Đánh dấu stale rồi refetch phần đang xem; không tải hàng loạt mọi ngày/tab hoặc tự suy credit từ UI.

## 7. Cấu trúc và thứ tự triển khai dự kiến

Các path sau là dự kiến, chưa tạo trong lượt lập kế hoạch:

| Vị trí                                                             | Trách nhiệm                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `docs/design/leave-and-makeup/design.md`, `<slice-slug>/design.md` | Claude bàn giao design chung và từng slice cùng test case                                                         |
| `src/modules/leave/`                                               | Screens/components/types/messages, mock boundary và public exports; tên module chốt theo kiến trúc khi triển khai |
| `src/modules/leave/services/`, `hooks/`                            | Chỉ sau approve UI: Zod schema, HTTP/query, mutation intent và xử lý conflict                                     |
| `src/modules/auth/AuthApp.tsx`, `src/navigation/`                  | Entry point Mentor/Manager, route params, role gate và lazy screen                                                |
| Public API teaching/attendance                                     | Liên kết context và refresh lịch/guest, tránh import sâu nội bộ module                                            |
| `__tests__/`, `scripts/`, `.maestro/phase-004-leave-and-makeup/`   | UI/API tests, runner và native flows sau khi mở cổng tương ứng                                                    |

| Bước           | Công việc                                                                                    | Điều kiện hoàn tất                                                          |
| -------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A — Kế hoạch   | Duyệt tổng, chốt Q-LEAVE-01/Q-MAKEUP-01 và chính sách dữ liệu                                | Có nguồn quyết định; mới tách tài liệu slice, cập nhật scope nếu được duyệt |
| B — Design     | Claude hoàn tất mọi design/test case; đối chiếu quyền, trạng thái và chuẩn UI                | Không thiếu slice trong scope; Codex không tự sửa design                    |
| C — UI Mentor  | Sau chỉ thị implement: UI test fail → mock pass theo S1 → S2/S3                              | List/form/detail dùng mock rõ ràng, không gọi HTTP P4                       |
| D — UI Manager | S4 → S5 → S6 → S7 nếu scope placement được duyệt; tích hợp entry point mock                  | Tất cả UI trong phase đủ trạng thái, vi/en/theme và test                    |
| E — Review UI  | Lint/typecheck/Jest, build/native review và hồ sơ ảnh/test case                              | Người dùng approve UI toàn phase; chưa qua thì chưa làm API                 |
| F — API        | Contract/snapshot, schema/service/hook test fail → pass; nối S1–S5, sau đó S6/S7 trong scope | API thật đúng quyền/version/key và không fallback mock                      |
| G — Kiểm chứng | Cleanup, check, build, E2E trọn phase và hồi quy liên quan                                   | Có bằng chứng hiện hành, ghi mọi failed/skipped/blocked                     |
| H — Nghiệm thu | Người dùng đọc bằng chứng và nghiệm thu                                                      | Mới cập nhật slice hoàn chỉnh/Done theo bằng chứng                          |

Sau duyệt tổng mới tạo các file `slice-001-mentor-leave-list.md` đến `slice-007-makeup-placement-editor.md` theo scope đã chốt; phân rã task/test cụ thể từ design. Không thêm các file này hoặc command placeholder trong lượt lập kế hoạch.

## 8. Kế hoạch kiểm thử và nghiệm thu

Đây là **coverage dự kiến để bàn giao Claude**, không thay test case design và chưa có kết quả chạy.

| Nhóm                      | Case bắt buộc                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quyền/dữ liệu             | Mentor đọc đơn người khác bị chặn; Mentor không vào management qua deep link; logout/đổi account xóa dữ liệu; 401/403 không lộ cache                                                        |
| List/detail               | Mỗi status, empty, phân trang/items chưa đủ, refresh/load-more fail; đổi filter khi request cũ còn chạy; null conflict count; EXPIRED không còn action                                      |
| Preview/mapping           | Biên notice UTC+7, ngày/ca hợp lệ, 93/94 ngày và 500/501 nguồn; 0 nguồn; thiếu/trùng mapping; sửa input sau preview; source/slot đổi; preserve duration                                     |
| Submit/review             | Double tap, timeout/mất response, retry cùng key, key/payload không khớp; stale version; approve đồng thời withdraw; sourcesCurrent=false; conflict mới; acknowledgment chưa chọn; EXPIRED  |
| Lịch sau duyệt            | Source CANCELLED, replacement đúng mapping và chuỗi leaf; class extension khi cần; lịch hai role/context refetch; không copy attendance thực tế                                             |
| Placement nếu thuộc scope | CourseUnit/chỗ/trùng lịch; chưa confirm nội dung; stale conflict/target/placement version; cancel/xếp lại; target hủy → NEEDS_REASSIGNMENT; guest roster/điểm danh và credit một lần qua P2 |
| UI/native                 | vi/en, light/dark, keyboard, vùng chạm/Back, screen reader, skeleton/feedback, offline không Retry, offline mutation bị khóa, reconnect không tự gửi                                        |

Kiểm tra khi triển khai: `npm run check` (lint 0 error/0 warning, format, `tsc --noEmit`, Jest), Android build/native và test phù hợp thay đổi. Chỉ tài liệu trong lượt này thì kiểm format/liên kết; không lấy unit/mock/build làm bằng chứng API/E2E native.

Theo [ADR-026](../../adr/ADR-026-single-e2e-command-per-phase.md), khi triển khai E2E P4 chỉ thêm **một command công khai** `npm run test:e2e:phase-4`. Command này **chưa tồn tại**, không hướng dẫn như lệnh có thể chạy hiện tại. Runner sau này tự chuẩn bị/kiểm API và dataset mới → chạy toàn bộ flow Maestro P4 → hồi quy liên quan; cùng backend/account/role, không log/commit credential. Bước chuẩn bị/API/dataset/native fail, thiếu môi trường hoặc bị ngắt phải trả nonzero, không dùng dataset cũ hoặc coi skipped là pass.

Dataset cần đơn hợp lệ cho submit/withdraw/reject/approve, nguồn/slot đúng notice, conflict có/không acknowledgment, version cũ, EXPIRED và target đủ/hết chỗ nếu placement được duyệt. Mỗi mutation dùng fixture riêng hoặc trạng thái xác minh lại; không giả định rollback đơn đã approve. Chỉ thao tác trên dữ liệu thử được phép.

Native flows cần bao phủ Mentor tạo/theo dõi/rút đơn; Manager từ chối và duyệt có/không conflict; kiểm lịch source/replacement hai role; placement/cancel/reassign/guest nếu thuộc scope. Hồi quy P0 auth/role, P1 lịch/lớp/context và P2 roster/attendance guest/credit theo đường bị ảnh hưởng. Ghi thiết bị/OS/backend/nguồn dữ liệu, command/exit code, ảnh native và giới hạn tại hồ sơ phase khi chạy; mốc iOS theo Q-PLAT-01.

Chỉ trình nghiệm thu khi UI toàn phase đã được duyệt, API trong scope có bằng chứng, checks và E2E bắt buộc pass, không còn blocked/skipped ảnh hưởng tiêu chí. Người dùng nghiệm thu mới đánh dấu Done. Tiến độ và nhật ký duy trì tại [progress P4](../../progress/phase/phase-004-leave-and-makeup.md), không quy đổi việc có kế hoạch thành hoàn tất UI/API.
