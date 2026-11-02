# P4-S4 — leave-review-queue · Đơn nghỉ cần duyệt

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-LEAVE-04; UC-MG-05. Endpoint tham chiếu: `GET /management/mentor-leave-requests`; `GET /manager/mentors` (tra tên, chọn Mentor).

## 1. Mục tiêu

Quản lý thấy các đơn nghỉ và mở từng đơn để xử lý. Màn chỉ đọc. Không hứa thời gian phản hồi và không có thông báo đẩy ở P0.

**Lựa chọn ban đầu:** `status=PENDING`, không lọc Mentor. Đây là việc cần làm; các trạng thái khác chỉ tải khi chọn (ADR-025 mục 2). Server trả toàn bộ backlog theo `submittedAt` giảm dần; không đổi thứ tự (G-P4-11).

## 2. Bố cục

Theo mẫu [H], bỏ các dòng về dạy thay và xung đột vì list không có dữ liệu đó.

```
┌──────────────────────────────┐
│▓ ←  Đơn xin nghỉ             ▓│
│▓    4 đơn                    ▓│  total server, ẩn khi chưa có
├──────────────────────────────┤
│ (Chờ duyệt)(Đã duyệt)(Đã từ chối)(Đã rút)(Hết hạn)  [≡ Mentor] → cuộn ngang
│ ┌──────────────────────────┐ │
│ │ (NL) Nguyễn Hoàng Long [Chờ duyệt]│
│ │ 06/11 – 08/11/2026 · Cả ngày│
│ │ Việc gia đình đột xuất   │ │
│ │ 3 buổi · Gửi 02/11, 09:12│ │
│ │ ◷ Hạn xử lý 18:30 06/11  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Thẻ dùng `LeaveRequestCard` có thêm dòng Mentor ở đầu: avatar chữ cái 32 + tên 14/600. Bấm mở S5.
- Bộ lọc `Filters` cuộn ngang cùng nút Mentor trong một hàng, như `IncompleteSessions`. Nút Mentor khi đã chọn đổi thành tên cắt 1 dòng kèm nút xóa, vùng chạm 44.
- Phụ đề luôn từ `total`, theo filter đang chọn, không phải số đã tải.
- Back về đúng filter và vị trí; refetch khi focus: đơn đã xử lý tự biến mất khỏi Chờ duyệt.

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Tên Mentor | `mentorId` qua bảng tra | Đang tra: skeleton ở dòng tên. Không tra được: "Chưa có tên", avatar icon `person`. **Không hiện id** |
| Khoảng ngày, ca, lý do, số buổi, thời gian gửi | Như S1 mục 3 | |
| Trạng thái | `status` hiệu lực từ server. Đơn PENDING quá hạn không còn trong lọc Chờ duyệt | |
| Hạn xử lý | `expiresAt`, chỉ PENDING | |

Lý do nghỉ có thể nhạy cảm nhưng là thông tin Quản lý cần để quyết định, và [H] hiện trên thẻ; giữ tối đa 2 dòng.

**Không có trên thẻ:** số trùng lịch, buổi chưa có người dạy, mức ưu tiên (G-P4-04). Muốn biết phải mở đơn. Không gọi detail từng hàng để bù (ADR-025 mục 5).

### 3.1 Bảng tra Mentor (G-P4-03)

Khi mở màn, gọi `GET /manager/mentors`, `pageSize` 100, tải đủ theo `total`, **không gửi `status`** để gồm cả Mentor đã tạm ngưng: đơn cũ vẫn cần tên. Tải song song và **không chặn** danh sách.

- Tra lỗi: thẻ hiện "Chưa có tên", không báo lỗi trên từng thẻ, vẫn bấm được. Nút Mentor báo lỗi khi mở.
- Bảng tra này cũng là danh sách của sheet chọn Mentor, có ô tìm cục bộ, không gọi lại.

### 3.2 Bộ lọc

| Bộ lọc | Giá trị | Query |
| --- | --- | --- |
| Trạng thái | Chờ duyệt / Đã duyệt / Đã từ chối / Đã rút / Hết hạn | `status`. Không có chip "Tất cả": màn là hàng chờ, và mỗi chip là một lần tải (ADR-025 mục 2) |
| Mentor | Sheet danh sách từ bảng tra | `mentorId` |

Đổi lọc: về trang 1, xóa danh sách cũ ngay, hiện skeleton. Không giữ thẻ cũ dưới bộ lọc mới. Response cũ về sau bị bỏ qua.

### 3.3 Phân trang và làm mới

`pageSize` 20. Tải thêm khi cuộn gần cuối, một request tại một thời điểm. Refetch khi focus; kéo để làm mới. Danh sách có thể đổi giữa hai trang vì đơn được xử lý: khử trùng theo `id`, luôn lấy `total` mới nhất. Trang rỗng mà `total` còn lớn hơn số đã tải: tải lại từ trang 1, không kết luận hết việc.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| LQ-A | Đang tải | Skeleton 3 thẻ; bộ lọc dùng được; không có phụ đề số |
| LQ-B | Có dữ liệu | Mục 2 |
| LQ-C | Rỗng, Chờ duyệt, không lọc Mentor | Khối căn giữa `task_alt`: "Không có đơn nào chờ duyệt." Đây là rỗng thật từ `total` = 0 |
| LQ-D | Rỗng, trạng thái khác hoặc có lọc Mentor | "Không có đơn phù hợp." + nút text "Xóa bộ lọc" về Chờ duyệt, bỏ Mentor |
| LQ-E | Tải thêm: đang tải / lỗi | Giữ thẻ; skeleton footer / chữ lỗi + "Thử lại" đúng trang |
| LQ-F | Lần đầu lỗi | `StatusBlock` + "Thử lại". **Không hiện như rỗng**: nói "không có đơn" khi chưa tải được sẽ làm đơn hết hạn âm thầm |
| LQ-G | Làm mới lỗi | Giữ thẻ của cùng query; `Alert` warning + mã hỗ trợ |
| LQ-H | Offline: có dữ liệu | Giữ thẻ; `leave.stale`; không "Thử lại"; bấm thẻ vẫn mở |
| LQ-I | Offline: chưa có | `leave.offlineEmpty`; không hiện rỗng |
| LQ-J | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền, "Quay lại" |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `leave.queue.title` | Đơn xin nghỉ | Leave requests |
| `leave.queue.subtitle` | {{count}} đơn | {{count}} requests |
| `leave.queue.mentor` | Mentor | Mentor |
| `leave.queue.mentorSheet` | Chọn Mentor | Choose a mentor |
| `leave.queue.mentorSearch` | Tìm Mentor | Search mentors |
| `leave.queue.mentorFailed` | Chưa tải được danh sách Mentor. | Couldn't load mentors. |
| `leave.queue.noName` | Chưa có tên | No name |
| `leave.queue.emptyPending` | Không có đơn nào chờ duyệt. | No requests waiting for review. |
| `leave.queue.emptyFilter` | Không có đơn phù hợp. | No matching requests. |
| `leave.queue.clear` | Xóa bộ lọc | Clear filters |
| `leave.queue.failed` | Chưa tải được đơn nghỉ. | Couldn't load leave requests. |

## 6. Accessibility

- Thẻ đọc thành một cụm: "Nguyễn Hoàng Long, chờ duyệt, ngày 6 đến 8 tháng 11, cả ngày, Việc gia đình đột xuất, 3 buổi, gửi ngày 2 tháng 11, hạn xử lý 18:30 ngày 6 tháng 11", role `button`.
- Avatar ẩn khỏi trình đọc.
- Bộ lọc role `radiogroup`. Đổi lọc xong đọc "{n} đơn".

## 7. testID

`leave-queue-screen`, `leave-queue-back`, `leave-queue-subtitle`, `leave-queue-filter-pending`, `leave-queue-filter-approved`, `leave-queue-filter-rejected`, `leave-queue-filter-withdrawn`, `leave-queue-filter-expired`, `leave-queue-mentor-filter`, `leave-queue-mentor-clear`, `leave-queue-mentor-sheet`, `leave-queue-mentor-option-<mentorId>`, `leave-queue-row-<id>`, `leave-queue-row-mentor-<id>`, `leave-queue-row-status-<id>`, `leave-queue-row-due-<id>`, `leave-queue-empty`, `leave-queue-empty-filter`, `leave-queue-clear-filters`, `leave-queue-error`, `leave-queue-retry`, `leave-queue-refresh-alert`, `leave-queue-offline`, `leave-queue-denied`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S4-01 | Mở màn | Xem request | `status=PENDING`, không có `mentorId`, `page=1`, `pageSize=20` |
| TC-P4-S4-02 | Chưa chọn trạng thái khác | Xem request | Không có request cho APPROVED, REJECTED, WITHDRAWN, EXPIRED |
| TC-P4-S4-03 | `total` 45, trang 1 có 20 | Xem | Phụ đề "45 đơn" |
| TC-P4-S4-04 | Trang trả theo `submittedAt` giảm dần, `expiresAt` lộn xộn | Xem | Giữ thứ tự server |
| TC-P4-S4-05 | Mentor có trong bảng tra | Xem | Hiện tên; không có request theo từng hàng |
| TC-P4-S4-06 | Bảng tra Mentor 500 | Xem | Thẻ hiện "Chưa có tên", không hiện id; bấm vẫn mở |
| TC-P4-S4-07 | Mentor đã tạm ngưng | Xem | Vẫn có tên; request bảng tra không có `status` |
| TC-P4-S4-08 | | Chọn "Đã duyệt" | `status=APPROVED`, về trang 1, thẻ cũ biến mất ngay |
| TC-P4-S4-09 | Request A chậm, đổi lọc sang B, A về sau | | Chỉ hiện B |
| TC-P4-S4-10 | | Chọn Mentor | `mentorId` đúng; nút đổi thành tên; xóa được |
| TC-P4-S4-11 | `total` 0, Chờ duyệt | Xem | `leave-queue-empty` |
| TC-P4-S4-12 | Lọc xong rỗng | Xóa bộ lọc | Về Chờ duyệt, bỏ Mentor |
| TC-P4-S4-13 | 500 lần đầu | Xem | `leave-queue-error`; không phải `leave-queue-empty` |
| TC-P4-S4-14 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ thẻ |
| TC-P4-S4-15 | Đơn xuất hiện ở cả trang 1 và 2 | Tải thêm | Không trùng thẻ |
| TC-P4-S4-16 | Trang rỗng, `total` lớn hơn số đã tải | Tải thêm | Tải lại từ trang 1; không báo hết |
| TC-P4-S4-17 | | Bấm thẻ | Mở S5 đúng `requestId` |
| TC-P4-S4-18 | Duyệt xong, Back | Focus | Refetch; thẻ biến mất; `total` giảm; giữ bộ lọc |
| TC-P4-S4-19 | Offline, đã có dữ liệu | Xem | Giữ thẻ; cảnh báo; không "Thử lại" |
| TC-P4-S4-20 | Offline, chưa có | Mở | `leave.offlineEmpty`; không phải rỗng |
| TC-P4-S4-21 | 403 khi đã có dữ liệu | Refetch | Xóa thẻ; `leave-queue-denied` |
| TC-P4-S4-22 | Tìm số trên chip, số xung đột, "ưu tiên", hứa thời gian phản hồi | Xem | Không có |
| TC-P4-S4-23 | Đăng nhập Mentor | Tìm route | Không có `LeaveReviewQueue` |

Ứng viên Maestro E2E: TC-P4-S4-01, -03, -05, -08, -11, -17, -18.
