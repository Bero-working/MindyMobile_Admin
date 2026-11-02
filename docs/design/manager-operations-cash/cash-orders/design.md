# P5-S4 — cash-orders · Đơn tiền mặt cần xử lý và lịch sử

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-PAY-01, BR-PAY-05; UC-MG-09. Endpoint tham chiếu: `GET /manager/orders` với `paymentType=CASH` (Q-P5-03), `GET /manager/classes` cho bộ lọc lớp.

## 1. Mục tiêu

Quản lý tìm đơn tiền mặt cần thu và xem lại đơn đã đóng. Màn chỉ đọc; xác nhận thu tiền nằm ở S5. Mọi Manager active đều thấy mọi đơn tiền mặt, không theo lớp phụ trách (BR-PAY-01). Không tạo đơn, ghi danh hay hóa đơn (BR-PAY-05).

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Đơn tiền mặt             ▓│
├──────────────────────────────┤
│ 🔍 Nhập mã đơn               │
│ (Chờ xác nhận)(Đã thu)(Hết hạn)(Đã hủy) → │ cuộn ngang
│ (🎓 Tất cả lớp ▾)            │
│ 3 ĐƠN                        │
│ ┌──────────────────────────┐ │
│ │ Ngô Bảo Ngọc [Chờ xác nhận]│
│ │ MD7K3QX9PA2B4C            │ │
│ │ ───────────────────────── │ │
│ │ 🕒 Hạn 18:30 30/10         │ │
│ │ Tạo 28/10/2026 6.500.000 ₫│ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Châu Minh Khoa [Quá hạn giữ chỗ]│
│ │ MD2P8LK4QW9X1Z            │ │
│ │ ───────────────────────── │ │
│ │ 🕒 Hạn 09:00 29/10         │ │
│ │ Tạo 27/10/2026 4.200.000 ₫│ │
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
└──────────────────────────────┘
```

**Lựa chọn ban đầu:** `status=PENDING`, không lọc lớp, trang 1 (ADR-025 mục 2). Đổi trạng thái mới tải trạng thái đó.

### 2.1 Thẻ đơn

Cả thẻ bấm được, mở S5.

| Vị trí | Nội dung | Nguồn |
| --- | --- | --- |
| Khối trên, trái | Tên học viên 15/600, tối đa 2 dòng; dưới là mã đơn 12 | `student.displayName`, null → "Chưa có tên"; `orderCode` |
| Khối trên, phải | Chip trạng thái | `status` |
| Khối dưới, trái | Mốc thời gian 13 kèm icon `schedule` theo trạng thái (xem dưới); dưới là "Tạo {ngày}" 12 | `createdAt` |
| Khối dưới, phải | Số tiền 15/700 | `totalAmount` qua `MoneyText` |

Hai khối ngăn bằng đường kẻ `divider`. Thẻ rộng bằng bộ lọc (`mx-space-0`).

Mốc thời gian:

| Trạng thái | Chữ |
| --- | --- |
| PENDING còn hạn | "Hạn {HH:mm dd/MM}" |
| PENDING đã quá `expiresAt` | "Hạn {HH:mm dd/MM}" và icon màu danger, chip thành "Quá hạn giữ chỗ" |
| PAID | "Đã thu {HH:mm dd/MM}" theo `paidAt`; có `payment.confirmedBy` thì thêm " · {tên}" |
| EXPIRED | "Hết hạn {HH:mm dd/MM}" theo `expiresAt` |
| CANCELLED | Không có dòng này; không có trường thời gian hủy |

**Không có tên lớp** trên thẻ vì nguồn không có (G-P5-04). Không gọi chi tiết từng hàng để lấy tên lớp (ADR-025 mục 5). Không có nút xác nhận trên thẻ.

"Quá hạn" so `expiresAt` với header `Date` của response trang đó (phase mục 7). Đây là nhãn hiển thị, không đổi `status` và không xóa đơn khỏi nhóm Chờ xác nhận: backend còn giữ PENDING đến khi job chạy.

### 2.2 Thứ tự và phân trang

- Giữ thứ tự server: `createdAt` mới nhất trước. **Không sắp lại theo hạn** vì chỉ có trang đã tải; nếu sắp thì đơn gấp ở trang sau vẫn bị khuất và hàng nhảy khi tải thêm.
- `pageSize` 20, nút "Xem thêm". Tải thêm giữ hàng cũ; lỗi thử lại đúng trang.
- Có thể có đơn mới chen vào khi đang tải thêm, làm một đơn lặp ở trang sau. Khử trùng theo `id` khi ghép trang.
- Số đầu danh sách là `total` của query đang hiện, chỉ hiện khi đã có dữ liệu. Không hiện số trên các chip trạng thái chưa tải.

### 2.3 Bộ lọc trạng thái

Cùng kiểu chip với `Filters` nhưng viết riêng tại màn vì cần trạng thái disabled và testID `cash-list-status-*`; cuộn ngang tràn hết chiều rộng, chọn đúng một. Thứ tự: Chờ xác nhận, Đã thu, Hết hạn, Đã hủy. Không có "Tất cả": bốn trạng thái có mục đích khác nhau và mỗi lựa chọn ánh xạ đúng một filter server. Chọn lại giữ dữ liệu đã tải trong cache của cùng query.

### 2.4 Tìm theo mã đơn

- Ô tìm dạng pill một dòng, icon `search`, "Nhập mã đơn" là placeholder (không có nhãn phía trên; vẫn đọc qua `accessibilityLabel`), chữ in hoa tự động, tối đa 50 ký tự. **Tìm khi bấm search trên bàn phím**, không debounce, vì server so khớp chính xác toàn mã.
- Gửi `paymentType=CASH&orderCode={mã đã trim, in hoa}`, **bỏ `status` và `classId`**: người dùng có mã thì cần thấy đơn dù trạng thái nào. Các chip và bộ lọc lớp mờ đi, không chọn được.
- Xóa ô (nút `close`) về đúng lựa chọn trước đó.
- Không có đơn: "Không tìm thấy đơn tiền mặt có mã này." Mã của đơn payOS cũng ra kết quả này.
- Không tìm theo tên học viên: server chỉ lọc bằng `studentId`, không có tìm theo chữ. Ghi chú này chỉ để Codex khỏi lọc trên trang đã tải.

### 2.5 Bộ lọc lớp

Chip "Tất cả lớp" mở `Sheet` danh sách lớp: `GET /manager/classes` tải khi mở sheet, phân trang, ô tìm gửi `q` lên server. Chọn lớp: chip đổi thành tên lớp kèm nút `close`, gửi thêm `classId`. Bố cục theo sheet lọc lớp của `IncompleteSessions`; sheet đó đang lọc trên dữ liệu đã tải, nên phần tìm không chép theo. Header không đổi.

Danh sách lớp lỗi: lỗi trong sheet, danh sách đơn không bị ảnh hưởng.

## 3. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| L-A | Đang tải trang đầu | Skeleton 3 thẻ đúng bố cục; không hiện số |
| L-B | Có dữ liệu | Mục 2 |
| L-C | Rỗng, PENDING | "Không có đơn tiền mặt nào chờ xác nhận." |
| L-D | Rỗng, PAID / EXPIRED / CANCELLED | "Chưa có đơn nào ở trạng thái này." |
| L-E | Rỗng, có lọc lớp | Câu tương ứng + nút chữ "Bỏ lọc lớp" (`cash-list-empty-clear-class`) |
| L-F | Tìm mã không thấy | Mục 2.4 |
| L-G | Lỗi lần đầu | `StatusBlock` + "Thử lại"; không hiện rỗng |
| L-H | Làm mới lỗi | Giữ dữ liệu cùng query, `Alert` "Chưa cập nhật được." |
| L-I | Tải thêm lỗi | Giữ hàng, thử lại đúng trang |
| L-J | Offline, có dữ liệu | Hiện, kèm cảnh báo, không "Thử lại"; đổi filter chưa tải thì hiện L-K |
| L-K | Offline, chưa có dữ liệu | `operations.offlineEmpty`; không hiện rỗng |
| L-L | 403 | Xóa dữ liệu; `StatusBlock` không quyền. Không giữ danh sách |
| L-M | 401 | Về Login |

Kéo làm mới tải lại đúng query đang hiện. Quay về từ S5 làm mới trang đầu, giữ vị trí cuộn. Xác nhận thành công ở S5 thì invalidate, đơn rời nhóm Chờ xác nhận.

## 4. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `operations.cash.title` | Đơn tiền mặt | Cash orders |
| `operations.cash.search` | Nhập mã đơn | Enter order code |
| `operations.cash.notFound` | Không tìm thấy đơn tiền mặt có mã này. | No cash order has this code. |
| `operations.cash.allClasses` | Tất cả lớp | All classes |
| `operations.cash.pickClass` | Chọn lớp | Choose a class |
| `operations.cash.clearClass` | Bỏ lọc lớp | Clear class filter |
| `operations.cash.clearSearch` | Xóa mã đơn | Clear order code |
| `operations.cash.count` | {{count}} đơn | {{count}} orders |
| `operations.cash.created` | Tạo {{date}} | Created {{date}} |
| `operations.cash.due` | Hạn {{time}} | Due {{time}} |
| `operations.cash.paid` | Đã thu {{time}} | Paid {{time}} |
| `operations.cash.paidBy` | Đã thu {{time}} · {{name}} | Paid {{time}} · {{name}} |
| `operations.cash.expiredAt` | Hết hạn {{time}} | Expired {{time}} |
| `operations.cash.noName` | Chưa có tên | No name |
| `operations.cash.emptyPending` | Không có đơn tiền mặt nào chờ xác nhận. | No cash orders are awaiting confirmation. |
| `operations.cash.empty` | Chưa có đơn nào ở trạng thái này. | No orders with this status yet. |
| `operations.cash.refreshFailed` | Chưa cập nhật được. | Couldn't refresh. |
| `operations.cash.more` | Xem thêm | Show more |

Nhãn trạng thái ở phase mục 7.

## 5. Accessibility

- Thẻ đọc một câu: "Đơn MD7K3QX9PA2B4C, Ngô Bảo Ngọc, sáu triệu năm trăm nghìn đồng, chờ xác nhận, hạn 18 giờ 30 ngày 30 tháng 10".
- Mã đơn đọc từng ký tự.
- Chip trạng thái dùng vai trò `radio`.

## 6. testID

`cash-list-screen`, `cash-list-back`, `cash-list-search`, `cash-list-search-clear`, `cash-list-status-pending`, `cash-list-status-paid`, `cash-list-status-expired`, `cash-list-status-cancelled`, `cash-list-class`, `cash-list-class-clear`, `cash-list-class-sheet`, `cash-list-count`, `cash-list-row-<orderId>`, `cash-list-row-<orderId>-status`, `cash-list-row-<orderId>-amount`, `cash-list-row-<orderId>-deadline`, `cash-list-more`, `cash-list-empty`, `cash-list-empty-clear-class`, `cash-list-not-found`, `cash-list-error`, `cash-list-retry`, `cash-list-offline`, `cash-list-denied`, `cash-list-skeleton`.

## 7. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P5-S4-01 | | Mở | Đúng 1 request `paymentType=CASH&status=PENDING&page=1&pageSize=20`; không gọi trạng thái khác, chi tiết đơn, danh sách lớp, không gọi `/manager/cash-orders` |
| TC-P5-S4-02 | Đang tải | Xem | Skeleton; không hiện số 0 hay chữ rỗng |
| TC-P5-S4-03 | Có đơn | Xem | Mã, tên học viên, số tiền đúng; không tính toán lại tiền |
| TC-P5-S4-04 | `totalAmount` 6500000 | Xem | `6.500.000 ₫` ở vi và en |
| TC-P5-S4-05 | `displayName` null | Xem | "Chưa có tên" |
| TC-P5-S4-06 | PENDING, `expiresAt` > Date | Xem | Chip "Chờ xác nhận"; "Hạn …" |
| TC-P5-S4-07 | PENDING, `expiresAt` <= Date, đồng hồ máy lệch | Xem | Chip "Quá hạn giữ chỗ" theo header `Date`, không theo máy; đơn vẫn trong nhóm |
| TC-P5-S4-08 | Thiếu header `Date` | Xem | Dùng đồng hồ máy |
| TC-P5-S4-09 | PAID, có `confirmedBy` | Lọc Đã thu | "Đã thu … · {tên}"; request `status=PAID` |
| TC-P5-S4-10 | PAID, `confirmedBy` null | Xem | Chỉ "Đã thu …", không có "null" |
| TC-P5-S4-11 | EXPIRED, CANCELLED | Lọc | Mỗi trạng thái một request mới; không hiện đơn của trạng thái trước trong lúc tải |
| TC-P5-S4-12 | Trang đơn | Xem | Không có nút xác nhận trên thẻ; không có tên lớp |
| TC-P5-S4-13 | 45 đơn | Xem thêm | Trang 2 rồi 3; không request song song; không lặp hàng dù server trả trùng id |
| TC-P5-S4-14 | Trang 2 lỗi | Xem | Giữ 20 hàng; thử lại đúng trang 2 |
| TC-P5-S4-15 | | Gõ mã chữ thường, bấm search | Một request với mã in hoa đã trim; **không có `status`, `classId`**; có `paymentType=CASH` |
| TC-P5-S4-16 | Đơn PAID, đang ở Chờ xác nhận | Tìm mã | Thấy đơn với chip Đã thu |
| TC-P5-S4-17 | Không có đơn | Tìm | `cash-list-not-found` |
| TC-P5-S4-18 | Đang có kết quả tìm | Xóa ô | Về trạng thái và lớp trước đó |
| TC-P5-S4-19 | | Gõ chưa bấm search | Không có request |
| TC-P5-S4-20 | | Mở sheet lớp, chọn lớp | Danh sách lớp chỉ tải khi mở sheet; đơn gửi thêm `classId`; chip có tên lớp |
| TC-P5-S4-21 | Lọc lớp, rỗng | Xem | "Bỏ lọc lớp" hoạt động |
| TC-P5-S4-22 | Rỗng, PENDING | Xem | `emptyPending` |
| TC-P5-S4-23 | 500 lần đầu | Xem | `cash-list-error`, "Thử lại"; **không** hiện chữ rỗng |
| TC-P5-S4-24 | Làm mới lỗi | Xem | Giữ dữ liệu; `refreshFailed` |
| TC-P5-S4-25 | Offline, có dữ liệu | Xem | Cảnh báo; không "Thử lại" |
| TC-P5-S4-26 | Offline, chưa có | Xem | `offlineEmpty`; không hiện rỗng |
| TC-P5-S4-27 | 403 khi đã có dữ liệu | Làm mới | Xóa dữ liệu; `cash-list-denied` |
| TC-P5-S4-28 | Bấm thẻ | | Mở S5 đúng `orderId`; Back giữ filter và vị trí cuộn |
| TC-P5-S4-29 | S5 xác nhận xong | Back | Đơn rời nhóm Chờ xác nhận; số cập nhật |
| TC-P5-S4-30 | Đổi tài khoản | Xem | Không còn dữ liệu của tài khoản trước |

Ứng viên Maestro E2E: TC-P5-S4-01, -03, -09, -11, -13, -15, -16, -28, -29.
