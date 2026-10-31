# P1-S2 — mentor-classes · Danh sách lớp được giao

Ngày: 31/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-02, BR-CLASS-02, BR-CLASS-03; UC-M-02. Endpoint tham chiếu: `GET /mentor/classes` (`status`, `page`, `pageSize`; `assignment` mặc định ANY).

## 1. Mục tiêu

Mentor thấy mọi lớp đang được giao và biết mình có quyền cả lớp hay chỉ theo buổi. Scope lấy từ server, không suy ra ở app.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Lớp phụ trách            ▓│
│▓    3 lớp                    ▓│
├──────────────────────────────┤
│ [Tất cả][Đang học][Đang mở]… │  FilterChipBar
│ ┌──────────────────────────┐ │
│ │ IELTS Foundation K12      │ │
│ │ IF-K12         [Đang học] │ │
│ │ [Mentor chính · Toàn lớp] │ │
│ │ ↻ 02/11/2026 – 30/01/2027 │ │
│ │ ▣ Tại lớp               › │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Giao tiếp B1 · Lớp 07     │ │
│ │ GTB1-07        [Đang học] │ │
│ │ [Dạy thay · Theo buổi]    │ │
│ │ ☺ Mentor chính: Lê Văn Phúc│ │  chỉ với scope SESSION
│ │ ↻ 05/10/2026 – 20/12/2026 │ │
│ │ ▶ Trực tuyến            › │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Header và panel theo [P0-S4 mục 3](../../foundation-auth/settings/design.md). Phụ đề "{total} lớp" lấy `total` của server theo bộ lọc hiện tại.
- Bộ lọc thứ tự: Tất cả, Đang học (IN_PROGRESS), Đang mở (OPEN), Đã kết thúc (COMPLETED), Đã hủy (CANCELLED). Mặc định Tất cả. Không có chip Nháp; lớp DRAFT nếu có vẫn hiện ở Tất cả với chip "Nháp".
- Không có ô tìm kiếm vì endpoint này không nhận từ khóa, và tìm trên trang đã tải sẽ cho kết quả sai.
- Thẻ dùng `ClassCard`, bấm → S3 với `classId`.
- Không hiện `availableSeats`, `maxStudents`, số học viên hay tiến độ.

## 3. Dữ liệu

| Nội dung | Nguồn | Ghi chú |
| --- | --- | --- |
| Tên, mã | `name`, `code` | |
| Chip trạng thái | `status` | Phase mục 8 |
| Chip phân công | `assignmentType` + `accessScope` | BOTH hiện như PRIMARY vì `accessScope` là CLASS. Lấy nhãn scope theo `accessScope` của server |
| Mentor chính | `mentor.displayName` | Chỉ hiện khi `accessScope` = SESSION; null → "Chưa có tên" |
| Khoảng ngày | `startDate`, `endDate` | Calendar date, không qua `Date` |
| Hình thức | `deliveryMode` | ONLINE/OFFLINE theo Q-CLASS-01 |

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S2-A | Đang tải | `SkeletonList` 3 thẻ; chip lọc vẫn dùng được; phụ đề ẩn |
| S2-B | Có lớp | Mục 2 |
| S2-C | Không có lớp nào, lọc Tất cả | `StatusBlock` icon `school` "Bạn chưa được giao lớp nào" + mô tả "Lớp được phân công sẽ hiển thị tại đây." |
| S2-D | Bộ lọc không có kết quả | Chữ căn giữa "Không có lớp ở trạng thái này." + nút text "Xem tất cả lớp" |
| S2-E | Offline/timeout/5xx/sai định dạng, chưa có dữ liệu | `StatusBlock` + "Thử lại" |
| S2-F | Như S2-E, đã có dữ liệu | Giữ dữ liệu + `InlineAlert` warning |
| S2-G | Lỗi khi tải trang tiếp | `ListFooter` lỗi, các trang đã tải giữ nguyên |
| S2-H | 401 | Về Login theo P0 |
| S2-I | 403 | Xóa dữ liệu; `StatusBlock` không quyền; "Quay lại" về Trang chủ |
| Conflict | Không áp dụng | Màn chỉ đọc |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.classes.title` | Lớp phụ trách | My classes |
| `teaching.classes.count` | {{count}} lớp | {{count}} classes |
| `teaching.filter.all` | Tất cả | All |
| `teaching.classes.emptyTitle` / `.emptyBody` | Bạn chưa được giao lớp nào / Lớp được phân công sẽ hiển thị tại đây. | No classes assigned yet / Your assigned classes will appear here. |
| `teaching.classes.emptyFilter` | Không có lớp ở trạng thái này. | No classes with this status. |
| `teaching.classes.showAll` | Xem tất cả lớp | Show all classes |
| `teaching.classes.primaryMentor` | Mentor chính: {{name}} | Primary mentor: {{name}} |
| `teaching.nameUnavailable` | Chưa có tên | Name unavailable |
| `common.loadingMore` | Đang tải thêm… | Loading more… |

Nhãn trạng thái, hình thức và phân công: phase mục 8.

## 6. Accessibility

- Thẻ lớp `accessibilityRole="button"`, đọc thành một cụm: "IELTS Foundation K12, mã IF-K12, Đang học, Mentor chính, Toàn lớp, từ 02/11/2026 đến 30/01/2027, Tại lớp".
- Chip lọc là `radiogroup`; mỗi chip `radio` có trạng thái đã chọn.
- Đổi bộ lọc thông báo số lớp mới sau khi tải xong.
- Tên dài tối đa 2 dòng, vẫn đọc đủ qua screen reader.

## 7. testID

`classes-screen`, `classes-back-button`, `classes-count`, `classes-filter-<all|IN_PROGRESS|OPEN|COMPLETED|CANCELLED>`, `classes-card-<classId>`, `classes-card-scope-<classId>`, `classes-card-mentor-<classId>`, `classes-empty`, `classes-empty-filter`, `classes-show-all`, `classes-error`, `classes-retry`, `classes-denied`, `classes-refresh-alert`, `classes-footer-retry`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S2-01 | 3 lớp, `total` = 3 | Mở màn | Gọi không có `status`; hiện 3 thẻ; phụ đề "3 lớp" |
| TC-P1-S2-02 | Lớp PRIMARY + CLASS | Xem thẻ | Chip "Mentor chính · Toàn lớp"; không có `classes-card-mentor-<id>` |
| TC-P1-S2-03 | Lớp BOTH + CLASS | Xem thẻ | Chip "Mentor chính · Toàn lớp" |
| TC-P1-S2-04 | Lớp SUBSTITUTE + SESSION | Xem thẻ | Chip "Dạy thay · Theo buổi"; có dòng mentor chính |
| TC-P1-S2-05 | Lớp SESSION, `mentor.displayName` null | Xem thẻ | "Mentor chính: Chưa có tên", không hiện id |
| TC-P1-S2-06 | `startDate` "2026-11-02", máy ở UTC−8 | Xem thẻ | Hiện 02/11/2026, không lùi ngày |
| TC-P1-S2-07 | ONLINE, OFFLINE | Xem thẻ | "Trực tuyến" và "Tại lớp" đúng icon |
| TC-P1-S2-08 | `deliveryMode` = HYBRID | Mở màn | Lỗi sai định dạng, không tự thêm nhãn |
| TC-P1-S2-09 | Có lớp | Bấm thẻ | Mở S3 đúng `classId`; không truyền scope qua params |
| TC-P1-S2-10 | Có 25 lớp | Cuộn cuối danh sách | Gọi trang 2; đủ 25 thẻ không trùng; phụ đề giữ `total` server |
| TC-P1-S2-11 | Trang 2 lỗi mạng | Cuộn, bấm "Thử lại" ở footer | Trang 1 còn nguyên; footer lỗi rồi tải được |
| TC-P1-S2-12 | Đang ở trang 2 | Chọn "Đã kết thúc" | Gọi `status=COMPLETED&page=1`; phụ đề theo kết quả mới |
| TC-P1-S2-13 | Response lọc cũ về sau lọc mới | Đổi chip nhanh | Hiện kết quả của chip cuối |
| TC-P1-S2-14 | Không có lớp | Mở màn | `classes-empty` |
| TC-P1-S2-15 | Lọc không có kết quả | Chọn chip, bấm "Xem tất cả lớp" | `classes-empty-filter`; bấm về Tất cả |
| TC-P1-S2-16 | Mất mạng lần đầu | Mở màn | `classes-error`; không có dữ liệu mock |
| TC-P1-S2-17 | Đã có dữ liệu, 500 | Kéo làm mới | Giữ thẻ + `classes-refresh-alert` |
| TC-P1-S2-18 | Đã có dữ liệu, 403 | Kéo làm mới | Không còn thẻ; `classes-denied` |
| TC-P1-S2-19 | Lớp không còn trong response | Quay lại màn từ S3 | Refetch; thẻ biến mất |
| TC-P1-S2-20 | User A rồi user B đăng nhập | Mở màn | Chỉ có lớp của B; không còn thẻ của A kể cả lúc đang tải |
| TC-P1-S2-21 | en, theme tối | Xem màn | Chữ tiếng Anh, chip đúng tone tối |

Ứng viên Maestro E2E: TC-P1-S2-01, -02, -04, -09, -14 (Mentor C), -20.
