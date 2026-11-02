# Phase 2 — Bản UI mock để review

**Cập nhật hiện hành:** [Hai tiện ích Manager, header tabs, filter ngang và correction rút gọn](ui-utilities-update.md) theo yêu cầu trực tiếp ngày 01/11/2026; phần mô tả baseline khác với cập nhật này được giữ để truy vết.

Ngày: 01/11/2026 (Asia/Bangkok). Triển khai theo chỉ thị “Triển khai đi”, sau khi đã có design và kế hoạch 7 slice. Đây là bản review UI, chưa phải tích hợp API hoặc nghiệm thu phase.

## Mở bản review

1. Mở app development với `DEBUG_MODE=true`, Metro chạy trên cổng 8081.
2. Bấm **Review P2** → **MENTOR** hoặc **MANAGER**. Không cần đăng nhập tài khoản thật cho bản review.
3. Nút **P2** ở phía phải gần đầu nội dung mở lại menu chuyển vai trò. Chọn vai trò sẽ khởi tạo lại dữ liệu giả và xóa draft trong bộ nhớ của lượt review trước. Chọn **Trở về ứng dụng** để về luồng thật P0/P1.
4. Trong màn P2, nhãn **UI MOCK · P2 — dữ liệu giả** mở các kịch bản loading, empty, offline, error, denied, notFound, uncertain, conflict, expired và các lỗi recovery. Reconnect chọn success; không có thao tác ghi tự động.

Review chỉ bật khi `__DEV__ && DEBUG_MODE`; bản release không có menu này. P2 chưa có HTTP service; không dùng dữ liệu giả để thay lỗi API thật. Dữ liệu demo và intent nằm trong RAM, không lưu MMKV hoặc thiết bị. Key có hình dạng UUID trong fixture là định danh giả có chủ đích; cơ chế UUID v4 an toàn cho HTTP thật thuộc bước API sau duyệt UI.

## Các luồng đã có mã

| Vai trò / slice | Đường vào và nội dung review |
| --- | --- |
| Mentor / S1 | Home → Tiếp tục điểm danh, hoặc lịch/lớp → chi tiết buổi → Điểm danh. Đánh dấu, Lưu, bulk cả snapshot, sync, finalize; có trạng thái offline/draft/intent/conflict |
| Mentor / S2 | Chi tiết buổi → Ghi chú buổi học, hoặc nút ghi chú sau finalize. Hai ô, bộ đếm, version riêng, dirty Back, conflict và giữ nội dung khi hết hạn |
| Manager / S3 | Home có tổng việc và tile Buổi chưa hoàn tất → backlog; lọc issue/lớp, mở đúng session/tab |
| Manager / S4 | Chi tiết buổi → tab Điểm danh; Tổng quan có totals và action theo quyền. Candidates khác snapshot; hàng regular/guest chỉ đọc |
| Manager / S5 | Tổng quan buổi đang diễn ra → Sửa điểm danh → chọn kết quả → Tiếp tục → lý do. Chốt thay mở sheet trực tiếp ở S4, bắt buộc giờ kết thúc thực tế và lý do |
| Manager / S6 | Backlog → buổi Chưa bắt đầu → Tổng quan → Khôi phục. Ngày/giờ/evidence/lý do trống, học viên chỉ tải khi mở sheet, tự chọn trạng thái từng người |
| Manager / S7 | Tổng quan → Lịch sử, hoặc nút lịch sử trên hàng điểm danh. Đọc audit từ nguồn mock sau correction/recovery, lọc regular/guest, mở bằng chứng |

Các nút Back/tab giữ điều hướng trực tiếp. SaveBar nằm ngoài vùng cuộn và trên safe area. Source fixture có lớp thông thường 18 học viên; fixture `large-roster` có 105 record để kiểm bulk nhiều trang trong test nguồn. Không suy số tổng từ trang đã tải.

## Hồ sơ kiểm chứng

- [UI/model/source và mapping design](ui-verification.md).
- [Maestro UI mock, ảnh native và giới hạn](e2e-ui.md).
- [Trạng thái phase](../../progress/phase/phase-002-attendance-and-notes.md).

Ngày 02/11/2026 (Asia/Bangkok), người dùng xác nhận “Duyệt UI phase 2”: UI toàn phase được duyệt 7/7, bao gồm các cập nhật chọn lớp → roster Sửa/Lịch sử ngày 02/11/2026. API 0/7; phase chưa nghiệm thu. [ADR-009](../../adr/ADR-009-phase-tdd-and-ownership.md) quy định: “UI TDD toàn phase → người dùng duyệt UI → contract/API TDD toàn phase”. Vì vậy chưa tạo contract/HTTP/schema wire hoặc gọi mutation backend trong lượt triển khai UI này. Q-PLAT-01 và nghiệm thu native/iOS vẫn là các cổng riêng.
