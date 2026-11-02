# P4 — Task thực hiện UI

Phạm vi: S1–S7 theo xác nhận người dùng ngày 02/11/2026; design nguồn Claude giữ nguyên. [Kế hoạch](phase-004-leave-and-makeup.md), [quyết định](../../adr/ADR-028-phase-4-leave-and-makeup-decisions.md).

- [x] T01 — Đọc design chung/7 slice, ghi quyết định từ quyền người dùng giao, tách kế hoạch slice.
- [x] T02 — Viết test model/UI fail trước code tương ứng; nguồn mock có dữ liệu và mutation/replay trong RAM.
- [x] T03 — Provider/query/mutation, lọc/phân trang, loại response cũ, cache/account boundary và trạng thái chung.
- [x] T04 — S1/S2/S3: danh sách, preview, slot/mapping, lý do, preview lại, submit/replace, rút đơn.
- [x] T05 — S4/S5: queue/lọc Mentor, detail, chặn stale/conflict, approve/reject, mở buổi bù.
- [x] T06 — S6/S7: conflict mode, chọn lớp, lookup conflict đủ trang, candidate, xác nhận nội dung, xếp/hủy/xếp lại.
- [x] T07 — Role routes, Home tile/badge, debug review, vi/en và shared tokens/theme.
- [x] T08 — Test P4 19/19 pass tại lần chạy đã ghi; tiếp tục bổ sung nếu thay source.
- [ ] T09 — Check toàn repo, native build/review, Maestro UI đủ luồng, ghi giới hạn và ảnh đã xem.
- [ ] T10 — Người dùng approve UI toàn phase.
- [ ] T11 — Contract/API TDD, dataset/backend thật (chưa mở cổng).
- [ ] T12 — Maestro tích hợp/hồi quy và người dùng nghiệm thu.
