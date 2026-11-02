# P5-S4 — Danh sách CASH

[Quy ước chung](README.md). **Nguồn hiện hành GET /manager/orders**, thay mapping khảo sát ban đầu /manager/cash-orders, theo Q-P5-03 đã chốt. Không sửa backend để thêm filter.

Query bắt buộc paymentType=CASH; mặc định status=PENDING, page=1,pageSize=20. Các status PAID/EXPIRED/CANCELLED chỉ tải khi chọn. Filter classId UUID tùy chọn; lớp tìm bằng GET /manager/classes?q=... khi mở sheet, phân trang riêng.

Tìm mã: orderCode trim/in hoa/tối đa 50, chỉ gửi khi bấm Search bàn phím; **bỏ status/classId**, giữ CASH. Xóa search về filter trước. Response {items:ManagerOrderSummaryDto[],total,page,pageSize}, không có details/tên lớp; không gọi detail từng hàng. Tên student nullable, payment/confirmedBy nullable, số tiền nguyên server; không tự cộng hoặc hiện 0 cho status chưa tải.

PENDING quá expiresAt theo Date header chỉ đổi nhãn “Quá hạn giữ chỗ”, không tự đổi status hoặc bỏ khỏi query PENDING. Hàng mở S5 đúng orderId, không có confirm trực tiếp. Query/cache account tách biệt, reload sau xác nhận và khi focus/foreground; tổng lấy đúng total query.
