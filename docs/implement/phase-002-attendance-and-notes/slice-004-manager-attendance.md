# P2-S4 — Manager đọc điểm danh và thao tác hợp lệ

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-ATT-03/10, BR-REPORT-01; UC-MG-03. Phụ thuộc P2-S3 và context P1-S4; UI-04/API-04 trong [kế hoạch tổng](phase-002-attendance-and-notes.md).
- [Design S4](../../design/attendance-and-notes/manager-attendance/design.md), [design chung](../../design/attendance-and-notes/design.md).
- S4 là tab Điểm danh trên `SessionContext` của Manager, không tạo route mới. Bổ sung `initialTab?: 'overview' | 'attendance'`; không thêm tab note Manager.

## 2. Task UI mock

- [ ] Mapping test fail → mock pass; cập nhật test P1-S4 bị thay thế đúng design chung mục 4.4, giữ hành vi Mentor ở phạm vi còn hiệu lực.
- [ ] Mở context rồi attendance `pageSize=1` lấy quyền/totals, bỏ request khi CANCELLED chưa start. Tổng quan không preload danh sách/note/audit.
- [ ] Mở tab Điểm danh mới tải attendance `pageSize=20`, hoặc candidates nếu SCHEDULED. Nếu initialTab attendance thì tải ngay; chuyển qua lại không tự gọi lại.
- [ ] SCHEDULED ẩn totals, candidates chỉ đọc có nhãn tạm tính; CANCELLED chưa start không tải danh sách; snapshot rỗng COMPLETED là 0 thật, không suy cả lớp Vắng.
- [ ] Hàng regular/guest chỉ đọc, pending payment chỉ là thông tin; nút lịch sử theo quyền, gửi enrollmentId/makeupPlacementId và studentName đúng hàng sang S7. Không gắn thao tác lên cả hàng.
- [ ] Nhóm action theo permission hiện tại: sửa khi eligible > 0; chốt theo canFinalize; recovery thêm `endsAt <= asOf`; audit theo canViewAttendanceAudits. Không suy quyền từ role/status.
- [ ] S4 sở hữu điểm mở sheet Chốt buổi thay và callback refresh; validation/mutation thuộc S5 mục 7. Không nhân đôi luồng finalize trong hai slice.
- [ ] Load more bằng nút, retry đúng trang/giữ hàng; focus sau S5/S6 cập nhật dữ liệu và giữ tab/vị trí. Đổi session không lộ snapshot cũ.
- [ ] Lỗi attendance không khóa context độc lập; lỗi quyền không hiện action phỏng đoán. Offline có cache cùng query giữ hàng/action mở được màn nhưng khóa ghi, không Retry; 403 xóa cả hai tab.
- [ ] Vi/en/theme/accessibility, skeleton/action spacing, Back/tab không animation; không thêm tỷ lệ chuyên cần, đổi lịch hoặc thao tác phase sau.

## 3. Mapping kiểm chứng

| ID nguồn | Trọng tâm |
| --- | --- |
| TC-P2-S4-01–28 | Toàn bộ test S4: tab/lazy load, preview/snapshot/totals, permissions/action, pagination, refresh/isolation/offline |
| TC-P2-S5-26–31 | Sheet chốt mở từ S4; triển khai và bằng chứng chính ở S5 |
| TC-P2-NAV-01/02 | Native Back/tab trực tiếp và role stack (design chung) |

Giữ nguyên tiền điều kiện và kỳ vọng ở design nguồn khi mapping từng case tới test/flow. Chưa có test hoặc ảnh native P2 pass.

## 4. Task API sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/manager-attendance.md` (chưa tạo).

- [ ] API-00/01 đối chiếu GET `/class-sessions/:sessionId/context`, `/attendance`, `/attendance-candidates`, guard/scope, pageSize và permission; schema/service/query tests fail → pass.
- [ ] Query key tách pageSize=1/20 và candidates/snapshot; response account/session cũ bị bỏ. Context không có permissions, phải dùng attendance/mutation response theo G-P2-01.
- [ ] Dùng invalidation từ S5/S6 để refresh context/totals/snapshot, không preload audit/note. GET lỗi không fallback mock hoặc lấy roster lớp làm snapshot.

## 5. E2E và hoàn thành

Dataset: SCHEDULED, IN_PROGRESS, COMPLETED rỗng/có dữ liệu, CANCELLED đã/chưa start, regular/guest nhiều trang và capability khác nhau. Chạy ứng viên cuối design S4, luồng S3 → S4 → S5/S6/S7 và quay lại. Command tổng dự kiến `npm run test:e2e:phase-2`; kiểm/cổng hoàn thành theo kế hoạch tổng. Q-PLAT-01 còn mở.
