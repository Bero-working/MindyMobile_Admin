# P5-S5 — cash-order-detail · Xác nhận đã nhận đủ tiền

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-PAY-01, BR-PAY-02, BR-PAY-03, BR-PAY-04, BR-PAY-06; UC-MG-09. Endpoint tham chiếu: `GET /manager/orders/:orderId`, `POST /manager/cash-orders/:orderId/confirm`.

## 1. Mục tiêu

Quản lý đối chiếu đúng người, đúng đơn, đúng lớp, đúng tổng tiền, đúng hạn, rồi xác nhận **đã nhận đủ toàn bộ** tiền. Thành công thì đơn thành PAID và ghi danh được kích hoạt trong cùng giao dịch (BR-PAY-03). Không thu một phần, không trả góp (BR-PAY-02), không biên nhận (Q-PAY-01).

Đây là màn rủi ro cao nhất của phase: sai ở đây là mất tiền thật hoặc thu hai lần. Ba nguyên tắc:

1. **Đọc lại trước khi cho xác nhận.** Danh sách có thể đã cũ.
2. **Không bao giờ kết luận từ response 200.** Server trả 200 cả khi Manager khác đã thu (G-P5-12), nên phải đọc lại để biết ai thu.
3. **Chưa rõ thì đọc trạng thái trước, không gửi lại ngay** (BR-PAY-04).

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Chi tiết đơn             ▓│
│▓    MD7K3QX9PA2B4C           ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Số tiền cần thu          │ │
│ │ 6.500.000 ₫ [Chờ xác nhận]│ │  26/700
│ │ Hạn giữ chỗ: 18:30 30/10/2026│
│ └──────────────────────────┘ │
│ HỌC VIÊN                     │
│ ┌──────────────────────────┐ │
│ │ (NB) Ngô Bảo Ngọc         │ │
│ └──────────────────────────┘ │
│ LỚP TRONG ĐƠN · 2            │
│ ┌──────────────────────────┐ │
│ │ IELTS Foundation          │ │  courseTitle
│ │ K12              4.000.000 ₫│  className, totalAmount
│ │ ──────────────────────── │ │
│ │ Giao tiếp B1              │ │
│ │ Lớp 07           2.500.000 ₫│
│ └──────────────────────────┘ │
│ THÔNG TIN ĐƠN                │
│ ┌──────────────────────────┐ │
│ │ Mã đơn   MD7K3QX9PA2B4C   │ │
│ │ Hình thức  Tiền mặt       │ │
│ │ Ngày tạo  09:12 28/10/2026│ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ( 💵 Xác nhận đã nhận tiền ) │  dính đáy, chỉ khi cho phép
└──────────────────────────────┘
```

- Mọi số tiền lấy nguyên từ server, không cộng lại. `details` hiển thị đúng thứ tự trả về.
- `quantity` > 1 thì thêm dòng 12 "{quantity} × {priceAmount}". `quantity` = 1 thì ẩn.
- Không hiện `mentorId`, `payment.referenceCode`. Không có khái niệm "Invoice" trong chữ.
- Đơn không phải CASH (mở từ liên kết lạ): `StatusBlock` "Đây không phải đơn tiền mặt." Không hiện nút.

### 2.1 Thẻ đầu theo trạng thái

| Trạng thái | Nhãn số tiền | Dòng phụ | Nút xác nhận |
| --- | --- | --- | --- |
| PENDING còn hạn | Số tiền cần thu | "Hạn giữ chỗ: {HH:mm dd/MM/yyyy}" | Có |
| PENDING, đã quá `expiresAt` theo header `Date` | Số tiền của đơn | "Đã quá hạn giữ chỗ lúc {…}. Không thu tiền cho đơn này." danger | **Không** |
| PAID | Đã thu | "Lúc {paidAt}" + người thu, mục 2.2 | Không |
| EXPIRED | Số tiền của đơn | "Đơn đã hết hạn lúc {expiresAt}. Chỗ học đã được trả lại." | Không |
| CANCELLED | Số tiền của đơn | "Đơn đã hủy." | Không |

Chỉ dùng "Số tiền cần thu" khi còn thu được, để đơn đóng không bị đọc như còn nợ.

"Chỗ học đã được trả lại" có căn cứ ở source: job hết hạn giải phóng hold. Riêng PENDING quá hạn thì không viết câu này vì job có thể chưa chạy.

### 2.2 Người thu

| `payment.confirmedBy` | Hiển thị |
| --- | --- |
| `id` = tài khoản hiện tại | "Bạn đã xác nhận" |
| Khác, `source` MANAGER | "{displayName} đã xác nhận" |
| `source` LEGACY_MENTOR | "{displayName} · Mentor, dữ liệu cũ" |
| null | Ẩn dòng. Không hiện "—" như một lỗi |

`displayName` null → "Chưa có tên".

## 3. Xác nhận

### 3.1 Đọc lại trước khi mở sheet

Bấm nút chính: `GET /manager/orders/:orderId`, nút `busy`.

| Kết quả đọc lại | Hành vi |
| --- | --- |
| PENDING còn hạn, tổng không đổi | Mở sheet với dữ liệu mới |
| Trạng thái đổi, hoặc đã quá hạn | Không mở sheet; thẻ cập nhật theo mục 2.1; `Alert` "Đơn vừa thay đổi. Xem lại thông tin bên dưới." |
| Lỗi / offline | Không mở sheet; `Alert` "Chưa kiểm tra được đơn. Thử lại sau." **Không xác nhận trên dữ liệu chưa kiểm tra** |

### 3.2 Sheet

Khác [H] ở ô nhập số tiền thay cho ô tích (Q-P5-02).

```
│ Xác nhận tiền mặt            │
│ MD7K3QX9PA2B4C               │
│ ┌──────────────────────────┐ │
│ │ Số tiền cần thu          │ │
│ │ 6.500.000 ₫              │ │
│ └──────────────────────────┘ │
│ Học viên   Ngô Bảo Ngọc      │
│ Lớp        IELTS Foundation K12│
│            Giao tiếp B1 Lớp 07│
│ Hạn        18:30 30/10/2026  │
│ Số tiền đã nhận *            │
│ ┌──────────────────────────┐ │
│ │                        ₫ │ │  MoneyField, trống
│ └──────────────────────────┘ │
│ ⓘ Phải nhận đủ toàn bộ số    │
│   tiền. Không thu một phần.  │
│   Thao tác này không hoàn    │
│   tác được.                  │
│ ( Xác nhận đã nhận tiền )    │
│ Quay lại                     │
```

- Ô nhập trống, bàn phím số, không có nút "Điền đủ". Nếu có nút điền thì ô nhập mất mục đích.
- Nút gửi khóa đến khi có số. Số khác `totalAmount`: lỗi ngay dưới ô khi bấm gửi, "Số tiền phải đúng {tổng}. Không thu một phần hoặc thu dư." Không có request.
- Đóng sheet, đổi màn hoặc gửi thành công: xóa số đã nhập. Không lưu thiết bị.
- Sheet không đóng được khi đang gửi và khi kết quả chưa rõ.
- Không có dialog thứ hai: nhập đúng số tiền đã là bước xác nhận có chủ đích.

Body: `{ receivedAmount }`, số nguyên VND. **Không gửi `expectedVersion` và `Idempotency-Key`**: route CASH không nhận (BR-PAY-04). Không dùng `newIntentKey` ở slice này.

## 4. Kết quả

Sau **mọi** response 200, đọc lại `GET /manager/orders/:orderId` rồi mới hiện kết quả. Trong lúc đọc, sheet vẫn `busy`.

### 4.1 Thành công

| Đọc lại | Hiển thị |
| --- | --- |
| PAID, `confirmedBy.id` = tài khoản hiện tại | Đóng sheet; Toast "Đã xác nhận nhận {số tiền}"; thẻ PAID; invalidate theo phase mục 8.1 |
| PAID, người khác | Đóng sheet; `Alert` warning **"Đơn này đã được {tên} xác nhận lúc {giờ}. Không cập nhật gì thêm. Nếu bạn vừa nhận tiền của học viên, hãy báo {tên} để tránh thu trùng."** Không dùng toast thành công |
| PAID, `confirmedBy` null hoặc đọc lại lỗi | Đóng sheet; thẻ PAID theo response của confirm; dòng 12 "Chưa tải được người xác nhận." + "Thử lại" |

### 4.2 Chưa rõ kết quả

Timeout, mất mạng sau khi gửi, hoặc 5xx. Backend chạy trong một giao dịch, nhưng client không thể biết đã commit hay chưa.

1. Sheet giữ nguyên, ô số tiền khóa, dải cảnh báo "Chưa rõ tiền đã được ghi nhận chưa. Đừng thu thêm tiền." (`cash-detail-unknown`).
2. Tự đọc lại chi tiết, **chưa có nút gửi lại ở bước này**.

| Đọc lại | Hành vi |
| --- | --- |
| PAID | Như mục 4.1. Người thu là chính mình thì câu Toast đổi thành "Đã ghi nhận nhận tiền. Không cần gửi lại." |
| PENDING còn hạn | Nút "Gửi lại" hiện ra, cùng số tiền. An toàn vì server không ghi trùng |
| EXPIRED, CANCELLED, PENDING quá hạn | Đóng sheet; thẻ theo mục 2.1 |
| Đọc lỗi | Giữ dải cảnh báo, nút "Kiểm tra lại". Offline: chỉ cảnh báo; có mạng lại thì tự đọc |

Rời màn khi còn chưa rõ: dialog "Chưa rõ tiền đã được ghi nhận chưa. Mở lại đơn này để kiểm tra." nút "Ở lại" / "Vẫn thoát".

### 4.3 Bị từ chối

Mọi nhánh đều không tự gửi lại. Có `requestId` thì thêm mã hỗ trợ. Sau mỗi 409, đọc lại chi tiết.

| HTTP / mã | Nghĩa | Hành vi |
| --- | --- | --- |
| 409 `CASH_ORDER_CLOSED` | Hết hạn, đơn đóng, hoặc có lớp đã hủy (G-P5-11) | Đóng sheet. `status` đã đổi: thẻ theo mục 2.1. Còn PENDING: `Alert` danger "Đơn này không còn thu tiền được: đã hết hạn, đã đóng hoặc có lớp đã hủy." Không đoán nguyên nhân. Thêm "Nếu đã nhận tiền, hãy báo người phụ trách." (G-P5-13). Nút xác nhận ẩn đến khi tải lại mà vẫn hợp lệ |
| 409 `CASH_HOLD_INVALID` | Chỗ giữ không còn hợp lệ | Đóng sheet; `Alert` danger "Chỗ giữ của học viên không còn hợp lệ nên chưa xác nhận được." + câu báo người phụ trách. Không đổi `status` trên thẻ |
| 409 `CASH_CONFIRMATION_INVALID`, đọc lại PENDING | Số tiền hoặc hình thức không khớp | `Alert` trong sheet "Số tiền chưa khớp với đơn. Kiểm tra lại." Xóa số đã nhập. Thẻ theo dữ liệu mới |
| 409 `CASH_CONFIRMATION_INVALID`, đọc lại PAID | Đơn đã thanh toán, không có xác nhận tiền mặt khớp | Đóng sheet; `Alert` danger "Đơn đã thanh toán nhưng chưa khớp với xác nhận tiền mặt. Không thu thêm tiền. Liên hệ hỗ trợ." + mã hỗ trợ |
| 403 `ORDER_ACCESS_DENIED`, 403 khác | Mất quyền | Xóa dữ liệu và số đã nhập; `StatusBlock` không quyền |
| 401 | Hết phiên | Về Login; xóa số đã nhập |
| 404 `ORDER_NOT_FOUND` | Không còn đơn | `StatusBlock` không tìm thấy |
| 400, 422 | Dữ liệu sai | `Alert` trong sheet, giữ sheet. Không xảy ra nếu `MoneyField` đúng |

Không thêm mã `CASH_*` khác ngoài ba mã này: source chỉ có ba. Mã lạ dùng câu lỗi chung + mã hỗ trợ.

## 5. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| D-A | Đang tải | Skeleton đúng bố cục; không hiện số tiền giả |
| D-B | PENDING còn hạn | Mục 2 |
| D-C | PENDING quá hạn | Mục 2.1, không có nút |
| D-D | PAID | Mục 2.1, 2.2 |
| D-E | EXPIRED, CANCELLED | Mục 2.1 |
| D-F | Không phải CASH | `StatusBlock` |
| D-G | Đọc lại trước khi mở sheet | Nút `busy` |
| D-H | Sheet mở / đang gửi | Mục 3.2 |
| D-I | Chưa rõ | Mục 4.2 |
| D-J | Bị từ chối | Mục 4.3 |
| D-K | Tải lỗi lần đầu | `StatusBlock` + "Thử lại". Không hiện thẻ rỗng |
| D-L | Làm mới lỗi | Giữ dữ liệu; **khóa nút xác nhận**; "Chưa cập nhật được." |
| D-M | Offline | Giữ dữ liệu nếu có; "Thông tin có thể đã cũ."; nút khóa, "Cần kết nối mạng" |
| D-N | 403, 404 | `StatusBlock` |

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `operations.cashDetail.title` | Chi tiết đơn | Order details |
| `operations.cashDetail.due` | Số tiền cần thu | Amount to collect |
| `operations.cashDetail.collected` | Đã thu | Collected |
| `operations.cashDetail.amount` | Số tiền của đơn | Order amount |
| `operations.cashDetail.holdUntil` | Hạn giữ chỗ: {{time}} | Hold until: {{time}} |
| `operations.cashDetail.holdPassed` | Đã quá hạn giữ chỗ lúc {{time}}. Không thu tiền cho đơn này. | The hold ended at {{time}}. Don't collect money for this order. |
| `operations.cashDetail.expired` | Đơn đã hết hạn lúc {{time}}. Chỗ học đã được trả lại. | This order expired at {{time}}. The seat has been released. |
| `operations.cashDetail.cancelled` | Đơn đã hủy. | This order was cancelled. |
| `operations.cashDetail.paidAt` | Lúc {{time}} | At {{time}} |
| `operations.cashDetail.byMe` | Bạn đã xác nhận | You confirmed this |
| `operations.cashDetail.byOther` | {{name}} đã xác nhận | {{name}} confirmed this |
| `operations.cashDetail.byLegacy` | {{name}} · Mentor, dữ liệu cũ | {{name}} · Mentor, legacy |
| `operations.cashDetail.student` | Học viên | Student |
| `operations.cashDetail.classes` | Lớp trong đơn · {{count}} | Classes in this order · {{count}} |
| `operations.cashDetail.lineQty` | {{quantity}} × {{price}} | {{quantity}} × {{price}} |
| `operations.cashDetail.info` | Thông tin đơn | Order information |
| `operations.cashDetail.code` | Mã đơn | Order code |
| `operations.cashDetail.method` / `.cash` | Hình thức / Tiền mặt | Method / Cash |
| `operations.cashDetail.createdAt` | Ngày tạo | Created |
| `operations.cashDetail.notCash` | Đây không phải đơn tiền mặt. | This isn't a cash order. |
| `operations.cashDetail.confirm` | Xác nhận đã nhận tiền | Confirm money received |
| `operations.cashDetail.changed` | Đơn vừa thay đổi. Xem lại thông tin bên dưới. | This order just changed. Review the details below. |
| `operations.cashDetail.notChecked` | Chưa kiểm tra được đơn. Thử lại sau. | Couldn't check this order. Try again later. |
| `operations.cashDetail.sheetTitle` | Xác nhận tiền mặt | Confirm cash |
| `operations.cashDetail.received` | Số tiền đã nhận | Amount received |
| `operations.cashDetail.fullOnly` | Phải nhận đủ toàn bộ số tiền. Không thu một phần. Thao tác này không hoàn tác được. | You must receive the full amount. Partial payment isn't allowed. This can't be undone. |
| `operations.cashDetail.mismatch` | Số tiền phải đúng {{total}}. Không thu một phần hoặc thu dư. | The amount must be exactly {{total}}. Partial or extra payment isn't allowed. |
| `operations.cashDetail.back` | Quay lại | Back |
| `operations.cashDetail.done` | Đã xác nhận nhận {{amount}} | Confirmed {{amount}} received |
| `operations.cashDetail.alreadyByOther` | Đơn này đã được {{name}} xác nhận lúc {{time}}. Không cập nhật gì thêm. Nếu bạn vừa nhận tiền của học viên, hãy báo {{name}} để tránh thu trùng. | {{name}} already confirmed this order at {{time}}. Nothing else changed. If you just received money from the student, tell {{name}} so it isn't collected twice. |
| `operations.cashDetail.collectorUnknown` | Chưa tải được người xác nhận. | Couldn't load who confirmed this. |
| `operations.cashDetail.unknown` | Chưa rõ tiền đã được ghi nhận chưa. Đừng thu thêm tiền. | We're not sure the payment was recorded. Don't collect more money. |
| `operations.cashDetail.recorded` | Đã ghi nhận nhận tiền. Không cần gửi lại. | Payment recorded. No need to send again. |
| `operations.cashDetail.resend` | Gửi lại | Send again |
| `operations.cashDetail.recheck` | Kiểm tra lại | Check again |
| `operations.cashDetail.leaveUnknown` | Chưa rõ tiền đã được ghi nhận chưa. Mở lại đơn này để kiểm tra. | We're not sure the payment was recorded. Open this order again to check. |
| `operations.cashDetail.closed` | Đơn này không còn thu tiền được: đã hết hạn, đã đóng hoặc có lớp đã hủy. | This order can no longer be paid: it expired, was closed, or includes a cancelled class. |
| `operations.cashDetail.holdInvalid` | Chỗ giữ của học viên không còn hợp lệ nên chưa xác nhận được. | The student's held seat is no longer valid, so this can't be confirmed. |
| `operations.cashDetail.tellOwner` | Nếu đã nhận tiền, hãy báo người phụ trách. | If you've received money, tell the person in charge. |
| `operations.cashDetail.amountInvalid` | Số tiền chưa khớp với đơn. Kiểm tra lại. | The amount doesn't match the order. Check it again. |
| `operations.cashDetail.paidMismatch` | Đơn đã thanh toán nhưng chưa khớp với xác nhận tiền mặt. Không thu thêm tiền. Liên hệ hỗ trợ. | This order is paid but doesn't match a cash confirmation. Don't collect more money. Contact support. |
| `operations.cashDetail.stale` | Thông tin có thể đã cũ. | This information may be out of date. |

## 7. Accessibility

- Số tiền đọc đầy đủ đơn vị. Ô nhập đọc "Số tiền đã nhận, bắt buộc, cần đúng sáu triệu năm trăm nghìn đồng".
- Lỗi lệch số tiền đọc ngay khi bấm gửi; focus về ô nhập.
- Dải "Chưa rõ" dùng live region mức assertive.
- Sheet cuộn được khi bàn phím mở; nút gửi không bị che.
- Hàng lớp đọc liền tên khóa, tên lớp và số tiền.

## 8. testID

`cash-detail-screen`, `cash-detail-back`, `cash-detail-amount`, `cash-detail-status`, `cash-detail-deadline`, `cash-detail-paid-at`, `cash-detail-collector`, `cash-detail-collector-retry`, `cash-detail-student`, `cash-detail-line-<detailId>`, `cash-detail-line-<detailId>-qty`, `cash-detail-code`, `cash-detail-created`, `cash-detail-confirm`, `cash-detail-changed`, `cash-detail-not-checked`, `cash-detail-sheet`, `cash-detail-sheet-amount`, `cash-detail-received`, `cash-detail-received-error`, `cash-detail-submit`, `cash-detail-sheet-back`, `cash-detail-unknown`, `cash-detail-resend`, `cash-detail-recheck`, `cash-detail-by-other`, `cash-detail-closed`, `cash-detail-hold-invalid`, `cash-detail-amount-invalid`, `cash-detail-paid-mismatch`, `cash-detail-not-cash`, `cash-detail-stale`, `cash-detail-error`, `cash-detail-retry`, `cash-detail-denied`, `cash-detail-not-found`, `cash-detail-leave`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P5-S5-01 | PENDING còn hạn | Mở | Một `GET /manager/orders/:id`; đúng học viên, mã, lớp, tổng, hạn; có `cash-detail-confirm` |
| TC-P5-S5-02 | Đơn 2 lớp, `quantity` 1 | Xem | Hai hàng; không có dòng số lượng; số từng hàng đúng server; không tự cộng |
| TC-P5-S5-03 | Một hàng `quantity` 2 | Xem | Có `cash-detail-line-*-qty` |
| TC-P5-S5-04 | PENDING, `expiresAt` <= Date, đồng hồ máy lệch | Mở | `holdPassed` theo `Date`; **không có nút** |
| TC-P5-S5-05 | PAID, người thu là mình | Mở | "Đã thu"; `byMe`; không có nút |
| TC-P5-S5-06 | PAID, người khác | Mở | `byOther` |
| TC-P5-S5-07 | PAID, LEGACY_MENTOR | Mở | `byLegacy`; không lộ `referenceCode`, `mentorId` |
| TC-P5-S5-08 | EXPIRED | Mở | "Số tiền của đơn"; `expired`; không có nút |
| TC-P5-S5-09 | CANCELLED | Mở | `cancelled`; không có nút |
| TC-P5-S5-10 | `paymentType` PAYOS | Mở trực tiếp | `cash-detail-not-cash`; không có nút |
| TC-P5-S5-11 | PENDING | Bấm xác nhận | Có một GET trước khi mở sheet; sheet dùng dữ liệu mới |
| TC-P5-S5-12 | Đọc lại trả PAID | Bấm | Không mở sheet; `changed`; thẻ PAID |
| TC-P5-S5-13 | Đọc lại lỗi | Bấm | Không mở sheet; `notChecked`; không có POST |
| TC-P5-S5-14 | Sheet mở | Xem | Ô số tiền **trống**; nút khóa; không có ô tích |
| TC-P5-S5-15 | Dán "6.500.000 ₫abc" | Nhập | Giữ `6500000`, hiện `6.500.000` |
| TC-P5-S5-16 | Nhập thiếu 1 đồng hoặc thừa | Gửi | `mismatch`; **không có request** |
| TC-P5-S5-17 | Nhập đúng | Gửi | Một POST đúng route; body chỉ có `receivedAmount` số nguyên; **không có header `Idempotency-Key`, không có `expectedVersion`** |
| TC-P5-S5-18 | | Double tap | Đúng 1 POST |
| TC-P5-S5-19 | 200, đọc lại PAID bởi mình | Xem | Toast `done`; thẻ PAID; danh sách, roster được invalidate |
| TC-P5-S5-20 | 200, đọc lại PAID **bởi Manager khác** | Xem | `cash-detail-by-other` có tên, giờ; **không có toast thành công** |
| TC-P5-S5-21 | 200, đọc lại lỗi | Xem | Thẻ PAID theo response; `collectorUnknown`; không nói "bạn đã xác nhận" |
| TC-P5-S5-22 | POST mất response | Xem | Sheet giữ; ô khóa; `cash-detail-unknown`; **không có `cash-detail-resend` trước khi đọc xong**; có GET tự động |
| TC-P5-S5-23 | Tiếp -22, đọc lại PAID bởi mình | Xem | Toast `recorded`; không có POST thứ hai |
| TC-P5-S5-24 | Tiếp -22, đọc lại PENDING | Gửi lại | POST cùng số tiền; server replay không tạo giao dịch; đọc lại |
| TC-P5-S5-25 | Tiếp -22, đọc lại EXPIRED | Xem | Đóng sheet; thẻ EXPIRED; không có nút gửi lại |
| TC-P5-S5-26 | Tiếp -22, đọc lại lỗi | Xem | `cash-detail-recheck`; không có `cash-detail-resend` |
| TC-P5-S5-27 | POST 500 | Xem | Xử lý như chưa rõ, không báo "thất bại" chắc chắn |
| TC-P5-S5-28 | 409 `CASH_ORDER_CLOSED`, đọc lại EXPIRED | Xem | Thẻ EXPIRED |
| TC-P5-S5-29 | 409 `CASH_ORDER_CLOSED`, đọc lại vẫn PENDING | Xem | `cash-detail-closed`; không đoán nguyên nhân; có `tellOwner`; nút ẩn |
| TC-P5-S5-30 | 409 `CASH_HOLD_INVALID` | Xem | `cash-detail-hold-invalid`; `status` trên thẻ không tự đổi |
| TC-P5-S5-31 | 409 `CASH_CONFIRMATION_INVALID`, PENDING | Xem | `cash-detail-amount-invalid`; số nhập bị xóa |
| TC-P5-S5-32 | 409 `CASH_CONFIRMATION_INVALID`, PAID | Xem | `cash-detail-paid-mismatch`; có mã hỗ trợ |
| TC-P5-S5-33 | 403 `ORDER_ACCESS_DENIED` | Gửi | Xóa dữ liệu, số nhập; `cash-detail-denied` |
| TC-P5-S5-34 | Sheet đang gửi | Back | Không đóng được |
| TC-P5-S5-35 | Đang chưa rõ | Back | `cash-detail-leave` |
| TC-P5-S5-36 | Làm mới lỗi, có dữ liệu | Xem | Giữ thẻ; **nút xác nhận khóa** |
| TC-P5-S5-37 | Offline | Xem | `cash-detail-stale`; nút khóa; "Cần kết nối mạng"; không "Thử lại" |
| TC-P5-S5-38 | Sheet đã nhập số | Đóng rồi mở lại | Ô trống |
| TC-P5-S5-39 | Tìm chữ trong app | Xem | Không có chữ "Invoice", "hóa đơn", "biên nhận" |

Ứng viên Maestro E2E: TC-P5-S5-01, -04, -05, -11, -14, -16, -17, -19, -20. Thêm hồi quy: sau khi xác nhận, học viên xuất hiện trong roster lớp của Quản lý. Nếu lớp đã start, ghi danh tiền mặt muộn được đồng bộ qua đồng bộ sĩ số của P2 (dữ liệu E2E P2). Kiểm thu trùng bằng hai tài khoản Manager cùng một đơn.
