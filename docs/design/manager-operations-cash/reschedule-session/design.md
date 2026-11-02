# P5-S2 — reschedule-session · Dời buổi tương lai

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-OPS-01, BR-TIME-01, BR-TEACH-03; UC-MG-07. Endpoint tham chiếu: `PATCH /management/class-sessions/:sessionId/schedule`; đọc `GET /class-sessions/:id/context`, `GET /manager/classes/:classId`.

## 1. Mục tiêu

Quản lý đổi ngày giờ của một buổi **SCHEDULED chưa tới giờ**, kèm lý do, rồi lịch của cả Quản lý và Mentor cập nhật. Không đổi tên buổi (Q-P5-04), không đổi người dạy, không tạo buổi mới.

[H] chỉ có mục "Đổi lịch buổi học", không có form. Bố cục tái dùng `SessionEditScreen` đang có, bỏ ô tên buổi và thêm lý do.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Đổi lịch buổi học        ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ Buổi 8: Line graphs [Sắp tới]│  SessionSummary
│ T2, 09/11/2026 · 18:30–20:00 │
│ Người dạy: Trần Mai          │
│                              │
│ LỊCH MỚI                     │
│ Ngày                         │
│ ┌──────────────────────────┐ │
│ │ 📅 T4, 11/11/2026        │ │  mở Sheet Calendar
│ └──────────────────────────┘ │
│ ┌───────────┐ ┌───────────┐  │
│ │ Bắt đầu   │ │ Kết thúc  │  │
│ │ 18:30     │ │ 20:00     │  │
│ └───────────┘ └───────────┘  │
│ Thời lượng 90 phút           │
│ ⓘ Người dạy giữ nguyên. Nếu  │
│   đổi người, phân công dạy   │
│   thay sau khi dời.          │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
│                      0/1000  │
├──────────────────────────────┤
│ ( Dời buổi )                 │  dính đáy
└──────────────────────────────┘
```

- Ba ô điền sẵn giá trị hiện tại của buổi, theo `Asia/Ho_Chi_Minh`. Nút "Dời buổi" khóa đến khi lịch khác lịch hiện tại.
- Lịch nằm trong một ngày: một ô ngày và hai ô giờ, nên không nhập được buổi qua đêm.
- "Thời lượng {n} phút" tính lại khi đổi giờ. Khác thời lượng cũ thì thêm "(trước đây {m} phút)". Không chặn: backend cho phép.

### 2.1 Chọn ngày

`Sheet` chứa `Calendar` như `SessionEdit`. Giới hạn:

- `minDate`: ngày hiện tại lấy từ `asOf`, theo giờ Việt Nam. Không lấy `startDate` lớp nếu `startDate` đã qua.
- `maxDate`: `endDate` của lớp từ `GET /manager/classes/:classId`.
- `minDate` cũng không nhỏ hơn `startDate`.

Lớp tải lỗi: Calendar không giới hạn theo lớp, có dòng 12 "Chưa kiểm tra được thời gian của lớp." Vẫn cho gửi, server sẽ từ chối nếu sai (`CLASS_SESSION_OUTSIDE_CLASS_PERIOD`). Không chặn cả màn vì một thông tin kiểm trước.

### 2.2 Kiểm tại client

Chạy khi bấm "Dời buổi", server vẫn kiểm lại.

| Điều kiện | Lỗi | Vị trí |
| --- | --- | --- |
| Giờ không đúng `HH:mm` | "Nhập giờ theo dạng HH:mm." | Ô giờ |
| `end <= start` | `operations.timeRange` | Ô kết thúc |
| `start <= asOf` mới nhất | `operations.startPast` | Ô bắt đầu |
| Ngày ngoài `[startDate, endDate]`, khi đã tải được lớp | `operations.outsidePeriod` | Ô ngày |
| Lý do trống hoặc chỉ khoảng trắng | `operations.reasonRequired` | Ô lý do |

## 3. Điều kiện vào màn

| Trạng thái | Hiển thị |
| --- | --- |
| SCHEDULED, `startsAt > asOf`, lớp OPEN, IN_PROGRESS hoặc DRAFT | Mục 2 |
| SCHEDULED, `startsAt <= asOf` | `StatusBlock` "Buổi này đã qua giờ học nên không dời được." (G-P5-09) |
| IN_PROGRESS, COMPLETED, CANCELLED | `StatusBlock` "Chỉ dời được buổi chưa bắt đầu." |
| Lớp COMPLETED, CANCELLED | `StatusBlock` `operations.classClosed` |

## 4. Xác nhận

`ConfirmationDialog` icon `edit_calendar`:

```
│ Dời buổi học?                │
│ Từ: T2, 09/11 · 18:30–20:00  │
│ Sang: T4, 11/11 · 18:30–20:00│
│ Lịch của Mentor và học viên  │
│ sẽ đổi theo. Nếu học viên có │
│ lịch học bù trùng, hệ thống  │
│ ghi nhận thành xung đột.     │
│ ( Dời buổi )   Quay lại      │
```

Không nêu số học viên bị ảnh hưởng và số xung đột vì không có nguồn (G-P5-10). Không hứa học viên hay Mentor nhận được thông báo.

Body: `{ startsAt, endsAt, reason, expectedVersion }`. `startsAt`, `endsAt` là ISO có offset `+07:00` từ `parseVietnamTime`. `expectedVersion` là `session.version` của context mới nhất.

## 5. Kết quả

| Kết quả | Hành vi |
| --- | --- |
| 200 | Toast "Đã dời buổi sang {ngày giờ}" theo `startsAt`, `endsAt` của response; về chi tiết buổi; invalidate theo phase mục 8.1 |
| Chưa rõ | `IntentBanner`; khóa form; "Gửi lại" cùng key, body, version |
| 409 `SESSION_VERSION_CONFLICT` | Tải lại context. **Giữ lịch đang nhập**, cập nhật `SessionSummary` và dòng "Từ" trong dialog. Alert `versionConflict`. Lần sau là intent mới |
| 409 `SESSION_STATE_CONFLICT` | Tải lại rồi chuyển nhánh mục 3 |
| 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` | Alert "{tên người dạy} đang trùng lịch hoặc nghỉ trong giờ này. Chọn giờ khác." Giữ form. Không gợi ý mentor khác vì không có nguồn (G-P5-07) |
| 409 `CLASS_SESSION_OVERLAP` | `operations.overlap` tại ô giờ |
| 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | `operations.placements`, chặn: buổi có học bù không dời được. Có lối tới P4-S6 khi P4 đã có |
| 409 `CLASS_NOT_EDITABLE` | Chuyển nhánh mục 3 |
| 422 thời gian | Phase mục 5.1; lỗi tại đúng ô |
| 403 / 401 / 404 / 5xx | Phase mục 5.1 |
| Offline | Form giữ trong bộ nhớ; khóa nút; "Cần kết nối mạng" |

Sau mỗi lần sửa ngày giờ bị từ chối, lần gửi tiếp là intent mới. Chỉ "Gửi lại" trong `IntentBanner` mới giữ key cũ.

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| R-A | Đang tải | Skeleton `SessionSummary` + ba ô |
| R-B | Có dữ liệu, chưa đổi | Mục 2; nút khóa |
| R-C | Đã đổi, hợp lệ | Nút bật |
| R-D | Lỗi nhập | Mục 2.2 |
| R-E | Đang gửi | Dialog `busy` |
| R-F | Lỗi mutation | Mục 5 |
| R-G | Context lỗi | `StatusBlock` + "Thử lại" |
| R-H | Lớp lỗi | Mục 2.1, form vẫn dùng được |
| R-I | Không đủ điều kiện | Mục 3 |
| R-J | Rời màn đã sửa | Dialog rời màn |

## 7. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `operations.rescheduleScreen.title` | Đổi lịch buổi học | Reschedule session |
| `operations.rescheduleScreen.newSchedule` | Lịch mới | New schedule |
| `operations.rescheduleScreen.date` | Ngày | Date |
| `operations.rescheduleScreen.start` | Bắt đầu | Start |
| `operations.rescheduleScreen.end` | Kết thúc | End |
| `operations.rescheduleScreen.timeFormat` | Nhập giờ theo dạng HH:mm. | Enter the time as HH:mm. |
| `operations.rescheduleScreen.duration` | Thời lượng {{minutes}} phút | Duration {{minutes}} min |
| `operations.rescheduleScreen.durationBefore` | (trước đây {{minutes}} phút) | (was {{minutes}} min) |
| `operations.rescheduleScreen.keepTeacher` | Người dạy giữ nguyên. Nếu đổi người, phân công dạy thay sau khi dời. | The teacher stays the same. To change teacher, assign a substitute after rescheduling. |
| `operations.rescheduleScreen.teacher` | Người dạy: {{name}} | Teacher: {{name}} |
| `operations.rescheduleScreen.classUnknown` | Chưa kiểm tra được thời gian của lớp. | Couldn't check the class period. |
| `operations.rescheduleScreen.submit` | Dời buổi | Reschedule |
| `operations.rescheduleScreen.confirmTitle` | Dời buổi học? | Reschedule this session? |
| `operations.rescheduleScreen.from` / `.to` | Từ: {{time}} / Sang: {{time}} | From: {{time}} / To: {{time}} |
| `operations.rescheduleScreen.confirmBody` | Lịch của Mentor và học viên sẽ đổi theo. Nếu học viên có lịch học bù trùng, hệ thống ghi nhận thành xung đột. | The mentor's and students' schedules will change. Any clash with a student's make-up session is recorded as a conflict. |
| `operations.rescheduleScreen.back` | Quay lại | Back |
| `operations.rescheduleScreen.done` | Đã dời buổi sang {{time}} | Session moved to {{time}} |
| `operations.rescheduleScreen.teacherBusy` | {{name}} đang trùng lịch hoặc nghỉ trong giờ này. Chọn giờ khác. | {{name}} has a clash or leave at this time. Choose another time. |
| `operations.rescheduleScreen.past` | Buổi này đã qua giờ học nên không dời được. | This session's time has passed, so it can't be rescheduled. |
| `operations.rescheduleScreen.notScheduled` | Chỉ dời được buổi chưa bắt đầu. | Only sessions that haven't started can be rescheduled. |

## 8. Accessibility

- Ô ngày là nút, đọc "Ngày, thứ Tư 11 tháng 11 năm 2026, mở lịch".
- Hai ô giờ dùng `numeric` keyboard, nhãn đầy đủ; lỗi đọc ngay khi bấm gửi.
- Calendar: ngày ngoài giới hạn có trạng thái disabled, không chỉ mờ.
- Màn 360 hoặc font 1.3: hai ô giờ xuống hai hàng.

## 9. testID

`reschedule-screen`, `reschedule-back`, `reschedule-summary`, `reschedule-open-calendar`, `reschedule-calendar-sheet`, `reschedule-calendar`, `reschedule-date-error`, `reschedule-start`, `reschedule-end`, `reschedule-time-error`, `reschedule-duration`, `reschedule-keep-teacher`, `reschedule-class-unknown`, `reschedule-reason`, `reschedule-reason-error`, `reschedule-submit`, `reschedule-confirm`, `reschedule-confirm-from`, `reschedule-confirm-to`, `reschedule-confirm-submit`, `reschedule-intent-banner`, `reschedule-resend`, `reschedule-error`, `reschedule-retry`, `reschedule-blocked`, `reschedule-denied`, `reschedule-not-found`.

## 10. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P5-S2-01 | SCHEDULED tương lai | Mở | Gọi context + lớp; ba ô đúng giờ VN; nút khóa |
| TC-P5-S2-02 | Thiết bị khác timezone | Mở | Ô vẫn theo giờ VN |
| TC-P5-S2-03 | Lớp có `endDate` | Mở Calendar | Ngày sau `endDate` và ngày trước hôm nay bị khóa |
| TC-P5-S2-04 | Lớp tải lỗi | Xem | Có `reschedule-class-unknown`; form dùng được |
| TC-P5-S2-05 | | Đổi ngày | Nút bật; thời lượng giữ nguyên |
| TC-P5-S2-06 | | Đổi giờ kết thúc | Thời lượng mới + "(trước đây 90 phút)" |
| TC-P5-S2-07 | | Đổi rồi đổi về như cũ | Nút khóa lại |
| TC-P5-S2-08 | `end <= start` | Gửi | `timeRange`; không có dialog |
| TC-P5-S2-09 | `start <= asOf` | Gửi | `startPast`; không có request |
| TC-P5-S2-10 | Lý do trống | Gửi | `reasonRequired`; focus ô lý do |
| TC-P5-S2-11 | Giờ "25:00" | Gửi | `timeFormat` |
| TC-P5-S2-12 | Hợp lệ | Gửi | Dialog có đúng Từ/Sang |
| TC-P5-S2-13 | Xác nhận | Xem body | `startsAt`, `endsAt` có `+07:00`; `reason`; `expectedVersion`; **không có `title`**; UUID v4 |
| TC-P5-S2-14 | | Double tap | Đúng 1 request |
| TC-P5-S2-15 | 200 | Xem | Toast theo response; về chi tiết buổi với giờ mới; chi tiết lớp được invalidate |
| TC-P5-S2-16 | Mất response | Gửi lại | Khóa form; cùng key, body, version |
| TC-P5-S2-17 | 409 version | Xem | Lịch đang nhập giữ; Summary cập nhật; không tự gửi; lần sau key, version mới |
| TC-P5-S2-18 | 409 `SESSION_STATE_CONFLICT` | Xem | `notScheduled`; không có Alert version |
| TC-P5-S2-19 | 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` | Xem | `teacherBusy` có tên; form giữ |
| TC-P5-S2-20 | Sau -19 | Đổi giờ, gửi | Key mới |
| TC-P5-S2-21 | 409 `CLASS_SESSION_OVERLAP` | Xem | `overlap` |
| TC-P5-S2-22 | 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | Xem | `placements` |
| TC-P5-S2-23 | 422 `CLASS_SESSION_OUTSIDE_CLASS_PERIOD` | Xem | `outsidePeriod` tại ô ngày |
| TC-P5-S2-24 | SCHEDULED, `startsAt <= asOf` | Mở | `reschedule-blocked` `past`; không có form |
| TC-P5-S2-25 | IN_PROGRESS, COMPLETED, CANCELLED | Mở | `reschedule-blocked` `notScheduled` |
| TC-P5-S2-26 | Lớp COMPLETED | Mở | `classClosed` |
| TC-P5-S2-27 | 403 khi có form | Gửi | Xóa form; `reschedule-denied` |
| TC-P5-S2-28 | Offline có dữ liệu | Xem | Sửa được; khóa nút; không "Thử lại" |
| TC-P5-S2-29 | Đã sửa | Back | Dialog rời màn |

Ứng viên Maestro E2E: TC-P5-S2-01, -05, -12, -13, -15, -17, -19, -24. Thêm: đăng nhập Mentor của buổi, lịch ngày cũ không còn buổi, lịch ngày mới có buổi.
