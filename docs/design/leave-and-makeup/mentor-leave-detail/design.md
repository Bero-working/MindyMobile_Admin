# P4-S3 — mentor-leave-detail · Chi tiết đơn nghỉ của tôi

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-LEAVE-04; UC-M-09, UC-M-10. Endpoint tham chiếu: `GET /mentor/leave-requests/:requestId`, `POST /mentor/leave-requests/:requestId/withdraw`; `GET /mentor/classes` (tra tên lớp).

## 1. Mục tiêu

Mentor xem một đơn của mình: khoảng nghỉ, từng buổi đổi thế nào, kết quả xử lý. Khi đơn còn chờ duyệt thì rút được, kèm lý do. Khi đã duyệt thì mở được buổi bù để kiểm lịch.

Mẫu [M] không có màn này. Bố cục đọc tương tự chi tiết đơn của [H], bỏ phần Quản lý.

Không có sửa đơn: backend không có route, muốn đổi thì rút rồi tạo mới. Không rút được đơn đã duyệt: đổi lịch sau duyệt thuộc P5.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Chi tiết đơn nghỉ        ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 06/11 – 08/11/2026  [Chờ duyệt]│
│ │ Cả ngày                  │ │
│ │ Gửi 02/11/2026, 09:12    │ │
│ │ ◷ Hạn xử lý 18:30 06/11  │ │
│ │ ──────────────────────── │ │
│ │ Lý do                    │ │
│ │ Việc gia đình            │ │
│ └──────────────────────────┘ │
│ ⚠ Có 2 trùng lịch học viên   │  khi PENDING và count > 0
│   với lịch bù. Đơn sẽ không  │
│   duyệt được nếu còn trùng.  │
│   Hãy rút đơn và tạo đơn mới │
│   với lịch bù khác.          │
│ ⓘ Giờ bù chưa được giữ cho   │  chỉ PENDING
│   đến khi duyệt.             │
│ BUỔI TRONG ĐƠN · 3           │
│ ┌──────────────────────────┐ │
│ │ IELTS 6.5 Intensive K08  │ │
│ │ Lịch gốc T6, 06/11 18:30–20:00│
│ │ ↻ Lịch bù T4, 11/11 18:30–20:00│
│ └──────────────────────────┘ │
│  ( Xem thêm )                │
│ ( Rút đơn )                  │  outline danger, chỉ PENDING
└──────────────────────────────┘
```

Sau khi APPROVED, thay phần cảnh báo và nút:

```
│ ✓ Đã duyệt 03/11/2026, 10:20 │  LeaveReviewBlock
│ Lý do của Quản lý            │
│ Đồng ý theo lịch đề xuất     │
│ BUỔI TRONG ĐƠN · 3           │
│ ┌──────────────────────────┐ │
│ │ IELTS 6.5 Intensive K08  │ │
│ │ Lịch gốc T6, 06/11 18:30–20:00 [Đã hủy]│
│ │ ↻ Buổi bù T4, 11/11 18:30–20:00  ›│  bấm mở chi tiết buổi
│ └──────────────────────────┘ │
│ Ngày kết thúc dự kiến của lớp │
│ IELTS 6.5 Intensive K08: 20/12/2026│
```

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Đầu thẻ | `fromDate`, `toDate`, `period`, `status`, `submittedAt` | Bắt buộc có |
| Hạn xử lý | `expiresAt`, chỉ PENDING | |
| Lý do xin nghỉ | `reason` | Bắt buộc có |
| Kết quả | `LeaveReviewBlock` theo `status` (mục 9.1 cấp phase) | |
| Tên lớp | `classId` qua bảng tra `GET /mentor/classes` | Ẩn dòng; **không hiện id** |
| Giờ gốc, giờ bù | `sourceStartsAt`, `sourceEndsAt`, `startsAt`, `endsAt` của item | Không có tiêu đề buổi: `LeaveItemDto` không trả (G-P4-03). Không gọi context từng hàng |
| Tổng số buổi | `itemCount`, không đếm trang đã tải | |
| Trùng lịch | `studentConflictCount` số hiện tại, chỉ hiện khi PENDING và > 0. Mentor không thấy id học viên | |
| Ngày kết thúc lớp | `classExtensions`, chỉ khi APPROVED. Chữ trung tính (G-P4-10) | Không có thì ẩn |

**Nhãn hàng theo trạng thái đơn:**

| `status` | Hàng hiện | Bấm hàng |
| --- | --- | --- |
| PENDING | "Lịch gốc" và "Lịch bù" (đề xuất) | Không bấm được |
| APPROVED | "Lịch gốc" kèm "Đã hủy", "Buổi bù" | Mở `SessionContext` với `replacementSessionId` khi có. Null thì không bấm được |
| REJECTED, WITHDRAWN, EXPIRED | "Lịch gốc" và "Lịch bù đề xuất", xám, không có "Đã hủy" | Không bấm được. Lịch **không** đổi, nên không được hiện như đã có lịch bù |

Buổi bù đã mở có thể về sau bị đổi tiếp ở P5. Hàng này là ảnh chụp lúc tạo đơn; chi tiết buổi là dữ liệu hiện tại. Dòng 12 dưới danh sách khi APPROVED: "Lịch hiện tại xem trong chi tiết buổi."

`pageSize` 20, nút "Xem thêm" tải trang kế tiếp theo `itemCount`. Làm mới khi focus và kéo.

## 4. Rút đơn

Nút chỉ hiện khi `status` PENDING. Bấm mở `Sheet`:

```
│ Rút đơn nghỉ?                │
│ Đơn 06/11 – 08/11/2026 sẽ    │
│ không còn được xử lý. Lịch   │
│ dạy không thay đổi.          │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                      0/1000  │
│ ( Rút đơn )      Giữ đơn     │
```

- Lý do bắt buộc 1–1000 sau trim. Trống: `leave.reasonRequired`.
- Body `expectedVersion` (từ lần tải mới nhất), `reason`. Key UUID v4.
- Thành công: đóng sheet, hiển thị từ response, invalidate danh sách, toast "Đã rút đơn." Dùng `version`, `status` trong response.

| Kết quả | Hành vi |
| --- | --- |
| 409 `LEAVE_VERSION_CONFLICT` | Đóng busy, tải lại, sheet giữ lý do, báo `leave.changed`. Nếu vẫn PENDING: người dùng bấm lại, tạo intent mới |
| 409 `LEAVE_STATE_CONFLICT` | Đóng sheet, tải lại, hiện trạng thái mới; báo "Đơn đã được xử lý nên không rút được." Đây là tình huống Quản lý vừa duyệt: **không được ghi đè** |
| 409 `LEAVE_REQUEST_EXPIRED` | Đóng sheet, tải lại, hiện Hết hạn; báo "Đơn đã hết hạn." |
| Chưa rõ kết quả | `IntentBanner` trong sheet, sheet không đóng được, "Gửi lại" cùng key, body, version |
| Offline | Nút khóa, `leave.needOnline` |

## 5. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| LD-A | Đang tải | Skeleton thẻ đầu + 2 hàng buổi |
| LD-B | PENDING | Mục 2 |
| LD-C | APPROVED | Khối kết quả, hàng buổi bù mở được, ngày kết thúc lớp |
| LD-D | REJECTED | Khối kết quả; hàng đề xuất xám; không nút |
| LD-E | WITHDRAWN | Như LD-D, nhãn "Lý do rút" |
| LD-F | EXPIRED | Khối hết hạn; **không hiện `review.reason`**; không nút |
| LD-G | Lần đầu lỗi | `StatusBlock` + "Thử lại" |
| LD-H | Làm mới lỗi | Giữ dữ liệu cùng query; `Alert` warning + mã hỗ trợ; **khóa Rút đơn** vì có thể đã cũ cho đến khi tải được |
| LD-I | Tải thêm lỗi | Giữ hàng; chữ lỗi + "Thử lại" đúng trang |
| LD-J | Offline: có dữ liệu | Giữ; `leave.stale`; Rút đơn khóa; hàng buổi bù vẫn bấm được, màn sau tự xử lý offline |
| LD-K | Offline: chưa có | `leave.offlineEmpty` |
| LD-L | 404 | `StatusBlock` không tìm thấy, "Quay lại". Không phân biệt đơn của người khác và id sai |
| LD-M | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền |

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `leave.detail.title` | Chi tiết đơn nghỉ | Leave request |
| `leave.detail.sentOn` | Gửi {{time}} | Sent {{time}} |
| `leave.detail.reason` | Lý do | Reason |
| `leave.detail.sessions` | Buổi trong đơn · {{count}} | Sessions · {{count}} |
| `leave.detail.conflictWarn` | Có {{count}} trùng lịch học viên với lịch bù. Đơn sẽ không duyệt được nếu còn trùng. Hãy rút đơn và tạo đơn mới với lịch bù khác. | {{count}} student timetable clashes with these make-up times. This can't be approved while they remain. Withdraw and submit a new request with other times. |
| `leave.detail.notHeld` | Giờ bù chưa được giữ cho đến khi duyệt. | Make-up times aren't held until approved. |
| `leave.detail.cancelled` | Đã hủy | Cancelled |
| `leave.detail.replacement` | Buổi bù | Make-up session |
| `leave.detail.proposed` | Lịch bù đề xuất | Proposed make-up |
| `leave.detail.currentNote` | Lịch hiện tại xem trong chi tiết buổi. | See session details for the current schedule. |
| `leave.detail.more` | Xem thêm | Show more |
| `leave.detail.withdraw` | Rút đơn | Withdraw |
| `leave.detail.withdrawTitle` | Rút đơn nghỉ? | Withdraw this request? |
| `leave.detail.withdrawBody` | Đơn {{range}} sẽ không còn được xử lý. Lịch dạy không thay đổi. | The {{range}} request will no longer be handled. Your schedule won't change. |
| `leave.detail.keep` | Giữ đơn | Keep request |
| `leave.detail.withdrawn` | Đã rút đơn. | Request withdrawn. |
| `leave.detail.alreadyHandled` | Đơn đã được xử lý nên không rút được. | This request was already handled, so it can't be withdrawn. |
| `leave.detail.expiredNow` | Đơn đã hết hạn. | This request has expired. |

## 7. Accessibility

- Hàng buổi đọc đủ: "IELTS 6.5 Intensive K08, lịch gốc thứ Sáu 6 tháng 11, 18:30 đến 20:00, đã hủy; buổi bù thứ Tư 11 tháng 11, 18:30 đến 20:00". Chỉ có role `button` khi bấm được.
- Không truyền đạt "Đã hủy" chỉ bằng gạch ngang hay màu.
- Mở sheet focus tiêu đề; thành công đọc toast.

## 8. testID

`leave-detail-screen`, `leave-detail-back`, `leave-detail-range`, `leave-detail-period`, `leave-detail-status`, `leave-detail-due`, `leave-detail-reason`, `leave-detail-review`, `leave-detail-review-reason`, `leave-detail-conflict-warning`, `leave-detail-not-held`, `leave-detail-session-<sourceSessionId>`, `leave-detail-session-open-<sourceSessionId>`, `leave-detail-class-end-<classId>`, `leave-detail-more`, `leave-detail-withdraw`, `leave-detail-withdraw-sheet`, `leave-detail-withdraw-reason`, `leave-detail-withdraw-send`, `leave-detail-withdraw-keep`, `leave-detail-error`, `leave-detail-retry`, `leave-detail-refresh-alert`, `leave-detail-offline`, `leave-detail-not-found`, `leave-detail-denied`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S3-01 | PENDING | Mở | Có Rút đơn, Hạn xử lý, dòng giờ bù chưa giữ; hàng không bấm được |
| TC-P4-S3-02 | PENDING, `studentConflictCount` 2 | Mở | Cảnh báo trùng có số 2 và hướng dẫn; không có id học viên |
| TC-P4-S3-03 | PENDING, `studentConflictCount` 0 | Mở | Không có cảnh báo trùng |
| TC-P4-S3-04 | APPROVED, có `replacementSessionId` | Mở, bấm hàng | Mở `SessionContext` đúng buổi bù; "Đã hủy" ở lịch gốc; không có Rút đơn |
| TC-P4-S3-05 | APPROVED, `replacementSessionId` null | Mở | Hàng không bấm được |
| TC-P4-S3-06 | REJECTED | Mở | "Lý do của Quản lý"; hàng đề xuất xám; không có "Đã hủy"; không nút |
| TC-P4-S3-07 | WITHDRAWN | Mở | "Lý do rút"; không có "Lý do của Quản lý" |
| TC-P4-S3-08 | EXPIRED, `review.reason` "Source start reached" | Mở | Chữ hết hạn tiếng Việt; không có chuỗi tiếng Anh; không có nút |
| TC-P4-S3-09 | EXPIRED, `review` null | Mở | Như trên, không crash |
| TC-P4-S3-10 | `classExtensions` có 2 lớp, APPROVED | Mở | Hai dòng "Ngày kết thúc dự kiến"; không có chữ "gia hạn" |
| TC-P4-S3-11 | `itemCount` 45, trang 1 có 20 | Mở | Tiêu đề 45; có Xem thêm |
| TC-P4-S3-12 | Xem thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ hàng |
| TC-P4-S3-13 | Tra lớp lỗi | Mở | Hàng không có tên lớp, không hiện id; vẫn đủ giờ |
| TC-P4-S3-14 | Không gọi context | Xem request | Không có `GET context` theo hàng |
| TC-P4-S3-15 | | Mở sheet rút, lý do trống | `leave.reasonRequired`; không request |
| TC-P4-S3-16 | Lý do hợp lệ | Gửi | Body đúng `expectedVersion`, `reason`; UUID v4; thành công hiển thị WITHDRAWN từ response; invalidate danh sách |
| TC-P4-S3-17 | 409 `LEAVE_VERSION_CONFLICT` | Gửi | Tải lại; giữ lý do; báo đổi; không tự gửi; lần sau key mới và version mới |
| TC-P4-S3-18 | 409 `LEAVE_STATE_CONFLICT`, server đã APPROVED | Gửi | Hiện APPROVED; báo đã xử lý; không có toast đã rút |
| TC-P4-S3-19 | 409 `LEAVE_REQUEST_EXPIRED` | Gửi | Hiện Hết hạn; gỡ nút |
| TC-P4-S3-20 | Mất mạng sau khi gửi | Gửi | `IntentBanner`; sheet không đóng được; Gửi lại cùng key |
| TC-P4-S3-21 | Double tap | Gửi | Một request |
| TC-P4-S3-22 | Làm mới lỗi khi PENDING | Xem | Giữ dữ liệu; Rút đơn khóa đến khi tải được |
| TC-P4-S3-23 | Offline, đã có dữ liệu | Xem | Cảnh báo; Rút đơn khóa; không "Thử lại" |
| TC-P4-S3-24 | Offline, chưa có | Mở | `leave.offlineEmpty` |
| TC-P4-S3-25 | 404 | Mở | `leave-detail-not-found`; chữ không tiết lộ đơn tồn tại |
| TC-P4-S3-26 | 403 khi đã có dữ liệu | Refetch | Xóa dữ liệu; `leave-detail-denied` |
| TC-P4-S3-27 | Quản lý duyệt lúc đang xem | Focus | Refetch; chuyển APPROVED; nút rút biến mất |
| TC-P4-S3-28 | Toast sau rút | Xem | Không chứa lý do |

Ứng viên Maestro E2E: TC-P4-S3-01, -04, -06, -16, -17, -18, -27.
