# P3-S4 — material-review-queue · Hàng đợi duyệt tài liệu

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAT-03; UC-MG-04. Endpoint tham chiếu: `GET /manager/materials`; `GET /manager/classes`; `GET /manager/mentors` (bảng tra).

## 1. Mục tiêu

Quản lý thấy các tài liệu đang chờ duyệt, xem lại những tài liệu đã duyệt hoặc đã từ chối, rồi mở từng tài liệu để quyết định. Màn chỉ đọc.

**Lựa chọn ban đầu:** `reviewStatus=PENDING_REVIEW`, trang 1 (ADR-025 mục 2). Các chip khác chỉ tải khi chọn. Server xếp `createdAt` giảm dần và không có query sắp xếp, nên giữ thứ tự server; **việc cũ nhất nằm cuối hàng đợi** (G-P3-04).

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Duyệt tài liệu           ▓│
│▓    4 tài liệu               ▓│  total server, ẩn khi chưa có
├──────────────────────────────┤
│ (Chờ duyệt)(Đã duyệt)(Bị từ chối)
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Unit 8 – Line graphs│ │  MaterialRow
│ │ │PPT│ IELTS Foundation K12│ │  ẩn nếu không tra được
│ │ └───┘ Trần Thị Linh       │ │  ẩn nếu không tra được
│ │ Tài liệu · 6,8 MB         │ │
│ │ [Chờ duyệt]               │ │
│ │ Cập nhật 18:40 01/11/2026 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Video Past experiences│
│ │ │MP4│ Giao tiếp B1 · Lớp 05│ │
│ │ └───┘ Trần Thị Linh       │ │
│ │ Video · 48 MB             │ │
│ │ [Chờ duyệt]               │ │
│ │ Cập nhật 09:02 31/10/2026 │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Bấm hàng mở S5. Back về đúng bộ lọc và vị trí, refetch khi focus: tài liệu đã xử lý tự rời khỏi "Chờ duyệt".
- Tổng ở phụ đề luôn từ `total` của bộ lọc đang chọn, không phải số đã tải (tiêu chí baseline). Nhãn "{n} tài liệu".
- Tile Trang chủ không có số (design chung mục 4.3).

## 3. Dữ liệu

### 3.1 Trên hàng

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Tiêu đề | `title` | |
| Lớp | Tên lớp có `id` = `createdInClassId` trong bảng tra | Null hoặc không tra được: ẩn dòng; **không hiện id** |
| Người tạo | `displayName` của Mentor có `id` = `createdBy` trong bảng tra | Ẩn dòng; không hiện id |
| Loại, dung lượng | `contentType`, `file.sizeBytes` | `file` null ở FILE/VIDEO: `fileMissing`. ARTICLE: "Bài viết" |
| Chip | Theo design chung mục 5 | |
| Thời gian | `updatedAt`, nhãn "Cập nhật" | Không gọi là "gửi lúc": DTO không có `submittedAt` |
| Lý do | `rejectionReason`, chỉ chip "Bị từ chối", tối đa 2 dòng | |

Không có tên chương ở hàng: DTO chỉ có `courseUnitId`, muốn tra phải gọi theo từng lớp (ADR-025 mục 5). S5 có.

### 3.2 Bảng tra (G-P3-03)

Khi mở màn, tải song song và **không chặn** danh sách:

- `GET /manager/classes`, **không lọc status**, `pageSize` 100, đủ theo `total`. Hàng đã duyệt có thể thuộc lớp đã kết thúc.
- `GET /manager/mentors`, `pageSize` 100, đủ theo `total`.

| Tình huống | Hiển thị |
| --- | --- |
| Đang tra | Skeleton ở hai dòng tương ứng |
| Tra lỗi | Ẩn hai dòng; không báo lỗi từng hàng; hàng vẫn bấm được |
| Có `createdInClassId` null | Tài liệu do Quản lý tạo trên web: chỉ ẩn dòng lớp |

Giữ bảng tra trong bộ nhớ khi còn ở màn; làm mới danh sách không tải lại bảng tra. Không gọi API theo từng hàng. Nếu backend bổ sung tên vào DTO thì bỏ bước này.

### 3.3 Bộ lọc

| Chip | Query | Ghi chú |
| --- | --- | --- |
| Chờ duyệt | `reviewStatus=PENDING_REVIEW` | Mặc định |
| Đã duyệt | `reviewStatus=APPROVED` | Gồm cả đã gỡ công bố; hàng phân biệt bằng chip |
| Bị từ chối | `reviewStatus=REJECTED` | |

**Không có "Nháp" và "Tất cả":** bản nháp chưa gửi không phải việc của hàng đợi, và "Tất cả" sẽ kéo cả nháp của mọi Mentor. Luôn gửi `reviewStatus`. Không có tìm kiếm và lọc lớp: backend không hỗ trợ; lọc trên trang đã tải sẽ cho kết quả sai.

Đổi bộ lọc: về trang 1, xóa danh sách cũ ngay, hiện skeleton. Response cũ bị bỏ qua. Chip không có số.

### 3.4 Phân trang và làm mới

`pageSize` 20. Tải thêm khi cuộn gần cuối, một request tại một thời điểm. Refetch khi focus; kéo để làm mới. Danh sách có thể đổi giữa hai trang: khử trùng theo `id` khi nối trang và luôn lấy `total` mới nhất. Một trang rỗng mà `total` còn lớn hơn số đã tải: thử tải lại từ trang 1, không kết luận hết việc.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| RQ-A | Đang tải | Skeleton 4 hàng đúng kích thước; bộ lọc dùng được; không có phụ đề số |
| RQ-B | Có dữ liệu | Mục 2 |
| RQ-C | Rỗng "Chờ duyệt" | Khối căn giữa `task_alt`: "Không có tài liệu nào chờ duyệt." Đây là rỗng thật từ `total` = 0 |
| RQ-D | Rỗng ở chip khác | "Không có tài liệu ở trạng thái này." |
| RQ-E | Tải thêm: đang tải / lỗi | Giữ hàng; skeleton footer / chữ lỗi + "Thử lại" đúng trang |
| RQ-F | Lần đầu lỗi | `StatusBlock` + "Thử lại". **Không hiện như rỗng** |
| RQ-G | Làm mới lỗi | Giữ hàng của cùng query; `Alert` warning + mã hỗ trợ khi có |
| RQ-H | Offline: có dữ liệu | Giữ hàng; `stale`; không "Thử lại"; bấm hàng vẫn mở, S5 tự xử lý |
| RQ-I | Offline: chưa có | `offlineEmpty`; không phải rỗng |
| RQ-J | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền, "Quay lại" |
| RQ-K | 422 tham số | Lỗi chung + mã hỗ trợ |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `materials.queue.title` | Duyệt tài liệu | Review materials |
| `materials.queue.subtitle` | {{count}} tài liệu | {{count}} materials |
| `materials.queue.pending` / `.approved` / `.rejected` | Chờ duyệt / Đã duyệt / Bị từ chối | Pending / Approved / Rejected |
| `materials.queue.empty` | Không có tài liệu nào chờ duyệt. | No materials are waiting for review. |
| `materials.queue.emptyOther` | Không có tài liệu ở trạng thái này. | No materials with this status. |

## 6. Accessibility

- Hàng đọc thành một cụm: "Unit 8 Line graphs, IELTS Foundation K12, Trần Thị Linh, Tài liệu, 6,8 megabyte, Chờ duyệt, cập nhật 18 giờ 40 ngày 1 tháng 11", role `button`.
- Bộ lọc role `radiogroup`. Đổi lọc xong đọc "{n} tài liệu".

## 7. testID

`review-queue-screen`, `review-queue-back`, `review-queue-subtitle`, `review-queue-filter-pending`, `review-queue-filter-approved`, `review-queue-filter-rejected`, `review-queue-row-<id>`, `review-queue-row-class-<id>`, `review-queue-row-author-<id>`, `review-queue-row-status-<id>`, `review-queue-row-reason-<id>`, `review-queue-empty`, `review-queue-empty-other`, `review-queue-error`, `review-queue-retry`, `review-queue-refresh-alert`, `review-queue-offline`, `review-queue-denied`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P3-S4-01 | Mở màn | Xem request | `reviewStatus=PENDING_REVIEW`, trang 1, `pageSize` 20; không gọi status khác |
| TC-P3-S4-02 | `total` 45, trang 1 có 20 | Xem | "45 tài liệu", không phải 20 |
| TC-P3-S4-03 | Trả về theo thứ tự server | Xem | Giữ nguyên thứ tự; không sắp lại |
| TC-P3-S4-04 | | Chọn "Đã duyệt" | `reviewStatus=APPROVED`, về trang 1, hàng cũ biến mất ngay; phụ đề theo `total` mới |
| TC-P3-S4-05 | APPROVED có `publishedAt` / null | Xem | "Đã công bố" / "Đã gỡ công bố" |
| TC-P3-S4-06 | Request A chậm, đổi lọc sang B, A về sau | | Chỉ hiện B |
| TC-P3-S4-07 | Tìm chip Nháp, Tất cả, số trên chip, ô tìm | Xem | Không có; không request nào thiếu `reviewStatus` |
| TC-P3-S4-08 | Tra được lớp, Mentor | Xem | Hiện đúng tên; không có request theo từng hàng |
| TC-P3-S4-09 | Bảng tra lớp 500 | Xem | Hàng vẫn hiện, không có dòng lớp, không hiện id; bấm vẫn mở |
| TC-P3-S4-10 | `createdInClassId` null | Xem | Không có dòng lớp |
| TC-P3-S4-11 | Tài liệu thuộc lớp COMPLETED | Xem | Vẫn tra được tên lớp: bảng tra không lọc status |
| TC-P3-S4-12 | Danh sách lớp nhiều trang | Mở | Tải đủ theo `total`; không chặn danh sách |
| TC-P3-S4-13 | `file` null, FILE | Xem | `fileMissing`; không crash |
| TC-P3-S4-14 | Hàng REJECTED có lý do | Xem | Tối đa 2 dòng lý do |
| TC-P3-S4-15 | | Xem thời gian | Nhãn "Cập nhật", giờ Việt Nam; không có "hôm qua", không có "gửi lúc" |
| TC-P3-S4-16 | `total` 0 ở Chờ duyệt | Xem | `review-queue-empty` |
| TC-P3-S4-17 | 500 lần đầu | Xem | `review-queue-error`; không phải rỗng |
| TC-P3-S4-18 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ hàng |
| TC-P3-S4-19 | Hàng ở cả trang 1 và 2 | Tải thêm | Không trùng |
| TC-P3-S4-20 | | Bấm hàng | Mở S5 đúng `materialId` |
| TC-P3-S4-21 | Duyệt xong ở S5, Back | Focus | Hàng rời "Chờ duyệt"; `total` giảm; giữ bộ lọc |
| TC-P3-S4-22 | Offline, đã có dữ liệu | Xem | Giữ hàng; `stale`; không "Thử lại" |
| TC-P3-S4-23 | Offline, chưa có | Mở | `offlineEmpty`; không phải rỗng |
| TC-P3-S4-24 | 403 khi đã có dữ liệu | Refetch | Xóa hàng; `review-queue-denied` |
| TC-P3-S4-25 | Đăng nhập Mentor | Tìm route | Không có `MaterialReviewQueue` |

Ứng viên Maestro E2E: TC-P3-S4-01, -02, -04, -16, -20, -21.
