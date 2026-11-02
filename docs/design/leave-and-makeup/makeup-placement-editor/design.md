# P4-S7 — makeup-placement-editor · Xếp học bù (đề xuất)

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAKEUP-02, BR-MAKEUP-03; UC-MG-06. Endpoint tham chiếu: `GET /management/student-schedule-conflicts`, `GET …/:conflictId/makeup-candidates`, `POST …/:conflictId/makeup-placement`, `POST /management/makeup-placements/:placementId/cancel`; `GET /manager/classes` (tra tên lớp).

Slice này phụ thuộc Q-MAKEUP-01 ([mục 2 cấp phase](../design.md)).

## 1. Mục tiêu

Quản lý xếp một học viên học ké một buổi của lớp khác, cùng Course Unit, còn chỗ. Quản lý phải **tự xác nhận nội dung tương đương**, vì cùng Unit không tự bảo đảm nội dung giống nhau. Hủy xếp có lý do, rồi xếp lại khi buổi nhận không còn dùng được.

Xếp chỉ cấp quyền vào đúng buổi nhận: không tạo đăng ký, không tạo đơn thu tiền, không mở tài liệu của lớp nhận (BR-MAKEUP-02). Buổi nhận tính một lần về nghĩa vụ gốc khi có kết quả, do server tính (BR-MAKEUP-03). Client không tự tính credit hay cộng chuyên cần.

Mẫu [H] không có màn này. Bố cục ghép từ thẻ buổi và `ReasonField` đã có.

**Lựa chọn ban đầu:** chưa chọn buổi. Candidates mặc định theo server: từ bây giờ tới 93 ngày sau, `startsAt` tăng dần. Không làm bộ lọc `from/to`: danh sách đã xếp gần nhất lên đầu và thường ngắn.

## 2. Tải và ba chế độ

Không có `GET` một conflict (G-P4-13). Khi mở, gọi `GET /management/student-schedule-conflicts?classId={classId}&pageSize=100` và đi từng trang đến khi thấy `id` = `conflictId`. Query không có `status` nên gồm OPEN + MAKEUP_ASSIGNED, đủ cho mọi thẻ mở được từ S6. Không thấy sau trang cuối: "Trường hợp này đã thay đổi hoặc đã xong." + "Quay lại".

`version`, `makeupPlacementId`, `makeupPlacementVersion` lấy từ response này, không qua params. Sau mỗi mutation tìm lại như trên để có version mới; `PlacementDto` không trả conflict version khi hủy.

Chế độ theo [S6 mục 3.1](../makeup-conflicts/design.md):

| Trạng thái | Chế độ | Candidates |
| --- | --- | --- |
| Chưa xếp | **Chọn buổi** (mục 3) | Gọi |
| Đã xếp | **Đã xếp** (mục 5) | **Không gọi**: server trả 409 `MAKEUP_ALREADY_ASSIGNED` |
| Cần xếp lại | **Cần xếp lại** (mục 5) | **Không gọi**: server trả kết quả nhưng xếp sẽ lỗi (G-P4-14). Phải hủy trước |

## 3. Chọn buổi

```
┌──────────────────────────────┐
│▓ ←  Xếp học bù               ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ (MA) Nguyễn Minh Anh     │ │  ConflictCard rút gọn
│ │ IELTS 6.5 Intensive K08  │ │
│ │ Buổi 19: Unit 10         │ │
│ │ T4, 11/11/2026 18:30–20:00│ │
│ │ ⚠ Trùng T4, 11/11 18:00–19:30│
│ └──────────────────────────┘ │
│ CHỌN BUỔI NHẬN · 3           │  total server
│ Cùng Course Unit, ở lớp khác,│
│ còn chỗ và không trùng lịch. │
│ ┌──────────────────────────┐ │
│ │ ┌──┐ IELTS 6.5 Intensive K09│  CandidateCard
│ │ │T5│ Buổi 19: Unit 10     │ │
│ │ │12│ 19:00–20:30          │ │
│ │ └──┘ Trần Thị Linh        │ │
│ │      Còn 3 chỗ            │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

`CandidateCard` là `Card` pressable, ô ngày 44 như P2-S3. Dòng 1 tên lớp qua bảng tra, ẩn nếu không có (G-P4-17). Dòng 2 `session.title`. Dòng 3 giờ. Dòng 4 `session.effectiveMentor.displayName`, null theo P1 mục 8. Dòng 5 "Còn {remainingCapacity} chỗ", **lấy từ server, không tự trừ**.

`pageSize` 20, tải thêm khi cuộn. Đây chỉ là ảnh chụp: `GET` không giữ chỗ, nên "Còn 1 chỗ" có thể đã hết khi gửi.

### 3.1 Sheet xác nhận

Bấm thẻ mở `Sheet`:

```
│ Xác nhận xếp học bù          │
│ Nguyễn Minh Anh sẽ học ké:   │
│ IELTS 6.5 Intensive K09      │
│ Buổi 19: Unit 10             │
│ T5, 12/11/2026 19:00–20:30   │
│ ☐ Tôi đã kiểm tra, nội dung  │
│   buổi này tương đương buổi  │
│   học viên cần bù.           │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                      0/1000  │
│ Học viên chỉ được vào buổi   │
│ này, không thành học viên    │
│ của lớp nhận.                │
│ ( Xếp học bù )    Quay lại   │
```

- **Checkbox không chọn sẵn**, là điều kiện mở nút: `contentMatchConfirmed` phải đúng là `true` và đại diện cho một xác nhận thật.
- Lý do 1–1000 sau trim, bắt buộc.
- Body: `targetSessionId`, `expectedVersion` (conflict), `expectedTargetVersion` (`session.version` của candidate), `contentMatchConfirmed: true`, `reason`. Key UUID v4.
- Đổi buổi khác: checkbox về chưa chọn, lý do giữ nguyên. Xác nhận nội dung thuộc về đúng một buổi.

### 3.2 Sau khi xếp

201 trả `placement`, `conflictVersion`, `targetSessionVersion`. Toast "Đã xếp học bù." Hiển thị chế độ Đã xếp, **kèm buổi nhận lấy từ `placement.targetSession`**. Thông tin này chỉ giữ trong bộ nhớ cho lần mở này, vì không có route đọc lại (G-P4-12). Invalidate theo [mục 10.1 cấp phase](../design.md).

### 3.3 Lỗi khi xếp

Giữ lý do. Sau lỗi về lựa chọn, **bỏ chọn checkbox** và tải lại, không tự đổi buổi hay gửi lại. Intent chưa rõ dùng `IntentBanner`, cùng key, body.

| Mã | Hành vi |
| --- | --- |
| 409 `MAKEUP_VERSION_CONFLICT` | Tải lại conflict và candidates; `leave.changed` |
| 409 `MAKEUP_ALREADY_ASSIGNED` | Tìm lại conflict, chuyển đúng chế độ; "Trường hợp này vừa được xếp." |
| 409 `MAKEUP_TARGET_FULL` | Tải lại candidates; "Buổi này vừa hết chỗ. Chọn buổi khác." |
| 409 `MAKEUP_TARGET_UNAVAILABLE` | Tải lại candidates; "Buổi này không còn dùng được. Chọn buổi khác." |
| 409 `MAKEUP_TARGET_ENROLLED` | Tải lại candidates; "Học viên đã đăng ký lớp này. Chọn buổi khác." |
| 409 `MAKEUP_STUDENT_CONFLICT` | Tải lại candidates; "Buổi này trùng lịch học của học viên. Chọn buổi khác." |
| 422 `MAKEUP_NOT_ELIGIBLE` | Đóng sheet; "Học viên hoặc buổi này chưa đủ điều kiện xếp học bù." + mã hỗ trợ |
| 404 `MAKEUP_NOT_FOUND` | `StatusBlock` không tìm thấy |

## 4. Trạng thái khi chọn buổi

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| MP-A | Đang tìm conflict | Skeleton thẻ học viên + 2 thẻ buổi |
| MP-B | Conflict có, candidates đang tải | Thẻ học viên hiện; skeleton 2 thẻ buổi |
| MP-C | Có candidates | Mục 3 |
| MP-D | Candidates rỗng | Thẻ học viên giữ nguyên; khối `event_busy`: "Chưa có buổi phù hợp trong 93 ngày tới. Thử lại sau khi lịch các lớp thay đổi." **Đây không phải vắng và không hết nghĩa vụ** |
| MP-E | 422 `MAKEUP_NOT_ELIGIBLE` khi tải candidates | "Học viên chưa hoàn tất đăng ký nên chưa xếp được." Xảy ra với tiền mặt chưa thu. Không có "Thử lại" |
| MP-F | 409 `MAKEUP_ALREADY_ASSIGNED` khi tải candidates | Tìm lại conflict, đổi chế độ |
| MP-G | Candidates lỗi | Thẻ học viên giữ nguyên; `Alert` danger + "Thử lại" |
| MP-H | Conflict lỗi | `StatusBlock` + "Thử lại" |
| MP-I | Tải thêm lỗi | Giữ thẻ; chữ lỗi + "Thử lại" đúng trang |
| MP-J | Offline: có dữ liệu | Giữ; `leave.stale`; thẻ buổi bấm được để xem, nút gửi trong sheet khóa + `leave.needOnline` |
| MP-K | Offline: chưa có | `leave.offlineEmpty` |
| MP-L | 401 / 403 | Về Login / xóa dữ liệu và lý do, `StatusBlock` không quyền |

## 5. Đã xếp và cần xếp lại

```
│ ┌──────────────────────────┐ │
│ │ (MA) Nguyễn Minh Anh [Đã xếp]│
│ │ IELTS 6.5 Intensive K08  │ │
│ │ Buổi 19: Unit 10         │ │
│ └──────────────────────────┘ │
│ BUỔI ĐÃ XẾP                  │
│ T5, 12/11/2026 19:00–20:30   │  chỉ khi vừa xếp trong lần mở này
│ IELTS 6.5 Intensive K09      │
│   hoặc                       │
│ ⓘ Chưa xem được buổi đã xếp  │  khi mở lại (G-P4-12)
│   trên ứng dụng.             │
│ ( Hủy xếp học bù )           │  outline danger
```

Chế độ **Cần xếp lại**: chip danger, thêm `Alert` warning "Buổi đã xếp không còn dùng được, nên học viên cần được xếp lại. Hãy hủy xếp cũ trước rồi chọn buổi mới." Nút đổi thành "Hủy xếp cũ và chọn lại" (primary), vì đó là việc cần làm tiếp.

### 5.1 Sheet hủy

Tiêu đề "Hủy xếp học bù?". Thân: "Học viên sẽ trở lại danh sách chưa xếp. Nếu học viên đã học buổi này, kết quả vẫn được lưu trong lịch sử nhưng không còn được tính cho buổi gốc." Một `ReasonField` bắt buộc. Nút "Hủy xếp học bù" (danger), "Quay lại".

Body `expectedVersion` (`makeupPlacementVersion`), `reason`. Không gửi khi `makeupPlacementVersion` null: coi là dữ liệu sai và tải lại.

Thành công: toast "Đã hủy xếp học bù." Tìm lại conflict để có version mới, rồi sang chế độ Chọn buổi và tải candidates. **Không tự xếp sang buổi khác.**

| Mã | Hành vi |
| --- | --- |
| 409 `MAKEUP_VERSION_CONFLICT` | Tìm lại conflict; `leave.changed`; giữ lý do; bấm lại là intent mới |
| 409 `MAKEUP_STATE_CONFLICT` | Tìm lại conflict, sang đúng chế độ; "Xếp học bù này đã được hủy." |
| 404 `MAKEUP_NOT_FOUND` | `StatusBlock` không tìm thấy |
| Chưa rõ | `IntentBanner`; sheet không đóng được; Gửi lại cùng key |
| Offline | Nút khóa; `leave.needOnline` |

Rời màn khi sheet có lý do đã gõ: dialog chung, thân "Lý do đã nhập sẽ bị bỏ." Lý do chỉ trong bộ nhớ (Q-P4-02).

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `makeup.place.title` | Xếp học bù | Make-up placement |
| `makeup.place.pickSection` | Chọn buổi nhận · {{count}} | Choose a session · {{count}} |
| `makeup.place.pickHint` | Cùng Course Unit, ở lớp khác, còn chỗ và không trùng lịch. | Same Course Unit, another class, seats left and no clash. |
| `makeup.place.seats` | Còn {{count}} chỗ | {{count}} seats left |
| `makeup.place.confirmTitle` | Xác nhận xếp học bù | Confirm placement |
| `makeup.place.willJoin` | {{student}} sẽ học ké: | {{student}} will join: |
| `makeup.place.contentCheck` | Tôi đã kiểm tra, nội dung buổi này tương đương buổi học viên cần bù. | I've checked that this session covers the same content. |
| `makeup.place.scopeNote` | Học viên chỉ được vào buổi này, không thành học viên của lớp nhận. | The student joins this session only and doesn't become a member of that class. |
| `makeup.place.submit` | Xếp học bù | Place student |
| `makeup.place.placed` | Đã xếp học bù. | Student placed. |
| `makeup.place.noCandidates` | Chưa có buổi phù hợp trong 93 ngày tới. Thử lại sau khi lịch các lớp thay đổi. | No suitable sessions in the next 93 days. Try again once class schedules change. |
| `makeup.place.notEligiblePending` | Học viên chưa hoàn tất đăng ký nên chưa xếp được. | This student hasn't completed registration yet. |
| `makeup.place.notEligible` | Học viên hoặc buổi này chưa đủ điều kiện xếp học bù. | This student or session isn't eligible for placement. |
| `makeup.place.notFound` | Trường hợp này đã thay đổi hoặc đã xong. | This case has changed or is finished. |
| `makeup.place.justAssigned` | Trường hợp này vừa được xếp. | This case was just placed. |
| `makeup.place.full` | Buổi này vừa hết chỗ. Chọn buổi khác. | This session just filled up. Choose another. |
| `makeup.place.unavailable` | Buổi này không còn dùng được. Chọn buổi khác. | This session is no longer available. Choose another. |
| `makeup.place.enrolled` | Học viên đã đăng ký lớp này. Chọn buổi khác. | The student is already registered in this class. Choose another. |
| `makeup.place.studentClash` | Buổi này trùng lịch học của học viên. Chọn buổi khác. | This session clashes with the student's timetable. Choose another. |
| `makeup.place.placedSection` | Buổi đã xếp | Placed session |
| `makeup.place.placedUnknown` | Chưa xem được buổi đã xếp trên ứng dụng. | The placed session isn't available in the app. |
| `makeup.place.reassignNote` | Buổi đã xếp không còn dùng được, nên học viên cần được xếp lại. Hãy hủy xếp cũ trước rồi chọn buổi mới. | The placed session can no longer be used. Cancel this placement, then choose a new session. |
| `makeup.place.cancel` | Hủy xếp học bù | Cancel placement |
| `makeup.place.cancelReassign` | Hủy xếp cũ và chọn lại | Cancel and choose again |
| `makeup.place.cancelTitle` | Hủy xếp học bù? | Cancel this placement? |
| `makeup.place.cancelBody` | Học viên sẽ trở lại danh sách chưa xếp. Nếu học viên đã học buổi này, kết quả vẫn được lưu trong lịch sử nhưng không còn được tính cho buổi gốc. | The student returns to the unplaced list. If they already attended, the result stays in history but no longer counts toward the original session. |
| `makeup.place.cancelled` | Đã hủy xếp học bù. | Placement cancelled. |
| `makeup.place.alreadyCancelled` | Xếp học bù này đã được hủy. | This placement was already cancelled. |
| `makeup.place.leaveBody` | Lý do đã nhập sẽ bị bỏ. | The reason you entered will be discarded. |

## 7. Accessibility

- `CandidateCard` đọc thành một cụm gồm tên lớp, tiêu đề, giờ, người dạy, số chỗ, role `button`.
- Checkbox role `checkbox`, đọc đủ câu xác nhận, vùng chạm 44. Nút gửi khóa có hint "Cần xác nhận nội dung và nhập lý do."
- Đổi chế độ sau mutation chuyển focus tới tiêu đề khối mới.

## 8. testID

`makeup-placement-screen`, `makeup-placement-back`, `makeup-placement-student`, `makeup-placement-status`, `makeup-placement-overlap`, `makeup-placement-candidates`, `makeup-placement-candidate-<sessionId>`, `makeup-placement-candidate-seats-<sessionId>`, `makeup-placement-no-candidates`, `makeup-placement-not-eligible`, `makeup-placement-candidates-error`, `makeup-placement-candidates-retry`, `makeup-placement-more`, `makeup-placement-confirm-sheet`, `makeup-placement-content-check`, `makeup-placement-reason`, `makeup-placement-submit`, `makeup-placement-send-error`, `makeup-placement-placed`, `makeup-placement-placed-unknown`, `makeup-placement-reassign-note`, `makeup-placement-cancel`, `makeup-placement-cancel-sheet`, `makeup-placement-cancel-reason`, `makeup-placement-cancel-send`, `makeup-placement-not-found`, `makeup-placement-error`, `makeup-placement-retry`, `makeup-placement-offline`, `makeup-placement-denied`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S7-01 | Conflict ở trang 2 của `classId` | Mở | Đi tiếp tới trang 2; không có `status` trong query; params không có version |
| TC-P4-S7-02 | Không tìm thấy qua mọi trang | Mở | `makeup-placement-not-found` |
| TC-P4-S7-03 | Chưa xếp | Mở | Gọi candidates, không có `from/to` |
| TC-P4-S7-04 | Đã xếp | Mở | **Không** gọi candidates; `makeup-placement-placed-unknown`; có nút Hủy |
| TC-P4-S7-05 | Cần xếp lại | Mở | **Không** gọi candidates; `makeup-placement-reassign-note`; nút "Hủy xếp cũ và chọn lại" |
| TC-P4-S7-06 | `remainingCapacity` 3 | Xem | "Còn 3 chỗ"; không tự tính |
| TC-P4-S7-07 | Tra lớp lỗi | Xem | Thẻ không có tên lớp, không hiện id; vẫn chọn được |
| TC-P4-S7-08 | Mentor null | Xem | Theo P1 mục 8; không thay bằng mentor chính |
| TC-P4-S7-09 | `total` 0 | Xem | `makeup-placement-no-candidates`; không có chữ vắng |
| TC-P4-S7-10 | 422 `MAKEUP_NOT_ELIGIBLE` khi tải | Xem | `makeup-placement-not-eligible`; không "Thử lại" |
| TC-P4-S7-11 | Candidates 500 | Xem | Thẻ học viên giữ; "Thử lại" gọi lại |
| TC-P4-S7-12 | Tải thêm lỗi | Thử lại | Đúng trang; giữ thẻ |
| TC-P4-S7-13 | Mở sheet | Xem | Checkbox chưa chọn; nút khóa |
| TC-P4-S7-14 | Chọn checkbox, lý do trống | Xem | Nút khóa; bấm vào ô báo `leave.reasonRequired` |
| TC-P4-S7-15 | Lý do có, chưa chọn checkbox | Xem | Nút khóa |
| TC-P4-S7-16 | Đủ | Gửi | Body đúng 5 trường; `expectedVersion` từ conflict, `expectedTargetVersion` từ `session.version`; `contentMatchConfirmed` true; UUID v4 |
| TC-P4-S7-17 | Đổi sang buổi khác | Mở sheet mới | Checkbox về chưa chọn; lý do giữ |
| TC-P4-S7-18 | 201 | Gửi | Chế độ Đã xếp có buổi nhận từ response; invalidate đúng; toast không chứa lý do |
| TC-P4-S7-19 | Mở lại sau khi xếp | Mở | `makeup-placement-placed-unknown`; không dựng buổi nhận từ cache cũ |
| TC-P4-S7-20 | 409 `MAKEUP_TARGET_FULL` | Gửi | Tải lại candidates; báo hết chỗ; checkbox bỏ chọn; giữ lý do; không tự đổi buổi |
| TC-P4-S7-21 | 409 `MAKEUP_TARGET_UNAVAILABLE` | Gửi | Chữ riêng; không gộp với hết chỗ |
| TC-P4-S7-22 | 409 `MAKEUP_TARGET_ENROLLED` | Gửi | Chữ riêng |
| TC-P4-S7-23 | 409 `MAKEUP_STUDENT_CONFLICT` | Gửi | Chữ riêng |
| TC-P4-S7-24 | 409 `MAKEUP_VERSION_CONFLICT` | Gửi | Tải lại; không tự gửi; lần sau key và version mới |
| TC-P4-S7-25 | 409 `MAKEUP_ALREADY_ASSIGNED` | Gửi | Đổi chế độ; báo vừa được xếp |
| TC-P4-S7-26 | Mất mạng sau khi gửi | Gửi | `IntentBanner`; Gửi lại cùng key, body; không giữ hai chỗ |
| TC-P4-S7-27 | Double tap | Gửi | Một request |
| TC-P4-S7-28 | Hủy, lý do trống | Gửi | `leave.reasonRequired`; không request |
| TC-P4-S7-29 | Hủy hợp lệ | Gửi | Body `expectedVersion` = `makeupPlacementVersion`; tìm lại conflict; sang Chọn buổi; có candidates; **không tự xếp** |
| TC-P4-S7-30 | Hủy khi Cần xếp lại | Gửi rồi xếp mới | Lần xếp dùng conflict version mới |
| TC-P4-S7-31 | 409 `MAKEUP_STATE_CONFLICT` | Hủy | Sang đúng chế độ; báo đã hủy |
| TC-P4-S7-32 | Chữ sheet hủy | Xem | Nói rõ kết quả giữ trong lịch sử, không còn tính cho buổi gốc; không có số credit |
| TC-P4-S7-33 | Có lý do đã gõ | Back | Dialog chung |
| TC-P4-S7-34 | Offline khi có dữ liệu | Xem | Cảnh báo; nút gửi khóa; không tự gửi khi có mạng lại |
| TC-P4-S7-35 | 403 khi đang mở sheet | Gửi | Xóa dữ liệu và lý do; `makeup-placement-denied` |
| TC-P4-S7-36 | Sau khi xếp (E2E) | Mentor lớp nhận mở điểm danh buổi nhận | Có học viên với chip Học bù; roster lớp nhận không thêm người này |
| TC-P4-S7-37 | Học viên trên S1 | Xem | Không hiển thị thành vắng ở bất kỳ trạng thái nào |

Ứng viên Maestro E2E: TC-P4-S7-03, -04, -05, -13, -16, -18, -20, -29, -36.
