# P3-S5 — material-review-detail · Duyệt, từ chối và gỡ công bố đúng phiên bản

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAT-01, BR-MAT-03, BR-MAT-04, BR-MAT-05; UC-MG-04. Endpoint tham chiếu: `GET /manager/materials/:materialId`; `POST .../approve`; `POST .../reject`; `POST .../publish`; `POST .../unpublish`; `GET /manager/mentors/:mentorId`; `GET /manager/classes/:classId/units`.

## 1. Mục tiêu

Quản lý xem đúng phiên bản Mentor đã gửi, hiểu rằng tài liệu dùng chung cho cả chương, rồi duyệt hoặc từ chối có lý do. Với tài liệu đã công bố, Quản lý gỡ được; đã gỡ thì công bố lại được.

Theo Q-MAT-01b: **không có Sửa, Tạo, Xóa** cho Quản lý trên mobile.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Duyệt tài liệu           ▓│
│▓    Unit 8 – Line graphs     ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Unit 8 – Line graphs│ │  MaterialSummary
│ │ │PPT│ [Chờ duyệt]         │ │
│ │ └───┘                     │ │
│ │ Người tạo Trần Thị Linh   │ │  ẩn nếu không tra được
│ │ Lớp       IELTS Foundation│ │  ẩn nếu null
│ │ Chương    Chương 8 · …    │ │  ẩn nếu không tra được
│ │ Loại      Tài liệu        │ │
│ │ Tệp       Line-graphs.pptx│ │
│ │ Kích thước 6,8 MB         │ │
│ │ Phiên bản 2               │ │
│ │ Cập nhật  18:40 01/11/2026│ │
│ │ ──────────                │ │
│ │ Mô tả…                    │ │
│ │ [ 👁 Xem nội dung ]        │ │
│ └──────────────────────────┘ │
│ ⓘ Tài liệu dùng chung cho cả  │  Alert info, khi còn chờ duyệt
│   chương. Khi duyệt, học viên│
│   mọi lớp đang học chương này│
│   sẽ thấy ngay.              │
├──────────────────────────────┤
│ [ Từ chối ] [ Duyệt và công bố]│  thanh hành động theo mục 3
└──────────────────────────────┘
```

- **Xem nội dung:** `Button` secondary, mở S6 với `materialId`, `revision` đang hiển thị, `fileId`. Không xin URL trước khi bấm. **Không bắt buộc xem trước** mới được duyệt: server không kiểm được việc này và cổng giả sẽ không giúp gì; chữ xác nhận nhắc lại phiên bản.
- **`availableAt`** có giá trị: thêm dòng "Hiển thị từ {thời gian}", và chữ xác nhận duyệt nêu thời điểm đó.
- **Đính kèm:** `AttachmentList`, như S3.

### 2.1 Tác động dùng chung (G-P3-07)

Material thuộc CourseUnit nên mọi lớp cùng khóa đều bị ảnh hưởng (BR-MAT-01). Backend không có API cho biết số lớp, nên design **nêu tác động bằng lời, không có số**. Không tự đếm từ danh sách lớp, vì không biết lớp nào đang học chương đó. `createdInClassId` chỉ là lớp nơi tài liệu được tạo, không phải phạm vi hiển thị.

### 2.2 Tra tên

Chỉ để hiển thị, không chặn màn, lỗi thì ẩn dòng và không hiện id:

| Dòng | Nguồn | Điều kiện gọi |
| --- | --- | --- |
| Người tạo | Bảng tra S4; nếu chưa có: `GET /manager/mentors/:createdBy` | Tài liệu do Quản lý tạo trả 404: ẩn dòng |
| Lớp | Bảng tra S4; nếu chưa có: `GET /manager/classes/:createdInClassId` | Khi `createdInClassId` khác null |
| Chương | `GET /manager/classes/:createdInClassId/units`, tìm `courseUnitId` khớp | Khi `createdInClassId` khác null |

## 3. Hành động theo trạng thái

| Trạng thái | Thông báo | Nút |
| --- | --- | --- |
| PENDING_REVIEW | Info tác động mục 2.1 | Secondary "Từ chối"; primary "Duyệt và công bố" |
| APPROVED, `publishedAt` có | Dòng "Đã công bố lúc {thời gian}" | Secondary "Gỡ công bố" (`public_off`) |
| APPROVED, `publishedAt` null | Warning "Tài liệu đã duyệt nhưng đang bị gỡ. Học viên không thấy." | Primary "Công bố lại" (`public`) |
| REJECTED | Danger: lý do + thời điểm + "Mentor cần sửa rồi gửi lại." | Không có |
| DRAFT | Info "Bản nháp chưa được gửi duyệt." | Không có |

Backend cho Quản lý duyệt trực tiếp bản nháp của mình và bản đã từng duyệt; mobile không làm nhánh đó vì không có Sửa/Tạo. Không hiện nút dạng disabled.

### 3.1 Duyệt và công bố

`ConfirmationDialog` icon `task_alt`, testID `approve-dialog`. Tiêu đề "Duyệt và công bố?". Thân: "Phiên bản {revision} sẽ được công bố ngay. Học viên mọi lớp đang học chương này sẽ thấy." Có `availableAt` tương lai: "... sẽ thấy từ {thời gian}." So sánh tương lai chỉ để chọn câu chữ; thiếu `asOf` nên khi không chắc thì dùng câu nêu thời điểm.

Nút "Để sau" và "Duyệt và công bố". `POST approve` với `expectedRevision` = `revision` đang hiển thị. Thành công: cập nhật màn bằng response, Toast "Đã duyệt và công bố". Ở lại màn, invalidate hàng đợi.

### 3.2 Từ chối

`Sheet` testID `reject-sheet`. Tiêu đề "Từ chối tài liệu", phụ đề là tiêu đề tài liệu.

- Ba chip gợi ý theo [H]: "Nội dung chưa đúng chương", "Thiếu đáp án / hướng dẫn", "Chất lượng file chưa đạt". Bấm chip **điền vào ô**, sửa tiếp được. Chip không phải mã; server chỉ nhận chuỗi.
- `MultilineField` nhãn "Lý do", bắt buộc, tối đa 2000 ký tự. Server trim trước khi lưu: chỉ khoảng trắng là trống.
- Gửi chuỗi đã trim. Nút "Từ chối" danger khóa khi trống hoặc quá dài. Vượt giới hạn không cắt nội dung.
- Mentor đọc được lý do này ở S1, S3: chữ gợi ý ngắn "Mentor sẽ đọc được lý do này."

`POST reject` với `expectedRevision`, `reason`. Thành công: đóng Sheet, cập nhật màn, Toast "Đã từ chối".

### 3.3 Gỡ công bố và công bố lại

**Gỡ:** `ConfirmationDialog` icon `public_off`, testID `unpublish-dialog`. Tiêu đề "Gỡ công bố?"; thân "Học viên và Mentor các lớp sẽ không còn thấy tài liệu này. Phiên bản đã duyệt được giữ lại."; nút "Để sau" và "Gỡ công bố" danger. Backend không có trường lý do, nên không có ô lý do.

**Công bố lại:** `ConfirmationDialog` icon `public`, testID `publish-dialog`. Tiêu đề "Công bố lại?"; thân "Phiên bản {revision} sẽ hiển thị lại cho học viên mọi lớp đang học chương này."

Cả hai gửi `expectedRevision`. Công bố lại kiểm file READY ở server: 409 `FILE_NOT_READY` theo mục 4.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| RD-A | Đang tải | Skeleton `MaterialSummary`; chưa có nút |
| RD-B | Có dữ liệu | Mục 2, 3 |
| RD-C | Lỗi lần đầu | `StatusBlock` + "Thử lại" |
| RD-D | Làm mới lỗi | Giữ dữ liệu; `Alert` warning |
| RD-E | Tra tên đang tải / lỗi | Skeleton ở dòng / ẩn dòng. Không chặn nút |
| RD-F | Đang gửi | Nút `busy`, Sheet và dialog không đóng được; Back bị chặn |
| RD-G | 409 `MATERIAL_REVIEW_CONFLICT` | Đóng dialog, **giữ nội dung ô lý do**. Tải lại; `RevisionNotice`; hiển thị theo trạng thái mới. Không tự gửi lại; người dùng xem lại và bấm lại |
| RD-H | 409 `FILE_NOT_READY` | `fileNotReady`; giữ trạng thái; không có thử lại tự động |
| RD-I | 422 | Dải danger + mã hỗ trợ; giữ ô lý do |
| RD-J | Chưa rõ kết quả | `IntentBanner` + "Gửi lại" cùng `expectedRevision`; từ chối giữ nguyên lý do và khóa ô |
| RD-K | 403 `MATERIAL_ACCESS_DENIED` | Xóa dữ liệu; `StatusBlock` không quyền |
| RD-L | 403 `ORIGIN_NOT_ALLOWED` | Lỗi chung + mã hỗ trợ; giữ dữ liệu |
| RD-M | 404 | Xóa dữ liệu; `StatusBlock` không tìm thấy. Đã bị xóa ở nơi khác |
| RD-N | Offline: có dữ liệu | Giữ; `stale`; nút khóa, `needOnline`; "Xem nội dung" khóa |
| RD-O | Offline: chưa có | `offlineEmpty` |
| RD-P | 401 | Về Login; xóa ô lý do |

Quy tắc đúng phiên bản: `expectedRevision` luôn là `revision` đang **hiển thị**, không phải bản mới nhất mà refetch vừa đưa về khi dialog đang mở. Refetch làm đổi `revision` khi dialog đang mở: đóng dialog và hiện `RevisionNotice`, tránh duyệt bản chưa xem.

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `materials.review.title` | Duyệt tài liệu | Review material |
| `materials.review.author` / `.class` / `.unit` | Người tạo / Lớp / Chương | Created by / Class / Chapter |
| `materials.review.sharedImpact` | Tài liệu dùng chung cho cả chương. Khi duyệt, học viên mọi lớp đang học chương này sẽ thấy ngay. | This material is shared across the chapter. Once approved, students in every class on this chapter will see it right away. |
| `materials.review.reject` | Từ chối | Reject |
| `materials.review.approve` | Duyệt và công bố | Approve and publish |
| `materials.review.approveTitle` | Duyệt và công bố? | Approve and publish? |
| `materials.review.approveBody` | Phiên bản {{revision}} sẽ được công bố ngay. Học viên mọi lớp đang học chương này sẽ thấy. | Version {{revision}} will be published right away. Students in every class on this chapter will see it. |
| `materials.review.approveBodyLater` | Phiên bản {{revision}} sẽ được công bố. Học viên mọi lớp đang học chương này sẽ thấy từ {{time}}. | Version {{revision}} will be published. Students in every class on this chapter will see it from {{time}}. |
| `materials.review.later` | Để sau | Not now |
| `materials.review.approved` | Đã duyệt và công bố | Approved and published |
| `materials.review.rejectTitle` | Từ chối tài liệu | Reject material |
| `materials.review.reason` | Lý do | Reason |
| `materials.review.reasonHint` | Mentor sẽ đọc được lý do này. | The mentor will see this reason. |
| `materials.review.reason1` | Nội dung chưa đúng chương | Content doesn't match the chapter |
| `materials.review.reason2` | Thiếu đáp án / hướng dẫn | Missing answers or instructions |
| `materials.review.reason3` | Chất lượng file chưa đạt | File quality isn't good enough |
| `materials.review.rejected` | Đã từ chối | Rejected |
| `materials.review.rejectedInfo` | Mentor cần sửa rồi gửi lại. | The mentor needs to edit and resubmit. |
| `materials.review.publishedAt` | Đã công bố lúc {{time}} | Published at {{time}} |
| `materials.review.unpublish` | Gỡ công bố | Unpublish |
| `materials.review.unpublishTitle` | Gỡ công bố? | Unpublish? |
| `materials.review.unpublishBody` | Học viên và Mentor các lớp sẽ không còn thấy tài liệu này. Phiên bản đã duyệt được giữ lại. | Students and mentors will no longer see this material. The approved version is kept. |
| `materials.review.unpublished` | Đã gỡ công bố | Unpublished |
| `materials.review.unpublishedInfo` | Tài liệu đã duyệt nhưng đang bị gỡ. Học viên không thấy. | Approved but unpublished. Students can't see it. |
| `materials.review.publish` | Công bố lại | Publish again |
| `materials.review.publishTitle` | Công bố lại? | Publish again? |
| `materials.review.publishBody` | Phiên bản {{revision}} sẽ hiển thị lại cho học viên mọi lớp đang học chương này. | Version {{revision}} will be visible again to students in every class on this chapter. |
| `materials.review.published` | Đã công bố lại | Published again |
| `materials.review.draftInfo` | Bản nháp chưa được gửi duyệt. | This draft hasn't been submitted. |

## 6. Accessibility

- Mở dialog đọc tiêu đề và thân, gồm số phiên bản và tác động.
- Lỗi ô lý do đọc khi bấm gửi. Chip gợi ý role `button`, không phải `radio`, vì chỉ điền nội dung.
- Thanh hành động không đè nội dung cuối; bàn phím không che ô lý do trong Sheet.

## 7. testID

`review-detail-screen`, `review-detail-back`, `review-detail-status`, `review-detail-author`, `review-detail-class`, `review-detail-unit`, `review-detail-revision`, `review-detail-impact`, `review-detail-view`, `review-detail-attachment-<fileId>`, `review-detail-approve`, `review-detail-reject`, `review-detail-unpublish`, `review-detail-publish`, `review-detail-rejected`, `review-detail-draft-note`, `approve-dialog`, `approve-confirm`, `reject-sheet`, `reject-chip-1`, `reject-chip-2`, `reject-chip-3`, `reject-reason`, `reject-confirm`, `unpublish-dialog`, `unpublish-confirm`, `publish-dialog`, `publish-confirm`, `review-detail-conflict`, `review-detail-unknown`, `review-detail-resend`, `review-detail-error`, `review-detail-retry`, `review-detail-denied`, `review-detail-not-found`, `review-detail-offline`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P3-S5-01 | Mở màn | Xem request | GET chi tiết; không xin URL file; tra tên không theo từng hàng |
| TC-P3-S5-02 | PENDING_REVIEW, revision 2 | Duyệt, xác nhận | Dialog nêu phiên bản 2 và tác động; POST `expectedRevision` 2; chip "Đã công bố"; không có nút xuất bản riêng |
| TC-P3-S5-03 | | Bấm Duyệt, "Để sau" | Không có request |
| TC-P3-S5-04 | PENDING, `availableAt` có giá trị | Duyệt | Dialog nêu thời điểm |
| TC-P3-S5-05 | Xem Alert tác động | | Có chữ dùng chung cho cả chương; **không có số lớp** |
| TC-P3-S5-06 | Mở Từ chối, ô trống hoặc chỉ khoảng trắng | | Nút khóa; không có request |
| TC-P3-S5-07 | Lý do 2001 ký tự | | Bộ đếm danger; không cắt; nút khóa |
| TC-P3-S5-08 | Bấm chip gợi ý | | Điền vào ô; sửa tiếp được |
| TC-P3-S5-09 | Lý do "  Thiếu  " | Gửi | `reason` "Thiếu"; màn thành REJECTED, hiện lý do; không có nút |
| TC-P3-S5-10 | APPROVED, có `publishedAt` | Xem | Chỉ có "Gỡ công bố" |
| TC-P3-S5-11 | Gỡ, xác nhận | | POST `unpublish` với `expectedRevision`; không có ô lý do; chip "Đã gỡ công bố"; `revision` giữ nguyên |
| TC-P3-S5-12 | APPROVED, `publishedAt` null | Xem | Warning; chỉ có "Công bố lại" |
| TC-P3-S5-13 | Công bố lại: 409 `FILE_NOT_READY` | | `fileNotReady`; giữ trạng thái |
| TC-P3-S5-14 | REJECTED | Xem | Lý do; không có nút |
| TC-P3-S5-15 | DRAFT (mở từ màn cũ) | Xem | `review-detail-draft-note`; không có nút duyệt |
| TC-P3-S5-16 | Tìm Sửa, Xóa, Tạo | Xem | Không có; không có route PATCH, DELETE |
| TC-P3-S5-17 | Hai phiên: B duyệt trước, A bấm duyệt | A nhận 409 | `RevisionNotice`; A thấy trạng thái mới; **không tự gửi** |
| TC-P3-S5-18 | Từ chối: 409 | | Sheet đóng; ô lý do còn nguyên nếu mở lại trong cùng trạng thái |
| TC-P3-S5-19 | Refetch đổi `revision` khi dialog đang mở | | Dialog đóng; `RevisionNotice`; không gửi `expectedRevision` mới âm thầm |
| TC-P3-S5-20 | Duyệt: mất response | "Gửi lại" | Cùng `expectedRevision`; server no-op; hiển thị đúng |
| TC-P3-S5-21 | Từ chối: mất response | "Gửi lại" | Cùng lý do; ô khóa |
| TC-P3-S5-22 | Duyệt: 409 `FILE_NOT_READY` | | `fileNotReady`; vẫn PENDING |
| TC-P3-S5-23 | `createdInClassId` null | Xem | Không có dòng Lớp, Chương; không gọi units |
| TC-P3-S5-24 | Tra Mentor 404, tra chương 500 | Xem | Ẩn dòng; không hiện id; nút vẫn dùng được |
| TC-P3-S5-25 | | Bấm "Xem nội dung" | S6 đúng `revision`, `fileId`; duyệt không bị chặn nếu chưa xem |
| TC-P3-S5-26 | Sau duyệt, Back | | S4 refetch; hàng rời "Chờ duyệt" |
| TC-P3-S5-27 | 404 khi đã có dữ liệu | Refetch | Xóa dữ liệu; `review-detail-not-found` |
| TC-P3-S5-28 | 403 `MATERIAL_ACCESS_DENIED` | Refetch | Xóa dữ liệu; `review-detail-denied` |
| TC-P3-S5-29 | 403 `ORIGIN_NOT_ALLOWED` khi duyệt | | Lỗi chung + mã hỗ trợ; giữ dữ liệu |
| TC-P3-S5-30 | Offline, đã có dữ liệu | Xem | Nút khóa, `needOnline`; không "Thử lại" |
| TC-P3-S5-31 | Đang gửi | Back, double tap | Back bị chặn; 1 request |
| TC-P3-S5-32 | Đăng nhập Mentor | Tìm route | Không có `MaterialReviewDetail` |

Ứng viên Maestro E2E: TC-P3-S5-02, -09, -11, -12, -17, -26.
