# Phase 7 — Kế hoạch triển khai báo cáo chuyên cần và stored progress

Ngày lập: **02/11/2026 (Asia/Bangkok)**. Người soạn: Codex.

**Người dùng đã duyệt kế hoạch tổng ngày 02/11/2026 qua phản hồi “Duyệt”.** Đã tách [hai kế hoạch slice](README.md#kế-hoạch-theo-slice) theo ADR-017, không sử dụng SpecKit. Chưa có chỉ thị implement, chưa tạo design, viết UI, nhập contract hoặc tích hợp API. Các câu hỏi/policy còn mở bên dưới giữ nguyên. UI 0/2, API 0/2, slice hoàn chỉnh 0/2; xem [tiến độ thực tế](../../progress/phase/phase-007-attendance-progress-reports.md).

## 1. Mục tiêu và phạm vi

Cho Mentor chính đọc chuyên cần và dữ liệu progress đã lưu của lớp; cho Manager đọc chuyên cần theo từng enrollment trong lớp. Diễn đạt rõ nguồn, phạm vi, thời điểm và chất lượng dữ liệu, tránh biến dữ liệu thiếu thành 0% hoặc kết luận hoàn thành học tập.

Giữ baseline hai slice của [P7](../../implementation-plan.md#p7-attendance-progress-reports), ưu tiên P1 trong roadmap; phụ thuộc P1/P2/P4 và phạm vi KPI được chốt. Việc lập kế hoạch không xác nhận các phase phụ thuộc đã nghiệm thu hoặc thay đổi phạm vi MVP P0–P5.

| Slice | Kết quả cần đạt | BR / UC | Phụ thuộc |
| --- | --- | --- | --- |
| P7-S1 — mentor-attendance-report | Báo cáo chuyên cần theo enrollment; mở summary/history của học viên; xem stored progress lớp và từng unit của học viên | BR-REPORT-01/02; UC-M-12 | P1-S3, P2-S1; P4 cho tình huống học bù |
| P7-S2 — manager-attendance-report | Báo cáo chuyên cần theo enrollment trong lớp, đúng công thức server, range và phân trang | BR-REPORT-01/02/03; UC-MG-10 | P1-S7, P2-S4; P4 cho tình huống học bù |

Chi tiết học viên, tab progress, loading/empty/error/denied là trạng thái hoặc phần nội dung trong slice; không tự tăng số UI. Hình thức trình bày chi tiết do design quyết định.

Ngoài baseline: dashboard nhiều lớp, doanh thu, KPI so sánh/xếp hạng/cảnh báo, SLA, chứng chỉ, tỷ lệ hoàn thành tự tính, điểm quiz/assignment, export/chia sẻ báo cáo, mutation điểm danh/progress và báo cáo toàn lớp cho Mentor chỉ có SESSION. Manager progress hoặc lịch sử chi tiết học viên chưa có endpoint tương ứng trong nhóm controller khảo sát; không gọi API Mentor/Student để bù khoảng trống.

## 2. Hiện trạng và nguồn khảo sát

- App đã có module auth, teaching, attendance, leave và các primitives/theme/vi-en. Đề xuất tách `src/modules/reports/` cho P7, tái sử dụng public types/helpers phù hợp; không trộn màn đọc báo cáo với editor điểm danh P2.
- Chưa có hồ sơ design `attendance-progress-reports`, contract P7 hoặc module reports tại lần lập này. Working tree có nhiều thay đổi từ phase khác; lượt này chỉ tạo hồ sơ P7 và đồng bộ mục lục/nhật ký liên quan.
- Đã đọc source backend cạnh repo ngày 02/11/2026: [controller Mentor](../../../../Mindy-BE/src/modules/attendance/controllers/mentor-attendance-reports.controller.ts), [controller management](../../../../Mindy-BE/src/modules/attendance/controllers/attendance-reports.controller.ts), [DTO query](../../../../Mindy-BE/src/modules/attendance/dtos/attendance-report-query.dto.ts), [DTO chung](../../../../Mindy-BE/src/modules/attendance/dtos/attendance-report.dto.ts), [DTO Mentor](../../../../Mindy-BE/src/modules/attendance/dtos/mentor-attendance-report.dto.ts), [credit domain](../../../../Mindy-BE/src/modules/attendance/domain/attendance-credit.ts), [projection](../../../../Mindy-BE/src/modules/attendance/services/attendance-projection.service.ts) và hai service [Mentor](../../../../Mindy-BE/src/modules/attendance/services/mentor-attendance-reports.service.ts), [management](../../../../Mindy-BE/src/modules/attendance/services/attendance-reports.service.ts).
- Nguồn progress/quyền: [workspace controller](../../../../Mindy-BE/src/modules/classes/controllers/mentor-workspace.controller.ts), [workspace scope](../../../../Mindy-BE/src/modules/classes/services/mentor-workspace.service.ts), [Mentor progress](../../../../Mindy-BE/src/modules/classes/services/mentor-progress.service.ts), [stored progress DTO](../../../../Mindy-BE/src/modules/enrollments/dtos/stored-progress.dto.ts), [stored progress service](../../../../Mindy-BE/src/modules/enrollments/services/stored-progress.service.ts) và [pagination](../../../../Mindy-BE/src/common/dtos/page-options.dto.ts).

Đây là khảo sát source để lập kế hoạch, chưa phải contract snapshot, xác nhận backend deploy hoặc kiểm chứng API runtime. Không chạy backend mutation trong lượt này.

Áp dụng ADR-004/005/007/008 cho query, schema, quyền, lỗi và thời gian; ADR-009/012/014/016/017 cho nguồn design và trình tự; ADR-018/019/025 cho tải dữ liệu/auth/UI; ADR-020/026 cho E2E. Tra [sổ ADR](../../adr/README.md) để biết hiệu lực. Ngoại lệ triển khai trực tiếp ở phase khác không tự áp dụng cho P7.

## 3. Cổng và điểm cần chốt

| Cổng / câu hỏi | Nội dung | Điều kiện tiếp theo |
| --- | --- | --- |
| Duyệt kế hoạch tổng — đã đáp ứng | Người dùng phản hồi “Duyệt” ngày 02/11/2026 | Đã tách hai kế hoạch slice theo ADR-017; không đồng nghĩa chỉ thị code/duyệt UI |
| Q-P1-01 — phần báo cáo | Chốt baseline chuyên cần hai role, stored progress chỉ Mentor; có yêu cầu KPI khác không | Chốt trước design/code; KPI thiếu nguồn cần contract và quyết định riêng |
| Phụ thuộc roadmap | P1/P2/P4 và cổng nghiệm thu MVP theo baseline | Không suy nghiệm thu từ việc đã có code |
| Design/test case Claude | Đủ S1/S2, hàng dài, dữ liệu thiếu/sai, phạm vi enrollment/học viên, lỗi từng phần và quyền | Codex chỉ đọc nguồn design, không tự tạo/sửa |
| Policy dữ liệu | Cache báo cáo học viên, offline, logout và retention | Đề xuất RAM-only; không persist PII/báo cáo vào MMKV |
| Chỉ thị implement | Yêu cầu triển khai sau khi đọc kế hoạch | UI mock TDD toàn phase khi đủ đầu vào |
| Approve UI toàn phase | Người dùng duyệt S1 và S2 | Sau đó mới nhập contract/schema/service/hook API |
| Kiểm chứng/nghiệm thu | Cleanup, lint/typecheck/Jest, build, Maestro và hồi quy; Q-PLAT-01 | Có bằng chứng thực tế; chỉ người dùng nghiệm thu mới Done |

Đề xuất mặc định toàn bộ khoảng thời gian cho chuyên cần, không chọn unit cho progress, page=1/pageSize=20. Bộ lọc ngày/unit và cách trình bày chi tiết cần chốt trong design; không tự thêm search/status/sort mà endpoint không hỗ trợ.

## 4. Mapping API dự kiến

Đường dẫn dưới đây lấy từ controller; ghép global prefix/base URL theo cấu hình ở bước contract, không đoán host hoặc tự thêm `/api`.

| Slice / phần | Endpoint khảo sát | Ý nghĩa |
| --- | --- | --- |
| S1 / chuyên cần lớp | `GET /mentor/classes/:classId/attendance-summary` | Danh sách summary theo enrollment; Mentor chính |
| S1 / học viên | `GET /mentor/classes/:classId/students/:studentId/attendance-summary` | `aggregationScope=STUDENT_CLASS_HISTORY`, có thể trải nhiều enrollment |
| S1 / lịch sử học viên | `GET /mentor/classes/:classId/students/:studentId/attendance` | History physical và metadata credit, phân trang |
| S1 / progress lớp | `GET /mentor/classes/:classId/progress` | Số unit stored/untracked/invalid theo enrollment; tùy chọn unitId |
| S1 / progress học viên | `GET /mentor/classes/:classId/students/:studentId/progress` | Unit theo enrollment của học viên, phân trang |
| S2 / chuyên cần lớp | `GET /management/classes/:classId/attendance-summary` | Summary theo enrollment; controller cho ADMIN/MANAGER, app P7 chỉ mở Manager |

Attendance list/history nhận page/pageSize và cặp from/to tùy chọn; summary học viên chỉ nhận cặp from/to. Cả hai mốc phải là ISO instant có timezone, from < to, tối đa 93 ngày; bỏ cả hai là không giới hạn range. Backend dùng điều kiện giao khoảng `starts_at < to && ends_at > from`; không tự lọc/cộng history một trang để thay summary. Credit chain được xử lý trước range tại server; không tự suy credit theo ngày target học bù.

Progress summary nhận page/pageSize và unitId tùy chọn; progress học viên chỉ page/pageSize. Không gửi range attendance sang progress hoặc mô tả stored progress là snapshot trong khoảng ngày đã chọn. Các page dùng `items/total/page/pageSize`, page bắt đầu 1, pageSize mặc định 20, tối đa 100. Mỗi response có asOf/timeZone; các request riêng không phải cùng một transaction snapshot.

Sau approve UI, hồ sơ contract dự kiến ở `docs/api-contract/phase-007-attendance-progress-reports/`, gồm README và contract hai slice; legacy snapshot có manifest nguồn/ngày. Các đường dẫn này chưa tồn tại. Đồng bộ mapping P7 và đích dự kiến trong implementation-plan khi tạo contract thật.

## 5. Quyền và diễn giải dữ liệu

1. Mentor endpoints chuyên cần/progress đều gọi workspace scope với `primaryOnly=true`: chỉ Mentor chính active được đọc toàn lớp. Mentor dạy thay SESSION không được gọi report dù được xem buổi/roster P1/P2. Ẩn entry theo quyền và kiểm lại khi mở/deep link/refetch; không dùng API management/Student hoặc cache cũ để fallback.
2. Manager dùng management endpoint, giữ kiểm account/role/scope server. Không tạo Admin workspace chỉ vì controller cho ADMIN. Lớp completed/cancelled có thể đọc lịch sử theo quyền server; P7 luôn chỉ đọc, không thêm correction/start/finalize hoặc sửa progress.
3. `rate` do server trả, tính PRESENT/(PRESENT+ABSENT) ×100 từ credit đã chốt, làm tròn hai chữ số tại server. `finalizedEligibleCount` là mẫu số; bằng 0 thì rate=null. UI hiển thị chưa đủ dữ liệu, không dùng `rate || 0` hoặc coi null là 0%.
4. present/absent/unmarked/excluded/makeupPending hiển thị riêng theo nguồn. Physical `attendanceStatus` khác `creditedAttendanceStatus`; null không đồng nghĩa ABSENT. Replacement/placement và đăng ký lại không được đếm đôi; UI không tái hiện SQL credit để tự tính kết quả.
5. Class summary là hàng theo enrollmentId, không nhất thiết một hàng duy nhất cho studentId. Dùng enrollmentId làm key; history dùng composite key có enrollmentId/sessionId; progress unit dùng enrollmentId/classUnitId. Summary học viên có scope STUDENT_CLASS_HISTORY, không ghi nhãn nó là summary chỉ của enrollment đang chọn.
6. `total` là tổng hàng của query. Response class summary không có tỷ lệ/tổng KPI cả lớp độc lập; không cộng một trang, trung bình các rate hoặc quét mọi trang để tự dựng KPI mới. Hai tab attendance/progress không join theo vị trí hàng vì có paging độc lập.
7. Progress summary chỉ có storedUnitCount/untrackedUnitCount/invalidStoredUnitCount, không phải phần trăm hoàn thành. Unit DTO giữ progressPercent là decimal string hoặc null; trackingStatus STORED/UNTRACKED và dataQuality VALID/INVALID_PERCENT/UNTRACKED là các chiều riêng. Có record STORED nhưng percent null có thể có dataQuality UNTRACKED; không ép chúng thành một cờ.
8. `"0.00"` hợp lệ là 0%, khác thiếu dữ liệu. INVALID_PERCENT hiển thị dữ liệu không hợp lệ, không clamp về 0/100. Không lấy completedAt/status hoặc tỷ lệ chuyên cần làm quy tắc hoàn thành; `completionPolicy=UNDEFINED`, `policyVersion=null`. `assignmentSummary.availability=NOT_IMPLEMENTED`, counts=null không phải chưa có bài tập hoặc 0 điểm.
9. Hiển thị asOf/timeZone theo nguồn, UTC+7 cho thao tác calendar nghiệp vụ theo ADR-008. Nếu chọn ngày kết thúc bao gồm cả ngày, adapter đổi sang mốc đầu ngày kế tiếp của timezone nghiệp vụ; kiểm lại giới hạn 93 ngày. Không ép date-only qua UTC midnight.
10. Tách lỗi validation range/UUID, 401, 403, 404 (`CLASS_STUDENT_NOT_FOUND` khi có), network/timeout và 5xx theo error adapter; giữ requestId. Chốt đủ code lỗi từ source/runtime ở bước contract, không tự phát minh code. GET thất bại không trả mock hoặc báo cáo rỗng thành công.

## 6. Tải dữ liệu, cache và UI

Các lựa chọn sau là đề xuất chờ design/policy, áp dụng ADR-025.

| Phần đang mở | Lựa chọn ban đầu / tải dữ liệu | Refresh / phân trang |
| --- | --- | --- |
| Mentor report | Entry từ lớp giữ classId; tab chuyên cần, không range, page 1 | Chỉ tải summary lớp; đổi range reset trang; chưa mở progress thì chưa tải |
| Mentor học viên | Chọn học viên mới tải summary và history của đúng studentId | Lỗi từng phần độc lập; history paging riêng; đóng/mở hoặc focus refetch theo policy |
| Mentor progress | Chỉ khi chọn tab; không unit filter, page 1 | Unit filter chỉ áp dụng summary progress; mở học viên mới tải units, không gọi từng hàng |
| Manager report | Entry từ lớp Manager giữ classId; không range, page 1 | Chỉ endpoint management; đổi range reset trang; không dựng tab progress giả |

Query key gồm account/role, classId, resource, studentId/unitId khi có, range và page. Attendance, history, progress có pagination riêng. Đổi query/resource/account không hiển thị kết quả cũ dưới nhãn mới; request cũ không ghi đè request mới. Load more chỉ chạy phần đang mở, chống trùng, giữ hàng đã tải và retry đúng trang lỗi.

Đề xuất giữ dữ liệu trong RAM của đúng tài khoản; không persist/log danh sách học viên và báo cáo. Offline có thể giữ dữ liệu đã tải read-only với thời điểm nguồn và cảnh báo có thể cũ; chưa tải không giả empty. Offline không có Retry. Online/focus/pull-to-refresh tải lại query đang dùng; thay phân công, mất quyền, logout/đổi account phải che/xóa cache liên quan theo auth boundary. Không coi `private, no-store` là quyền persist local; policy phải được chốt trước code.

Sau thay đổi điểm danh/correction/recovery P2, replacement/placement P4/P5, invalidate/refetch báo cáo liên quan khi quay lại; không tự tăng giảm count ở client. Progress không được đổi theo attendance mutation. Kiểm cơ chế hiện hành để tránh tạo vòng refetch hoặc tải mọi lớp.

Skeleton bám cấu trúc thật; loading phần nào hiện ở phần đó. Content/empty đặt trước warning/Retry, refresh lỗi có thể giữ đúng query. Phân biệt chưa tải/rỗng/lỗi/0 thật; không giả số đếm tab chưa tải. Không thêm request theo từng hàng để trang trí.

Điều hướng/Back/tab trực tiếp, không animation/gesture chuyển màn. Design cần vi/en, light/dark, accessibility, tên học viên dài, chữ lớn, giải thích mẫu số/credit/progress và scrolling danh sách dài. Tái sử dụng primitives/token; không tự sao layout P1 hoặc sửa design Claude.

## 7. Trình tự triển khai sau khi đủ đầu vào

| Bước | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| P7-01 | Duyệt kế hoạch tổng, chốt phần báo cáo Q-P1-01, policy và phụ thuộc | Ghi phản hồi thật; không tự đóng câu hỏi |
| P7-02 | Tách hai kế hoạch slice; nhận design/test case Claude toàn phase | Đủ trạng thái, quyền và diễn giải dữ liệu S1/S2 |
| P7-03 | Sau chỉ thị implement: test fail → model/fixture/UI mock S1 | Null/0, credit, enrollment/history và progress pass |
| P7-04 | Test fail → UI mock S2 | Range, paging, denied và giới hạn KPI pass |
| P7-05 | Rà UI toàn phase, ảnh native, entry P1 và quyền SESSION | Người dùng approve UI hai slice trước API |
| P7-06 | Nhập snapshot/contract; schema/adapter/service tests fail → pass | Wire/null/decimal/timezone/paging/error đúng nguồn |
| P7-07 | Tích hợp Mentor attendance → progress → Manager summary | Không fallback mock; race/auth/invalidation đúng scope |
| P7-08 | Cleanup, lint/typecheck/Jest, build, Maestro toàn phase/hồi quy | Bằng chứng trên source hiện tại; thiếu dữ liệu ghi blocked/skipped |
| P7-09 | Đồng bộ hồ sơ và trình nghiệm thu | Người dùng xác nhận mới Done |

Kiến trúc dự kiến `src/modules/reports/`: screens/components, hooks, services/schema, model/types, messages và public index theo module hiện hành. Entry từ MentorClassDetail/ManagerClassDetail qua public interface, giữ classId và role; component không gọi HTTP trực tiếp. Dùng shared HTTP/auth/query/error, không sửa backend trong phạm vi kế hoạch này.

## 8. Ma trận kiểm chứng

| Nhóm | Ca kiểm bắt buộc |
| --- | --- |
| Quyền | Mentor chính, dạy thay SESSION, người ngoài, Manager; deep link sai role/class/student; mất phân công/inactive; 401/403/404; lịch sử lớp đóng |
| Chuyên cần | Mẫu số 0 → null, mẫu số >0 với rate=0 thật, 100%, làm tròn; unmarked/excluded/pending tách riêng; physical khác credited |
| Học bù/enrollment | Replacement chain, placement pending/completed/reassigned, guest credit, hủy/đăng ký lại; không đếm đôi; summary học viên khác enrollment row |
| Range/thời gian | Bỏ range, thiếu một mốc, from=to/đảo, thiếu timezone, 93 ngày và vượt; giao khoảng ở biên; ngày UTC+7; range không áp lên stored progress |
| Progress | Không record, STORED có percent null, 0.00/100 hợp lệ, INVALID_PERCENT, trạng thái/percent mâu thuẫn; policy undefined, assignment không triển khai; nhiều enrollment/unit |
| Dữ liệu | Empty/chưa tải/lỗi từng phần/offline; nhiều trang, lỗi load more; total không phải KPI; hai tab paging độc lập; không gọi detail từng hàng |
| Cache/race | Đổi lớp/filter/student/unit/account khi request chưa xong; mất quyền; response cũ; refresh lỗi; P2/P4/P5 thay nguồn rồi quay lại |
| UI native | Text dài, chữ lớn, vi/en, light/dark, accessibility, skeleton/feedback, Back và scroll; xem ảnh thiết bị thật |
| Hồi quy | Auth refresh/logout/denied; entry và scope CLASS/SESSION P1; luồng điểm danh P2 và học bù P4/P5 liên quan |

Khi triển khai, chạy `npm run lint` (gồm type-check), `npm test -- --runInBand` và `npm run build:android`; chạy riêng `npm run lint:type-check` khi cần khoanh vùng. Ghi command và kết quả thật; test/độ bao phủ theo design/contract, không dùng test phase khác làm bằng chứng P7.

Command E2E công khai duy nhất dự kiến: `npm run test:e2e:phase-7` theo ADR-020/026, **chưa tồn tại**. Khi triển khai tạo runner tại scripts và flow dưới `.maestro/phase-007-attendance-progress-reports/`; một command kiểm môi trường/API, chuẩn bị dataset mới, chạy Maestro S1/S2 và hồi quy. Không tạo command rỗng ở lượt kế hoạch.

Dataset cần Mentor chính/dạy thay/người ngoài, Manager, lớp nhiều trang, học viên nhiều enrollment, no-credit/rate 0 thật, replacement/placement, stored/untracked/invalid progress và lớp đóng. P7 chỉ GET; tạo fixture qua công cụ thử nghiệm được phép, không sửa lịch sử nghiệp vụ thật. Nếu nguồn P2/P4 chưa đủ fixture hoặc backend deploy khác source thì ghi rõ blocker; không giả pass bằng mock.

Runner trả exit code khác 0 khi API/chuẩn bị dataset/flow thất bại hoặc bị ngắt. API pass không thay E2E native. Lưu build, thiết bị/OS, backend/dataset, log/report/screenshot và kết quả từng flow; Q-PLAT-01 giữ giới hạn nền tảng iOS riêng.

## 9. Điều kiện bàn giao

- Đủ S1/S2 theo phạm vi đã chốt, có design/contract và bằng chứng quyền/nguồn dữ liệu.
- UI được duyệt trước API; chuyên cần/progress không tự sinh KPI hoặc quy tắc hoàn thành.
- Cleanup, lint 0 error/0 warning, typecheck/Jest, build và Maestro toàn phase/hồi quy pass trên bản hiện tại.
- Đồng bộ README/progress/mapping, nêu blocker/giới hạn và commit/PR thật nếu có; người dùng nghiệm thu mới Done.

Lượt lập kế hoạch chỉ kiểm tài liệu và liên kết; không chạy test ứng dụng, không tạo bằng chứng API/E2E hoặc sửa BR/ADR Accepted.
