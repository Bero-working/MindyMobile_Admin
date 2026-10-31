# Phase 1 — Review UI mock

Ngày 31/10/2026 (Asia/Bangkok). Phạm vi: UI của 7 slice Teaching Workspace theo design Claude; API P1 chưa tích hợp, UI chưa được người dùng approve.

## Mở bản review

Chạy `npm start`, sau đó `npm run android`. Dùng `.env.development` có `DEBUG_MODE=true`. Đăng nhập bằng tài khoản Mentor hoặc Manager hợp lệ qua auth P0 hiện hữu. Trang chủ có Lịch dạy/Lớp của tôi (Mentor) hoặc Lớp học (Manager). P1 dùng hoàn toàn fixture trong bộ nhớ, không đọc dữ liệu lớp/học viên thật và không gọi endpoint P1. Nhãn **UI MOCK · P1** luôn có trên màn P1; các route này chỉ đăng ký khi `__DEV__ && DEBUG_MODE`. Production giữ khung workspace P0 cho đến khi API P1 được duyệt và tích hợp.

Không dùng fixture để suy quyền thật của tài khoản đang đăng nhập. Các tên lớp, học viên, liên hệ `.test` và link Meet trong P1 là dữ liệu giả cho review. Auth P0 vẫn dùng server đã cấu hình.

## Luồng review

1. Mentor → Lịch dạy: ngày hôm nay theo giờ Việt Nam, tuần từ thứ Hai, dạy chính/dạy thay; đổi tuần/ngày; bấm buổi → context.
2. Mentor → Lớp của tôi: lọc trạng thái, mở IELTS Foundation K12 → chương đầu mở; chương 2 có dữ liệu legacy thiếu người dạy; buổi giao người khác không bấm được.
3. Workspace lớp → Học viên: phân biệt đang học/đã thanh toán với đang giữ chỗ/chờ thanh toán; không hiện tiền, liên hệ hoặc action thu tiền.
4. Lớp Giao tiếp B1 là scope SESSION: không có nút roster toàn lớp; mở buổi được giao → xem link và học viên tạm tính của buổi.
5. Manager → Lớp học: tìm tên/mã sau 300ms, mặc định Đang học, 5 chip lifecycle có số đếm độc lập với tìm kiếm; mở lớp → ba tab Tổng quan/Buổi học/Học viên. Tab Tổng quan có 4 ô ghi danh và nhóm thông tin lớp; tab Học viên chỉ có tên, ghi danh và trạng thái tài khoản, không hiển thị liên hệ hoặc thanh toán.
6. Manager mở lớp English 3 đã hủy: có cảnh báo không tự hoàn tiền, vẫn đọc lịch; buổi hủy không có nhóm học viên/link/người dạy khi thiếu snapshot.
7. Settings P0: đổi vi/en, sáng/tối rồi quay lại kiểm tra P1. Back Android và nút Quay lại giữ đúng luồng. Logout xóa cây UI và fixture theo phiên.

## Kịch bản tại nhãn UI MOCK

Bấm nhãn để mở sheet; chọn scenario rồi đóng tự động:

| Scenario | Hành vi |
| --- | --- |
| success | Dữ liệu fixture mặc định |
| loading | Skeleton đứng chờ; tắt animation khi hệ thống giảm chuyển động |
| empty | Danh sách rỗng theo từng màn/bộ lọc |
| offline / error | Lỗi tải đầu; nếu đã tải thì giữ dữ liệu + cảnh báo làm mới thất bại |
| refreshError | Giữ dữ liệu đã tải + mã hỗ trợ mock khi làm mới |
| denied / notFound | Xóa dữ liệu khỏi toàn màn, có nút Quay lại |
| noRoster | Capability roster false, kể cả scope CLASS; màn roster trực tiếp bị chặn |
| studentsError | Nhóm/tab học viên lỗi riêng, phần context/tóm tắt còn nguyên |
| unitError | Buổi của chương lỗi riêng, thẻ tóm tắt còn nguyên |
| unavailable | Mô phỏng candidates 422: chưa có danh sách học viên cho buổi |

Chọn success để phục hồi. Kéo xuống làm mới; focus/foreground tải lại fixture. Request cũ bị bỏ qua; lỗi quyền của request con xóa toàn màn. Conflict không áp dụng vì toàn phase chỉ đọc. 401/refresh, parse DTO và lỗi HTTP thật được kiểm chứng ở bước API sau approve.

## Kiểm chứng

Tra [ui-verification.md](ui-verification.md) và [e2e-ui.md](e2e-ui.md). Lệnh `npm run test:e2e:phase-1:ui` chạy smoke native của cả 7 màn. Đây là kiểm chứng UI mock; chưa phải bộ nghiệm thu E2E tích hợp API P1.


## Home bổ sung 31/10/2026

Home đã triển khai theo design hiện hành: header tài khoản, mascot trang trí ở mép card, nhóm Giảng dạy (Mentor) hoặc Điều phối giảng dạy (Manager), lưới 4 cột chỉ có 2/1 tile đã đăng ký. Mở bằng bản debug như hướng dẫn trên. Kiểm tra avatar → Hồ sơ, Settings → vi/en/theme → back, từng tile và back; nhãn English tự xuống dòng, phần dưới card để trống theo design. Bản release giữ fallback P0 đến khi tích hợp P1.

Kết quả test/build hiện hành nằm ở `ui-verification.md`; ảnh và smoke native ở `e2e-ui.md`. Đây là bản UI để review; chưa tự approve UI toàn phase, tích hợp API hoặc nghiệm thu.

## Bản UI mới — 31/10/2026

- Trang chủ Mentor: thẻ hôm nay ưu tiên buổi đang diễn ra, tiếp đến buổi theo lịch sớm nhất, cuối cùng buổi hoàn tất muộn nhất; nút Meet độc lập với vùng mở chi tiết. Ngày theo giờ Việt Nam được kiểm tra khi quay lại/foreground và khi màn để mở qua ngày. Có kéo làm mới, lỗi và thử lại riêng cho lịch/context.
- Theo phản hồi ảnh của người dùng: “Xem lịch” đặt tuyệt đối ở góc phải, gần ngang chip trạng thái; bỏ hàng riêng và khoảng trống của nút. Thẻ giữ vùng chạm mở lịch; tiêu đề lớp dùng hết chiều rộng còn lại.
- Tiện ích Mentor nằm trên nền màn: Lớp phụ trách nổi bật trước, Lịch dạy sau. Manager có thẻ nghỉ ngơi tĩnh và nhóm Điều phối giảng dạy.
- Manager danh sách: header Danh sách lớp, tổng 5 lifecycle; ô tìm cao 52; chip có số đếm riêng, không có Tất cả. Xóa tìm kiếm giữ trạng thái đã chọn.
- Manager chi tiết: ba tab trên header, mở mặc định Tổng quan. Lịch/học viên tải khi mở lần đầu, giữ dữ liệu khi đổi tab; lỗi tóm tắt không khóa tab khác. Phân trang tự động chỉ áp dụng tab đang hiển thị.

Vẫn là UI mock để review. API P1 chưa tích hợp; chưa tự chuyển phase sang Done hoặc coi UI đã được duyệt.

Phản hồi tiếp theo: thêm gap 12px giữa cụm tiêu đề/phụ đề và hàng tab trong header (bao gồm Chi tiết buổi học).
