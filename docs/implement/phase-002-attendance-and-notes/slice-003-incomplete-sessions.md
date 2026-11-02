# P2-S3 — Buổi học cần xử lý của Manager

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-ATT-01/05, BR-REPORT-01; UC-MG-02/03. Phụ thuộc P1-S6, UI-00/01; task UI-04/API-04 trong [kế hoạch tổng](phase-002-attendance-and-notes.md).
- [Design S3](../../design/attendance-and-notes/incomplete-sessions/design.md), [design chung](../../design/attendance-and-notes/design.md). Route `IncompleteSessions` chỉ cho Manager.
- Sở hữu tile thứ hai và thẻ tổng việc trên Home Manager theo Q-P2-02; đây là tổng endpoint, không thêm KPI mới.

## 2. Task UI mock

- [ ] Mapping test fail → mock pass theo design; giữ testID `incomplete-*` và Home tương ứng.
- [ ] Mặc định toàn backlog: không issue/classId/from/to; chỉ trang đầu `pageSize=20`. Hai issue có nhãn riêng, chưa start không phải Vắng.
- [ ] Lọc issue và lớp OPEN/IN_PROGRESS. Không làm date picker/from-to hoặc số đếm trên chip. Đổi lọc xóa hàng cũ ngay/reset page, bỏ response cũ về muộn.
- [ ] Tra tên lớp bằng bảng OPEN + IN_PROGRESS `pageSize=100`, tải đủ trang, tái sử dụng cho sheet chọn lớp và tìm cục bộ. Đây là lookup cần thiết theo design; không gọi context/attendance theo hàng. Lỗi lookup không chặn backlog; không hiện classId thay tên.
- [ ] Thẻ giữ thứ tự server; số ngày dùng lịch Việt Nam và asOf. `deadlineExpired` true/false/null có đúng ba hành vi; không thay effectiveMentor null bằng mentor chính.
- [ ] Tải thêm khi gần cuối, một request/lần, dedupe sessionId, lỗi retry đúng trang và giữ hàng. Không kết luận hết việc từ trang rỗng trái total; refetch trang 1.
- [ ] Chọn thẻ mở `SessionContext(sessionId, classTitle?, initialTab: 'attendance')`; quay lại refetch và giữ filter trong màn.
- [ ] Home: một request incomplete `pageSize=1` lấy total khi mở/focus; 0 có empty thật, lỗi/offline không giả nghỉ ngơi hoặc số 0. Thẻ có total > 0 và tile đều mở S3; giữ dữ liệu cùng query nếu refresh lỗi, 403 xóa số.
- [ ] Skeleton/empty có và không filter/lỗi/offline, không Retry offline; 403 xóa backlog. Route vắng khỏi Mentor stack; Back đúng Home, vi/en/theme/accessibility.

## 3. Mapping kiểm chứng

| ID nguồn | Trọng tâm |
| --- | --- |
| TC-P2-S3-01–09 | Query mặc định, total, issue/hạn/null, timezone và lookup |
| TC-P2-S3-10–19 | Filter/race/empty/pagination/dedupe/đi S4 và quay lại |
| TC-P2-S3-20–24 | Offline, mất quyền, phạm vi và role |
| TC-P2-HOME-01–05 | Thẻ tổng việc và đúng hai tile Manager (design chung) |

Thay kỳ vọng P1 H-B/H-R theo design chung mục 4.4; không giữ test khẳng định Manager Home không gọi API. Chưa chạy các test trên.

## 4. Task API sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/incomplete-sessions.md` (chưa tạo).

- [ ] API-00/01 đối chiếu GET `/management/class-sessions/incomplete` và lookup GET `/manager/classes`; schema/service/query tests fail → pass cho nullable fields, total/page/issue/scope và cả Home pageSize=1.
- [ ] Query key account/role/filter/pageSize/page; không gộp tổng Home với trang backlog. Start/finalize/correction/recovery invalidate theo design chung mục 10.1; đặc biệt tổng Home cùng backlog được làm mới sau xử lý.
- [ ] Không fallback mock/đếm local làm total; cache chỉ RAM, không log roster hoặc trả response account cũ.

## 5. E2E và hoàn thành

Dataset: hai issue, hạn true/false/null, backlog nhiều trang, class lookup lỗi, tổng Home 0/>0 và xử lý một buổi ở S5/S6. Dùng ứng viên Maestro cuối design S3 và TC-P2-HOME-01–05. Command tổng dự kiến `npm run test:e2e:phase-2`; kiểm/cổng hoàn thành theo kế hoạch tổng, chưa có kết quả chạy. Q-PLAT-01 còn mở.
