# P1-S1 — mentor-schedule · Lịch dạy theo tuần

Ngày: 31/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-01, BR-TEACH-02, BR-TIME-01; UC-M-02. Endpoint tham chiếu: `GET /mentor/schedule` (`from`, `to`, `page`, `pageSize`); tên lớp qua `GET /mentor/classes` (G-01).

## 1. Mục tiêu

Mentor xem các buổi mình đang là người dạy theo từng tuần, phân biệt dạy chính và dạy thay, rồi mở đúng buổi. Danh sách do server quyết định theo effective mentor. App không tự lọc thêm.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Lịch dạy         Hôm nay ▓│  nút text trên nền brand
│▓    Tháng 11/2026            ▓│
│▓   ‹   02/11 – 08/11/2026  › ▓│
│▓ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐▓│
│▓ │T2││T3││T4││T5││T6││T7││CN│▓│  WeekStrip
│▓ │02││03││04││05││06││07││08│▓│
│▓ │• ││  ││• ││  ││• ││  ││  │▓│  chấm = có buổi
│▓ └──┘└──┘└──┘└──┘└──┘└──┘└──┘▓│
├──────────────────────────────┤
│ THỨ HAI, 02/11               │  nhãn nhóm
│ ┌──────────────────────────┐ │
│ │ 18:30–20:00  [Theo lịch]  │ │  giờ 15/600, chip trạng thái
│ │ Buổi 8: Line graphs       │ │  tiêu đề 14/500, tối đa 2 dòng
│ │ IELTS Foundation K12      │ │  tên lớp 13 secondary, có thể ẩn
│ │ [Dạy chính]             › │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- `Screen` biến thể `app`, header và panel theo [P0-S4 mục 3](../../foundation-auth/settings/design.md).
- **Tiêu đề phụ:** tháng của ngày đang chọn. Tuần nằm giữa hai tháng vẫn lấy theo ngày đang chọn.
- **Nút "Hôm nay":** chỉ hiện khi ngày đang chọn khác hôm nay.
- **Hàng đổi tuần:** nút `chevron_left`/`chevron_right` 44px nền trong suốt, pressed `--mdy-white-a24`; khoảng ngày 14/600 `--mdy-on-brand` căn giữa.
- **`WeekStrip`:** lưới 7 cột gap 4, ô cao `--mdy-size-day` 64, radius 18. Ở màn rộng 360 mỗi bước ô (ô + gap) đạt khoảng 47px.
  - Thường: chữ `--mdy-on-brand`.
  - Hôm nay: nền `--mdy-white-a14`.
  - Đang chọn: nền `--mdy-surface` cố định #fff ở cả hai theme, chữ `--mdy-brand-900`.
  - Thứ 11/500, ngày 16/600, chấm tròn 5px.
- **Thẻ buổi:** `GlassCard pressable` padding 16, gap 8, pressed scale .99, gap giữa thẻ 12. Bấm → S4 với `sessionId` và `classTitle` nếu tra được tên lớp.
- Buổi CANCELLED nếu server trả về thì vẫn hiện: tiêu đề màu `--mdy-text-secondary`, vẫn bấm được. Buổi hủy trước khi bắt đầu không có trong response (G-09).
- Dưới danh sách có dòng múi giờ khi máy khác +07:00 (phase mục 7).

## 3. Dữ liệu và hành vi

| Nội dung | Nguồn | Ghi chú |
| --- | --- | --- |
| Giờ | `startsAt`, `endsAt` | Theo Asia/Ho_Chi_Minh |
| Tiêu đề | `title` | |
| Tên lớp | `name` của lớp có `id` = `classId` trong `GET /mentor/classes` | Không tra được hoặc request tra lỗi thì ẩn dòng, không hiện id, không làm màn lỗi (G-01) |
| Chip trạng thái | `status` | Phase mục 8 |
| Chip dạy chính/thay | `assignmentType` | Phase mục 8 |

- **Khoảng tuần:** thứ Hai 00:00 đến thứ Hai tuần sau 00:00 giờ Việt Nam, gửi dạng ISO có offset, ví dụ `from=2026-11-02T00:00:00+07:00`, `to=2026-11-09T00:00:00+07:00`.
- **Tải đủ tuần:** dùng `pageSize` 100, tự tải tiếp đến khi đủ `total`, vì chấm trên `WeekStrip` phải đúng cho cả tuần. Không hiện nút tải thêm.
- **Xếp ngày:** theo `startsAt` đổi sang giờ Việt Nam. Server có thể trả buổi chồng biên tuần; buổi có ngày ngoài tuần đang xem thì không hiện trong tuần này.
- **Thứ tự trong ngày:** theo thứ tự server, `startsAt` tăng dần.
- **Mở lần đầu:** chọn hôm nay theo giờ Việt Nam, kể cả khi múi giờ máy khác.
- **Đổi tuần:** `WeekStrip` đổi ngay vì tính cục bộ, danh sách hiện skeleton, giữ đúng thứ đang chọn. Nếu về đúng tuần hiện tại thì chọn hôm nay. Bấm nhanh nhiều lần: chỉ hiện kết quả của tuần cuối cùng.
- **Chọn ngày:** đổi danh sách ngay, không gọi API. Chuyển danh sách fade `--mdy-dur-fast`.
- Không có chọn tháng, không có vuốt đổi tuần.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S1-A | Đang tải | `WeekStrip` đủ ngày, chưa có chấm; panel `SkeletonList` 3 thẻ |
| S1-B | Có buổi trong ngày | Mục 2 |
| S1-C | Tuần có buổi, ngày đang chọn trống | Nhãn nhóm + chữ căn giữa "Không có buổi dạy trong ngày này." |
| S1-D | Cả tuần trống hoặc mentor không có assignment | `StatusBlock` icon `event_busy` "Không có buổi dạy trong tuần này"; khi không ở tuần hiện tại có nút secondary "Về hôm nay" |
| S1-E | Offline/timeout/5xx/sai định dạng, chưa có dữ liệu | `StatusBlock` + "Thử lại"; `WeekStrip` vẫn dùng được |
| S1-F | Như S1-E, đã có dữ liệu tuần đó | Giữ dữ liệu + `InlineAlert` warning |
| S1-G | 401 | Về Login theo P0 |
| S1-H | 403 | Xóa dữ liệu; `StatusBlock` không quyền; "Quay lại" về Trang chủ |
| Conflict | Không áp dụng | Màn chỉ đọc |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.schedule.title` | Lịch dạy | Teaching schedule |
| `teaching.schedule.month` | Tháng {{month}}/{{year}} | {{monthName}} {{year}} |
| `teaching.schedule.today` | Hôm nay | Today |
| `teaching.schedule.prevWeek` / `.nextWeek` | Tuần trước / Tuần sau | Previous week / Next week |
| `teaching.schedule.emptyDay` | Không có buổi dạy trong ngày này. | No sessions on this day. |
| `teaching.schedule.emptyWeek` | Không có buổi dạy trong tuần này | No sessions this week |
| `teaching.schedule.backToToday` | Về hôm nay | Back to today |
| `teaching.schedule.dayA11y` | {{day}}, {{count}} buổi | {{day}}, {{count}} sessions |
| `teaching.denied.title` / `.body` | Không có quyền xem / Tài khoản của bạn không còn quyền xem nội dung này. | No access / Your account no longer has access to this content. |
| `common.back` / `common.retry` | Quay lại / Thử lại | Back / Try again |
| `teaching.refreshFailed` | Chưa cập nhật được. Đang hiện dữ liệu đã tải trước đó. | Couldn't refresh. Showing previously loaded data. |

## 6. Accessibility

- Ô ngày `accessibilityRole="radio"`, `accessibilityState.selected`, label đầy đủ: "Thứ Hai 02/11, 2 buổi", thêm "Hôm nay" nếu đúng. Chấm không được focus riêng.
- Thẻ buổi đọc thành một cụm: "18:30 đến 20:00, Buổi 8: Line graphs, IELTS Foundation K12, Theo lịch, Dạy chính".
- Đổi tuần thông báo qua `announceForAccessibility` khoảng ngày mới.
- Phóng chữ: hàng ngày giữ 7 cột, `maxFontSizeMultiplier` 1.3; thẻ buổi không giới hạn.

## 7. testID

`schedule-screen`, `schedule-back-button`, `schedule-today-button`, `schedule-prev-week`, `schedule-next-week`, `schedule-week-range`, `schedule-day-<YYYY-MM-DD>`, `schedule-day-dot-<YYYY-MM-DD>`, `schedule-session-<sessionId>`, `schedule-session-class-<sessionId>`, `schedule-empty-day`, `schedule-empty-week`, `schedule-error`, `schedule-retry`, `schedule-denied`, `schedule-refresh-alert`, `schedule-timezone-note`.

## 8. Test case

Mốc giả định: 02/11/2026 là thứ Hai.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S1-01 | Now 2026-11-02T03:00:00Z | Mở màn | Gọi `from=2026-11-02T00:00:00+07:00`, `to=2026-11-09T00:00:00+07:00`; chọn ô 02/11; nút "Hôm nay" ẩn |
| TC-P1-S1-02 | Now 2026-11-01T17:30:00Z, máy ở America/Los_Angeles | Mở màn | Chọn thứ Hai 02/11 (giờ VN là 00:30), không chọn ngày theo múi giờ máy; có `schedule-timezone-note` |
| TC-P1-S1-03 | Máy ở +07:00 | Mở màn | Không có `schedule-timezone-note` |
| TC-P1-S1-04 | Buổi `startsAt` 2026-11-08T17:30:00Z | Xem tuần 02–08/11, rồi sang tuần sau | Không nằm trong ngày 08/11; nằm ở ngày 09/11 của tuần sau |
| TC-P1-S1-05 | Buổi PRIMARY và SUBSTITUTE cùng ngày | Xem danh sách | Chip "Dạy chính" và "Dạy thay" đúng từng buổi |
| TC-P1-S1-06 | Đủ 4 trạng thái buổi | Xem danh sách | Nhãn đúng phase mục 8; buổi SCHEDULED đã qua giờ vẫn "Theo lịch" |
| TC-P1-S1-07 | Buổi có `classId` tra được | Xem thẻ | Có `schedule-session-class-<id>` với đúng tên lớp |
| TC-P1-S1-08 | Buổi có `classId` không tra được, hoặc `GET /mentor/classes` lỗi | Xem thẻ | Không có dòng tên lớp, không hiện id; không có lỗi màn; thẻ vẫn bấm được |
| TC-P1-S1-09 | Có buổi ngày 02/11 | Bấm thẻ | Mở S4 đúng `sessionId` |
| TC-P1-S1-10 | Tuần có `total` = 130 | Mở màn | Tự tải đủ 2 trang; chấm đúng cả tuần; không trùng item |
| TC-P1-S1-11 | Đang ở thứ Tư | Bấm `schedule-next-week` | Sang tuần sau, vẫn chọn thứ Tư; hiện skeleton; nút "Hôm nay" hiện |
| TC-P1-S1-12 | Response tuần A về sau tuần B | Bấm nhanh 2 lần | Danh sách và chấm thuộc tuần B |
| TC-P1-S1-13 | Tuần có buổi, ngày chọn trống | Chọn ngày trống | `schedule-empty-day`, không gọi API thêm |
| TC-P1-S1-14 | Tuần trống, không phải tuần hiện tại | Xem | `schedule-empty-week` có nút "Về hôm nay"; bấm về đúng tuần có hôm nay |
| TC-P1-S1-15 | Mentor không có assignment | Mở màn | `schedule-empty-week`, không hiện lỗi |
| TC-P1-S1-16 | Mất mạng lần đầu | Mở màn, bấm "Thử lại" khi có mạng | `schedule-error` rồi hiện dữ liệu; không dùng mock |
| TC-P1-S1-17 | 500 requestId "req-9", đã có dữ liệu tuần | Kéo làm mới | Giữ dữ liệu; `schedule-refresh-alert` kèm "Mã hỗ trợ: req-9" |
| TC-P1-S1-18 | Response thiếu `startsAt` | Mở màn | Lỗi sai định dạng; không crash |
| TC-P1-S1-19 | Status lạ từ server | Mở màn | Lỗi sai định dạng, không có nhãn dự phòng |
| TC-P1-S1-20 | 403 khi đã có dữ liệu | Kéo làm mới | Không còn thẻ buổi trên màn; `schedule-denied` |
| TC-P1-S1-21 | 401, refresh thất bại | Kéo làm mới | Về Login theo P0; không còn dữ liệu lịch |
| TC-P1-S1-22 | Buổi bị thu hồi sau khi tải danh sách | Bấm thẻ cũ | S4 hiện trạng thái không quyền; quay lại thì danh sách refetch và buổi biến mất |
| TC-P1-S1-23 | en, theme tối | Xem màn | Chữ tiếng Anh, thứ Mon → Sun; ô đang chọn vẫn nền trắng |
| TC-P1-S1-24 | Bật đọc màn hình | Focus ô ngày | Đọc "Thứ Hai 02/11, 2 buổi", trạng thái đang chọn đúng |

Ứng viên Maestro E2E: TC-P1-S1-01, -05, -09, -11, -15 (Mentor C), -22.
