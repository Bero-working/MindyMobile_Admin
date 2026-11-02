# P2-S5 — attendance-correction · Sửa điểm danh có lý do

Ngày: 01/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-ATT-08, BR-ATT-10, BR-ATT-11; UC-MG-03. Endpoint tham chiếu: `GET` và `PUT /class-sessions/:sessionId/attendance`, `PUT .../attendance/bulk`; `POST .../finalize` (Q-P2-01).

## 1. Mục tiêu

Quản lý đổi kết quả của record **đã có** trong snapshot, luôn kèm lý do, và mọi thay đổi đi vào lịch sử. Không thêm người mới: thiếu record thì đi S6. Không đóng vai Mentor, không kéo dài hạn của Mentor.

Mẫu [H] không có form này. Bố cục tái dùng `AttendanceRow`, `MarkToggle`, `SaveBar` của S1 để người dùng học một lần.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Sửa điểm danh            ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ Buổi 8: Line graphs [Đã hoàn tất]│
│ T2, 02/11/2026 · 18:30–20:00 │
│ ⓘ Chỉ đổi kết quả của học    │
│   viên đã có trong danh sách.│
│   Mỗi thay đổi đều cần lý do │
│   và được ghi vào lịch sử.   │
│ ┌─────┐┌─────┐┌─────┐        │  TotalsStrip
│ │ 16  ││  2  ││  0  │        │
│ └─────┘└─────┘└─────┘        │
│ [✓✓ Tất cả có mặt] [Tất cả vắng]│
│ HỌC VIÊN · 18                │
│ ┌──────────────────────────┐ │
│ │▌(NB) Ngô Bảo Ngọc         │ │
│ │▌ Chưa lưu [Có mặt][✕ Vắng]│ │
│ │ (TH) Trần Hà              │ │
│ │       [✓ Có mặt][Vắng]    │ │
│ └──────────────────────────┘ │
│ Không thấy học viên? Khôi    │  khi canRecover và endsAt ≤ asOf
│ phục điểm danh               │
├──────────────────────────────┤
│ 1 thay đổi chưa lưu ( Tiếp tục ) │
└──────────────────────────────┘
```

- `pageSize` 100, nút "Xem thêm học viên". Không có candidates hay roster lớp. **Hàng nào không có trong snapshot thì không sửa được ở đây**, không chuyển ngầm thành insert.
- Toggle chỉ có Có mặt, Vắng. Với Quản lý, không chạm lại để về Chưa điểm danh: thao tác đó không phải "sửa kết quả", và buổi đã đóng thì server từ chối UNMARKED. Hàng đang UNMARKED của buổi IN_PROGRESS vẫn chọn được một trong hai.
- Quyền đọc từ `session.permissions` trong response. `canEditAttendance` false: `StatusBlock` "Buổi này không sửa được điểm danh." + "Quay lại".

## 3. Sheet xác nhận lưu

Bấm "Tiếp tục" mở `Sheet`. Lý do nằm ở bước này để người dùng viết lý do khi đã thấy đủ thay đổi.

```
│ Xác nhận sửa điểm danh       │
│ ┌──────────────────────────┐ │
│ │ Ngô Bảo Ngọc              │ │
│ │ Có mặt → Vắng             │ │  có chữ, không chỉ màu
│ │ Châu Khoa · Học bù        │ │
│ │ Chưa điểm danh → Có mặt   │ │
│ └──────────────────────────┘ │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                      0/1000  │
│ ( Lưu thay đổi )  Quay lại   │
```

- Trái mũi tên là `baseStatus` server, phải là giá trị draft. Không hiện lịch sử dựng từ client.
- Lý do bắt buộc: 1–1000 ký tự sau trim. Trống hoặc chỉ khoảng trắng: "Nhập lý do sửa." Quá dài: bộ đếm danger, khóa nút.
- Body: `expectedVersion`, `reason`, `records`, `guestRecords`. Hàng regular vào `records` theo `enrollmentId`, guest vào `guestRecords` theo `makeupPlacementId`.
- Lý do gõ rồi không mất khi đóng sheet, gặp lỗi, hoặc qua conflict. Lưu thành công thì xóa.

## 4. Đánh dấu cả lớp

Có hai nút như S1. Vì tác động lớn, sheet riêng thay cho dialog: nội dung phạm vi lấy `totals.eligible` như S1 mục 4, có `ReasonField`. Body: `expectedVersion`, `checked`, `reason`. Có draft: nói rõ draft bị bỏ. Thành công: toast theo số đổi thật, tải lại.

## 5. Kết quả

| Kết quả | Hành vi |
| --- | --- |
| 200 | Đóng sheet; xóa draft đã gửi và lý do; `TotalsStrip` theo response; toast "Đã sửa {n} học viên"; ở lại màn để sửa tiếp hoặc Back. Số `n` theo `changedEnrollmentIds` + `changedMakeupPlacementIds` |
| 200, `n` = 0 | Toast "Không có thay đổi." |
| Chưa rõ | Sheet không đóng được bằng thao tác thường; `IntentBanner` trong sheet; "Gửi lại" cùng key, body, version; khóa ô lý do |
| 409 `SESSION_VERSION_CONFLICT` | Đóng sheet, `ConflictPanel` trên đầu danh sách (phase mục 6.4). Lý do giữ nguyên. Lưu lại mở sheet với danh sách mới, key mới, version mới |
| 409 `SESSION_STATE_CONFLICT` | Tải lại; dải danger; giữ draft nếu trạng thái mới vẫn sửa được; nếu không thì hàng hiện "Chưa lưu" và khóa |
| 422 `ATTENDANCE_ENROLLMENT_NOT_ELIGIBLE` hoặc 409 `MAKEUP_ATTENDANCE_NOT_ELIGIBLE` | Tải lại; bỏ hàng khỏi draft; dòng `rowsDropped`; giữ lý do; có link Khôi phục nếu được phép |
| 422 thiếu lý do | Không xảy ra do form chặn. Nếu có: hiện lỗi tại ô lý do |
| 403 / 401 / 404 | Phase mục 6.3 |
| 5xx | Trong sheet: dải danger + mã hỗ trợ; thử lại cùng intent |
| Offline | Nút "Tiếp tục" và "Lưu thay đổi" khóa; cảnh báo; không "Thử lại". Draft và lý do trong bộ nhớ |

Không có hạn Mentor trong màn này: Quản lý không bị `editableUntil` chặn theo backend. Không hiện chữ gợi ý là đã kéo dài hạn cho Mentor.

Sau khi lưu, invalidate theo phase mục 10.1. Điểm danh của Mentor sẽ thấy version mới và đi qua conflict nếu đang sửa cùng lúc.

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| C-A | Đang tải | Skeleton đúng bố cục |
| C-B | Có dữ liệu | Mục 2 |
| C-C | `eligible` 0 | "Chưa có bản ghi để sửa." + nút "Khôi phục điểm danh" nếu được phép; không có lối vào này từ S4 nhưng phải đúng khi dữ liệu đổi |
| C-D | Có draft / sheet / đang gửi | Mục 2, 3 |
| C-E | Giới hạn lô | Phase mục 6.1 |
| C-F | Lỗi mutation | Mục 5 |
| C-G | Tải lỗi lần đầu / làm mới lỗi / tải thêm lỗi | `StatusBlock` / `Alert` giữ dữ liệu / thử lại đúng trang |
| C-H | Không có quyền sửa | Mục 2 |
| C-I | Rời màn có draft | Phase mục 6.5 |

## 7. Chốt buổi thay

Người dùng duyệt Q-P2-01 ngày 01/11/2026. Thao tác này nằm trong slice S5, không tăng số UI, và phải bổ sung `POST /finalize` của Quản lý vào kế hoạch mục 8 cùng contract S5.

Lối vào: `manager-att-finalize` ở S4, mở `Sheet` trực tiếp trên màn đó, không qua danh sách.

```
│ Chốt buổi thay Mentor        │
│ ┌─────┐┌─────┐┌─────┐        │  totals vừa tải
│ │ 10  ││  2  ││  6  │        │
│ └─────┘└─────┘└─────┘        │
│ ⚠ 6 học viên chưa điểm danh  │
│   sẽ được tính là Vắng.      │
│ Bắt đầu thực tế: 18:32 02/11 │
│ Giờ kết thúc thực tế *       │
│ ┌────────┐                   │  TimeField, không điền sẵn
│ │ --:--  │  02/11/2026       │
│ └────────┘                   │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
│ ( Chốt buổi )  Quay lại      │
```

- **Giờ kết thúc bắt buộc, không điền sẵn**, không dùng giờ hiện tại và không tự lấy `endsAt` (G-P2-07). Nút phụ "Dùng giờ theo lịch ({HH:mm})" chỉ điền khi người dùng bấm, và dòng dưới nhắc "Chỉ dùng nếu đúng với thực tế."
- Ngày lấy theo ngày của `actualStartedAt`, chỉ đọc. Buổi không qua đêm (`isSingleTeachingDay`).
- Kiểm tại client: `actualStartedAt` < giờ kết thúc ≤ `asOf` mới nhất. Sai: "Giờ kết thúc phải sau giờ bắt đầu và không ở tương lai." Server vẫn kiểm lại.
- Mở sheet: tải lại trang đầu để có `totals`, `version` mới. 409 version sau khi bấm: tải lại, hiện số mới và "Số liệu vừa thay đổi. Xem lại trước khi chốt.", phải xác nhận lại.
- Body: `expectedVersion`, `reason`, `actualEndedAt` (ISO có offset +07:00).
- Thành công: S4 tải lại; buổi rời S3; toast "Đã chốt buổi học".

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `attendance.correction.title` | Sửa điểm danh | Edit attendance |
| `attendance.correction.info` | Chỉ đổi kết quả của học viên đã có trong danh sách. Mỗi thay đổi đều cần lý do và được ghi vào lịch sử. | Only changes results for students on the list. Each change needs a reason and is recorded in the history. |
| `attendance.correction.missing` | Không thấy học viên? Khôi phục điểm danh | Student missing? Recover attendance |
| `attendance.correction.continue` | Tiếp tục | Continue |
| `attendance.correction.confirmTitle` | Xác nhận sửa điểm danh | Confirm attendance changes |
| `attendance.correction.change` | {{from}} → {{to}} | {{from}} → {{to}} |
| `attendance.correction.reason` | Lý do | Reason |
| `attendance.correction.reasonRequired` | Nhập lý do sửa. | Enter a reason. |
| `attendance.correction.submit` | Lưu thay đổi | Save changes |
| `attendance.correction.back` | Quay lại | Back |
| `attendance.correction.done` | Đã sửa {{count}} học viên | Updated {{count}} students |
| `attendance.correction.noChange` | Không có thay đổi. | No changes. |
| `attendance.correction.bulkTitle` | Sửa điểm danh cả lớp | Edit attendance for the whole class |
| `attendance.correction.noEdit` | Buổi này không sửa được điểm danh. | Attendance can't be edited for this session. |
| `attendance.correction.empty` | Chưa có bản ghi để sửa. | There are no records to edit. |
| `attendance.finalize.title` | Chốt buổi thay Mentor | Finalize for mentor |
| `attendance.finalize.started` | Bắt đầu thực tế: {{time}} {{date}} | Actual start: {{time}} {{date}} |
| `attendance.finalize.end` | Giờ kết thúc thực tế | Actual end time |
| `attendance.finalize.useSchedule` | Dùng giờ theo lịch ({{time}}) | Use scheduled time ({{time}}) |
| `attendance.finalize.useScheduleHint` | Chỉ dùng nếu đúng với thực tế. | Use this only if it's accurate. |
| `attendance.finalize.endInvalid` | Giờ kết thúc phải sau giờ bắt đầu và không ở tương lai. | The end time must be after the start time and not in the future. |
| `attendance.finalize.submit` | Chốt buổi | Finalize |

Chữ bulk và cảnh báo UNMARKED dùng lại của S1.

## 9. Accessibility

- Dòng thay đổi đọc "Ngô Bảo Ngọc, từ Có mặt sang Vắng".
- Ô lý do có nhãn bắt buộc; lỗi đọc ngay khi bấm gửi.
- Sheet cuộn được khi bàn phím mở; nút gửi không bị che.

## 10. testID

`correction-screen`, `correction-back`, `correction-info`, `correction-totals`, `correction-bulk-present`, `correction-bulk-absent`, `correction-row-<attendanceId>`, `correction-mark-<attendanceId>-present`, `correction-mark-<attendanceId>-absent`, `correction-row-<attendanceId>-unsaved`, `correction-unsaved-count`, `correction-continue`, `correction-more`, `correction-missing-link`, `correction-sheet`, `correction-change-<attendanceId>`, `correction-reason`, `correction-reason-error`, `correction-reason-count`, `correction-submit`, `correction-bulk-sheet`, `correction-bulk-reason`, `correction-bulk-submit`, `correction-intent-banner`, `correction-resend`, `correction-conflict`, `correction-no-edit`, `correction-empty`, `correction-error`, `correction-retry`, `correction-denied`, `correction-not-found`, `finalize-sheet`, `finalize-impact`, `finalize-end-time`, `finalize-use-schedule`, `finalize-end-error`, `finalize-reason`, `finalize-submit`, `finalize-changed`.

## 11. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P2-S5-01 | COMPLETED, `canEditAttendance` | Mở | Chỉ gọi `attendance`; không gọi candidates, roster lớp |
| TC-P2-S5-02 | Hàng PRESENT | Chạm Vắng | Hàng "Chưa lưu"; `TotalsStrip` không đổi; chưa có request |
| TC-P2-S5-03 | Hàng đang chọn | Chạm lại | Không về Chưa điểm danh |
| TC-P2-S5-04 | Không có thay đổi | Xem | Không có `correction-continue` |
| TC-P2-S5-05 | 2 thay đổi | Tiếp tục | Sheet liệt kê đúng 2 dòng từ/đến; ô lý do trống |
| TC-P2-S5-06 | Sheet mở, lý do trống hoặc chỉ khoảng trắng | Lưu | `correction-reason-error`; không có request |
| TC-P2-S5-07 | Lý do 1001 ký tự | Nhập | Bộ đếm danger; khóa nút |
| TC-P2-S5-08 | Lý do 1000 ký tự | Lưu | Gửi được |
| TC-P2-S5-09 | Regular + guest | Lưu | `reason` có; regular theo `enrollmentId`; guest theo `makeupPlacementId`; UUID v4 |
| TC-P2-S5-10 | | Double tap | Đúng 1 request |
| TC-P2-S5-11 | Thành công | Xem | Hết draft và lý do; số theo response; toast đúng số đổi |
| TC-P2-S5-12 | Thành công | Back về S4 | S4 cập nhật; audit và incomplete được invalidate |
| TC-P2-S5-13 | Mất response | Xem, gửi lại | Ô lý do khóa; cùng key, body, version |
| TC-P2-S5-14 | 409 version, server đổi một hàng | Xem | `correction-conflict`; lý do giữ; không tự gửi |
| TC-P2-S5-15 | Tiếp -14 | Chọn, lưu | Sheet hiện danh sách mới; key mới, version mới |
| TC-P2-S5-16 | 409 `SESSION_STATE_CONFLICT` | Lưu | Không hiện panel version; thông báo trạng thái |
| TC-P2-S5-17 | 422 not eligible | Lưu | Bỏ hàng; `rowsDropped`; lý do giữ; **không** có request tạo record |
| TC-P2-S5-18 | Học viên không có trong snapshot | Tìm | Không có hàng; có `correction-missing-link` khi được khôi phục |
| TC-P2-S5-19 | Roster 2 trang, `eligible` 150 | Tất cả có mặt, không nhập lý do | Sheet nêu 150; thiếu lý do không gửi được |
| TC-P2-S5-20 | Tiếp -19 | Nhập lý do, gửi | Body `checked: true`, `reason`; không có danh sách id |
| TC-P2-S5-21 | `canEditAttendance` false | Mở trực tiếp | `correction-no-edit`; không có toggle |
| TC-P2-S5-22 | 403 khi đã có draft | Lưu | Xóa dữ liệu, draft, lý do; `correction-denied` |
| TC-P2-S5-23 | Có draft | Back | `leave-dialog` |
| TC-P2-S5-24 | Offline có dữ liệu | Xem | Khóa gửi; không "Thử lại"; giữ draft |
| TC-P2-S5-25 | CANCELLED đã start, `canEditAttendance` true | Sửa, lưu | Gửi được; không có chữ nói buổi đã hoàn tất |
| TC-P2-S5-26 | `unmarked` 6 | Mở sheet chốt | Tải totals mới; `finalize-impact` có 6; giờ kết thúc **trống** |
| TC-P2-S5-27 | Thiếu giờ hoặc lý do | Chốt | Không có request; focus ô lỗi |
| TC-P2-S5-28 | Giờ ≤ `actualStartedAt`, hoặc > `asOf` | Chốt | `finalize-end-error`; không có request |
| TC-P2-S5-29 | | Bấm "Dùng giờ theo lịch" | Điền `endsAt` theo giờ VN; có nhắc; chưa gửi |
| TC-P2-S5-30 | Thành công | Xem body | `actualEndedAt` có offset; `reason`; buổi rời S3 |
| TC-P2-S5-31 | 409 version, `unmarked` mới | Xem | Số mới + `finalize-changed`; phải xác nhận lại |

Ứng viên Maestro E2E: TC-P2-S5-05, -06, -09, -11, -12, -14, -19, -20, -26, -30.
