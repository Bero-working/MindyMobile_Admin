# P5-S3 — replacement-session · Hủy buổi và tạo buổi thay thế

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-OPS-01, BR-MAKEUP-01; UC-MG-07. Endpoint tham chiếu: `POST /management/class-sessions/:sessionId/cancel`, `POST /management/class-sessions/:sessionId/makeups`; đọc `GET /class-sessions/:id/context`, `GET /manager/classes/:classId`.

## 1. Mục tiêu

Quản lý hủy một buổi và, nếu cần, tạo buổi thay thế từ buổi đã hủy mới nhất. Buổi cũ giữ nguyên lịch sử và điểm danh; buổi mới không chép điểm danh hay giờ thực tế (BR-MAKEUP-01). Phạm vi tác động phải được xác nhận trước khi hủy.

**Hai request riêng.** Hủy và tạo thay thế là hai giao dịch, mỗi bước có key, version và lý do riêng. Hủy xong chưa tạo được thay thế thì buổi vẫn ở trạng thái đã hủy, và màn phải nói rõ điều đó.

[H] có mục "Hủy buổi học" và "Tạo buổi bù", không có form. Bố cục ghép từ token và thành phần có sẵn.

## 2. Màn theo trạng thái

Một route. Nội dung chọn theo `status` đọc từ context:

| `status` | Nội dung |
| --- | --- |
| SCHEDULED, IN_PROGRESS | Bước 1 — Hủy buổi (mục 3) |
| CANCELLED, lớp OPEN hoặc IN_PROGRESS | Bước 2 — Tạo thay thế (mục 4) |
| CANCELLED, lớp khác | `StatusBlock` "Lớp không còn mở nên không tạo được buổi thay thế." |
| COMPLETED | `StatusBlock` "Buổi đã hoàn tất nên không hủy được." |

Khi đi từ Bước 1 sang Bước 2 trên cùng màn, có thanh hai bước ở đầu nội dung: "1 Hủy buổi ✓ — 2 Buổi thay thế". Mở thẳng buổi đã hủy thì không có thanh này.

## 3. Bước 1 — Hủy buổi

```
┌──────────────────────────────┐
│▓ ←  Hủy buổi học             ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ Buổi 8: Line graphs [Sắp tới]│  SessionSummary
│ T2, 09/11/2026 · 18:30–20:00 │
│ Người dạy: Trần Mai          │
│                              │
│ PHẠM VI TÁC ĐỘNG             │
│ ┌──────────────────────────┐ │
│ │ 👥 18 học viên trong      │ │  chỉ khi có nguồn
│ │    danh sách của buổi    │ │
│ │ 📅 Buổi chuyển sang Đã    │ │
│ │    hủy, không diễn ra nữa│ │
│ │ ↺ Không hoàn tác được.    │ │
│ │    Có thể tạo buổi thay  │ │
│ │    thế ở bước sau        │ │
│ └──────────────────────────┘ │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
│                      0/1000  │
├──────────────────────────────┤
│ ( Hủy buổi )                 │  danger, dính đáy
└──────────────────────────────┘
```

**Số học viên** tải riêng một request, không chặn màn:

| `status` | Nguồn | Hiển thị |
| --- | --- | --- |
| SCHEDULED | `GET attendance-candidates?page=1&pageSize=1`, đọc `total` | "{n} học viên dự kiến của buổi" |
| IN_PROGRESS | `GET attendance?page=1&pageSize=1`, đọc `totals` | "{eligible} học viên trong danh sách · {present} có mặt · {absent} vắng" |
| Đang tải | | Skeleton một dòng |
| Lỗi, 422 | | **Ẩn dòng**. Không hiện 0 |

**Riêng IN_PROGRESS** thêm `Alert` warning trên phạm vi tác động: "Buổi đang diễn ra. Điểm danh đã lưu vẫn được giữ, nhưng buổi sẽ dừng ngay." Sau khi hủy, Quản lý vẫn sửa được điểm danh của buổi đã start qua P2.

Bấm "Hủy buổi": lý do trống thì báo lỗi tại chỗ. Hợp lệ thì mở `ConfirmationDialog` icon `event_busy`, tiêu đề "Hủy buổi này?", thân "{tiêu đề} · {ngày giờ}. Thao tác này không hoàn tác được.", nút "Hủy buổi" (danger) và "Quay lại". **Nút "Quay lại" không dùng chữ "Hủy"** để khỏi nhầm.

Body: `{ reason, expectedVersion }`.

| Kết quả | Hành vi |
| --- | --- |
| 200 | Đóng dialog; sang Bước 2 trên cùng màn; `Alert` success "Đã hủy buổi học."; `version` lấy từ response; invalidate theo phase mục 8.1 |
| Chưa rõ | `IntentBanner`; khóa form; "Gửi lại" cùng key, body, version |
| 409 `SESSION_VERSION_CONFLICT` | Phase mục 5.1; lý do giữ; phải xác nhận lại |
| 409 `SESSION_STATE_CONFLICT` | Tải lại rồi chuyển nhánh mục 2 |
| 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | `operations.placements`. Chưa hủy; có lối tới P4-S6 khi P4 đã có (G-P5-14) |
| 409 `CLASS_NOT_EDITABLE` | Chặn, `classClosed` |
| 403 / 401 / 404 / 5xx | Phase mục 5.1 |
| Offline | Khóa nút; "Cần kết nối mạng" |

## 4. Bước 2 — Tạo buổi thay thế

```
┌──────────────────────────────┐
│▓ ←  Tạo buổi thay thế        ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ 1 Hủy buổi ✓ ── 2 Buổi thay thế│ khi đi từ Bước 1
│ ✓ Đã hủy buổi học.           │
│ Thay cho: Buổi 8 [Đã hủy]    │
│ T2, 09/11/2026 · 18:30–20:00 │
│                              │
│ Tên buổi *                   │
│ ┌──────────────────────────┐ │
│ │ Buổi 8: Line graphs      │ │  điền sẵn tên buổi cũ
│ └──────────────────────────┘ │
│ Ngày *                       │
│ ┌──────────────────────────┐ │
│ │ 📅 Chọn ngày             │ │  KHÔNG điền sẵn
│ └──────────────────────────┘ │
│ ┌───────────┐ ┌───────────┐  │
│ │ Bắt đầu * │ │ Kết thúc  │  │  kết thúc chỉ đọc
│ │ --:--     │ │ --:--     │  │
│ └───────────┘ └───────────┘  │
│ Giữ thời lượng 90 phút       │
│ ⓘ Do Trần Mai (mentor chính) │
│   dạy. Không chép điểm danh  │
│   và giờ thực tế của buổi cũ.│
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ( Tạo buổi thay thế ) Để sau │
└──────────────────────────────┘
```

- **Ngày và giờ bắt đầu không điền sẵn:** buổi thay thế phải là giờ người dùng chủ động chọn.
- **Giờ kết thúc chỉ đọc** = giờ bắt đầu + thời lượng buổi cũ, vì backend bắt buộc giữ thời lượng. Vượt qua 24:00 thì báo lỗi `timeRange` tại ô bắt đầu, không gửi.
- Tên buổi điền sẵn tên cũ, sửa được, 1–250 ký tự sau trim.
- Lý do: đi từ Bước 1 thì điền sẵn lý do hủy và sửa được. Mở thẳng buổi đã hủy thì để trống. Lý do này ghi riêng vào lịch sử của thao tác tạo.
- **Người dạy:** không có ô chọn và không gửi `mentorId`. Buổi mới do mentor chính dạy, kể cả khi buổi cũ có dạy thay (G-P5-07). Sau khi tạo mới phân công dạy thay qua S1. Dòng ⓘ nói rõ điều này.
- Phòng học và link học được backend giữ như buổi cũ; không có ô nhập.
- `minDate`: hôm nay theo `asOf`. **Không giới hạn `maxDate`** vì backend tự kéo dài lớp. Chọn ngày sau `endDate`: dòng info "Lớp sẽ kéo dài đến {ngày}." Không tải được lớp thì bỏ dòng này.

Bấm "Tạo buổi thay thế", kiểm tại chỗ như S2 mục 2.2, rồi mở `ConfirmationDialog` icon `event_repeat`:

- Tiêu đề: "Tạo buổi thay thế?"
- Thân: "{tên} · {ngày giờ}. Thay cho buổi đã hủy ngày {ngày cũ}." Thêm "Lớp sẽ kéo dài đến {ngày}." khi có.
- Nút: "Tạo buổi" / "Quay lại".

Body: `{ classUnitId, title, startsAt, endsAt, reason, expectedVersion }`. `classUnitId` lấy từ context của buổi đã hủy, không có ô nhập. `expectedVersion` là version mới nhất của buổi đã hủy.

| Kết quả | Hành vi |
| --- | --- |
| 201 | Toast "Đã tạo buổi thay thế"; **thay** màn S3 bằng `SessionContext` của `session.sessionId` mới. Back về chi tiết buổi đã hủy. Có `classEndDate` mới thì toast thêm "Lớp kéo dài đến {ngày}." |
| Chưa rõ | `IntentBanner`; khóa form; "Gửi lại" cùng key, body, version |
| 409 `MAKEUP_ALREADY_EXISTS` | Khóa form. `Alert` "Buổi này đã có buổi thay thế. Mở lịch lớp để xem buổi mới nhất." + nút "Xem lịch lớp" mở `ManagerClassDetail` tab Buổi học. Không tạo nhánh từ tổ tiên cũ (G-P5-08) |
| 409 `SESSION_VERSION_CONFLICT` | Phase mục 5.1; form giữ |
| 409 `SESSION_STATE_CONFLICT` | Tải lại rồi chuyển nhánh mục 2 |
| 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` | "{mentor chính} đang trùng lịch hoặc nghỉ trong giờ này. Chọn giờ khác." Form giữ |
| 409 `CLASS_SESSION_OVERLAP` | `overlap` tại ô giờ |
| 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | `placements` |
| 422 `SESSION_START_NOT_FUTURE`, thời gian | Phase mục 5.1 |
| 404 `CLASS_UNIT_NOT_FOUND`, 422 `MAKEUP_DURATION_MISMATCH` | Không xảy ra do client lấy từ buổi cũ. Nếu có: lỗi chung kèm mã hỗ trợ |
| 403 / 401 / 404 / 5xx | Phase mục 5.1 |

**"Để sau"** hiện khi đi từ Bước 1, về chi tiết buổi. Buổi đã hủy vẫn có "Tạo buổi thay thế" ở nhóm điều phối. Có dữ liệu đã nhập: dialog "Thoát mà chưa lưu?". Thân dialog nói rõ thêm "Buổi đã được hủy." để không ai tưởng đang quay lui thao tác hủy.

## 5. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| P-A | Đang tải | Skeleton `SessionSummary` + form |
| P-B | Bước 1 | Mục 3 |
| P-C | Bước 1, IN_PROGRESS | Thêm cảnh báo |
| P-D | Bước 2 sau khi vừa hủy | Mục 4, có thanh bước và thông báo đã hủy |
| P-E | Bước 2, mở thẳng | Mục 4, không có thanh bước |
| P-F | Đã có replacement | `MAKEUP_ALREADY_EXISTS` |
| P-G | Không đủ điều kiện | Mục 2 |
| P-H | Đang gửi | Dialog `busy` |
| P-I | Lỗi mutation | Mục 3, 4 |
| P-J | Tải lỗi | `StatusBlock` + "Thử lại". Lỗi lớp ở Bước 2: bỏ dòng kéo dài, vẫn dùng được form; nhưng không rõ lớp có mở hay không, server quyết định |
| P-K | Rời màn | Dialog rời màn |

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `operations.replacement.cancelTitle` | Hủy buổi học | Cancel session |
| `operations.replacement.scope` | Phạm vi tác động | What this affects |
| `operations.replacement.candidates` | {{count}} học viên dự kiến của buổi | {{count}} students expected |
| `operations.replacement.totals` | {{eligible}} học viên trong danh sách · {{present}} có mặt · {{absent}} vắng | {{eligible}} students on the list · {{present}} present · {{absent}} absent |
| `operations.replacement.scopeSchedule` | Buổi chuyển sang Đã hủy và không diễn ra nữa. | The session becomes Cancelled and won't take place. |
| `operations.replacement.scopeFinal` | Không hoàn tác được. Có thể tạo buổi thay thế ở bước sau. | This can't be undone. You can create a replacement next. |
| `operations.replacement.inProgress` | Buổi đang diễn ra. Điểm danh đã lưu vẫn được giữ, nhưng buổi sẽ dừng ngay. | This session is in progress. Saved attendance is kept, but the session stops now. |
| `operations.replacement.cancelSubmit` | Hủy buổi | Cancel session |
| `operations.replacement.cancelConfirm` | Hủy buổi này? | Cancel this session? |
| `operations.replacement.cancelBody` | {{session}} · {{time}}. Thao tác này không hoàn tác được. | {{session}} · {{time}}. This can't be undone. |
| `operations.replacement.back` | Quay lại | Go back |
| `operations.replacement.cancelled` | Đã hủy buổi học. | Session cancelled. |
| `operations.replacement.stepCancel` / `.stepReplace` | Hủy buổi / Buổi thay thế | Cancel / Replacement |
| `operations.replacement.title` | Tạo buổi thay thế | Create replacement |
| `operations.replacement.source` | Thay cho: {{session}} | Replaces: {{session}} |
| `operations.replacement.name` | Tên buổi | Session name |
| `operations.replacement.nameRequired` | Nhập tên buổi. | Enter a session name. |
| `operations.replacement.pickDate` | Chọn ngày | Choose a date |
| `operations.replacement.dateRequired` | Chọn ngày. | Choose a date. |
| `operations.replacement.keepDuration` | Giữ thời lượng {{minutes}} phút | Keeps the {{minutes}}-minute duration |
| `operations.replacement.noCopy` | Do {{name}} (mentor chính) dạy. Không chép điểm danh và giờ thực tế của buổi cũ. | Taught by {{name}} (primary mentor). Attendance and actual times aren't copied from the old session. |
| `operations.replacement.extend` | Lớp sẽ kéo dài đến {{date}}. | The class will run until {{date}}. |
| `operations.replacement.submit` | Tạo buổi thay thế | Create replacement |
| `operations.replacement.later` | Để sau | Later |
| `operations.replacement.confirmTitle` | Tạo buổi thay thế? | Create replacement? |
| `operations.replacement.confirmBody` | {{session}} · {{time}}. Thay cho buổi đã hủy ngày {{date}}. | {{session}} · {{time}}. Replaces the session cancelled on {{date}}. |
| `operations.replacement.confirmSubmit` | Tạo buổi | Create |
| `operations.replacement.done` | Đã tạo buổi thay thế | Replacement created |
| `operations.replacement.doneExtended` | Lớp kéo dài đến {{date}}. | The class now runs until {{date}}. |
| `operations.replacement.exists` | Buổi này đã có buổi thay thế. Mở lịch lớp để xem buổi mới nhất. | This session already has a replacement. Open the class schedule to see the latest. |
| `operations.replacement.openSchedule` | Xem lịch lớp | View class schedule |
| `operations.replacement.teacherBusy` | {{name}} đang trùng lịch hoặc nghỉ trong giờ này. Chọn giờ khác. | {{name}} has a clash or leave at this time. Choose another time. |
| `operations.replacement.classNotOpen` | Lớp không còn mở nên không tạo được buổi thay thế. | The class isn't open, so a replacement can't be created. |
| `operations.replacement.completed` | Buổi đã hoàn tất nên không hủy được. | This session is complete, so it can't be cancelled. |
| `operations.replacement.leaveNote` | Buổi đã được hủy. | The session has been cancelled. |

## 7. Accessibility

- Thanh bước đọc "Bước 2 trên 2, Buổi thay thế".
- Khi chuyển sang Bước 2: focus vào thông báo "Đã hủy buổi học.", trình đọc màn hình đọc thông báo này.
- Ô kết thúc chỉ đọc có nhãn "Kết thúc, tự tính theo thời lượng".
- Nút danger có chữ rõ, không chỉ dựa vào màu.

## 8. testID

`replacement-screen`, `replacement-back`, `replacement-summary`, `replacement-progress`, `replacement-scope`, `replacement-scope-students`, `replacement-in-progress`, `replacement-cancel-reason`, `replacement-cancel-reason-error`, `replacement-cancel-submit`, `replacement-cancel-confirm`, `replacement-cancel-confirm-submit`, `replacement-cancelled`, `replacement-source`, `replacement-title`, `replacement-title-error`, `replacement-open-calendar`, `replacement-calendar`, `replacement-date-error`, `replacement-start`, `replacement-end`, `replacement-time-error`, `replacement-duration`, `replacement-no-copy`, `replacement-extend`, `replacement-reason`, `replacement-reason-error`, `replacement-submit`, `replacement-later`, `replacement-confirm`, `replacement-confirm-submit`, `replacement-exists`, `replacement-open-schedule`, `replacement-intent-banner`, `replacement-resend`, `replacement-error`, `replacement-retry`, `replacement-blocked`, `replacement-denied`, `replacement-not-found`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P5-S3-01 | SCHEDULED, candidates `total` 18 | Mở | Bước 1; "18 học viên dự kiến"; `pageSize=1` |
| TC-P5-S3-02 | IN_PROGRESS, `totals` 18/10/2 | Mở | Có `replacement-in-progress`; dòng số đúng `totals` |
| TC-P5-S3-03 | Nguồn số học viên lỗi hoặc 422 | Mở | Không có `replacement-scope-students`; **không có số 0**; form dùng được |
| TC-P5-S3-04 | Lý do trống | Hủy buổi | Lỗi; không có dialog, không có request |
| TC-P5-S3-05 | Hợp lệ | Hủy, xác nhận | Dialog nói không hoàn tác; body `reason`, `expectedVersion`; UUID v4 |
| TC-P5-S3-06 | | Double tap | Đúng 1 request |
| TC-P5-S3-07 | 200 | Xem | Sang Bước 2 trên cùng màn; `replacement-cancelled`; attendance, context, lịch lớp được invalidate; **chưa có request makeups** |
| TC-P5-S3-08 | Tiếp -07 | Xem body sau này | `expectedVersion` = `version` trong response hủy |
| TC-P5-S3-09 | Mất response khi hủy | Gửi lại | Khóa form; cùng key, body, version |
| TC-P5-S3-10 | 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | Hủy | `placements`; vẫn ở Bước 1 |
| TC-P5-S3-11 | 409 `SESSION_STATE_CONFLICT` | Hủy | Không hiện Alert version; chuyển nhánh theo trạng thái mới |
| TC-P5-S3-12 | CANCELLED, lớp OPEN | Mở thẳng | Bước 2; không có `replacement-progress`; ngày, giờ bắt đầu, lý do trống; tên đã điền |
| TC-P5-S3-13 | COMPLETED | Mở | `replacement-blocked` `completed` |
| TC-P5-S3-14 | CANCELLED, lớp CANCELLED | Mở | `replacement-blocked` `classNotOpen` |
| TC-P5-S3-15 | Thời lượng cũ 90 phút | Nhập bắt đầu 18:30 | Kết thúc 20:00, chỉ đọc |
| TC-P5-S3-16 | Bắt đầu 23:00, thời lượng 90 phút | Gửi | `timeRange`; không có request |
| TC-P5-S3-17 | Thiếu ngày / giờ / tên / lý do | Gửi | Lỗi đúng ô; focus ô đầu tiên; không có request |
| TC-P5-S3-18 | Chọn ngày sau `endDate` | Xem | Có `replacement-extend`; dialog cũng có |
| TC-P5-S3-19 | Hợp lệ | Xác nhận | Body có `classUnitId` của buổi cũ, `title`, `startsAt`, `endsAt`, `reason`, `expectedVersion`; **không có `mentorId`**, không có trường điểm danh; UUID v4 khác key hủy |
| TC-P5-S3-20 | 201 | Xem | Toast; mở chi tiết buổi mới, status SCHEDULED, không có số điểm danh; Back về buổi đã hủy |
| TC-P5-S3-21 | 201, `classEndDate` mới | Xem | Toast có `doneExtended` |
| TC-P5-S3-22 | 409 `MAKEUP_ALREADY_EXISTS` | Xem | `replacement-exists`; form khóa; `replacement-open-schedule` mở đúng lớp, tab Buổi học; không gọi lại với buổi khác |
| TC-P5-S3-23 | Buổi cũ có dạy thay | Mở Bước 2 | `replacement-no-copy` ghi mentor chính |
| TC-P5-S3-24 | 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` | Xem | `teacherBusy`; form giữ |
| TC-P5-S3-25 | Hủy xong, makeups 5xx | Xem | `IntentBanner`; chữ không nói buổi chưa bị hủy; Back về chi tiết thấy "Đã hủy" |
| TC-P5-S3-26 | Sau hủy | Để sau khi đã nhập | Dialog rời màn có `leaveNote` |
| TC-P5-S3-27 | Sau hủy, Back trên chi tiết | Xem | Có "Tạo buổi thay thế" |
| TC-P5-S3-28 | 403 | Gửi | Xóa form; `replacement-denied` |
| TC-P5-S3-29 | Offline | Xem | Khóa gửi; không "Thử lại" |
| TC-P5-S3-30 | Buổi IN_PROGRESS đã hủy qua S3 | Mở tab Điểm danh P2 | Điểm danh cũ vẫn còn |

Ứng viên Maestro E2E: TC-P5-S3-01, -05, -07, -12, -15, -19, -20, -22, -30. Thêm: đăng nhập mentor chính, buổi mới hiện SCHEDULED trong lịch, buổi cũ không còn hiện như buổi sắp dạy. Backend trả `effectiveMentor` null cho buổi hủy khi chưa start, nên Mentor có thể không thấy buổi đó trong lịch; không kiểm chip "Đã hủy" ở phía Mentor.
