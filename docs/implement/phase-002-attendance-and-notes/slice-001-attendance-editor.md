# P2-S1 — Điểm danh của Mentor

Ngày tách: 01/11/2026 (Asia/Bangkok). **UI được người dùng duyệt ngày 02/11/2026** theo chỉ thị “Duyệt UI phase 2”. API đã nối ngày 02/11/2026; [contract](../../api-contract/phase-002-attendance-and-notes/README.md), [kiểm chứng và giới hạn](api-integration.md). [Bản review](ui-review.md) · [Kiểm chứng và giới hạn](ui-verification.md). Checklist bên dưới giữ làm tiêu chí đối chiếu từng nhánh, chưa thay bằng tuyên bố mọi case đã pass.

## 1. Phạm vi và đầu vào

- BR-ATT-01–09/11, BR-OFF-01/02; UC-M-04/05/06. Phụ thuộc P1-S4, UI-00/01 của [kế hoạch tổng](phase-002-attendance-and-notes.md).
- Nguồn: [design S1](../../design/attendance-and-notes/attendance-editor/design.md), [design chung](../../design/attendance-and-notes/design.md), ADR-006/025/026. Giữ nguyên testID và test case nguồn.
- Route `AttendanceEditor(sessionId, classTitle?)` chỉ đăng ký cho Mentor. Quyền/version lấy lại từ dữ liệu hiện hành, không từ params.
- S1 sở hữu nút Tiếp tục điểm danh trên Home Mentor và entry point điểm danh/totals tại context Mentor (design chung mục 4.1–4.2). S2 sở hữu entry point ghi chú.

## 2. Task UI mock — UI-02

- [ ] Mapping test case nguồn → test fail → mock boundary → pass; chưa gọi HTTP thật.
- [ ] Mở: context + attendance trang 1, `pageSize=100` để đọc quyền; chỉ thêm candidates khi SCHEDULED. Preview luôn tạm tính; không có toggle, không tự start theo giờ; CANCELLED chưa start không gọi candidates.
- [ ] Start online có xác nhận, `canStart` từ server; thành công bỏ candidates và đọc snapshot. Mentor thay không gọi roster lớp.
- [ ] Render regular/guest, khóa hàng `attendanceId`; toggle PRESENT/ABSENT, chạm lại về UNMARKED chỉ ở IN_PROGRESS. Totals là bản đã lưu, không cộng draft.
- [ ] Draft gồm giá trị mong muốn và `baseStatus`, giữ trong bộ nhớ. Giới hạn 100 regular + 100 guest mỗi lô; chạm vượt giới hạn bị chặn, không tự chia lô. Nút Xem thêm tải theo yêu cầu và giữ draft.
- [ ] Bulk xác nhận toàn snapshot mọi trang/guest, số lấy `totals.eligible`; cảnh báo bỏ draft và xóa giờ vào khi đánh Vắng. Sync chỉ thêm, giữ draft, báo số thật và pending payment.
- [ ] Finalize: lưu draft trước; chỉ mở sheet khi thành công và đã có totals/version mới. Nêu UNMARKED → ABSENT; version conflict phải đọc và xác nhận lại. Sau chốt có action mở S2.
- [ ] Intent bất biến body/key/version; serialize mutation theo session, chặn double tap. Mất response khóa action, Gửi lại cùng intent; conflict từng hàng theo design chung mục 6.4, không tự gửi lại hoặc Giữ tất cả.
- [ ] COMPLETED còn hạn cho sửa PRESENT/ABSENT; hết hạn/trạng thái đổi giữ rõ phần chưa lưu nhưng khóa ghi. 403/401 xóa dữ liệu và draft theo auth boundary.
- [ ] Offline chỉ cho đánh dấu hàng đã tải khi lần tải gần nhất có quyền sửa và buổi đã start. Khóa mọi request ghi/bulk/tải thêm; reconnect refetch và giữ draft, người dùng tự bấm Lưu. App-kill/logout/đổi tài khoản mất draft; không persist/queue/replay.
- [ ] Skeleton, empty, lỗi từng phần/load more, warning offline không Retry; Back có dirty dialog; vi/en, sáng/tối, màn 360/font 1.3, vùng chạm và safe area theo design.

## 3. Mapping kiểm chứng

Toàn bộ **TC-P2-S1-01 đến -66** trong design là bắt buộc, kể cả -63 nằm sau -66 trong bảng nguồn; không đổi số ID.

| Nhóm | Phạm vi kiểm chứng |
| --- | --- |
| Preview/start | Đúng ngày/quyền, candidates 422, snapshot rỗng, mất response, start ở thiết bị khác |
| Draft/mutation | Toggle, lô regular/guest, bulk mọi trang, sync, intent và conflict |
| Finalize/hạn sửa | Lưu trước chốt, tác động totals mới, xác nhận lại, hết hạn và trạng thái |
| Offline/quyền | Draft chỉ RAM, reconnect không ghi, logout/app-kill, SESSION không gọi roster CLASS |
| Tích hợp P1 | TC-P2-HOME-06/07; TC-P2-CTX-01–07 của design chung; bỏ kỳ vọng placeholder tương ứng tại P1 |

Khi implement ghi từng ID → test/flow → kết quả trong hồ sơ verification; chưa có kết quả pass ở lượt tách kế hoạch.

## 4. Task API — API-02 sau duyệt UI toàn phase

Contract dự kiến: `docs/api-contract/phase-002-attendance-and-notes/attendance-editor.md` (chưa tạo).

- [ ] API-00/01: đối chiếu nguồn/legacy/runtime, schema và service tests fail → pass cho GET context/attendance/candidates; POST start/sync-roster/finalize; PUT attendance/bulk theo prefix `/class-sessions/:sessionId`.
- [ ] Mutation dùng UUID v4 an toàn (G-P2-11), `expectedVersion`, cookie/auth/error adapter P0; start/finalize Mentor không gửi actual times hay reason. Xác minh enum/nullability/lô/page và mã lỗi thật.
- [ ] Query key gồm account/role/session/pageSize/filter/page; tách preview/snapshot. Sau start invalidate context/attendance/lịch hôm nay/danh sách buổi lớp; lưu/bulk/sync invalidate attendance/context; finalize thêm backlog/Home/audit/buổi lớp.
- [ ] Kiểm retry mất response không ghi hai lần, serialize cả mutation chung session với Manager; không fallback mock khi server lỗi. Cache chỉ trong RAM, không log roster/key.

## 5. E2E và hoàn thành

Dataset: buổi hôm nay SCHEDULED, IN_PROGRESS regular + guest, trên 100 record, thanh toán tiền mặt đủ điều kiện sau start, COMPLETED còn/hết hạn, Mentor dạy thay và hai phiên cùng buổi. Dùng các ứng viên Maestro cuối design S1; thêm kiểm offline/reconnect/logout/app-kill theo test nguồn.

Chạy qua command tổng dự kiến `npm run test:e2e:phase-2` khi đã triển khai; không tạo command rỗng. Lint 0 warning, typecheck, Jest, ảnh/native và E2E thật theo kế hoạch tổng. Q-PLAT-01 còn mở; UI review và nghiệm thu phase chưa thực hiện.
