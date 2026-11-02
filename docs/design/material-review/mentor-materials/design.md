# P3-S1 — mentor-materials · Tài liệu theo chương

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAT-01, BR-MAT-02, BR-MAT-06; UC-M-08. Endpoint tham chiếu: `GET /mentor/classes`; `GET /mentor/classes/:classId`; `GET /mentor/classes/:classId/units`; `GET /mentor/classes/:classId/units/:unitId/materials`.

## 1. Mục tiêu

Mentor chọn lớp và chương, thấy tài liệu đã công bố của chương cùng bản của chính mình kèm trạng thái, rồi mở chi tiết hoặc tải tài liệu mới. Không có khóa/mở chương (BR-MAT-06).

**Lựa chọn ban đầu** (ADR-025 mục 2):

| Lựa chọn | Mặc định |
| --- | --- |
| Lớp (khi vào từ Trang chủ) | Chưa chọn; danh sách theo `status` IN_PROGRESS |
| Chương | `params.unitId` nếu có và còn trong danh sách; nếu không thì chương có `position` nhỏ nhất |
| Trạng thái | Tất cả, không gửi `reviewStatus` |

## 2. Bố cục

**Bước chọn lớp** (chỉ khi không có `classId`):

```
┌──────────────────────────────┐
│▓ ←  Tài liệu                 ▓│
│▓    Chọn lớp                 ▓│
├──────────────────────────────┤
│ (Đang dạy)(Sắp dạy)(Đã kết thúc)│
│ ┌──────────────────────────┐ │
│ │ IELTS Foundation K12    › │ │  dùng lại hàng lớp của P1-S2
│ │ IF-K12                    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Dùng lại dữ liệu, bộ lọc và hàng của P1-S2. Bấm hàng: `push` `MentorMaterials` với `classId`; Back về bước chọn lớp với đúng bộ lọc. Không hiện số tài liệu trên hàng.

**Danh sách theo chương:**

```
┌──────────────────────────────┐
│▓ ←  Tài liệu                 ▓│
│▓    IELTS Foundation K12     ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Chương 8 · Line graphs  ⌄ │ │  bộ chọn chương, mở Sheet
│ └──────────────────────────┘ │
│ [ ⇪ Tải tài liệu lên ]       │  chỉ khi authorMaterials
│ (Tất cả)(Nháp)(Chờ duyệt)(Bị từ chối)(Đã công bố) → cuộn ngang
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Unit 8 – Worksheet  │ │  MaterialRow
│ │ │PDF│ Tài liệu · 1,2 MB   │ │
│ │ └───┘ [Bị từ chối]        │ │
│ │ ⓘ Thiếu đáp án phần 2     │ │  lý do, tối đa 2 dòng
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Bài giảng Unit 8    │ │
│ │ │MP4│ Video · 36 MB       │ │
│ │ └───┘ [Đã công bố]        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- **Bộ chọn chương:** "Chương {position} · {title}", tối đa 2 dòng, vùng chạm ≥ 44, `expand_more`. Sheet liệt kê chương theo `position`, đánh dấu chương đang chọn. Không hiện `status`, `unlockAt` hay biểu tượng khóa.
- **Tải tài liệu lên:** `Button` primary, icon `upload_file`. Chỉ hiện khi `capabilities.authorMaterials` = true. **Không hiện dạng disabled**. Bấm mở S2 với `classId`, `classUnitId`, `courseUnitId`, `unitTitle` của chương đang chọn.
- **Bộ lọc:** `Filters` cuộn ngang, không có số. Scope SESSION không có hàng lọc, vì chỉ có một loại trạng thái.
- **Hàng:** dòng phụ "{loại nội dung} · {dung lượng}". ARTICLE: "Bài viết". `file` null ở FILE/VIDEO: chữ `fileMissing` (G-P3-08). Chỉ REJECTED có dòng lý do; `rejectionReason` null thì không có dòng.
- Bấm hàng mở S3. Refetch khi quay lại; giữ chương và bộ lọc.
- **Scope SESSION:** thêm `Alert` info "Bạn dạy thay theo buổi nên chỉ xem được tài liệu đã công bố." Danh sách chương do server giới hạn.
- **Tiêu đề và thứ tự:** giữ thứ tự server (`sortOrder`). Không sắp lại trong từng trang.

## 3. Dữ liệu

### 3.1 Bộ lọc

| Chip | Query |
| --- | --- |
| Tất cả | Bỏ `reviewStatus` |
| Nháp | `DRAFT` |
| Chờ duyệt | `PENDING_REVIEW` |
| Bị từ chối | `REJECTED` |
| Đã công bố | `APPROVED` |

Đổi chương hoặc bộ lọc: về trang 1, xóa danh sách cũ ngay, hiện skeleton. Không giữ hàng cũ dưới lựa chọn mới. Response cũ bị bỏ qua.

### 3.2 Phân trang

`pageSize` 20, tải thêm khi cuộn gần cuối, một request tại một thời điểm. Khử trùng theo `id`. Danh sách chương `pageSize` 100, tải đủ theo `total` khi mở Sheet nếu còn trang. Không kết luận rỗng cả lớp từ một chương rỗng.

### 3.3 Lớp đã kết thúc

COMPLETED: thêm `Alert` info "Lớp đã kết thúc." Nút tải lên vẫn theo `authorMaterials` của server; design không tự ẩn theo status.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| MS-A | Đang tải lớp, chương | Skeleton bộ chọn và 3 hàng; chưa có nút tải lên |
| MS-B | Có dữ liệu | Mục 2 |
| MS-C | Lớp không có chương | Khối căn giữa "Lớp chưa có chương nào."; không có bộ lọc, không có nút tải lên |
| MS-D | Chương rỗng, không lọc | "Chương này chưa có tài liệu." Vẫn có nút tải lên nếu được phép |
| MS-E | Rỗng khi có lọc | "Không có tài liệu ở trạng thái này." + "Xóa bộ lọc" |
| MS-F | Đang tải danh sách, đã có chương | Giữ bộ chọn và bộ lọc; skeleton 3 hàng |
| MS-G | Tải thêm: đang tải / lỗi | Giữ hàng; skeleton footer / chữ lỗi + "Thử lại" đúng trang |
| MS-H | Lỗi chương hoặc lớp, chưa có dữ liệu | `StatusBlock` + "Thử lại". **Không hiện như rỗng** |
| MS-I | Lỗi danh sách, đã có chương | Lỗi trong vùng danh sách + "Thử lại"; vẫn đổi được chương |
| MS-J | Làm mới lỗi | Giữ hàng của cùng query; `Alert` warning + mã hỗ trợ khi có |
| MS-K | Offline: có dữ liệu | Giữ hàng; `stale`; không "Thử lại"; nút tải lên khóa kèm `needOnline` |
| MS-L | Offline: chưa có dữ liệu | `offlineEmpty`; không phải rỗng |
| MS-M | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền, "Quay lại" |
| MS-N | 404 chương hoặc lớp | `StatusBlock` không tìm thấy |
| MS-O | `params.unitId` không còn trong danh sách | Chọn chương đầu; không báo lỗi |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `materials.list.title` | Tài liệu | Materials |
| `materials.list.chooseClass` | Chọn lớp | Choose a class |
| `materials.list.unit` | Chương {{position}} · {{title}} | Chapter {{position}} · {{title}} |
| `materials.list.unitSheet` | Chọn chương | Choose a chapter |
| `materials.list.upload` | Tải tài liệu lên | Upload material |
| `materials.list.all` | Tất cả | All |
| `materials.list.sessionScope` | Bạn dạy thay theo buổi nên chỉ xem được tài liệu đã công bố. | You're substituting for specific sessions, so you can only view published materials. |
| `materials.list.classEnded` | Lớp đã kết thúc. | This class has ended. |
| `materials.list.noUnits` | Lớp chưa có chương nào. | This class has no chapters yet. |
| `materials.list.empty` | Chương này chưa có tài liệu. | This chapter has no materials yet. |
| `materials.list.emptyFilter` | Không có tài liệu ở trạng thái này. | No materials with this status. |
| `materials.list.clear` | Xóa bộ lọc | Clear filter |

## 6. Accessibility

- Bộ chọn chương đọc "Chương 8, Line graphs, đang chọn. Bấm để đổi chương", role `button`.
- Hàng đọc thành một cụm: "Unit 8 Worksheet, Tài liệu, 1,2 megabyte, Bị từ chối, lý do: Thiếu đáp án phần 2", role `button`.
- Bộ lọc role `radiogroup`. Đổi lọc xong đọc số kết quả từ `total`.

## 7. testID

`materials-screen`, `materials-back`, `materials-class-<classId>`, `materials-unit-picker`, `materials-unit-sheet`, `materials-unit-option-<unitId>`, `materials-upload`, `materials-filter-all`, `materials-filter-draft`, `materials-filter-pending`, `materials-filter-rejected`, `materials-filter-approved`, `materials-row-<id>`, `materials-row-status-<id>`, `materials-row-reason-<id>`, `materials-scope-alert`, `materials-ended-alert`, `materials-no-units`, `materials-empty`, `materials-empty-filter`, `materials-clear-filter`, `materials-error`, `materials-retry`, `materials-refresh-alert`, `materials-offline`, `materials-denied`, `materials-not-found`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P3-S1-01 | Vào từ Trang chủ | Xem | Bước chọn lớp, `status=IN_PROGRESS`; không có request tài liệu; không có số trên hàng |
| TC-P3-S1-02 | Bước chọn lớp | Chọn lớp, rồi Back | Mở danh sách; Back về bước chọn lớp đúng bộ lọc |
| TC-P3-S1-03 | Vào từ chi tiết lớp, `unitId` = chương 8 | Xem | Chọn sẵn chương 8; đúng 1 request materials của chương 8 |
| TC-P3-S1-04 | Không có `unitId` | Xem | Chọn chương `position` nhỏ nhất |
| TC-P3-S1-05 | `unitId` không có trong danh sách | Xem | Chọn chương đầu; không có lỗi |
| TC-P3-S1-06 | | Mở màn | Request không có `reviewStatus`; không gọi riêng từng status |
| TC-P3-S1-07 | | Đổi chương | Xóa hàng cũ ngay; về trang 1; đúng `unitId` mới |
| TC-P3-S1-08 | Request A chậm, đổi sang chương B, A về sau | | Chỉ hiện B |
| TC-P3-S1-09 | | Chọn "Bị từ chối" | `reviewStatus=REJECTED`, về trang 1; chip không có số |
| TC-P3-S1-10 | Chọn "Đã công bố" | | `reviewStatus=APPROVED`; hàng hiện "Đã công bố" |
| TC-P3-S1-11 | `authorMaterials` true | Xem | Có `materials-upload`; bấm mở S2 đúng `classUnitId`, `courseUnitId` |
| TC-P3-S1-12 | `authorMaterials` false | Xem | Không có `materials-upload`, kể cả disabled |
| TC-P3-S1-13 | Scope SESSION | Xem | Có `materials-scope-alert`; không có hàng lọc; không có nút tải lên |
| TC-P3-S1-14 | Lớp COMPLETED, `authorMaterials` true | Xem | Có `materials-ended-alert`; vẫn có nút tải lên |
| TC-P3-S1-15 | REJECTED có lý do | Xem | Hiện lý do tối đa 2 dòng |
| TC-P3-S1-16 | FILE có `file` null | Xem | "Tệp không khả dụng"; không crash; vẫn bấm được |
| TC-P3-S1-17 | ARTICLE | Xem | Icon bài viết, "Bài viết" |
| TC-P3-S1-18 | Tìm khóa chương, `unlockAt`, nút mở chương | Xem | Không có; không gọi route release |
| TC-P3-S1-19 | `total` 0, không lọc | Xem | `materials-empty` |
| TC-P3-S1-20 | Lọc xong rỗng | Xem | `materials-empty-filter`; xóa lọc tải lại "Tất cả" |
| TC-P3-S1-21 | 500 lần đầu | Xem | `materials-error`; không phải `materials-empty` |
| TC-P3-S1-22 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ hàng |
| TC-P3-S1-23 | Hàng xuất hiện ở cả trang 1 và 2 | Tải thêm | Không trùng |
| TC-P3-S1-24 | `total` 45, trang 1 có 20 | Cuộn | Tải thêm đến đủ; không tự kết luận hết |
| TC-P3-S1-25 | Offline, đã có dữ liệu | Xem | Giữ hàng; `stale`; không "Thử lại"; nút tải lên khóa |
| TC-P3-S1-26 | Offline, chưa có | Mở | `offlineEmpty`; không phải rỗng |
| TC-P3-S1-27 | 403 khi đã có dữ liệu | Refetch | Xóa hàng; `materials-denied` |
| TC-P3-S1-28 | Tạo tài liệu ở S2, quay về | Focus | Tài liệu mới có trong danh sách; không refetch chương khác |
| TC-P3-S1-29 | Response có `visibleUnitCount` nhưng chương trả `status` LOCKED, `unlockAt` tương lai | Xem | Chương vẫn chọn được; không hiện trạng thái khóa hay giờ mở |

Ứng viên Maestro E2E: TC-P3-S1-01, -03, -09, -11, -13, -19, -28.
