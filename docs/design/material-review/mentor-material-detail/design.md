# P3-S3 — mentor-material-detail · Xem, gửi duyệt và đọc kết quả

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAT-02, BR-MAT-03, BR-MAT-04, BR-MAT-05; UC-M-08. Endpoint tham chiếu: `GET /mentor/classes/:classId/materials/:materialId`; `POST .../materials/:materialId/submit`; `DELETE .../materials/:materialId?expectedRevision=`.

## 1. Mục tiêu

Mentor đọc một tài liệu, xem nội dung, gửi duyệt bản nháp của mình, đọc lý do từ chối, sửa rồi gửi lại, hoặc xóa bản nháp. Với tài liệu đã công bố hoặc của người khác, màn chỉ đọc.

Mẫu [M] gửi duyệt ngay trên hàng; design chuyển về đây để có xác nhận, vì sau khi gửi Mentor không sửa và không rút lại được.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Chi tiết tài liệu        ▓│
│▓    IELTS Foundation K12     ▓│
├──────────────────────────────┤
│ ⛔ Bị từ chối                 │  Alert danger, chỉ REJECTED
│    Thiếu đáp án phần 2       │
│    Lúc 09:12 02/11/2026      │
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Unit 8 – Worksheet  │ │  MaterialSummary
│ │ │PDF│ [Bị từ chối]        │ │
│ │ └───┘                     │ │
│ │ Loại     Tài liệu         │ │
│ │ Tệp      Worksheet-8.pdf  │ │
│ │ Kích thước 1,2 MB         │ │
│ │ Phiên bản 3               │ │
│ │ Cập nhật 09:12 02/11/2026 │ │
│ │ ──────────                │ │
│ │ Mô tả bài tập phần 2…     │ │
│ │ [ 👁 Xem nội dung ]        │ │
│ └──────────────────────────┘ │
│ ĐÍNH KÈM                     │  chỉ khi có attachments
│ ┌──────────────────────────┐ │
│ │ 📎 Answer-key.docx   ↗    │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ [ ✎ Sửa để gửi lại ]          │  thanh hành động theo mục 3
│        Xóa bản nháp          │
└──────────────────────────────┘
```

- Các dòng thông tin: ẩn dòng không có giá trị. `availableAt` có giá trị thì thêm dòng "Hiển thị từ {thời gian}". `sessionId` không hiện. ARTICLE không có dòng Tệp, Kích thước.
- **Xem nội dung** (`visibility`): `Button` secondary. Mở S6 với `materialId`, `revision`, `classId`, `fileId` = `file.id`. ARTICLE: không có `fileId`. Không xin URL trước khi bấm.
- `file` null: thay nút bằng dòng `fileMissing`.
- **Đính kèm:** `AttachmentList`. Bấm là xin URL rồi mở ngoài theo S6 mục 4. Chỉ đọc (Q-P3-02).
- **Người gửi, người duyệt:** không hiện tên; DTO chỉ có id. Chỉ hiện thời điểm `reviewedAt`.

## 3. Hành động theo trạng thái

Điều kiện `canEdit` lấy từ response hiện tại. "Của tôi" là `createdBy` = tài khoản đang đăng nhập.

| Trạng thái | Điều kiện | Thông báo trên đầu | Nút |
| --- | --- | --- | --- |
| DRAFT | `canEdit` | Không | Primary "Gửi duyệt" (`send`), secondary "Sửa" (`edit`), text danger "Xóa bản nháp" (`delete`) |
| DRAFT, ARTICLE | `canEdit` | Info "Bài viết chỉ sửa được trên web." | "Gửi duyệt", "Xóa bản nháp" |
| PENDING_REVIEW | Của tôi | Info "Đang chờ Quản lý duyệt. Bạn chưa thể sửa hay rút lại lúc này." | Không có |
| REJECTED | `canEdit` | Danger: lý do + thời điểm | Primary "Sửa để gửi lại", text danger "Xóa bản nháp" |
| REJECTED, ARTICLE | `canEdit` | Danger: lý do, kèm "Bài viết chỉ sửa được trên web." | "Xóa bản nháp" |
| APPROVED | Của tôi | Info "Tài liệu đã được duyệt nên bạn không sửa được. Hãy liên hệ Quản lý nếu cần thay đổi." | Không có |
| APPROVED | Của người khác | Không | Không có |

**Không có nút "Gửi duyệt" với REJECTED** (BR-MAT-03). Không hiện nút dạng disabled.

### 3.1 Gửi duyệt

`ConfirmationDialog` icon `send`. Tiêu đề "Gửi duyệt?"; thân "Sau khi gửi, bạn không sửa hay rút lại được cho đến khi có kết quả."; nút "Để sau" và "Gửi duyệt". testID `submit-dialog`.

Xác nhận: `POST submit` với `expectedRevision` = `revision` đang hiển thị. Thành công: dùng response để cập nhật màn, Toast "Đã gửi duyệt". Ở lại màn.

### 3.2 Xóa bản nháp

`ConfirmationDialog` icon `delete`. Tiêu đề "Xóa bản nháp?"; thân "Tài liệu này sẽ bị xóa khỏi danh sách."; nút "Giữ lại" và "Xóa" danger. testID `delete-dialog`.

`DELETE` với `expectedRevision` trong query. 204: về S1, Toast "Đã xóa bản nháp", invalidate danh sách chương. Backend giữ file và lịch sử; chữ không hứa xóa vĩnh viễn.

### 3.3 Sửa

Mở S2 với `materialId` và `classId`, `classUnitId`, `courseUnitId`. Màn này chỉ có `courseUnitId` từ response và `classId` từ params; `classUnitId` tra bằng `GET .../units` đã có trong cache của S1, thiếu thì gọi một lần khi bấm Sửa.

## 4. Dữ liệu

- Mở màn: một `GET` chi tiết. Refetch khi focus; chỉ đổi lớp server, không đụng dialog đang mở.
- Phát hiện kết quả duyệt: bằng refetch khi focus và kéo làm mới. Không polling, không push (P8).
- `rejectionReason` có thể null ở bản không phải của tôi; không hiện khối lý do khi null.

## 5. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| MD-A | Đang tải | Skeleton `MaterialSummary` |
| MD-B | Có dữ liệu | Mục 2, 3 |
| MD-C | Lỗi lần đầu | `StatusBlock` + "Thử lại" |
| MD-D | Làm mới lỗi | Giữ dữ liệu; `Alert` warning |
| MD-E | Đang gửi, đang xóa | Nút `busy`; Back bị chặn; các nút khác khóa |
| MD-F | Gửi: 409 `MATERIAL_REVIEW_CONFLICT` | Tải lại; `RevisionNotice`; hiển thị theo trạng thái mới; không tự gửi |
| MD-G | Gửi: 409 `FILE_NOT_READY` | `fileNotReady`; giữ DRAFT |
| MD-H | Gửi, xóa: chưa rõ kết quả | `IntentBanner` + "Gửi lại" cùng `expectedRevision`; an toàn vì lệnh lặp không đổi gì |
| MD-I | 403 `MATERIAL_ACCESS_DENIED` | Xóa dữ liệu; `StatusBlock` không quyền. Đọc chung với mất assignment |
| MD-J | 403 `ORIGIN_NOT_ALLOWED` | Lỗi chung + mã hỗ trợ; giữ dữ liệu |
| MD-K | 404 | Xóa dữ liệu; "Không tìm thấy tài liệu này. Tài liệu có thể đã bị xóa hoặc thay đổi." + "Quay lại" (G-P3-06) |
| MD-L | Offline: có dữ liệu | Giữ; `stale`; nút ghi khóa, `needOnline`; "Xem nội dung" khóa |
| MD-M | Offline: chưa có | `offlineEmpty` |
| MD-N | 401 | Về Login |

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `materials.detail.title` | Chi tiết tài liệu | Material details |
| `materials.detail.kind` / `.file` / `.size` / `.revisionLabel` / `.updated` / `.availableAt` | Loại / Tệp / Kích thước / Phiên bản / Cập nhật / Hiển thị từ | Type / File / Size / Version / Updated / Available from |
| `materials.detail.view` | Xem nội dung | View content |
| `materials.detail.attachments` | Đính kèm | Attachments |
| `materials.detail.submit` | Gửi duyệt | Submit for review |
| `materials.detail.edit` | Sửa | Edit |
| `materials.detail.editRejected` | Sửa để gửi lại | Edit and resubmit |
| `materials.detail.delete` | Xóa bản nháp | Delete draft |
| `materials.detail.pendingInfo` | Đang chờ Quản lý duyệt. Bạn chưa thể sửa hay rút lại lúc này. | Waiting for a manager's review. You can't edit or withdraw it right now. |
| `materials.detail.rejectedTitle` | Bị từ chối | Rejected |
| `materials.detail.rejectedAt` | Lúc {{time}} | At {{time}} |
| `materials.detail.approvedInfo` | Tài liệu đã được duyệt nên bạn không sửa được. Hãy liên hệ Quản lý nếu cần thay đổi. | This material has been approved, so you can't edit it. Contact a manager if it needs changing. |
| `materials.detail.articleWeb` | Bài viết chỉ sửa được trên web. | Articles can only be edited on the web. |
| `materials.detail.submitTitle` / `.submitBody` | Gửi duyệt? / Sau khi gửi, bạn không sửa hay rút lại được cho đến khi có kết quả. | Submit for review? / After submitting, you can't edit or withdraw it until there's a result. |
| `materials.detail.submitLater` | Để sau | Not now |
| `materials.detail.submitted` | Đã gửi duyệt | Submitted for review |
| `materials.detail.deleteTitle` / `.deleteBody` | Xóa bản nháp? / Tài liệu này sẽ bị xóa khỏi danh sách. | Delete draft? / This material will be removed from the list. |
| `materials.detail.deleteKeep` / `.deleteConfirm` | Giữ lại / Xóa | Keep / Delete |
| `materials.detail.deleted` | Đã xóa bản nháp | Draft deleted |
| `materials.detail.notFound` | Không tìm thấy tài liệu này. Tài liệu có thể đã bị xóa hoặc thay đổi. | Couldn't find this material. It may have been deleted or changed. |

## 7. Accessibility

- Thông báo lý do từ chối được đọc khi mở màn, trước `MaterialSummary`.
- Các dòng thông tin đọc theo cặp "Kích thước: 1,2 megabyte".
- Nút Xóa không đặt sát nút chính; khoảng cách theo token, vùng chạm ≥ 44.

## 8. testID

`material-detail-screen`, `material-detail-back`, `material-detail-status`, `material-detail-rejected`, `material-detail-pending`, `material-detail-approved`, `material-detail-article-note`, `material-detail-view`, `material-detail-file-missing`, `material-detail-attachment-<fileId>`, `material-detail-submit`, `material-detail-edit`, `material-detail-delete`, `submit-dialog`, `submit-confirm`, `delete-dialog`, `delete-confirm`, `material-detail-conflict`, `material-detail-unknown`, `material-detail-resend`, `material-detail-error`, `material-detail-retry`, `material-detail-denied`, `material-detail-not-found`, `material-detail-offline`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P3-S3-01 | Mở màn | Xem request | Đúng 1 GET chi tiết; không xin URL file |
| TC-P3-S3-02 | DRAFT, `canEdit` | Xem | "Gửi duyệt", "Sửa", "Xóa bản nháp" |
| TC-P3-S3-03 | DRAFT, `canEdit`, revision 3 | Gửi, xác nhận | Có dialog; POST `expectedRevision` 3; màn thành PENDING_REVIEW, không còn nút ghi |
| TC-P3-S3-04 | | Bấm gửi, "Để sau" | Không có request |
| TC-P3-S3-05 | REJECTED, `canEdit` | Xem | Lý do và thời điểm; **không** có "Gửi duyệt"; có "Sửa để gửi lại" |
| TC-P3-S3-06 | PENDING_REVIEW của tôi | Xem | Thông báo chờ; không có nút ghi nào, kể cả disabled |
| TC-P3-S3-07 | APPROVED của tôi | Xem | `material-detail-approved`; không có nút ghi |
| TC-P3-S3-08 | APPROVED của người khác | Xem | Không thông báo; không có nút ghi |
| TC-P3-S3-09 | DRAFT, ARTICLE | Xem | Không có "Sửa"; có `material-detail-article-note`; "Gửi duyệt" có |
| TC-P3-S3-10 | REJECTED, ARTICLE | Xem | Không "Sửa"; có "Xóa bản nháp" |
| TC-P3-S3-11 | Có `reviewStatus` DRAFT nhưng `canEdit` false | Xem | Không có nút ghi |
| TC-P3-S3-12 | Gửi: 409 conflict, server đã PENDING | | Tải lại; `RevisionNotice`; hiển thị PENDING; không gửi lại |
| TC-P3-S3-13 | Gửi: 409 `FILE_NOT_READY` | | `fileNotReady`; vẫn DRAFT |
| TC-P3-S3-14 | Gửi: mất response | "Gửi lại" | Cùng `expectedRevision`; server no-op; màn PENDING |
| TC-P3-S3-15 | Xóa, xác nhận, revision 2 | | DELETE `?expectedRevision=2`; về S1; hàng biến mất |
| TC-P3-S3-16 | Xóa mất response | "Gửi lại" | 204; về S1 |
| TC-P3-S3-17 | Xóa: 409 | | Tải lại; `RevisionNotice`; không về S1 |
| TC-P3-S3-18 | Bấm "Xem nội dung" | | S6 đúng `revision`, `fileId`; URL chỉ xin ở S6 |
| TC-P3-S3-19 | ARTICLE | Bấm "Xem nội dung" | S6 không có `fileId` |
| TC-P3-S3-20 | `file` null, FILE | Xem | `material-detail-file-missing`; không có nút xem |
| TC-P3-S3-21 | Có đính kèm | Xem | Liệt kê; không có nút thêm, xóa đính kèm |
| TC-P3-S3-22 | `availableAt` có giá trị | Xem | "Hiển thị từ {thời gian}" theo giờ Việt Nam |
| TC-P3-S3-23 | Duyệt ở nơi khác rồi focus | | Refetch; đổi chip và nút; không polling |
| TC-P3-S3-24 | 404 khi đã có dữ liệu | Refetch | Xóa dữ liệu; `material-detail-not-found`; không hiện dữ liệu cũ |
| TC-P3-S3-25 | 403 `MATERIAL_ACCESS_DENIED` | Refetch | Xóa dữ liệu; `material-detail-denied` |
| TC-P3-S3-26 | 403 `ORIGIN_NOT_ALLOWED` khi gửi | | Lỗi chung + mã hỗ trợ; giữ màn |
| TC-P3-S3-27 | Offline, đã có dữ liệu | Xem | Giữ; `stale`; nút ghi khóa; không "Thử lại" |
| TC-P3-S3-28 | Có mạng lại khi có lệnh chưa rõ | | Không tự gửi; nút "Gửi lại" hiện |
| TC-P3-S3-29 | Đang gửi | Bấm Back, double tap | Back bị chặn; chỉ 1 request |

Ứng viên Maestro E2E: TC-P3-S3-03, -05, -07, -15, -18.
