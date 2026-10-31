# P1-S6 — manager-classes · Quản lý xem lớp hiện hữu

Ngày: 31/10/2026, cập nhật theo `Manager Mobile UI.html` cùng ngày. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-SCOPE-02, BR-SCOPE-03, BR-CLASS-02, BR-CLASS-03; UC-MG-02. Endpoint tham chiếu: `GET /manager/classes` (`q`, `status`, `page`, `pageSize`).

## 1. Mục tiêu

Quản lý tìm và theo dõi các lớp hiện có theo trạng thái rồi mở chi tiết lớp. Chỉ đọc.

**Chọn nguồn dữ liệu:** dùng `GET /manager/classes`, không dùng `GET /management/classes`. Lý do: route này chỉ dành cho MANAGER, có tìm theo `q`, trả ngày lớp, hình thức, sĩ số. `GET /management/classes` chỉ có mã, tên, trạng thái, mentor và cũng mở cho ADMIN. Không trộn DTO của hai route trong màn này.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Danh sách lớp            ▓│
│▓    24 lớp                   ▓│
├──────────────────────────────┤
│ (⌕ Tìm theo tên hoặc mã lớp ) │  ô tìm kính cao 52, pill
│ [Đang học (5)][Đang mở (2)][Đã…│  FilterChipBar
│ ┌──────────────────────────┐ │
│ │ IELTS 6.5 Intensive K08 [Đang học]│
│ │ I65-K08                   │ │
│ │ ☺ Mentor chính: Nguyễn H. Long│
│ │ ↻ 02/11/2026 – 30/01/2027 · Tại lớp│
│ │ ▣ Còn 4/20 chỗ          › │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Header và panel theo [P0-S4 mục 3](../../foundation-auth/settings/design.md). Phụ đề "{tổng} lớp" là tổng số đếm của 5 trạng thái, không đổi theo tìm kiếm hay bộ lọc. Chưa có đủ số đếm thì ẩn phụ đề.
- **Ô tìm:** kiểu kính, cao 52, pill, icon `search` 18, placeholder theo mục 5, nút `close` 44 khi có chữ. Mẫu cho tìm theo mentor nhưng `q` của server chỉ tìm tên và mã lớp, nên placeholder không nhắc mentor.
- **Tìm kiếm:** trim, debounce 300 ms, tối đa 100 ký tự, gửi `q` khi có ít nhất 1 ký tự, chuỗi rỗng thì bỏ `q`. Về trang 1. Không tìm trên trang đã tải.
- **Bộ lọc:** chọn một trong Đang học (mặc định), Đang mở, Đã kết thúc, Đã hủy, Nháp. Không có "Tất cả". Ba chip đầu theo mẫu; thêm Đã hủy và Nháp vì nếu không, Quản lý không tìm được các lớp đó.
- **Số đếm trên chip:** "{nhãn} ({số})". Server không trả tổng theo trạng thái, nên lấy `total` của `GET /manager/classes?status=<trạng thái>&page=1&pageSize=1`, mỗi trạng thái một request. Gọi khi mở màn và khi kéo làm mới, không gọi theo từng lần gõ. Số không đổi theo tìm kiếm. Request đếm lỗi thì chip đó không có số, không ảnh hưởng danh sách.
- **Giữ tìm kiếm và bộ lọc** khi quay lại từ S7.
- Thẻ dùng `ClassCard`, chip trên cùng bên phải, chevron ở hàng cuối, bấm → S7 với `classId`.
- Lớp CANCELLED: chip "Đã hủy" tone danger, tên lớp màu `--mdy-text-secondary`, vẫn mở được.

**Không có:** tạo lớp, nút thêm nổi, sửa, hủy, chọn chi nhánh, lọc theo chi nhánh, bộ lọc theo mentor hay khóa học. Không hiển thị `assignmentType`/`accessScope` của DTO vì Quản lý không có assignment (G-06).

### 2.1 Đối chiếu `Manager Mobile UI.html`

| Phần của mẫu | P1 | Lý do |
| --- | --- | --- |
| Tiêu đề, phụ đề, ô tìm, chip có số, thẻ lớp | Giữ | |
| Chip "Sắp mở" | Đổi thành "Đang mở" | Giá trị server là OPEN; "Sắp mở" có thể sai khi lớp OPEN đã qua ngày bắt đầu (phase mục 8) |
| "T2 · T4 · T6 · 18:30 · Phòng 301" | Thay | Lịch tuần không có trong DTO, `roomName` luôn null (G-06, G-10). Thay bằng khoảng ngày và hình thức |
| "16 học viên · Unit 10/16" | Thay | Danh sách không có số học viên và tiến độ (G-10). Thay bằng số chỗ |
| "Chưa phân công mentor chính" | Bỏ | `mentor.id` luôn có. `displayName` null là "Chưa có tên" |

## 3. Dữ liệu

| Nội dung | Nguồn | Ghi chú |
| --- | --- | --- |
| Tên, mã, chip | `name`, `code`, `status` | |
| Mentor chính | `mentor.displayName` | null → "Chưa có tên" |
| Khoảng ngày | `startDate`, `endDate` | Calendar date |
| Hình thức | `deliveryMode` | ONLINE/OFFLINE theo Q-CLASS-01 |
| Chỗ | `availableSeats`, `maxStudents` | "Còn {availableSeats}/{maxStudents} chỗ". Dùng nguyên giá trị server, không tự tính số học viên |

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S6-A | Đang tải | `SkeletonList` 3 thẻ; ô tìm và chip vẫn dùng được |
| S6-B | Có lớp | Mục 2 |
| S6-C | Trạng thái đang chọn không có lớp, không có từ khóa | `StatusBlock` icon `school` "Không có lớp ở trạng thái này" |
| S6-D | Tìm không có kết quả | Chữ "Không tìm thấy lớp phù hợp." + nút text "Xóa tìm kiếm" |
| S6-E | Offline/timeout/5xx/sai định dạng, chưa có dữ liệu | `StatusBlock` + "Thử lại" |
| S6-F | Như S6-E, đã có dữ liệu; lỗi trang tiếp | Giữ dữ liệu + `InlineAlert` warning; hoặc `ListFooter` lỗi |
| S6-G | 401 | Về Login theo P0 |
| S6-H | 403 | Xóa dữ liệu; `StatusBlock` không quyền; "Quay lại" về Trang chủ |
| Conflict | Không áp dụng | Màn chỉ đọc |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.managerClasses.title` | Danh sách lớp | Classes |
| `teaching.managerClasses.filterCount` | {{label}} ({{count}}) | {{label}} ({{count}}) |
| `teaching.managerClasses.searchPlaceholder` | Tìm theo tên hoặc mã lớp | Search by class name or code |
| `teaching.managerClasses.clearSearch` | Xóa nội dung tìm | Clear search |
| `teaching.managerClasses.empty` | Không có lớp ở trạng thái này | No classes with this status |
| `teaching.managerClasses.noResults` | Không tìm thấy lớp phù hợp. | No matching classes. |
| `teaching.managerClasses.clearAll` | Xóa tìm kiếm | Clear search |
| `teaching.managerClasses.seats` | Còn {{available}}/{{max}} chỗ | {{available}}/{{max}} seats left |
| `teaching.classes.primaryMentor` | Mentor chính: {{name}} | Primary mentor: {{name}} |

Nhãn trạng thái và hình thức: phase mục 8.

## 6. Accessibility

- Ô tìm có label "Tìm lớp"; nút xóa có label theo mục 5.
- Sau khi kết quả tìm về, thông báo số lớp qua `announceForAccessibility`; không thông báo từng ký tự.
- Thẻ lớp đọc thành một cụm gồm tên, mã, trạng thái, mentor, ngày, hình thức, số chỗ.
- Chip lọc là `radiogroup`.

## 7. testID

`manager-classes-screen`, `manager-classes-back-button`, `manager-classes-count`, `manager-classes-search`, `manager-classes-search-clear`, `manager-classes-filter-<IN_PROGRESS|OPEN|COMPLETED|CANCELLED|DRAFT>`, `manager-classes-card-<classId>`, `manager-classes-mentor-<classId>`, `manager-classes-seats-<classId>`, `manager-classes-empty`, `manager-classes-no-results`, `manager-classes-clear-all`, `manager-classes-error`, `manager-classes-retry`, `manager-classes-denied`, `manager-classes-refresh-alert`, `manager-classes-footer-retry`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S6-01 | 24 lớp, 5 đang học | Mở màn | Chọn sẵn "Đang học (5)"; danh sách gọi `GET /manager/classes?status=IN_PROGRESS`; phụ đề "24 lớp"; **0 lần** gọi `GET /management/classes` |
| TC-P1-S6-02 | Đủ 5 trạng thái | Xem | Nhãn và tone đúng phase mục 8; CANCELLED rõ ràng |
| TC-P1-S6-03 | Có lớp | Xem màn | Không có tạo lớp, nút nổi, chọn chi nhánh, action Admin |
| TC-P1-S6-04 | DTO có `assignmentType` | Xem thẻ | Không hiện "Mentor chính · Toàn lớp" hay nhãn phân công |
| TC-P1-S6-05 | `mentor.displayName` null | Xem thẻ | "Mentor chính: Chưa có tên" |
| TC-P1-S6-06 | `availableSeats` 4, `maxStudents` 20 | Xem thẻ | "Còn 4/20 chỗ" |
| TC-P1-S6-07 | `availableSeats` 0 | Xem thẻ | "Còn 0/20 chỗ", không ẩn thẻ |
| TC-P1-S6-08 | Nhập " ielts " | Dừng 300 ms | Gọi đúng một lần với `q=ielts&page=1` |
| TC-P1-S6-09 | Gõ liên tục | Trong 300 ms | Không gọi từng ký tự |
| TC-P1-S6-10 | Response cũ về sau | Gõ thêm chữ | Chỉ hiện kết quả của từ khóa cuối |
| TC-P1-S6-11 | Đã có chữ | Bấm xóa | Bỏ `q`, về trang 1 |
| TC-P1-S6-12 | Chọn "Đã hủy" | Bấm chip | Gọi `status=CANCELLED&page=1`, giữ `q` nếu có |
| TC-P1-S6-13 | 45 lớp đang học | Cuộn | Tải đủ, không trùng; chip giữ "(45)" |
| TC-P1-S6-14 | Tìm không ra | Bấm "Xóa tìm kiếm" | Bỏ `q`, giữ chip đang chọn |
| TC-P1-S6-15 | Đang lọc và tìm | Vào S7 rồi back | Giữ từ khóa, chip và vị trí; dữ liệu refetch |
| TC-P1-S6-16 | Có lớp | Bấm thẻ | Mở S7 đúng `classId` |
| TC-P1-S6-17 | Mất mạng lần đầu | Mở màn | `manager-classes-error`; không dùng mock |
| TC-P1-S6-18 | Đã có dữ liệu, 500 "req-3" | Kéo làm mới | Giữ dữ liệu; alert kèm "Mã hỗ trợ: req-3" |
| TC-P1-S6-19 | Đã có dữ liệu, 403 | Kéo làm mới | Không còn thẻ; `manager-classes-denied` |
| TC-P1-S6-20 | Tài khoản ADMIN | Đăng nhập | Dừng ở P0-S3 (không đủ quyền), không vào được màn này |
| TC-P1-S6-21 | en, theme tối | Xem màn | Chữ tiếng Anh, ô tìm đúng màu tối |
| TC-P1-S6-22 | Request đếm OPEN lỗi, danh sách OK | Mở màn | Chip "Đang mở" không có số; danh sách vẫn hiện; ẩn phụ đề |
| TC-P1-S6-23 | Gõ từ khóa | Xem chip | Số trên chip không đổi; không gọi thêm request đếm |
| TC-P1-S6-24 | Có lớp | Xem thẻ | Không có lịch tuần, phòng, số học viên, tiến độ unit |
| TC-P1-S6-25 | Chip "Nháp" không có lớp | Bấm chip | `StatusBlock` "Không có lớp ở trạng thái này" |

Ứng viên Maestro E2E: TC-P1-S6-01, -02, -03, -08, -16, -20.
