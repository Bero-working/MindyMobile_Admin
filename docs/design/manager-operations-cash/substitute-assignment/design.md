# P5-S1 — substitute-assignment · Phân công và xóa dạy thay theo buổi

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-01, BR-TEACH-03, BR-OPS-01; UC-MG-08. Endpoint tham chiếu: `GET /management/class-sessions/:sessionId/available-mentors`, `PATCH /management/class-sessions/:sessionId/mentor`.

## 1. Mục tiêu

Quản lý chọn người dạy thay cho **một buổi chưa bắt đầu**, hoặc trả buổi về mentor chính, luôn kèm lý do. Không đổi mentor chính của lớp (Q-CLASS-02), không đụng buổi đã bắt đầu (Q-P5-01).

## 2. Bố cục

Dựa trên sheet "Phân công dạy thay" của [H], chuyển thành màn riêng vì có ô tìm, danh sách phân trang và ô lý do.

```
┌──────────────────────────────┐
│▓ ←  Phân công dạy thay       ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ Buổi 8: Line graphs [Sắp tới]│  SessionSummary
│ T2, 09/11/2026 · 18:30–20:00 │
│ Đang dạy: Lê Hoàng [Dạy thay]│
│ Mentor chính: Trần Mai       │
│ ( ⊖ Trả về mentor chính )    │  chỉ khi SUBSTITUTE
│                              │
│ 🔍 Tìm theo tên mentor       │
│ MENTOR RẢNH · 12             │
│ ⓘ Đã loại mentor trùng lịch  │
│   hoặc nghỉ trong giờ này.   │
│ ┌──────────────────────────┐ │
│ │ (LH) Lê Hoàng  [Đang dạy]│ │  không chọn được
│ │ (NA) Ngô An             ◉│ │
│ │ (PB) Phạm Bình          ○│ │
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
│                      0/1000  │
├──────────────────────────────┤
│ ( Phân công )                │  dính đáy
└──────────────────────────────┘
```

- Tìm gọi server với `search`, trim, tối đa 100 ký tự, debounce 300 ms, về trang 1. Đổi từ khóa: skeleton danh sách, không hiện kết quả cũ. Không lọc trên trang đã tải.
- Số "12" là `total` của query đang hiện. Khi đang tìm: "Kết quả · {total}".
- Giữ thứ tự server: theo tên. `pageSize` 20, nút "Xem thêm"; lỗi tải thêm thử lại đúng trang và giữ các hàng.
- Hàng `isCurrent`: chip "Đang dạy", không chọn được. Hàng còn lại là radio, vùng chạm cả hàng, cao tối thiểu 56.
- Đổi từ khóa hoặc trang **giữ người đã chọn** ở một dòng dưới ô tìm: "Đã chọn: Ngô An". Người đó có thể không nằm trong kết quả tìm mới.
- Người dạy hiện tại có thể không có trong danh sách: họ đang trùng lịch hoặc vừa nghỉ. Không thêm tay vào danh sách; dòng "Đang dạy" trong `SessionSummary` vẫn đúng.
- Danh sách mentor là ảnh chụp, không bảo đảm ghi thành công (BR-TEACH-03). Có dòng "Kiểm tra lúc {HH:mm}" 12 dưới tiêu đề nhóm, lấy từ `asOf`.

## 3. Điều kiện vào màn

Màn đọc lại context khi mở, không tin params.

| Trạng thái buổi | Hiển thị |
| --- | --- |
| SCHEDULED, `startsAt > asOf` | Mục 2 |
| SCHEDULED, `startsAt <= asOf` | `StatusBlock` "Buổi này đã qua giờ học nên không phân công được." |
| IN_PROGRESS | `StatusBlock` "Buổi đã bắt đầu nên người dạy đã được chốt." |
| COMPLETED, CANCELLED | `StatusBlock` "Buổi này không còn phân công được." |
| Lớp COMPLETED, CANCELLED (candidates trả 409 `CLASS_NOT_EDITABLE`) | `StatusBlock` "Lớp đã kết thúc hoặc đã hủy nên không đổi được buổi này." |

Candidates chỉ gọi khi buổi đủ điều kiện. Không gọi `PATCH` ở các nhánh chặn.

## 4. Phân công

Bấm "Phân công" khi đã chọn mentor và có lý do. Thiếu: lỗi tại chỗ, focus ô lỗi đầu tiên, không mở dialog. Thiếu mentor: "Chọn một mentor."

`ConfirmationDialog` icon `swap_horiz`:

- Tiêu đề: "Phân công {tên} dạy thay?"
- Thân: "{tiêu đề buổi} · {ngày giờ}. Thay {người đang dạy}. Mentor chính của lớp giữ nguyên."
- Nút: "Phân công" (primary) / "Quay lại".

Body: `{ mentorId, reason, expectedVersion }`, `expectedVersion` lấy `sessionVersion` của candidates. **Không lấy từ context** khi hai giá trị lệch: lệch tức là có thay đổi giữa hai lần đọc, nên tải lại cả hai trước khi cho gửi.

## 5. Trả về mentor chính

Nút `substitute-clear`, variant secondary, icon `person_remove`, chỉ hiện khi `assignmentType` = SUBSTITUTE. Không cần chọn trong danh sách. Bấm mở `Sheet`:

```
│ Trả về mentor chính          │
│ Buổi 8 · T2, 09/11 · 18:30   │
│ Lê Hoàng sẽ không dạy buổi   │
│ này. Trần Mai dạy lại.       │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ └──────────────────────────┘ │
│ ( Xác nhận )  Quay lại       │
```

Lý do trong sheet tách khỏi ô lý do của màn. Body: `{ mentorId: null, reason, expectedVersion }`.

## 6. Kết quả

| Kết quả | Hành vi |
| --- | --- |
| 200 | Toast "Đã phân công {tên} dạy thay" hoặc "Đã trả buổi về mentor chính"; về chi tiết buổi; invalidate theo phase mục 8.1. Tên lấy từ `effectiveMentor` của response |
| Chưa rõ | `IntentBanner` trên đầu màn; khóa danh sách và lý do; "Gửi lại" cùng key, body, version |
| 409 `SESSION_VERSION_CONFLICT` | Phase mục 5.1; tải lại context và candidates; **giữ lý do, bỏ lựa chọn** nếu người đó không còn trong trang 1 |
| 409 `SESSION_STATE_CONFLICT` | Chuyển sang nhánh tương ứng ở mục 3 |
| 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` | Tải lại candidates; bỏ lựa chọn; Alert "Mentor này vừa trùng lịch hoặc nghỉ trong giờ này. Chọn người khác." Khi đang trả về mentor chính: "Mentor chính đang trùng lịch hoặc nghỉ trong giờ này nên chưa trả về được." và giữ sheet |
| 422 `CLASS_MENTOR_NOT_ELIGIBLE` | Phase mục 5.1 |
| 403 / 401 / 404 / 5xx | Phase mục 5.1 |
| Offline | Danh sách đã tải vẫn xem được; tìm và gửi khóa; "Cần kết nối mạng" |

Sau khi thành công, lịch sử `teachingMentorId` không đổi vì buổi chưa start. Lịch Mentor cũ và mới cập nhật theo phase mục 8.1.

## 7. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| A-A | Đang tải | Skeleton `SessionSummary` + 4 hàng |
| A-B | Có dữ liệu | Mục 2 |
| A-C | `total` = 0, không tìm | Icon `info`, "Không có mentor nào rảnh trong giờ này." Vẫn còn nút trả về nếu đang có dạy thay |
| A-D | `total` = 0, đang tìm | "Không tìm thấy mentor nào." Không phải lỗi |
| A-E | Đã chọn, đang gửi | Dialog `busy` |
| A-F | Lỗi mutation | Mục 6 |
| A-G | Tải lỗi lần đầu / làm mới lỗi / tải thêm lỗi | `StatusBlock` / `Alert` giữ dữ liệu / thử lại đúng trang |
| A-H | Buổi không đủ điều kiện | Mục 3 |
| A-I | Rời màn đã chọn hoặc đã gõ | Dialog rời màn |

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `operations.substitute.title` | Phân công dạy thay | Assign substitute |
| `operations.substitute.current` | Đang dạy: {{name}} | Teaching: {{name}} |
| `operations.substitute.primary` | Mentor chính: {{name}} | Primary mentor: {{name}} |
| `operations.substitute.search` | Tìm theo tên mentor | Search by mentor name |
| `operations.substitute.available` | Mentor rảnh · {{count}} | Available mentors · {{count}} |
| `operations.substitute.results` | Kết quả · {{count}} | Results · {{count}} |
| `operations.substitute.basis` | Đã loại mentor trùng lịch hoặc nghỉ trong giờ này. | Mentors with a clash or leave at this time are excluded. |
| `operations.substitute.checkedAt` | Kiểm tra lúc {{time}} | Checked at {{time}} |
| `operations.substitute.isCurrent` | Đang dạy | Teaching |
| `operations.substitute.selected` | Đã chọn: {{name}} | Selected: {{name}} |
| `operations.substitute.selectRequired` | Chọn một mentor. | Choose a mentor. |
| `operations.substitute.submit` | Phân công | Assign |
| `operations.substitute.confirmTitle` | Phân công {{name}} dạy thay? | Assign {{name}} as substitute? |
| `operations.substitute.confirmBody` | {{session}} · {{time}}. Thay {{current}}. Mentor chính của lớp giữ nguyên. | {{session}} · {{time}}. Replaces {{current}}. The class's primary mentor stays the same. |
| `operations.substitute.back` | Quay lại | Back |
| `operations.substitute.assigned` | Đã phân công {{name}} dạy thay | {{name}} assigned as substitute |
| `operations.substitute.clear` | Trả về mentor chính | Return to primary mentor |
| `operations.substitute.clearBody` | {{current}} sẽ không dạy buổi này. {{primary}} dạy lại. | {{current}} will no longer teach this session. {{primary}} will teach it. |
| `operations.substitute.clearSubmit` | Xác nhận | Confirm |
| `operations.substitute.cleared` | Đã trả buổi về mentor chính | Session returned to primary mentor |
| `operations.substitute.mentorBusy` | Mentor này vừa trùng lịch hoặc nghỉ trong giờ này. Chọn người khác. | This mentor now has a clash or leave at this time. Choose someone else. |
| `operations.substitute.primaryBusy` | Mentor chính đang trùng lịch hoặc nghỉ trong giờ này nên chưa trả về được. | The primary mentor has a clash or leave at this time, so the session can't be returned yet. |
| `operations.substitute.ineligible` | Mentor này không còn nhận lớp. | This mentor is no longer available for classes. |
| `operations.substitute.empty` | Không có mentor nào rảnh trong giờ này. | No mentors are available at this time. |
| `operations.substitute.noResult` | Không tìm thấy mentor nào. | No mentors found. |
| `operations.substitute.past` | Buổi này đã qua giờ học nên không phân công được. | This session's time has passed, so it can't be assigned. |
| `operations.substitute.started` | Buổi đã bắt đầu nên người dạy đã được chốt. | The session has started, so its teacher is set. |
| `operations.substitute.closed` | Buổi này không còn phân công được. | This session can no longer be assigned. |

## 9. Accessibility

- Danh sách là `radiogroup`, hàng đọc "Ngô An, chưa chọn". Hàng đang dạy đọc "Lê Hoàng, đang dạy, không chọn được".
- Kết quả tìm mới đọc số kết quả qua live region.

## 10. testID

`substitute-screen`, `substitute-back`, `substitute-summary`, `substitute-clear`, `substitute-search`, `substitute-count`, `substitute-checked-at`, `substitute-selected`, `substitute-row-<mentorId>`, `substitute-row-<mentorId>-current`, `substitute-more`, `substitute-empty`, `substitute-no-result`, `substitute-reason`, `substitute-reason-error`, `substitute-select-error`, `substitute-submit`, `substitute-confirm`, `substitute-confirm-submit`, `substitute-clear-sheet`, `substitute-clear-reason`, `substitute-clear-submit`, `substitute-intent-banner`, `substitute-resend`, `substitute-error`, `substitute-retry`, `substitute-blocked`, `substitute-denied`, `substitute-not-found`.

## 11. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P5-S1-01 | SCHEDULED tương lai, 25 mentor | Mở | Candidates `page=1&pageSize=20`; 20 hàng; số 25; không chọn sẵn |
| TC-P5-S1-02 | Tiếp -01 | Xem thêm | Trang 2; đủ 25 hàng; hết nút |
| TC-P5-S1-03 | Trang 2 lỗi | Xem | Giữ 20 hàng; thử lại đúng trang 2 |
| TC-P5-S1-04 | | Gõ "ngô" nhanh | Một request `search=ngô` sau debounce; không hiện kết quả cũ |
| TC-P5-S1-05 | Đã chọn Ngô An | Tìm "phạm" | Vẫn có `substitute-selected` "Ngô An" |
| TC-P5-S1-06 | Hàng `isCurrent` | Chạm | Không chọn được; có chip "Đang dạy" |
| TC-P5-S1-07 | Chưa chọn | Phân công | `substitute-select-error`; không có dialog, không có request |
| TC-P5-S1-08 | Đã chọn, lý do trống hoặc chỉ khoảng trắng | Phân công | `substitute-reason-error`; không có request |
| TC-P5-S1-09 | Lý do 1001 ký tự | Nhập | Bộ đếm danger; khóa nút |
| TC-P5-S1-10 | Hợp lệ | Phân công, xác nhận | Dialog có tên người mới và người cũ; body đúng `mentorId`, `reason`, `expectedVersion` = `sessionVersion`; UUID v4 |
| TC-P5-S1-11 | | Double tap xác nhận | Đúng 1 request |
| TC-P5-S1-12 | 200 | Xem | Toast theo `effectiveMentor`; về chi tiết buổi, chip "Dạy thay"; context, chi tiết lớp được invalidate |
| TC-P5-S1-13 | Mất response | Gửi lại | Khóa form; cùng key, body, version |
| TC-P5-S1-14 | 409 version | Xem | Tải lại context và candidates; lý do giữ; lần gửi sau có key và version mới; không tự gửi |
| TC-P5-S1-15 | 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` khi phân công | Xem | Bỏ lựa chọn; tải lại candidates; `mentorBusy`; lý do giữ |
| TC-P5-S1-16 | 422 `CLASS_MENTOR_NOT_ELIGIBLE` | Xem | Tải lại; bỏ lựa chọn; `ineligible` |
| TC-P5-S1-17 | `assignmentType` PRIMARY | Xem | Không có `substitute-clear` |
| TC-P5-S1-18 | SUBSTITUTE | Trả về, nhập lý do, xác nhận | Body `mentorId: null`; toast `cleared` |
| TC-P5-S1-19 | SUBSTITUTE, lý do trống | Xác nhận | Lỗi tại sheet; không có request |
| TC-P5-S1-20 | 409 `CLASS_MENTOR_SCHEDULE_CONFLICT` khi trả về | Xem | `primaryBusy`; sheet còn mở; lý do giữ |
| TC-P5-S1-21 | IN_PROGRESS | Mở trực tiếp | `substitute-blocked` `started`; **không gọi candidates, không gọi PATCH** |
| TC-P5-S1-22 | COMPLETED hoặc CANCELLED | Mở | `substitute-blocked` |
| TC-P5-S1-23 | SCHEDULED, `startsAt <= asOf` | Mở | `substitute-blocked` `past` |
| TC-P5-S1-24 | Candidates 409 `CLASS_NOT_EDITABLE` | Mở | `classClosed` |
| TC-P5-S1-25 | `total` 0, có dạy thay | Mở | `substitute-empty`; vẫn có `substitute-clear` |
| TC-P5-S1-26 | Tìm, `total` 0 | Xem | `substitute-no-result` |
| TC-P5-S1-27 | 403 khi đã chọn | Gửi | Xóa dữ liệu và form; `substitute-denied` |
| TC-P5-S1-28 | Offline có dữ liệu | Xem | Khóa tìm và gửi; "Cần kết nối mạng"; không "Thử lại" |
| TC-P5-S1-29 | Đã chọn | Back | Dialog rời màn |
| TC-P5-S1-30 | `sessionVersion` khác `session.version` của context | Mở | Tải lại cả hai trước khi cho gửi |

Ứng viên Maestro E2E: TC-P5-S1-01, -04, -10, -12, -14, -18, -21. Thêm đăng nhập Mentor được phân công: buổi xuất hiện trong lịch; mentor chính không còn buổi đó.
