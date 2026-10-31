# P1-S5 — mentor-students · Học viên của lớp cho Mentor chính

Ngày: 31/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-02, BR-ENR-02, BR-DATA-02; UC-M-03. Endpoint tham chiếu: `GET /mentor/classes/:classId` (kiểm capability); `GET /mentor/classes/:classId/students` (`orderStatus`, `page`, `pageSize`).

## 1. Mục tiêu

Mentor chính đọc danh sách học viên toàn lớp cùng trạng thái ghi danh và thanh toán. Chỉ đọc. Mentor thay không dùng màn này; họ xem học viên theo buổi ở S4.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Học viên                 ▓│
│▓    IELTS Foundation K12 · 18│  tên lớp · total
├──────────────────────────────┤
│ [Tất cả][Đã thanh toán][Chờ…]│  FilterChipBar
│ ┌──────────────────────────┐ │
│ │ (NB) Ngô Bảo Ngọc         │ │
│ │ [Đang học][Đã thanh toán] │ │
│ │ Thanh toán 28/10/2026 · Tiền mặt│
│ ├──────────────────────────┤ │
│ │ (CK) Châu Minh Khoa       │ │
│ │ [Đang giữ chỗ][Chờ thanh toán]│
│ │ Giữ chỗ đến 02/11/2026 18:00 · Tiền mặt│
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Header và panel theo [P0-S4 mục 3](../../foundation-auth/settings/design.md). Phụ đề là `name` của lớp và `total` của roster.
- Bộ lọc: Tất cả, Đã thanh toán (PAID), Chờ thanh toán (PENDING), Quá hạn thanh toán (EXPIRED), Đơn đã hủy (CANCELLED). Lọc qua `orderStatus` ở server.
- Hàng dùng `StudentRow`, không bấm được. Tiến độ và chuyên cần từng học viên thuộc P7.
- **Không hiện** số tiền (`classAmount`, `orderTotalAmount`), `orderCode`, `orderClassCount` và không có hành động từ `canConfirmCash`. Mentor chỉ cần biết trạng thái, thu tiền là việc của Quản lý ở P5.
- Không có tìm kiếm vì endpoint không nhận từ khóa.

## 3. Dữ liệu

| Nội dung | Nguồn | Ghi chú |
| --- | --- | --- |
| Tên, avatar | `studentName` | |
| Chip ghi danh | `enrollmentStatus` | Phase mục 8 |
| Chip đơn | `orderStatus` | Phase mục 8 |
| Dòng phụ khi PAID | `paidAt`, `paymentType` | "Thanh toán {DD/MM/YYYY} · {hình thức}"; `paidAt` null → chỉ hình thức |
| Dòng phụ khi PENDING | `expiresAt`, `paymentType` | "Giữ chỗ đến {DD/MM/YYYY HH:mm} · {hình thức}". Không tự đổi nhãn khi đã qua giờ |
| Dòng phụ khi EXPIRED/CANCELLED | `paymentType` | Chỉ hình thức |

Phải thể hiện "đang giữ chỗ / chờ thanh toán" khác "đang học": chờ thanh toán chưa đủ quyền học (BR-ENR-02).

## 4. Chặn quyền trước khi gọi roster

Đây là tiêu chí nghiệm thu riêng của slice: **không gọi roster CLASS với scope SESSION.**

1. Khi vào màn, đọc `GET /mentor/classes/:classId` trước, kể cả khi vừa đọc ở S3. Không tin capability cũ hay params.
2. Chỉ khi `capabilities.readClassRoster` = true mới gọi `.../students`.
3. false → hiện S5-G ngay, **0 lần gọi roster**.
4. Roster trả 403 bất kỳ lúc nào → xóa danh sách trên màn và hiện S5-G.

Roster là dữ liệu cá nhân: không persist, không ghi log tên, xóa khi rời phiên theo phase mục 9.1.

## 5. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S5-A | Đang kiểm quyền / đang tải | `SkeletonList` 5 hàng; phụ đề ẩn; chip lọc chưa bấm được khi đang kiểm quyền |
| S5-B | Có học viên | Mục 2 |
| S5-C | Lớp chưa có học viên, lọc Tất cả | `StatusBlock` icon `groups` "Lớp chưa có học viên" |
| S5-D | Bộ lọc không có kết quả | Chữ "Không có học viên ở trạng thái này." + nút text "Xem tất cả" |
| S5-E | Lỗi mạng/timeout/5xx/sai định dạng, chưa có dữ liệu | `StatusBlock` + "Thử lại" |
| S5-F | Như S5-E, đã có dữ liệu; lỗi trang tiếp | Giữ dữ liệu + `InlineAlert` warning; hoặc `ListFooter` lỗi |
| S5-G | Không có quyền xem toàn lớp | Xóa dữ liệu; `StatusBlock` "Bạn không có quyền xem danh sách lớp này" + mô tả + "Quay lại" về S3 |
| S5-H | 404 lớp | Xóa dữ liệu; `StatusBlock` "Không tìm thấy lớp" |
| S5-I | 401 | Về Login theo P0 |
| Conflict | Không áp dụng | Màn chỉ đọc |

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.students.title` | Học viên | Students |
| `teaching.students.subtitle` | {{className}} · {{count}} | {{className}} · {{count}} |
| `teaching.students.paidLine` | Thanh toán {{date}} · {{method}} | Paid {{date}} · {{method}} |
| `teaching.students.heldLine` | Giữ chỗ đến {{dateTime}} · {{method}} | Seat held until {{dateTime}} · {{method}} |
| `teaching.students.empty` | Lớp chưa có học viên | No students in this class yet |
| `teaching.students.emptyFilter` | Không có học viên ở trạng thái này. | No students with this status. |
| `teaching.students.showAll` | Xem tất cả | Show all |
| `teaching.students.deniedTitle` | Bạn không có quyền xem danh sách lớp này | You can't view this class list |
| `teaching.students.deniedBody` | Danh sách toàn lớp chỉ dành cho mentor chính. Bạn vẫn xem được học viên của buổi được giao trong chi tiết buổi. | The whole-class list is for the primary mentor. You can still see students of your assigned sessions in session details. |

Nhãn trạng thái: phase mục 8.

## 7. Accessibility

- Hàng đọc thành một cụm: "Châu Minh Khoa, Đang giữ chỗ, Chờ thanh toán, giữ chỗ đến 18:00 ngày 02/11/2026, Tiền mặt".
- Hàng không có role `button`.
- Chip lọc là `radiogroup`; đổi lọc thông báo số học viên sau khi tải xong.
- Chip ghi danh và chip đơn tự xuống dòng khi phóng chữ, không cắt chữ.

## 8. testID

`students-screen`, `students-back-button`, `students-subtitle`, `students-filter-<all|PAID|PENDING|EXPIRED|CANCELLED>`, `students-row-<enrollmentId>`, `students-enrollment-<enrollmentId>`, `students-order-<enrollmentId>`, `students-line-<enrollmentId>`, `students-empty`, `students-empty-filter`, `students-show-all`, `students-error`, `students-retry`, `students-denied`, `students-not-found`, `students-refresh-alert`, `students-footer-retry`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S5-01 | `readClassRoster` true | Mở từ S3 | Đọc class detail trước rồi gọi `students`; hiện danh sách, phụ đề đúng tên lớp và `total` |
| TC-P1-S5-02 | `readClassRoster` false | Mở màn | `students-denied`; **0 lần** gọi `students` |
| TC-P1-S5-03 | Capability cũ true, class detail mới trả false | Mở màn | `students-denied`; 0 lần gọi `students` |
| TC-P1-S5-04 | Đang xem, roster 403 `MENTOR_SCOPE_REQUIRED` | Kéo làm mới | Không còn hàng học viên; `students-denied` |
| TC-P1-S5-05 | ACTIVE + PAID, `paidAt` có | Xem hàng | Hai chip success; dòng "Thanh toán 28/10/2026 · Tiền mặt" |
| TC-P1-S5-06 | PENDING_PAYMENT + PENDING | Xem hàng | "Đang giữ chỗ", "Chờ thanh toán"; **không** có "Đang học"; có dòng giữ chỗ |
| TC-P1-S5-07 | PENDING, `expiresAt` đã qua | Xem hàng | Vẫn "Chờ thanh toán"; không tự đổi thành quá hạn |
| TC-P1-S5-08 | `orderStatus` EXPIRED | Xem hàng | Chip "Quá hạn thanh toán"; dòng phụ chỉ hình thức |
| TC-P1-S5-09 | `paidAt` null, PAID | Xem hàng | Dòng phụ chỉ hình thức, không có "null" |
| TC-P1-S5-10 | Có `classAmount`, `canConfirmCash` true | Xem hàng | Không có số tiền, mã đơn hay nút xác nhận tiền mặt |
| TC-P1-S5-11 | Có dữ liệu | Bấm hàng | Không điều hướng |
| TC-P1-S5-12 | Chọn "Chờ thanh toán" | Bấm chip | Gọi `orderStatus=PENDING&page=1`; không lọc ở client |
| TC-P1-S5-13 | 45 học viên | Cuộn | Tải đủ trang, không trùng, phụ đề giữ `total` |
| TC-P1-S5-14 | Trang 2 lỗi | Cuộn, "Thử lại" | Trang 1 còn; footer lỗi rồi tải được |
| TC-P1-S5-15 | Không có học viên | Mở màn | `students-empty` |
| TC-P1-S5-16 | Lọc rỗng | Chọn chip, "Xem tất cả" | `students-empty-filter`; về Tất cả |
| TC-P1-S5-17 | Lỗi mạng lần đầu | Mở màn | `students-error`; không có mock |
| TC-P1-S5-18 | Đã có dữ liệu, 500 | Kéo làm mới | Giữ dữ liệu + `students-refresh-alert` |
| TC-P1-S5-19 | 404 | Mở màn | `students-not-found` |
| TC-P1-S5-20 | Đăng xuất rồi user khác vào | Mở màn | Không còn tên học viên của phiên trước ở bất kỳ màn nào |
| TC-P1-S5-21 | Khởi động lại app, offline | Mở màn | Không có dữ liệu từ thiết bị; `students-error` |
| TC-P1-S5-22 | en, theme tối | Xem màn | Chữ tiếng Anh, tone chip đúng |

Ứng viên Maestro E2E: TC-P1-S5-01, -04, -05, -06, -20. TC-P1-S5-02 kiểm bằng Jest vì Mentor thay không có đường bấm vào màn này; E2E của nhánh đó là TC-P1-S3-02.
