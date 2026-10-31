# P1-S7 — manager-class-detail · Quản lý đọc lịch và học viên lớp

Ngày: 31/10/2026, cập nhật theo `Manager Mobile UI.html` cùng ngày. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-01, BR-CLASS-02, BR-CLASS-06, BR-ENR-02; UC-MG-02. Endpoint tham chiếu: `GET /manager/classes/:classId`; `GET /management/classes/:classId` (lịch); `GET /manager/classes/:classId/students` (học viên).

## 1. Mục tiêu

Quản lý đọc thông tin lớp, lịch các buổi và học viên, rồi đi tới chi tiết buổi. Chỉ đọc, kể cả khi backend có route vận hành cho Quản lý: những route đó thuộc P4/P5.

**Ba route, ba tab, không trộn DTO:**

| Tab | Route | Chỉ dùng |
| --- | --- | --- |
| Tổng quan | `GET /manager/classes/:classId` | Toàn bộ trừ các trường ở mục 3 |
| Buổi học | `GET /management/classes/:classId` | Chỉ `sessions`. Bỏ qua `class` trong response để tránh hai nguồn cho cùng dữ liệu |
| Học viên | `GET /manager/classes/:classId/students` | Mục 5 |

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Chi tiết lớp             ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
│▓┌────────┐┌───────┐┌───────┐▓│
│ │Tổng quan││Buổi học││Học viên│▓│  tab dính vào panel
├─┘        └┴───────┴┴───────┴─┤
│ ┌──────────────────────────┐ │
│ │ [Đang học] I65-K08        │ │
│ │ ┌─────────┐ ┌─────────┐   │ │  ô số 18/700, chú thích 11
│ │ │14 Đang học│ │2 Giữ chỗ│   │ │
│ │ ├─────────┤ ├─────────┤   │ │
│ │ │0 Hoàn thành│ │1 Đã hủy│  │ │
│ │ └─────────┘ └─────────┘   │ │
│ └──────────────────────────┘ │
│ THÔNG TIN LỚP                │
│ ┌──────────────────────────┐ │
│ │ (NL) Mentor chính         │ │
│ │      Nguyễn Hoàng Long    │ │
│ │ (↻)  Thời gian học        │ │
│ │      02/11/2026 – 30/01/2027│
│ │ (▣)  Hình thức · Tại lớp  │ │
│ │ (☺)  Chỗ · Còn 4/20 chỗ   │ │
│ │ (▤)  Khóa học · IELTS-65 …│ │
│ │ (▤)  Giáo trình · 16 chương · 48 buổi│
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- `Screen` biến thể `app`. Tiêu đề "Chi tiết lớp", phụ đề là `name`; đang tải thì chưa có phụ đề.
- **Tab trong header:** ba tab cuộn được nếu không đủ chỗ, padding ngang 22, bo trên 18, chữ 14/600. Tab chọn cao 48, nền trùng nền màn, chữ `--mdy-ink`. Tab thường cao 42 cộng `hitSlop` đủ 44, nền `--mdy-white-a14`, chữ `--mdy-on-brand`. Khi tab đầu đang chọn, góc trên trái panel vuông để nối liền với tab.
- **Mặc định** tab Tổng quan. Mỗi tab tải khi mở lần đầu, đổi tab không gọi lại. Đổi tab crossfade `--mdy-dur-fast`. Giữ tab và vị trí cuộn khi quay lại từ S4.
- **Thẻ tóm tắt:** `GlassCard` padding 16, gap 14. Hàng đầu: chip `status` + `code` 12 `--mdy-text-secondary`.
- **Ô số ghi danh:** lưới 2×2, gap 8, nền `--mdy-surface-muted`, radius 14, padding 10; số 18/700, chú thích 11 `--mdy-text-secondary`. Giá trị 0 vẫn hiện. Hai cột thay vì ba của mẫu để đủ bốn giá trị mà không cắt chữ.
- **Nhóm "THÔNG TIN LỚP":** nhãn 12/600 chữ hoa; `GlassCard` padding 6; mỗi hàng padding 10, gap 12, ô tròn 40 nền `--mdy-brand-tint-2` icon 20 `--mdy-link`; nhãn 12 `--mdy-text-secondary`, giá trị 14/500. Hàng không bấm được.
- **Lớp CANCELLED:** `InlineAlert` warning trên thẻ tóm tắt: "Lớp đã hủy. Thông tin chỉ để tra cứu. Việc hủy lớp không tự hoàn tiền cho học viên." (BR-CLASS-06). Chip "Đã hủy" tone danger. Các tab vẫn đọc được.

**Không có:** phân công mentor, đổi lịch, hủy buổi, xác nhận tiền mặt, sửa lớp, hủy lớp, báo cáo. Không có `roomName` lớp, trạng thái chương hay `unlockAt` (G-04, G-06).

### 2.1 Đối chiếu `Manager Mobile UI.html`

| Phần của mẫu | P1 | Lý do |
| --- | --- | --- |
| Header, ba tab, thẻ tóm tắt, nhóm "THÔNG TIN LỚP", hàng buổi, hàng học viên | Giữ | |
| Nút "Đổi" / "Phân công" mentor | Ẩn | Q-CLASS-02: mobile chưa đổi mentor chính |
| "Chưa phân công" mentor | Bỏ | `mentor.id` luôn có. `displayName` null là "Chưa có tên" |
| Thanh tiến độ "Unit 10/16" | Ẩn | DTO không có tiến độ; BR-MAT-06 đã bỏ khóa chương (G-04); stored progress thuộc P7 |
| Ô "Chuyên cần", "Dưới 80%", cột % ở tab Học viên | Ẩn | Thuộc P7-S2, phụ thuộc điểm danh P2 và KPI chưa chốt |
| Ô "Học viên" | Thay | Bốn ô `enrollmentCounts`; không tự cộng thành tổng (BR-ENR-02) |
| "Lịch học T2 · T4 · T6 · 18:30" | Thay | Không có trong DTO (G-10). Thay bằng hàng "Thời gian học" |
| "Phòng học" | Thay | `roomName` luôn null (G-06). Thay bằng hàng "Hình thức" |
| Nhóm "GẦN ĐÂY VÀ SẮP TỚI" | Đổi | Route không lọc được theo ngày (G-05). Thành "TẤT CẢ BUỔI HỌC" |
| Chip "Đã học" / "Hôm nay" / "Sắp tới" | Đổi | Dùng nhãn server (phase mục 8), không suy diễn ở client |
| "Có mặt 14/16" | Ẩn | Điểm danh thuộc P2 (G-08) |
| Ô ngày chỉ có thứ và ngày | Đổi | Thêm tháng vì danh sách trải nhiều tháng |

## 3. Dữ liệu tab Tổng quan

| Nội dung | Nguồn | Ghi chú |
| --- | --- | --- |
| Phụ đề, mã | `name`, `code` | |
| Chip | `status` | |
| Khóa học | `course.code`, `course.title` | "{code} · {title}", icon `menu_book` |
| Giáo trình | `unitCount`, `sessionCount` | Icon `menu_book` |
| Mentor chính | `mentor.displayName` | Avatar chữ cái 40. null → "Chưa có tên" màu secondary |
| Thời gian học | `startDate`, `endDate` | Calendar date, icon `event_repeat` |
| Hình thức | `deliveryMode` | Icon theo phase mục 8 |
| Chỗ | `availableSeats`, `maxStudents` | Như S6, icon `groups` |
| Ghi danh | `enrollmentCounts` | Không tự cộng thành "tổng học viên" |
| Không dùng | `assignmentType`, `accessScope`, `roomName` | G-06 |

## 4. Tab Buổi học

- Nhãn nhóm "TẤT CẢ BUỔI HỌC"; `GlassCard` padding 6; thứ tự server `startsAt` tăng dần, phân trang `ListFooter`, `pageSize` 20. Không có "nhảy tới hôm nay" (G-05). Không tải hết rồi lọc ở client.
- **Hàng:** padding 10, gap 12, pressed nền `--mdy-surface-muted`, radius 14. Ô ngày rộng 44, radius 12, nền `--mdy-surface-muted`: thứ 11, ngày 16/700, tháng 11. Buổi của hôm nay theo giờ Việt Nam: ô nền `--mdy-brand-800`, chữ `--mdy-on-brand`. Giữa: tiêu đề `title` 14/500; dòng phụ 12 `--mdy-text-secondary`. Phải: chip `status`.
- **Dòng phụ:** "{giờ} · {`effectiveMentor.displayName`}"; `assignmentType` SUBSTITUTE thêm " · Dạy thay"; `effectiveMentor` null theo phase mục 8.
- Mọi hàng bấm được, kể cả buổi đã hủy → S4 với `sessionId`, `classTitle` = tên lớp.
- Rỗng: "Lớp chưa có buổi học nào."

## 5. Tab Học viên

- Nhãn nhóm "{total} HỌC VIÊN" từ `total` của server; `GlassCard` padding 6; phân trang `ListFooter`.
- Hàng không bấm được, padding 8/10, gap 12:

```
│ (NB)  Ngô Bảo Ngọc     [Đang học] │
│ (LT)  Lê Thu Hà    [Đang giữ chỗ] │
│ (PH)  Phạm Đức Huy     [Đang học] │
│       Tài khoản tạm ngưng         │
```

- Avatar 36, tên 14/500, chip `enrollmentStatus` theo phase mục 8. "Đang giữ chỗ" không được hiện như "Đang học" (BR-ENR-02).
- `studentStatus` khác ACTIVE: dòng 12 `--mdy-text-secondary` "Tài khoản tạm ngưng" hoặc "Chờ xác minh".
- **Không hiện** email, số điện thoại, trạng thái đơn, ngày thanh toán, số tiền, mã đơn, `orderClassCount`; không có bộ lọc đơn và **không dùng `canConfirmCash`**. Xác nhận tiền mặt thuộc P5.
- Roster không persist, không ghi log tên.
- Rỗng: "Lớp chưa có học viên".

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S7-A | Đang tải tóm tắt | Header không phụ đề, tab dùng được; skeleton thẻ tóm tắt và nhóm thông tin |
| S7-B | Tab Tổng quan có dữ liệu | Mục 2 |
| S7-C | Tab Buổi học / Học viên có dữ liệu | Mục 4, 5 |
| S7-D | Lớp CANCELLED | `InlineAlert` warning ở tab Tổng quan, chip danger, các tab đọc được |
| S7-E | Lớp DRAFT/OPEN/COMPLETED | Chip đúng, không có thông báo riêng |
| S7-F | Tab đang tải / rỗng | Skeleton trong tab / chữ mục 4, 5 |
| S7-G | Lỗi tab Buổi học hoặc Học viên | Lỗi và "Thử lại" trong tab đó; tab khác giữ nguyên |
| S7-H | Lỗi tóm tắt, chưa có dữ liệu | `StatusBlock` + "Thử lại" trong tab Tổng quan; tab khác vẫn mở được |
| S7-I | Làm mới lỗi mạng/5xx, đã có dữ liệu | Giữ dữ liệu + `InlineAlert` warning |
| S7-J | 401 | Về Login theo P0 |
| S7-K | 403 từ bất kỳ route | Xóa toàn bộ tab; `StatusBlock` không quyền; "Quay lại" về S6 |
| S7-L | 404 lớp | Xóa dữ liệu; `StatusBlock` "Không tìm thấy lớp"; "Quay lại" về S6 |
| Conflict | Không áp dụng | Màn chỉ đọc |

## 7. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.managerDetail.title` | Chi tiết lớp | Class details |
| `teaching.managerDetail.tabOverview` / `.tabSessions` / `.tabStudents` | Tổng quan / Buổi học / Học viên | Overview / Sessions / Students |
| `teaching.managerDetail.infoHead` | THÔNG TIN LỚP | CLASS INFORMATION |
| `teaching.managerDetail.primaryMentor` | Mentor chính | Primary mentor |
| `teaching.managerDetail.dates` | Thời gian học | Class period |
| `teaching.managerDetail.delivery` | Hình thức | Format |
| `teaching.managerDetail.seats` | Chỗ | Seats |
| `teaching.managerDetail.course` | Khóa học | Course |
| `teaching.managerDetail.syllabus` | Giáo trình | Syllabus |
| `teaching.managerDetail.count` | {{units}} chương · {{sessions}} buổi | {{units}} units · {{sessions}} sessions |
| `teaching.managerDetail.enrollActive` / `.enrollHeld` / `.enrollDone` / `.enrollCancelled` | Đang học / Giữ chỗ / Hoàn thành / Đã hủy | Active / Held / Completed / Cancelled |
| `teaching.managerDetail.cancelled` | Lớp đã hủy. Thông tin chỉ để tra cứu. Việc hủy lớp không tự hoàn tiền cho học viên. | This class was cancelled. Information is for reference only. Cancelling doesn't automatically refund students. |
| `teaching.managerDetail.sessionsHead` | TẤT CẢ BUỔI HỌC | ALL SESSIONS |
| `teaching.managerDetail.studentsHead` | {{total}} HỌC VIÊN | {{total}} STUDENTS |
| `teaching.managerDetail.substitute` | Dạy thay | Substitute |
| `teaching.managerDetail.noSessions` | Lớp chưa có buổi học nào. | This class has no sessions yet. |
| `teaching.managerDetail.noStudents` | Lớp chưa có học viên | This class has no students yet |
| `teaching.managerDetail.suspended` / `.pendingVerify` | Tài khoản tạm ngưng / Chờ xác minh | Account suspended / Pending verification |
| `teaching.teacherMissing` | Chưa có dữ liệu người dạy | Teacher not recorded |

Nhãn trạng thái ở phase mục 8.

## 8. Accessibility

- Ba tab: `tablist`, mỗi tab `accessibilityRole="tab"`, `accessibilityState.selected`.
- Ô số ghi danh đọc thành một cụm: "14 đang học, 2 giữ chỗ, 0 hoàn thành, 1 đã hủy".
- Mỗi hàng thông tin đọc nhãn rồi giá trị. Nhãn nhóm là `header`.
- Hàng buổi đọc gồm ngày, giờ, tiêu đề, trạng thái, người dạy.
- Hàng học viên đọc tên và trạng thái, không có role `button`.
- `InlineAlert` lớp đã hủy đọc khi màn mở.

## 9. testID

`manager-detail-screen`, `manager-detail-back-button`, `manager-detail-status`, `manager-detail-code`, `manager-detail-course`, `manager-detail-mentor`, `manager-detail-dates`, `manager-detail-delivery`, `manager-detail-seats`, `manager-detail-count`, `manager-detail-enroll-<ACTIVE|PENDING_PAYMENT|COMPLETED|CANCELLED>`, `manager-detail-cancelled-alert`, `manager-detail-tab-overview`, `manager-detail-tab-schedule`, `manager-detail-tab-students`, `manager-detail-session-<sessionId>`, `manager-detail-session-teacher-<sessionId>`, `manager-detail-sessions-empty`, `manager-detail-sessions-error`, `manager-detail-students-count`, `manager-detail-student-<enrollmentId>`, `manager-detail-student-status-<enrollmentId>`, `manager-detail-students-empty`, `manager-detail-students-error`, `manager-detail-error`, `manager-detail-retry`, `manager-detail-denied`, `manager-detail-not-found`, `manager-detail-refresh-alert`.

## 10. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S7-01 | Lớp IN_PROGRESS | Mở từ S6 | Mở tab Tổng quan; gọi `/manager/classes/:id`; chưa gọi `/management/classes/:id` và `students`; tiêu đề "Chi tiết lớp", phụ đề tên lớp |
| TC-P1-S7-02 | Có khóa học, counts | Xem tab Tổng quan | Đúng mã và tên khóa học, 16 chương · 48 buổi; 4 ô ghi danh đúng; có số 0 |
| TC-P1-S7-03 | `roomName` null, `assignmentType` có | Xem tab Tổng quan | Không có hàng phòng, không có nhãn phân công |
| TC-P1-S7-04 | Response lịch có `class.primaryMentor` khác | Mở tab Tổng quan rồi Buổi học | Tóm tắt vẫn lấy từ route Manager; không trộn |
| TC-P1-S7-05 | Buổi SUBSTITUTE | Xem hàng | Dòng phụ có "Dạy thay" và đúng `effectiveMentor` |
| TC-P1-S7-06 | COMPLETED, `effectiveMentor` null | Xem hàng | "Chưa có dữ liệu người dạy"; không dùng mentor chính |
| TC-P1-S7-07 | Có buổi | Bấm hàng | Mở S4 đúng `sessionId`, `classTitle` đúng; back về S7, giữ tab và vị trí |
| TC-P1-S7-08 | Buổi CANCELLED, `effectiveMentor` null | Xem, bấm hàng | Không có người dạy; vẫn mở S4 |
| TC-P1-S7-09 | 45 buổi | Cuộn | Gọi các trang tiếp, không trùng |
| TC-P1-S7-10 | Lớp CANCELLED | Mở màn | `manager-detail-cancelled-alert`; chip danger; các tab vẫn đọc |
| TC-P1-S7-11 | Lần lượt DRAFT, OPEN, COMPLETED | Mở màn | Nhãn đúng; không có alert hủy |
| TC-P1-S7-12 | Có buổi, có học viên | Mở lần lượt hai tab, đổi qua lại | Mỗi route gọi đúng một lần |
| TC-P1-S7-13 | ACTIVE, có email và phone | Xem hàng | Chip "Đang học"; không có email hay số điện thoại |
| TC-P1-S7-14 | 30 học viên | Mở tab, cuộn | "30 HỌC VIÊN" đúng `total`; tải tiếp không trùng |
| TC-P1-S7-15 | PENDING_PAYMENT | Xem hàng | "Đang giữ chỗ"; không có "Đang học" |
| TC-P1-S7-16 | `studentStatus` SUSPENDED / PENDING_VERIFICATION | Xem hàng | Dòng phụ đúng theo mục 5 |
| TC-P1-S7-17 | `canConfirmCash` true, có số tiền | Xem hàng | Không có nút xác nhận, số tiền, mã đơn, trạng thái đơn |
| TC-P1-S7-18 | Có điểm danh ở server | Xem cả ba tab | Không có tiến độ, chuyên cần, "Dưới 80%", "Có mặt" |
| TC-P1-S7-19 | Có quyền Manager | Xem toàn màn | Không có "Đổi", "Phân công", đổi lịch, hủy, sửa |
| TC-P1-S7-20 | Lịch lỗi mạng, tóm tắt OK | Mở tab Buổi học | `manager-detail-sessions-error`; "Thử lại" chỉ gọi lịch; tab Tổng quan còn nguyên |
| TC-P1-S7-21 | Roster lỗi 500, tab Buổi học đã có | Mở tab Học viên | `manager-detail-students-error`; tab Buổi học còn nguyên |
| TC-P1-S7-22 | Tóm tắt lỗi mạng | Mở màn | `manager-detail-error` trong tab Tổng quan |
| TC-P1-S7-23 | Đã có dữ liệu, students 403 | Kéo làm mới | Xóa toàn bộ tab; `manager-detail-denied` |
| TC-P1-S7-24 | 404 | Mở màn | `manager-detail-not-found` |
| TC-P1-S7-25 | Đăng xuất rồi đăng nhập user khác | Mở màn | Không còn dữ liệu học viên phiên trước |
| TC-P1-S7-26 | en, theme tối | Xem màn | Chữ tiếng Anh; tab và chip đúng màu tối |
| TC-P1-S7-27 | Buổi hôm nay theo giờ Việt Nam, máy khác múi giờ | Xem hàng | Ô ngày nổi bật đúng buổi; chip vẫn theo `status` |

Ứng viên Maestro E2E: TC-P1-S7-01, -02, -05, -07, -10, -12, -15, -19.
