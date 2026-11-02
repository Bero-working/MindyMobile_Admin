# P2-S7 — Lịch sử điểm danh

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-ATT-10; UC-MG-03. Phụ thuộc S4, audit thật sau S5/S6; UI-05/API-04 trong [kế hoạch tổng](phase-002-attendance-and-notes.md).
- [Design S7](../../design/attendance-and-notes/attendance-audits/design.md), [design chung](../../design/attendance-and-notes/design.md).
- Route Manager `AttendanceAudits(sessionId, classTitle?, enrollmentId?, makeupPlacementId?, studentName?)`. Chỉ đọc; params không cấp quyền. Không tạo audit/before-after từ local draft.

## 2. Task UI mock

- [ ] Mapping test fail → mock pass, giữ testID `audit-*`. Mở từ nhóm action S4 mặc định không lọc; mở từ hàng regular dùng enrollmentId, guest thêm makeupPlacementId.
- [ ] Trang đầu audit pageSize=20, total/thứ tự server; đủ năm action, thời gian Việt Nam. oldStatus null chỉ hiện giá trị mới, reason null ẩn dòng, actor name null không hiện id.
- [ ] Lý do dài mở rộng; recoveryEvidence mở tại hàng có đủ nguồn/cơ sở/thanh toán/trạng thái/giờ cũ-mới theo server. Không hiển thị id/version hoặc suy giờ cũ khi null.
- [ ] Khi có tên params và đang lọc, dùng tên đó không gọi bảng tra; còn lại tra attendance pageSize=100 đủ trang, khóa tra theo regular/guest để không nhầm người. Lookup không chặn audit, không gọi từng hàng.
- [ ] Lookup loading có skeleton tên, lỗi có feedback/Retry riêng khi online, không tìm thấy hiện Học viên không xác định; không dùng id làm nhãn.
- [ ] Xóa chip lọc reset trang 1, bỏ hàng cũ ngay và bỏ response về muộn; không thêm lọc action/thời gian/client filter trên một trang. 422 người không thuộc buổi xóa lọc và tải toàn buổi kèm thông báo.
- [ ] Load more khi gần cuối, một request/lần, dedupe id, retry đúng trang/giữ hàng. Focus/pull refresh; rời màn không giữ trạng thái mở evidence.
- [ ] Empty toàn buổi/đang lọc riêng biệt; lỗi lần đầu khác empty, refresh lỗi giữ dữ liệu cùng query; offline giữ cache hoặc offlineEmpty, không Retry; 403 xóa dữ liệu và Mentor không có route.
- [ ] Vi/en/theme, accessibility/focus/label, skeleton/spacing, Back trực tiếp; evidence/reason chỉ RAM, không log/persist.

## 3. Mapping kiểm chứng

| ID nguồn | Trọng tâm |
| --- | --- |
| TC-P2-S7-01–10 | Query mặc định, total/action/null/giờ/lý do/evidence |
| TC-P2-S7-11–17 | Filter regular/guest, race khi xóa, lookup đủ trang/fallback |
| TC-P2-S7-18–28 | Empty/error/pagination/dedupe/422/offline/403, audit mới S5, scope/role |

Đủ 28 ID; khi triển khai mapping từng ID tới test/flow và kết quả. Không ghi mock fixture là audit runtime thật.

## 4. Task API sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/attendance-audits.md` (chưa tạo).

- [ ] API-00/01 đối chiếu GET `/management/class-sessions/:sessionId/attendance-audits` và GET attendance cho tên; query/filter/page, nullable actor/status/reason/evidence, enums/quyền; schema/service/query tests fail → pass.
- [ ] Query key account/role/session/filter/pageSize/page; audit bị invalidate sau chốt/correction/recovery đúng buổi. Lookup thất bại không biến audit thành lỗi toàn màn.
- [ ] Kiểm regular/guest identity, response cũ sau đổi lọc/account và mất quyền; không fallback mock, không log bằng chứng/lý do hoặc tải mọi audit từ Home/context.

## 5. E2E và hoàn thành

Dataset: audit nhiều trang/đủ action/null fields/evidence, regular + guest, correction thật từ S5 và recovery thật từ S6. Dùng ứng viên cuối design S7, chứng minh lý do/before-after do server trả. Command tổng dự kiến `npm run test:e2e:phase-2`; kiểm/cổng theo kế hoạch tổng. Q-PLAT-01 còn mở.
