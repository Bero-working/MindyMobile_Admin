# P4-S1 — mentor-leave-list · Đơn nghỉ của tôi

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-LEAVE-01, BR-LEAVE-04; UC-M-09, UC-M-10. Endpoint tham chiếu: `GET /mentor/leave-requests`.

## 1. Mục tiêu

Mentor thấy các đơn nghỉ của chính mình, biết đơn nào đang chờ, kết quả ra sao, và là điểm bắt đầu để tạo đơn mới. Màn chỉ đọc. Server tự giới hạn theo tài khoản; client không gửi `mentorId`.

Mẫu [M] không có màn này. Thẻ dùng lại cách trình bày danh sách đơn của [H], bỏ avatar và tên Mentor vì đều là của chính người dùng.

**Lựa chọn ban đầu:** "Tất cả", không gửi `status` (ADR-025 mục 2). Một Mentor thường có ít đơn và cần thấy cả kết quả gần đây, khác với hàng chờ của Quản lý ở S4. Server xếp `submittedAt` giảm dần; không đổi thứ tự.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Đơn xin nghỉ             ▓│
├──────────────────────────────┤
│ (Tất cả)(Chờ duyệt)(Đã duyệt)(Đã từ chối)(Đã rút)(Hết hạn) → cuộn ngang
│ ┌──────────────────────────┐ │
│ │ 06/11 – 08/11/2026  [Chờ duyệt]│
│ │ Cả ngày                  │ │
│ │ Việc gia đình            │ │  13 secondary, tối đa 2 dòng
│ │ 3 buổi · Gửi 02/11, 09:12│ │
│ │ ◷ Hạn xử lý 18:30 06/11  │ │  chỉ PENDING
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ T3, 20/10/2026 [Đã duyệt]│ │
│ │ Sáng · 00:00–12:00       │ │
│ │ Khám sức khỏe            │ │
│ │ 1 buổi · Gửi 15/10, 20:01│ │
│ └──────────────────────────┘ │
│                              │
│                ( + Tạo đơn ) │  nút chính dính đáy phải
└──────────────────────────────┘
```

- `Filters` cuộn ngang một hàng, không xuống hàng, theo yêu cầu người dùng ở P2. Chip không có số: đếm từng trạng thái phải gọi thêm API (ADR-025 mục 5).
- Thẻ dùng `LeaveRequestCard`, bấm mở S3. Không dùng blur trên thẻ lặp.
- Nút "Tạo đơn" (icon `add`) mở S2. Nút nằm trên safe area và thêm padding đáy cho danh sách để không che thẻ cuối.
- "Hạn xử lý" chính là `expiresAt`, tức giờ bắt đầu buổi đầu tiên. Nghĩa: tới giờ đó mà chưa duyệt thì đơn hết hiệu lực.
- Back về đúng filter và vị trí; refetch khi focus để cập nhật kết quả duyệt.

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Khoảng ngày | `fromDate`, `toDate`, định dạng ở mục 9 cấp phase | Bắt buộc có |
| Ca | `period` | Bắt buộc có |
| Trạng thái | `status`. **Đã là trạng thái hiệu lực từ server**: PENDING quá hạn được trả về EXPIRED | Bắt buộc có |
| Lý do | `reason` | Bắt buộc có |
| Số buổi | `itemCount`. Không dùng `items` vì list luôn trả rỗng (G-P4-04) | |
| Thời gian gửi | `submittedAt` | |
| Hạn xử lý | `expiresAt`, chỉ PENDING | |

Không hiện tên lớp trên thẻ: list không có dữ liệu buổi, và `classExtensions` không đủ để nói đơn gồm lớp nào theo đúng thứ tự. Không hiện số trùng lịch (`studentConflictCount` null ở list).

### 3.1 Bộ lọc

| Chip | Query |
| --- | --- |
| Tất cả | bỏ `status` |
| Chờ duyệt / Đã duyệt / Đã từ chối / Đã rút / Hết hạn | `PENDING` / `APPROVED` / `REJECTED` / `WITHDRAWN` / `EXPIRED` |

Đổi lọc: về trang 1, xóa danh sách cũ ngay, hiện skeleton. Response cũ về sau bị bỏ qua. Lựa chọn chỉ giữ khi còn trong màn.

### 3.2 Phân trang và làm mới

`pageSize` 20. Tải thêm khi cuộn gần cuối, chỉ một request tại một thời điểm. Refetch khi focus; kéo để làm mới. Khử trùng theo `id` khi nối trang, luôn lấy `total` mới nhất. Lỗi tải thêm thử lại đúng trang đó.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| LL-A | Đang tải | Skeleton 3 thẻ đúng kích thước; bộ lọc dùng được; nút Tạo đơn dùng được |
| LL-B | Có dữ liệu | Mục 2 |
| LL-C | Rỗng, không lọc | Khối căn giữa `event_note`: "Bạn chưa có đơn nghỉ nào." + nút "Tạo đơn" trong khối, ẩn nút dính đáy để không có hai nút |
| LL-D | Rỗng, có lọc | "Không có đơn phù hợp." + nút text "Xem tất cả" |
| LL-E | Tải thêm: đang tải / lỗi | Giữ thẻ; skeleton footer / chữ lỗi + "Thử lại" đúng trang |
| LL-F | Lần đầu lỗi | `StatusBlock` + "Thử lại". **Không hiện như rỗng**. Nút Tạo đơn vẫn dùng được |
| LL-G | Làm mới lỗi | Giữ thẻ của cùng query; `Alert` warning + mã hỗ trợ khi có |
| LL-H | Offline: có dữ liệu | Giữ thẻ; `leave.stale`; không "Thử lại"; bấm thẻ vẫn mở |
| LL-I | Offline: chưa có dữ liệu | `leave.offlineEmpty`; không "Thử lại"; không hiện rỗng |
| LL-J | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền, "Quay lại" |

Nút Tạo đơn khi offline vẫn mở được S2 vì form nhập được; S2 tự khóa phần cần mạng.

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `leave.list.title` | Đơn xin nghỉ | Leave requests |
| `leave.list.all` | Tất cả | All |
| `leave.list.create` | Tạo đơn | New request |
| `leave.list.empty` | Bạn chưa có đơn nghỉ nào. | You don't have any leave requests yet. |
| `leave.list.emptyFilter` | Không có đơn phù hợp. | No matching requests. |
| `leave.list.showAll` | Xem tất cả | Show all |
| `leave.list.failed` | Chưa tải được đơn nghỉ. | Couldn't load leave requests. |

## 6. Accessibility

- Thẻ đọc thành một cụm: "Ngày 6 đến 8 tháng 11 năm 2026, cả ngày, chờ duyệt, Việc gia đình, 3 buổi, gửi ngày 2 tháng 11, hạn xử lý 18:30 ngày 6 tháng 11", role `button`.
- Bộ lọc role `radiogroup`. Đổi lọc xong đọc kết quả.
- Nút Tạo đơn có nhãn đầy đủ, vùng chạm ≥ 44.

## 7. testID

`leave-list-screen`, `leave-list-back`, `leave-list-filter-all`, `leave-list-filter-pending`, `leave-list-filter-approved`, `leave-list-filter-rejected`, `leave-list-filter-withdrawn`, `leave-list-filter-expired`, `leave-list-create`, `leave-list-row-<id>`, `leave-list-row-status-<id>`, `leave-list-row-due-<id>`, `leave-list-empty`, `leave-list-empty-filter`, `leave-list-show-all`, `leave-list-error`, `leave-list-retry`, `leave-list-refresh-alert`, `leave-list-offline`, `leave-list-denied`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S1-01 | Mở màn | Xem request | Không có `status`, không có `mentorId`; `page=1`, `pageSize=20` |
| TC-P4-S1-02 | Có đủ 5 trạng thái | Xem | Mỗi thẻ đúng nhãn và tone; giữ thứ tự server |
| TC-P4-S1-03 | Server trả `status` EXPIRED, `expiresAt` đã qua | Xem | "Hết hạn"; **không** có "Hạn xử lý"; không có chữ "Chờ duyệt" |
| TC-P4-S1-04 | Server trả PENDING | Xem | Có "Hạn xử lý {expiresAt}" đúng giờ Việt Nam |
| TC-P4-S1-05 | `itemCount` 3, `items` rỗng | Xem | "3 buổi" |
| TC-P4-S1-06 | `fromDate` = `toDate` | Xem | Hiện một ngày, không có dấu "–" |
| TC-P4-S1-07 | Máy múi giờ UTC−5, `fromDate` 2026-11-06 | Xem | Vẫn là 06/11, không lùi về 05/11 |
| TC-P4-S1-08 | | Chọn "Đã duyệt" | `status=APPROVED`, về trang 1, thẻ cũ biến mất ngay |
| TC-P4-S1-09 | Request A chậm, đổi lọc sang B, A về sau | | Chỉ hiện B |
| TC-P4-S1-10 | Rỗng, có lọc | Bấm "Xem tất cả" | Bỏ `status`, tải lại |
| TC-P4-S1-11 | `total` 0, không lọc | Xem | `leave-list-empty` có nút Tạo đơn; chỉ một nút Tạo đơn trên màn |
| TC-P4-S1-12 | 500 lần đầu | Xem | `leave-list-error`; không phải `leave-list-empty`; `leave-list-create` vẫn bấm được |
| TC-P4-S1-13 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ thẻ |
| TC-P4-S1-14 | Đơn xuất hiện ở cả trang 1 và 2 | Tải thêm | Không trùng thẻ |
| TC-P4-S1-15 | | Bấm thẻ | Mở S3 đúng `requestId`; params không có version hay status |
| TC-P4-S1-16 | | Bấm Tạo đơn | Mở S2 |
| TC-P4-S1-17 | Đơn vừa được duyệt ở nơi khác, Back từ S3 | Focus | Refetch; nhãn đổi; giữ bộ lọc |
| TC-P4-S1-18 | Offline, đã có dữ liệu | Xem | Giữ thẻ; cảnh báo; không "Thử lại" |
| TC-P4-S1-19 | Offline, chưa có | Mở | `offlineEmpty`; không phải rỗng |
| TC-P4-S1-20 | 403 khi đã có dữ liệu | Refetch | Xóa thẻ; `leave-list-denied` |
| TC-P4-S1-21 | Tìm số trên chip, tên lớp, số trùng lịch | Xem | Không có |
| TC-P4-S1-22 | Đăng nhập Quản lý | Tìm route | Không có `MentorLeaveList` |

Ứng viên Maestro E2E: TC-P4-S1-01, -02, -08, -11, -15, -16, -17.
