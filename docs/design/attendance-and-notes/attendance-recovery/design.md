# P2-S6 — attendance-recovery · Khôi phục điểm danh bằng bằng chứng

Ngày: 01/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-ATT-08, BR-ATT-10; UC-MG-03. Endpoint tham chiếu: `POST /management/class-sessions/:sessionId/attendance/recover`; `GET .../attendance`, `GET .../context`; `GET /manager/classes/:classId/students`.

## 1. Mục tiêu

Quản lý thêm các record **còn thiếu** cho một buổi đã diễn ra, dựa trên bằng chứng lịch sử có thật. Chỉ thêm, không sửa record có sẵn. Thao tác không hoàn tác được và đổi trạng thái buổi, nên form buộc người dùng nhập có chủ đích: không điền sẵn thời gian, không điền sẵn bằng chứng, không chọn sẵn học viên.

Áp dụng khi `permissions.canRecover` true và `session.endsAt` ≤ `asOf` (G-P2-06).

| Trạng thái buổi | Ý nghĩa của recovery |
| --- | --- |
| SCHEDULED | Buổi đã diễn ra nhưng không ai bấm bắt đầu. Sau recovery buổi thành COMPLETED |
| COMPLETED | Buổi đã chốt nhưng thiếu record. Giữ nguyên giờ đã biết |
| IN_PROGRESS, CANCELLED | Server không cho. Không có lối vào |

## 2. Bố cục

Một form cuộn dọc, bốn nhóm theo thứ tự cố định, nút gửi dính đáy.

```
┌──────────────────────────────┐
│▓ ←  Khôi phục điểm danh      ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ Buổi 8: Line graphs [Theo lịch]│
│ T2, 02/11/2026 · 18:30–20:00 │
│ ┌──────────────────────────┐ │
│ │ ⚠ Chỉ dùng khi có bằng    │ │  Alert warning
│ │ chứng buổi học đã diễn ra.│ │
│ │ Chỉ thêm bản ghi còn thiếu│ │
│ │ và không hoàn tác được.   │ │
│ │ Buổi sẽ chuyển sang Đã    │ │  chỉ khi SCHEDULED
│ │ hoàn tất.                 │ │
│ └──────────────────────────┘ │
│ 1 · THỜI GIAN THỰC TẾ        │
│ Ngày học *                   │
│ ┌──────────────┐             │
│ │ dd/mm/yyyy   │ Dùng ngày   │
│ └──────────────┘ theo lịch   │
│ Bắt đầu *      Kết thúc *    │
│ ┌────────┐     ┌────────┐    │
│ │ --:--  │     │ --:--  │    │
│ └────────┘     └────────┘    │
│ 2 · BẰNG CHỨNG               │
│ Nguồn bằng chứng *           │
│ ┌──────────────────────────┐ │
│ │                          │ │  gợi ý trong nhãn phụ
│ └──────────────────────────┘ │
│                      0/2000  │
│ Lý do khôi phục *            │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
│                      0/1000  │
│ 3 · HỌC VIÊN · 2             │
│ ┌──────────────────────────┐ │
│ │ (NB) Ngô Bảo Ngọc       ✕ │ │
│ │  Thanh toán trước giờ học │ │
│ │  14:02 01/11/2026         │ │
│ │       [✓ Có mặt][Vắng]    │ │
│ │ (TH) Trần Hà            ✕ │ │
│ │  Tiền mặt, vào muộn       │ │
│ │  19:10 02/11/2026         │ │
│ │       [Có mặt][✕ Vắng]    │ │
│ └──────────────────────────┘ │
│ ( + Chọn học viên )          │  khóa đến khi nhóm 1 hợp lệ
│ ⓘ Học viên không được chọn   │
│   sẽ không có bản ghi, không │
│   tự tính là vắng.           │
├──────────────────────────────┤
│ (   Xem lại và khôi phục    )│
└──────────────────────────────┘
```

Không có trường người dạy: DTO không có, và không tự dựng (G-P2-08). Giới hạn "Học viên học bù không khôi phục được ở đây" nằm ở sheet chọn học viên.

## 3. Thời gian thực tế

Trạng thái ô phụ thuộc giờ server đã biết. Server từ chối nếu giờ gửi lên khác giờ đã biết (`ATTENDANCE_RECOVERY_CLOCK_CONFLICT`).

| `actualStartedAt`, `actualEndedAt` | Ô |
| --- | --- |
| Cả hai null (SCHEDULED) | Cả ngày và hai giờ đều **trống**, người dùng nhập |
| Đã biết | Ô đó chỉ đọc, hiển thị giá trị server, gửi đúng giá trị đó. Có dòng "Giữ nguyên giờ đã ghi." |

- **Không điền sẵn** thời gian hiện tại hay `startsAt`/`endsAt`. Nút "Dùng ngày theo lịch" và "Dùng giờ theo lịch" chỉ điền khi người dùng bấm.
- Ô ngày là `TextField` bàn phím số, tự chèn `/`, phân tích `dd/mm/yyyy` không qua múi giờ máy. Giờ dùng `TimeField`. Tất cả hiểu theo giờ Việt Nam và gửi ISO có offset +07:00.
- Kiểm tại client, khi rời ô và khi gửi; server kiểm lại:

| Điều kiện | Lỗi |
| --- | --- |
| Đủ ngày, bắt đầu, kết thúc | "Nhập đủ ngày và giờ." |
| Ngày tồn tại thật (31/02 sai) | "Ngày không hợp lệ." |
| bắt đầu < kết thúc | "Giờ kết thúc phải sau giờ bắt đầu." |
| kết thúc ≤ `asOf` mới nhất | "Thời gian không được ở tương lai." |

- Khác ngày theo lịch: **cảnh báo, không chặn** (G-P2-06), dòng warning 12 "Ngày này khác ngày học theo lịch ({dd/MM/yyyy}). Kiểm tra lại bằng chứng."
- Buổi không qua đêm nên một ô ngày dùng chung là đủ. Buổi kết thúc đúng 00:00 hôm sau chưa nhập được trong form; đây là giới hạn đã biết của design.

## 4. Bằng chứng và lý do

| Trường | Giới hạn sau trim | Nhãn phụ | Lỗi |
| --- | --- | --- | --- |
| `evidenceNote` | 1–2000 | "Ví dụ: biên bản giấy, tin nhắn lớp. Ghi đủ để người khác kiểm tra lại." | "Nhập nguồn bằng chứng." |
| `reason` | 1–1000 | "Vì sao dữ liệu bị thiếu." | "Nhập lý do khôi phục." |

Bằng chứng và lý do hiện trong lịch sử S7. Không có tải file: DTO chỉ nhận chữ.

## 5. Chọn học viên

Nút "Chọn học viên" khóa đến khi nhóm thời gian hợp lệ, vì điều kiện thanh toán phụ thuộc giờ bắt đầu. Đổi giờ sau khi đã chọn: tính lại cơ sở cho từng người, người không còn hợp lệ bị bỏ và báo "{n} học viên đã bị bỏ vì không còn đủ điều kiện với giờ mới."

**Sheet** tải theo nhu cầu, chỉ khi mở:

1. `GET /manager/classes/:classId/students`, `pageSize` 100, tải thêm khi cuộn.
2. Khi `totals.eligible` > 0: `GET attendance`, `pageSize` 100, tải đủ để biết ai đã có record. Một trang chưa đủ để kết luận "chưa có". Đang tải: các hàng chưa bấm được.

Có ô tìm cục bộ trên các hàng đã tải. Mỗi hàng: tên, trạng thái ghi danh, thanh toán, chỉ báo chọn.

### 5.1 Khả năng chọn và cơ sở vào học

Dữ liệu dùng: `enrollmentStatus`, `paymentType`, `paidAt`. Đây là gợi ý để tránh gửi sai; **server kiểm lại toàn bộ**, gồm cả `createdAt` của ghi danh mà roster không trả.

| Điều kiện (theo thứ tự) | Hàng | `admissionBasis` |
| --- | --- | --- |
| Đã có record trong snapshot | Khóa, "Đã có điểm danh. Dùng Sửa điểm danh." | — |
| `enrollmentStatus` khác ACTIVE/COMPLETED/CANCELLED | Khóa, "Ghi danh chưa đủ điều kiện." | — |
| `paidAt` null | Khóa, "Chưa có thanh toán." | — |
| `paidAt` ≤ giờ bắt đầu | Chọn được | `PAID_BEFORE_START` |
| `paidAt` > giờ bắt đầu, `paymentType` CASH | Chọn được | `CASH_LATE_ADMISSION` |
| `paidAt` > giờ bắt đầu, loại khác | Khóa, "Thanh toán sau giờ học." | — |

Với dữ kiện đã có thì chỉ có tối đa một cơ sở hợp lệ, nên hiển thị như thông tin chỉ đọc, không bắt người dùng chọn. Thời gian `paidAt` hiện theo giờ Việt Nam. Không hiện số tiền hay mã đơn: không cần cho quyết định này.

Hàng khóa vẫn hiện kèm lý do, để Quản lý không tưởng dữ liệu bị thiếu.

Mỗi học viên đã chọn **phải có trạng thái Có mặt hoặc Vắng do người dùng chọn**, không mặc định. Thiếu: viền danger, "Chọn Có mặt hoặc Vắng." Không có UNMARKED.

### 5.2 Giới hạn

| Giới hạn | Hành vi |
| --- | --- |
| Chưa chọn ai | "Chọn ít nhất một học viên." |
| Tối đa 1000 record | Hàng thứ 1001 không chọn được, dòng báo giới hạn |
| Thân request 256 KiB | Trước khi gửi, ước lượng kích thước JSON UTF-8 của đúng body. Vượt: dừng ở sheet xem lại, "Dữ liệu quá lớn để gửi một lần. Giảm số học viên hoặc rút ngắn bằng chứng." Không tự cắt, không tự chia lô: chia lô sẽ đổi trạng thái buổi từ lần đầu và các lần sau phải khớp giờ đã ghi |

## 6. Xem lại và gửi

Bấm nút đáy: kiểm toàn form, focus lỗi đầu tiên. Hợp lệ thì mở `Sheet` "Xem lại trước khi khôi phục":

- Thời gian thực tế, bằng chứng, lý do (rút gọn).
- "{n} học viên: {p} có mặt, {a} vắng."
- SCHEDULED: "Buổi sẽ chuyển sang Đã hoàn tất."
- "Thao tác này không hoàn tác được. Muốn đổi kết quả sau đó, dùng Sửa điểm danh."
- Nút "Khôi phục" / "Quay lại".

Mở sheet thì tải lại `attendance?pageSize=1` để lấy `version` và `permissions` mới. Quyền mất: dừng. Version đổi so với lúc mở form: hiện "Buổi vừa có thay đổi. Kiểm tra lại." và phải bấm xác nhận sau khi đọc.

Body: `expectedVersion`, `reason`, `evidenceNote`, `actualStartedAt`, `actualEndedAt`, `records[{enrollmentId, status, admissionBasis}]`. Header: UUID v4.

| Kết quả | Hành vi |
| --- | --- |
| 200 | Toast "Đã khôi phục {n} học viên"; về S4; invalidate theo phase mục 10.1; buổi SCHEDULED rời S3. Không ở lại form để tránh gửi lần hai |
| Chưa rõ | `IntentBanner` trong sheet; form khóa; "Gửi lại" cùng key, body, version |
| 409 `SESSION_VERSION_CONFLICT` | Giữ form; tải lại context và snapshot; đánh dấu lại người đã có record và tính lại; dải "Buổi vừa có thay đổi. Kiểm tra lại rồi gửi." Lần gửi sau là intent mới |
| 409 `ATTENDANCE_RECOVERY_RECORD_EXISTS` | Giữ form; tải lại snapshot; bỏ người đã có record và báo số người; "Những học viên này đã có điểm danh. Dùng Sửa điểm danh nếu cần đổi." |
| 409 `ATTENDANCE_RECOVERY_CLOCK_CONFLICT` | Tải lại context; ô giờ chuyển chỉ đọc theo server; "Giờ thực tế đã được ghi trước đó." Tính lại cơ sở vào học |
| 409 `SESSION_STATE_CONFLICT` | Thoát form sang `StatusBlock` "Buổi này không khôi phục được nữa." Giữ bằng chứng trên màn để sao chép |
| 422 `ATTENDANCE_RECOVERY_EVIDENCE_INVALID` | Giữ form; "Bằng chứng thanh toán hoặc ghi danh của một học viên không hợp lệ với giờ này." **Server không nói là ai**: không tự đoán. Gợi ý kiểm tra giờ bắt đầu và danh sách |
| 422 khác | Lỗi chung, giữ form, mã hỗ trợ |
| 413 | Như vượt 256 KiB ở mục 5.2 |
| 403 / 401 / 404 | Phase mục 6.3, xóa form |
| 5xx | Dải danger trong sheet; thử lại cùng intent |
| Offline | Khóa nút gửi; cảnh báo; không "Thử lại"; form trong bộ nhớ |

Không có bước nào tự điền dữ liệu thiếu sau lỗi.

## 7. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| R-A | Đang tải | Skeleton thẻ đầu; các ô chưa dùng được |
| R-B | SCHEDULED | Mục 2, ô giờ trống |
| R-C | COMPLETED có giờ | Ô giờ chỉ đọc; thân cảnh báo không có câu chuyển trạng thái |
| R-D | Không có quyền hoặc buổi chưa diễn ra | `StatusBlock` "Buổi này không khôi phục được."; "Quay lại"; không có form |
| R-E | Sheet: đang tải / rỗng / lỗi / lỗi tải thêm | Skeleton / "Lớp chưa có học viên." / chữ lỗi + "Thử lại" trong sheet / thử lại đúng trang, giữ hàng |
| R-F | Mọi người đều đã có record | Sheet: "Mọi học viên đều đã có điểm danh." |
| R-G | Đang gửi / chưa rõ / lỗi | Mục 6 |
| R-H | Rời màn khi đã nhập | Dialog chung; thân "Nội dung đã nhập sẽ bị bỏ." |

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `attendance.recovery.title` | Khôi phục điểm danh | Recover attendance |
| `attendance.recovery.warning` | Chỉ dùng khi có bằng chứng buổi học đã diễn ra. Chỉ thêm bản ghi còn thiếu và không hoàn tác được. | Use only with evidence that the session took place. This only adds missing records and can't be undone. |
| `attendance.recovery.willComplete` | Buổi sẽ chuyển sang Đã hoàn tất. | The session will be marked Completed. |
| `attendance.recovery.timeGroup` | THỜI GIAN THỰC TẾ | ACTUAL TIME |
| `attendance.recovery.date` / `.start` / `.end` | Ngày học / Bắt đầu / Kết thúc | Date / Start / End |
| `attendance.recovery.useDate` / `.useTime` | Dùng ngày theo lịch / Dùng giờ theo lịch | Use scheduled date / Use scheduled time |
| `attendance.recovery.keepKnown` | Giữ nguyên giờ đã ghi. | Keeps the recorded time. |
| `attendance.recovery.timeMissing` | Nhập đủ ngày và giờ. | Enter the date and times. |
| `attendance.recovery.dateInvalid` | Ngày không hợp lệ. | That date isn't valid. |
| `attendance.recovery.endBeforeStart` | Giờ kết thúc phải sau giờ bắt đầu. | The end time must be after the start time. |
| `attendance.recovery.future` | Thời gian không được ở tương lai. | The time can't be in the future. |
| `attendance.recovery.dateDiffers` | Ngày này khác ngày học theo lịch ({{date}}). Kiểm tra lại bằng chứng. | This differs from the scheduled date ({{date}}). Check your evidence. |
| `attendance.recovery.evidenceGroup` | BẰNG CHỨNG | EVIDENCE |
| `attendance.recovery.evidence` / `.evidenceHint` | Nguồn bằng chứng / Ví dụ: biên bản giấy, tin nhắn lớp. Ghi đủ để người khác kiểm tra lại. | Evidence source / For example, a paper record or class messages. Include enough for someone else to check. |
| `attendance.recovery.evidenceRequired` | Nhập nguồn bằng chứng. | Enter the evidence source. |
| `attendance.recovery.reason` / `.reasonHint` | Lý do khôi phục / Vì sao dữ liệu bị thiếu. | Reason / Why the data is missing. |
| `attendance.recovery.reasonRequired` | Nhập lý do khôi phục. | Enter a reason. |
| `attendance.recovery.studentsGroup` | HỌC VIÊN · {{count}} | STUDENTS · {{count}} |
| `attendance.recovery.pick` | Chọn học viên | Choose students |
| `attendance.recovery.pickSearch` | Tìm học viên | Search students |
| `attendance.recovery.notSelected` | Học viên không được chọn sẽ không có bản ghi, không tự tính là vắng. | Students not chosen get no record and aren't counted as absent. |
| `attendance.recovery.guestLimit` | Học viên học bù không khôi phục được ở đây. | Make-up students can't be recovered here. |
| `attendance.recovery.hasRecord` | Đã có điểm danh. Dùng Sửa điểm danh. | Already has attendance. Use Edit attendance. |
| `attendance.recovery.enrollmentBlocked` | Ghi danh chưa đủ điều kiện. | Enrollment isn't eligible. |
| `attendance.recovery.noPayment` | Chưa có thanh toán. | No payment yet. |
| `attendance.recovery.paidLate` | Thanh toán sau giờ học. | Paid after the session. |
| `attendance.recovery.paidAt` | {{time}} {{date}} | {{time}} {{date}} |
| `attendance.recovery.statusRequired` | Chọn Có mặt hoặc Vắng. | Choose Present or Absent. |
| `attendance.recovery.noneSelected` | Chọn ít nhất một học viên. | Choose at least one student. |
| `attendance.recovery.tooMany` | Tối đa 1000 học viên mỗi lần. | Up to 1000 students at a time. |
| `attendance.recovery.tooLarge` | Dữ liệu quá lớn để gửi một lần. Giảm số học viên hoặc rút ngắn bằng chứng. | That's too much to send at once. Choose fewer students or shorten the evidence. |
| `attendance.recovery.droppedByTime` | {{count}} học viên đã bị bỏ vì không còn đủ điều kiện với giờ mới. | {{count}} students were removed because they don't qualify with the new time. |
| `attendance.recovery.review` | Xem lại và khôi phục | Review and recover |
| `attendance.recovery.reviewTitle` | Xem lại trước khi khôi phục | Review before recovering |
| `attendance.recovery.reviewCount` | {{count}} học viên: {{present}} có mặt, {{absent}} vắng. | {{count}} students: {{present}} present, {{absent}} absent. |
| `attendance.recovery.reviewFoot` | Thao tác này không hoàn tác được. Muốn đổi kết quả sau đó, dùng Sửa điểm danh. | This can't be undone. To change results later, use Edit attendance. |
| `attendance.recovery.submit` | Khôi phục | Recover |
| `attendance.recovery.done` | Đã khôi phục {{count}} học viên | Recovered {{count}} students |
| `attendance.recovery.changed` | Buổi vừa có thay đổi. Kiểm tra lại rồi gửi. | This session just changed. Check it, then send again. |
| `attendance.recovery.recordExists` | Những học viên này đã có điểm danh. Dùng Sửa điểm danh nếu cần đổi. | These students already have attendance. Use Edit attendance to change it. |
| `attendance.recovery.clockConflict` | Giờ thực tế đã được ghi trước đó. | The actual time was already recorded. |
| `attendance.recovery.evidenceInvalid` | Bằng chứng thanh toán hoặc ghi danh của một học viên không hợp lệ với giờ này. | One student's payment or enrollment evidence isn't valid for this time. |
| `attendance.recovery.unavailable` | Buổi này không khôi phục được. | This session can't be recovered. |
| `attendance.recovery.noLonger` | Buổi này không khôi phục được nữa. | This session can no longer be recovered. |
| `attendance.recovery.emptyClass` / `.allRecorded` | Lớp chưa có học viên. / Mọi học viên đều đã có điểm danh. | This class has no students. / All students already have attendance. |
| `attendance.recovery.leaveBody` | Nội dung đã nhập sẽ bị bỏ. | What you've entered will be discarded. |

## 9. Accessibility

- Mỗi nhóm có tiêu đề role `header`; số thứ tự nhóm đọc được.
- Lỗi form: focus ô đầu tiên, đọc lỗi. Hàng khóa trong sheet đọc kèm lý do và `disabled`.
- Hàng đã chọn đọc "Ngô Bảo Ngọc, thanh toán trước giờ học lúc 14:02 ngày 01/11/2026, chưa chọn trạng thái". Nút ✕ có nhãn "Bỏ {tên}".
- Ô ngày, giờ có nhãn đọc định dạng mong đợi.

## 10. testID

`recovery-screen`, `recovery-back`, `recovery-warning`, `recovery-date`, `recovery-start`, `recovery-end`, `recovery-use-date`, `recovery-use-start`, `recovery-use-end`, `recovery-keep-known`, `recovery-time-error`, `recovery-date-differs`, `recovery-evidence`, `recovery-evidence-error`, `recovery-evidence-count`, `recovery-reason`, `recovery-reason-error`, `recovery-reason-count`, `recovery-pick`, `recovery-selected-<enrollmentId>`, `recovery-selected-basis-<enrollmentId>`, `recovery-selected-remove-<enrollmentId>`, `recovery-mark-<enrollmentId>-present`, `recovery-mark-<enrollmentId>-absent`, `recovery-mark-error-<enrollmentId>`, `recovery-none-selected`, `recovery-not-selected-note`, `recovery-too-large`, `recovery-review`, `recovery-sheet-students`, `recovery-option-<enrollmentId>`, `recovery-option-reason-<enrollmentId>`, `recovery-sheet-search`, `recovery-sheet-retry`, `recovery-review-sheet`, `recovery-submit`, `recovery-intent-banner`, `recovery-resend`, `recovery-error-banner`, `recovery-unavailable`, `recovery-denied`, `recovery-not-found`.

## 11. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P2-S6-01 | SCHEDULED đã qua giờ, `canRecover` | Mở | Mọi ô trống; không có giờ hiện tại hay `startsAt`; không gọi roster lớp |
| TC-P2-S6-02 | COMPLETED có giờ thực tế | Mở | Ô giờ chỉ đọc đúng server; không có câu chuyển trạng thái |
| TC-P2-S6-03 | `canRecover` false, hoặc `endsAt` > `asOf` | Mở trực tiếp | `recovery-unavailable`; không có form |
| TC-P2-S6-04 | IN_PROGRESS | Mở trực tiếp | `recovery-unavailable` |
| TC-P2-S6-05 | | Bấm "Dùng ngày theo lịch" | Chỉ lúc đó mới điền, theo giờ VN |
| TC-P2-S6-06 | Giờ kết thúc ≤ bắt đầu; ngày 31/02; thời gian tương lai | Nhập | Đúng từng lỗi; `recovery-pick` khóa |
| TC-P2-S6-07 | Ngày khác lịch | Nhập | `recovery-date-differs`; vẫn tiếp tục được |
| TC-P2-S6-08 | Máy múi giờ khác | Nhập 18:30 | Gửi `...T18:30:00+07:00` |
| TC-P2-S6-09 | Bằng chứng/lý do trống, chỉ khoảng trắng, quá giới hạn | Gửi | Lỗi đúng ô; focus ô đầu; không có request |
| TC-P2-S6-10 | Thời gian chưa hợp lệ | Bấm `recovery-pick` | Khóa |
| TC-P2-S6-11 | Thời gian hợp lệ | Mở sheet | Lúc này mới gọi `GET /manager/classes/:id/students`; có `pageSize`=100 |
| TC-P2-S6-12 | COMPLETED, `eligible` 150 | Mở sheet | Tải đủ các trang `attendance`; hàng chưa rõ chưa bấm được |
| TC-P2-S6-13 | Người đã có record | Xem | Khóa, "Đã có điểm danh…" |
| TC-P2-S6-14 | `paidAt` null / PENDING_PAYMENT | Xem | Khóa, đúng lý do |
| TC-P2-S6-15 | `paidAt` = đúng giờ bắt đầu | Chọn | `PAID_BEFORE_START` |
| TC-P2-S6-16 | CASH, `paidAt` sau bắt đầu | Chọn | `CASH_LATE_ADMISSION` |
| TC-P2-S6-17 | PAYOS, `paidAt` sau bắt đầu | Xem | Khóa, "Thanh toán sau giờ học." |
| TC-P2-S6-18 | Đã chọn người A theo giờ cũ | Đổi giờ bắt đầu sớm hơn `paidAt` với PAYOS | A bị bỏ; `droppedByTime` |
| TC-P2-S6-19 | Đã chọn, chưa chọn trạng thái | Gửi | `recovery-mark-error-*`; không có mặc định |
| TC-P2-S6-20 | Không chọn ai | Gửi | `recovery-none-selected` |
| TC-P2-S6-21 | Chọn đủ 1000 | Chọn thêm | Không nhận; báo giới hạn |
| TC-P2-S6-22 | Body ước lượng > 256 KiB | Xem lại | `recovery-too-large`; không có request; không chia lô |
| TC-P2-S6-23 | Form hợp lệ, SCHEDULED | Xem lại | Sheet nêu số người, chuyển trạng thái, không hoàn tác; `version` được tải lại |
| TC-P2-S6-24 | Thành công | Xem body | Đủ trường; UUID v4; về S4; buổi rời S3 |
| TC-P2-S6-25 | | Double tap | Đúng 1 request |
| TC-P2-S6-26 | Mất response | Gửi lại | Form khóa; cùng key, body, version |
| TC-P2-S6-27 | 409 version | Xem | Giữ form; không tự gửi; lần sau key mới |
| TC-P2-S6-28 | 409 `RECORD_EXISTS` | Xem | Tải lại; bỏ người đã có; báo số; **không tự chuyển thành sửa** |
| TC-P2-S6-29 | 409 `CLOCK_CONFLICT` | Xem | Ô giờ chỉ đọc theo server; tính lại cơ sở |
| TC-P2-S6-30 | 422 `EVIDENCE_INVALID` | Xem | Thông báo chung; không chỉ đích danh; form giữ |
| TC-P2-S6-31 | 413 | Xem | Như `recovery-too-large` |
| TC-P2-S6-32 | 409 `SESSION_STATE_CONFLICT` | Xem | `noLonger`; bằng chứng còn đọc được |
| TC-P2-S6-33 | 403 | Xem | Xóa form; `recovery-denied` |
| TC-P2-S6-34 | Đã nhập | Back | `leave-dialog` thân riêng |
| TC-P2-S6-35 | Offline đã nhập | Xem | Khóa gửi; cảnh báo; không "Thử lại"; giữ form |
| TC-P2-S6-36 | Học viên không chọn sau thành công | Xem S4 | Không có record cho họ; không hiện Vắng |
| TC-P2-S6-37 | Sau recovery, `effectiveMentor` null | Xem S4 | "Chưa có dữ liệu người dạy"; không dùng mentor chính |

Ứng viên Maestro E2E: TC-P2-S6-01, -02, -03, -11, -13, -15, -19, -23, -24, -28, -36. Cần dữ liệu thanh toán thật; thiếu thì báo blocked, không tạo lịch sử giả.
