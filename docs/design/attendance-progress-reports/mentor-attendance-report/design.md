# P7-S1 — mentor-attendance-report · Mentor đọc chuyên cần và stored progress

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-REPORT-01, BR-REPORT-02, BR-TEACH-02, BR-MAKEUP-03; UC-M-12. Endpoint tham chiếu: `GET /mentor/classes/:classId/attendance-summary`; `GET /mentor/classes/:classId/progress`; `GET /mentor/classes/:classId/students/:studentId/attendance-summary`; `GET /mentor/classes/:classId/students/:studentId/attendance`; `GET /mentor/classes/:classId/students/:studentId/progress`; `GET /mentor/classes/:classId/units`.

## 1. Mục tiêu

Mentor chính đọc chuyên cần từng học viên trong lớp và tình trạng dữ liệu tiến độ đã lưu, rồi xem chi tiết một học viên để hiểu vì sao có con số đó. Chỉ đọc. Mentor dạy thay không có màn này (BR-TEACH-02).

Màn trả lời "học viên này có mặt bao nhiêu buổi đã chốt, còn gì chưa tính", **không** trả lời "lớp này học tốt không" hay "học viên này đã hoàn thành chưa".

**Lựa chọn ban đầu** (ADR-025 mục 2):

| Lựa chọn | Mặc định |
| --- | --- |
| Tab màn lớp | Chuyên cần |
| Khoảng ngày | Toàn bộ thời gian, không gửi `from`, `to` |
| Tab màn học viên | Lịch sử; khoảng ngày theo params của màn trước |

## 2. Báo cáo lớp

### 2.1 Tab Chuyên cần

```
┌──────────────────────────────┐
│▓ ←  Báo cáo                  ▓│
│▓    IELTS Foundation K12     ▓│
│▓ [Chuyên cần] [Tiến độ]      ▓│
├──────────────────────────────┤
│ (📅 Toàn bộ thời gian)  ⓘ Cách tính│
│ 24 LƯỢT GHI DANH             │
│ Số liệu lúc 14:32 02/11/2026 │
│ ┌──────────────────────────┐ │
│ │ (NN) Ngô Bảo Ngọc  83,33%│ │
│ │ 5/6 buổi đã chốt         │ │
│ │ Có mặt 5 · Vắng 1        │ │
│ │ [Chờ học bù 1]           │ │
│ │ Không tính 4           › │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ (CK) Châu Minh Khoa     —│ │
│ │ Chưa có buổi đã chốt     │ │
│ │ Không tính 10          › │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ (TL) Trần Lan         0% │ │
│ │ 0/3 buổi đã chốt         │ │
│ │ Có mặt 0 · Vắng 3      › │ │
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
└──────────────────────────────┘
```

- Hàng dùng `AttendanceSummaryRow`, bấm mở màn học viên với `studentId`, `studentName`, `from`, `to`.
- `rate` null: không có dòng "Có mặt · Vắng", vì cả hai đều là 0 và dễ gây hiểu nhầm.
- Không có ô tổng của lớp, không sắp xếp, không tô màu theo tỷ lệ ([phase mục 1](../design.md)).
- `readonly` true: `Alert` info `reports.mentor.readonly`.
- Học viên hủy rồi ghi danh lại có hai hàng cùng tên (G-P7-01), đúng theo server, không gộp.

### 2.2 Tab Tiến độ

```
┌──────────────────────────────┐
│▓ [Chuyên cần] [Tiến độ]      ▓│
├──────────────────────────────┤
│ ⓘ Đây là dữ liệu tiến độ đã  │
│   lưu, chưa có quy tắc hoàn  │
│   thành. Chưa theo dõi không │
│   có nghĩa là 0%.            │
│ 24 LƯỢT GHI DANH             │
│ Số liệu lúc 14:32 02/11/2026 │
│ ┌──────────────────────────┐ │
│ │ (NN) Ngô Bảo Ngọc      › │ │
│ │ Có dữ liệu 3 · Chưa theo dõi 9│
│ │ ⚠ 1 chương dữ liệu không hợp lệ│
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ (CK) Châu Minh Khoa    › │ │
│ │ Chưa theo dõi 12         │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- `storedUnitCount` 0: chỉ hiện "Chưa theo dõi {n}". `untrackedUnitCount` 0: chỉ hiện "Có dữ liệu {n}".
- `invalidStoredUnitCount` > 0: thêm dòng warning. Số này nằm trong `storedUnitCount`, nên ghi "1 chương dữ liệu không hợp lệ", không cộng thêm.
- Không có phần trăm, không có thanh tiến độ ở tab này.
- Tab này không có bộ lọc khoảng ngày: endpoint không nhận. Không dùng tham số `unitId` ở P7.
- Tải khi mở tab lần đầu. Bấm hàng mở màn học viên, ở tab Tiến độ.

## 3. Báo cáo học viên

```
┌──────────────────────────────┐
│▓ ←  Ngô Bảo Ngọc             ▓│
│▓    IELTS Foundation K12     ▓│
│▓ [Lịch sử] [Tiến độ]         ▓│
├──────────────────────────────┤
│ (📅 Toàn bộ thời gian)  ⓘ Cách tính│
│ ┌──────────────────────────┐ │
│ │ 83,33%                    │ │
│ │ 5/6 buổi đã chốt          │ │
│ │ Có mặt 5 · Vắng 1         │ │
│ │ [Chờ học bù 1] Không tính 4│ │
│ │ Số liệu lúc 14:32 02/11   │ │
│ └──────────────────────────┘ │
│ ⓘ Tính trên toàn bộ lịch sử   │
│   của học viên trong lớp này. │
│ 11 BUỔI                      │
│ ┌──────────────────────────┐ │
│ │ Buổi 8 · Line graphs    › │ │
│ │ 18:30 28/10/2026 [Đã xong]│ │
│ │ Điểm danh: Vắng           │ │
│ │ Tính chuyên cần: Có mặt   │ │
│ │ [Đã tính học bù]          │ │
│ ├──────────────────────────┤ │
│ │ Buổi 7 · Bar charts     › │ │
│ │ 18:30 26/10/2026 [Đã xong]│ │
│ │ Điểm danh: Có mặt         │ │
│ │ Tính chuyên cần: Có mặt   │ │
│ ├──────────────────────────┤ │
│ │ Buổi 9 · Maps             │ │
│ │ 18:30 04/11/2026 [Sắp dạy]│ │
│ │ [Chưa diễn ra]            │ │
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
└──────────────────────────────┘
```

Header lấy `studentName` từ params; không có thì "Học viên". Không có endpoint cho tên riêng; không gọi roster để lấy tên.

### 3.1 Thẻ tổng

Từ `attendance-summary`. Tỷ lệ 26/700 `--mdy-link`, như số trên thẻ Trang chủ. `rate` null: "—" và `noFinalized`. Dòng giải thích `reports.mentor.historyScope` luôn hiện (G-P7-06). Summary lỗi: thẻ hiện lỗi riêng, lịch sử vẫn dùng được, và ngược lại.

### 3.2 Hàng lịch sử

| Thành phần | Quy tắc | Nguồn |
| --- | --- | --- |
| Tiêu đề, ngày giờ, chip buổi | Như hàng buổi của P1 | `title`, `startsAt`, `sessionStatus` |
| Dòng "Điểm danh: …" | Theo phase mục 7. Hiện khi `attendanceStatus` khác null hoặc applicability là ELIGIBLE | `attendanceStatus` |
| Dòng "Tính chuyên cần: …" | Chỉ khi `creditedAttendanceStatus` khác null | `creditedAttendanceStatus` |
| Chip applicability | **Hiện với mọi giá trị trừ ELIGIBLE**: ELIGIBLE đã được dòng trên diễn đạt | `attendanceApplicability` |
| Chip "Dạy thay" | Khi `assignmentType` = SUBSTITUTE | `assignmentType` |

Không dùng `excluded` riêng để sinh chữ: đã có applicability. Không suy credited từ physical.

Bấm hàng mở `SessionContext` bằng `sessionId` của hàng. DTO không có cờ `readSessionContext`, nên mọi hàng đều bấm được; nếu server từ chối, màn đó tự xử lý không quyền theo P1.

Thứ tự server: `startsAt` mới nhất trước. `total` đếm số buổi của query đang hiện; đừng đem so với mẫu số.

### 3.3 Tab Tiến độ của học viên

```
┌──────────────────────────────┐
│ ⓘ Đây là dữ liệu đã lưu…      │
│ 12 CHƯƠNG                    │
│ ┌──────────────────────────┐ │
│ │ Chương 1 · Getting started│ │
│ │ [Đã hoàn thành] 100,00%   │ │
│ │ Hoàn thành 12/09/2026     │ │
│ ├──────────────────────────┤ │
│ │ Chương 2 · Daily routines │ │
│ │ [Đang học] 40,50%         │ │
│ ├──────────────────────────┤ │
│ │ Chương 3 · Food & drink   │ │
│ │ ⚠ Dữ liệu không hợp lệ    │ │
│ ├──────────────────────────┤ │
│ │ Chương 4 · At the shops   │ │
│ │ Chưa theo dõi             │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

| `trackingStatus` / `dataQuality` | Hiển thị |
| --- | --- |
| STORED / VALID | Chip `status`, `progressPercent` đúng chuỗi server |
| STORED / INVALID_PERCENT | Chip `status` nếu có, "⚠ Dữ liệu không hợp lệ", không có số |
| STORED / UNTRACKED | Chip `status`, "Chưa có %" |
| UNTRACKED / UNTRACKED | "Chưa theo dõi". **Không có 0%, không có chip Chưa bắt đầu** |

Tên chương tra bằng `classUnitId` từ `GET .../units?pageSize=100`, song song, không chặn. Thiếu thì hiện "Chương {thứ tự trong danh sách}" theo thứ tự server, không hiện id. `completedAt` có giá trị thì thêm dòng "Hoàn thành {dd/MM/yyyy}".

Không có bộ lọc khoảng ngày ở tab này; ẩn chip khoảng ngày và "Cách tính".

## 4. Bộ lọc khoảng ngày

`RangeFilter`, theo phase mục 7. Áp dụng cho tab Chuyên cần của màn lớp, và cả thẻ tổng lẫn lịch sử của màn học viên.

```
┌──────────────────────────────┐
│ Chọn khoảng ngày             │
│ Từ ngày   [ 01/10/2026    📅]│
│ Đến ngày  [ 31/10/2026    📅]│
│ Tối đa 93 ngày.              │
│ ( Xem toàn bộ )  [ Áp dụng ] │
└──────────────────────────────┘
```

Khoảng ngày đang chọn ở màn học viên không làm đổi màn lớp khi Back: màn lớp giữ lựa chọn của nó. Tổng theo một khoảng ngày chỉ là số trong khoảng đó; `AsOfLine` và chip luôn cho biết đang xem gì.

## 5. Trạng thái

Áp dụng cho từng phần tải riêng: danh sách, thẻ tổng, lịch sử, tiến độ.

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| R-A | Đang tải trang đầu | Skeleton đúng bố cục; **không hiện 0, không hiện "—"** |
| R-B | Có dữ liệu | Mục 2, 3 |
| R-C | Rỗng | `reports.empty` |
| R-D | Lịch sử rỗng trong khoảng | `reports.mentor.noSessions` + "Xem toàn bộ" |
| R-E | Lớp COMPLETED, CANCELLED | Như R-B, thêm `readonly` |
| R-F | Lỗi lần đầu | `StatusBlock` + "Thử lại"; không hiện rỗng hay 0 |
| R-G | Làm mới lỗi | Giữ dữ liệu cùng query, `refreshFailed` |
| R-H | Tải thêm lỗi | Giữ hàng, thử lại đúng trang |
| R-I | Offline, có dữ liệu | Hiện, `stale`, `AsOfLine`; không "Thử lại" |
| R-J | Offline, chưa có dữ liệu | `offlineEmpty` |
| R-K | 403 (Mentor dạy thay mở trực tiếp, hoặc mất lớp) | Xóa dữ liệu; `StatusBlock` không quyền |
| R-L | 404 | Xóa dữ liệu; `StatusBlock` không tìm thấy, "Quay lại" |
| R-M | 401 | Về Login |

Kéo làm mới tải lại đúng tab và khoảng đang hiện. Quay về từ màn con giữ tab, khoảng và vị trí cuộn.

## 6. Nội dung chữ

Chữ chung ở [phase mục 11](../design.md).

| Key gợi ý | vi | en |
| --- | --- | --- |
| `reports.mentor.title` | Báo cáo | Reports |
| `reports.mentor.tabAttendance` | Chuyên cần | Attendance |
| `reports.mentor.tabProgress` | Tiến độ | Progress |
| `reports.mentor.tabHistory` | Lịch sử | History |
| `reports.mentor.student` | Học viên | Student |
| `reports.mentor.readonly` | Lớp đã kết thúc hoặc đã hủy. Số liệu chỉ để đọc lại. | This class has ended or was cancelled. Figures are for reference. |
| `reports.mentor.historyScope` | Tính trên toàn bộ lịch sử của học viên trong lớp này. | Calculated across the student's whole history in this class. |
| `reports.mentor.sessions` | {{count}} buổi | {{count}} sessions |
| `reports.mentor.units` | {{count}} chương | {{count}} chapters |
| `reports.mentor.attendanceLine` | Điểm danh: {{status}} | Attendance: {{status}} |
| `reports.mentor.creditLine` | Tính chuyên cần: {{status}} | Counted as: {{status}} |
| `reports.mentor.substitute` | Dạy thay | Substitute |
| `reports.mentor.noSessions` | Không có buổi nào trong khoảng này. | No sessions in this range. |
| `reports.mentor.viewAll` | Xem toàn bộ | View all |
| `reports.mentor.progressNote` | Đây là dữ liệu tiến độ đã lưu, chưa có quy tắc hoàn thành. Chưa theo dõi không có nghĩa là 0%. | This is stored progress data; no completion rule is defined. Not tracked doesn't mean 0%. |
| `reports.mentor.stored` | Có dữ liệu {{count}} | Has data {{count}} |
| `reports.mentor.untracked` | Chưa theo dõi {{count}} | Not tracked {{count}} |
| `reports.mentor.invalidCount` | {{count}} chương dữ liệu không hợp lệ | {{count}} chapters with invalid data |
| `reports.mentor.unitUntracked` | Chưa theo dõi | Not tracked |
| `reports.mentor.unitInvalid` | Dữ liệu không hợp lệ | Invalid data |
| `reports.mentor.noPercent` | Chưa có % | No % yet |
| `reports.mentor.completedAt` | Hoàn thành {{date}} | Completed {{date}} |
| `reports.mentor.unitFallback` | Chương {{index}} | Chapter {{index}} |

## 7. Accessibility

- Hàng lớp đọc một câu: "Ngô Bảo Ngọc, 83 phẩy 33 phần trăm, 5 trên 6 buổi đã chốt, có mặt 5, vắng 1, chờ học bù 1, không tính 4".
- Hàng `rate` null: "Châu Minh Khoa, chưa có buổi đã chốt, không tính 10". Không đọc "gạch ngang".
- Hàng lịch sử: "Buổi 8, ngày 28 tháng 10, điểm danh vắng, tính chuyên cần có mặt, đã tính học bù".
- Chương chưa theo dõi đọc "chưa theo dõi", không đọc số.

## 8. testID

`mentor-report-screen`, `mentor-report-back`, `mentor-report-tab-attendance`, `mentor-report-tab-progress`, `mentor-report-range`, `mentor-report-range-clear`, `mentor-report-range-sheet`, `mentor-report-range-from`, `mentor-report-range-to`, `mentor-report-range-apply`, `mentor-report-meaning`, `mentor-report-meaning-sheet`, `mentor-report-count`, `mentor-report-as-of`, `mentor-report-readonly`, `mentor-report-row-<enrollmentId>`, `mentor-report-row-<enrollmentId>-rate`, `mentor-report-row-<enrollmentId>-denominator`, `mentor-report-row-<enrollmentId>-makeup`, `mentor-report-row-<enrollmentId>-unmarked`, `mentor-report-row-<enrollmentId>-excluded`, `mentor-report-progress-note`, `mentor-report-progress-<enrollmentId>`, `mentor-report-more`, `mentor-report-empty`, `mentor-report-error`, `mentor-report-retry`, `mentor-report-offline`, `mentor-report-denied`, `mentor-report-skeleton`.

Màn học viên: `student-report-screen`, `student-report-back`, `student-report-tab-history`, `student-report-tab-progress`, `student-report-rate`, `student-report-denominator`, `student-report-scope`, `student-report-range`, `student-report-count`, `student-report-session-<sessionId>`, `student-report-session-<sessionId>-attendance`, `student-report-session-<sessionId>-credit`, `student-report-session-<sessionId>-applicability`, `student-report-unit-<classUnitId>`, `student-report-unit-<classUnitId>-percent`, `student-report-unit-<classUnitId>-status`, `student-report-more`, `student-report-empty`, `student-report-view-all`, `student-report-error`, `student-report-denied`, `student-report-not-found`, `student-report-skeleton`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P7-S1-01 | Mentor chính | Mở | Đúng 1 request `attendance-summary?page=1&pageSize=20`; không có `from`, `to`; không gọi progress, roster, trang 2 |
| TC-P7-S1-02 | Đang tải | Xem | Skeleton; không có 0, không có "—" |
| TC-P7-S1-03 | Có đủ loại hàng | Xem | Mỗi hàng đúng theo TC-P7-SEM-01 đến 05 |
| TC-P7-S1-04 | `rate` null | Xem | Không có dòng "Có mặt · Vắng" |
| TC-P7-S1-05 | `total` 24 | Xem | "24 lượt ghi danh", không phải "học viên"; `AsOfLine` từ `asOf` |
| TC-P7-S1-06 | Hai hàng cùng `student.id` | Xem | Hiện cả hai, key theo `enrollmentId` |
| TC-P7-S1-07 | `readonly` true | Xem | `mentor-report-readonly`; số vẫn hiện |
| TC-P7-S1-08 | 45 enrollment | Xem thêm | Trang 2 rồi 3; không tự tải; không lặp hàng |
| TC-P7-S1-09 | Trang 2 lỗi | Xem | Giữ 20 hàng; thử lại đúng trang 2 |
| TC-P7-S1-10 | Có khoảng ngày | Xem thêm | Trang 2 giữ đúng `from`, `to` |
| TC-P7-S1-11 | | Mở tab Tiến độ | Lúc này mới có request `progress`; không có `from`, `to`, `unitId`; không có chip khoảng ngày |
| TC-P7-S1-12 | Tab Tiến độ | Xem | Có `progress-note`; đúng số; **không có `%` nào, không có thanh tiến độ** |
| TC-P7-S1-13 | `storedUnitCount` 0 | Xem | Chỉ "Chưa theo dõi {n}" |
| TC-P7-S1-14 | `invalidStoredUnitCount` 1 | Xem | Dòng warning; `storedUnitCount` không bị cộng thêm |
| TC-P7-S1-15 | Bấm hàng chuyên cần | | Mở màn học viên đúng `studentId`, cùng khoảng; tab Lịch sử |
| TC-P7-S1-16 | Bấm hàng tiến độ | | Mở màn học viên, tab Tiến độ |
| TC-P7-S1-17 | Màn học viên | Mở | Request summary và `attendance` trang 1; progress chưa gọi; không gọi roster |
| TC-P7-S1-18 | Summary lỗi, lịch sử OK | Xem | Thẻ tổng có lỗi riêng; lịch sử hiện; và ngược lại |
| TC-P7-S1-19 | Physical ABSENT, credited PRESENT, MAKEUP_CREDITED | Xem | "Điểm danh: Vắng", "Tính chuyên cần: Có mặt", chip "Đã tính học bù" |
| TC-P7-S1-20 | NOT_STARTED, `attendanceStatus` null | Xem | Chỉ chip "Chưa diễn ra"; không có dòng điểm danh và tính |
| TC-P7-S1-21 | MAKEUP_PENDING | Xem | Chip "Chờ học bù"; không có dòng credited |
| TC-P7-S1-22 | Mỗi applicability còn lại | Xem | Đúng nhãn phase mục 7 |
| TC-P7-S1-23 | Applicability lạ | Xem | Phản hồi sai định dạng theo schema |
| TC-P7-S1-24 | `assignmentType` SUBSTITUTE | Xem | Chip "Dạy thay" |
| TC-P7-S1-25 | Bấm hàng lịch sử | | Mở `SessionContext` đúng `sessionId` |
| TC-P7-S1-26 | Màn học viên | Xem | Luôn có `student-report-scope` |
| TC-P7-S1-27 | Lịch sử rỗng trong khoảng | Bấm "Xem toàn bộ" | Về Toàn bộ thời gian |
| TC-P7-S1-28 | Đổi khoảng ở màn học viên, Back | | Màn lớp giữ khoảng của nó |
| TC-P7-S1-29 | Tab Tiến độ học viên | Mở | Request `progress` và `units?pageSize=100`; bảng tra lỗi không chặn |
| TC-P7-S1-30 | UNTRACKED / UNTRACKED | Xem | "Chưa theo dõi"; **không có 0%**, không có chip |
| TC-P7-S1-31 | STORED / VALID `"40.50"`, vi / en | Xem | "40,50%" / "40.50%"; không làm tròn |
| TC-P7-S1-32 | STORED / INVALID_PERCENT | Xem | Warning; không có số |
| TC-P7-S1-33 | STORED / UNTRACKED | Xem | Chip `status`, "Chưa có %" |
| TC-P7-S1-34 | `completedAt` có giá trị | Xem | "Hoàn thành {ngày}" theo giờ Việt Nam |
| TC-P7-S1-35 | Thiếu tên chương | Xem | "Chương {n}"; không hiện id |
| TC-P7-S1-36 | Toàn bộ S1 | Tìm | Không có chữ về quiz, chứng chỉ, % hoàn thành khóa |
| TC-P7-S1-37 | Lỗi lần đầu | Xem | `error`, "Thử lại"; không có 0 |
| TC-P7-S1-38 | Làm mới lỗi | Xem | Giữ dữ liệu; `refreshFailed` |
| TC-P7-S1-39 | Offline, có dữ liệu | Xem | `stale`, `AsOfLine`; không "Thử lại" |
| TC-P7-S1-40 | Offline, chưa có | Xem | `offlineEmpty`; không có 0 |
| TC-P7-S1-41 | 403 khi đã có dữ liệu | Làm mới | Xóa dữ liệu; `denied` |
| TC-P7-S1-42 | Mentor dạy thay mở route trực tiếp | | 403; `denied`; không có số nào |
| TC-P7-S1-43 | 404 `CLASS_STUDENT_NOT_FOUND` | Mở màn học viên | `not-found`, "Quay lại" |
| TC-P7-S1-44 | Đổi tài khoản | Xem | Không còn dữ liệu của tài khoản trước |

Ứng viên Maestro E2E: TC-P7-S1-01, -03, -05, -08, -11, -15, -19, -20, -25, -30, -31, -42.
