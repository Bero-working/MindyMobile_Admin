# P4-S6 — makeup-conflicts · Xung đột lịch học viên (đề xuất)

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAKEUP-02, BR-MAKEUP-03; UC-MG-06. Endpoint tham chiếu: `GET /management/student-schedule-conflicts`; `GET /manager/classes` (tra tên lớp, chọn lớp).

Slice này phụ thuộc Q-MAKEUP-01 ([mục 2 cấp phase](../design.md)). Bỏ thì chỉ mất tile và route, S1–S5 không đổi.

## 1. Mục tiêu

Quản lý thấy các học viên mà **một buổi bù của lớp họ trùng với lịch học khác**, biết trường hợp nào chưa xếp, đã xếp hay cần xếp lại, rồi mở để xử lý. Màn chỉ đọc.

Mẫu [H] có tile nhưng không có màn. Màn này không phải danh sách học viên vắng: **trùng lịch không phải ABSENT** (BR-MAKEUP-03), và không có chữ vắng nào trên màn. Phân biệt rõ với buổi bù cả lớp: [mục 5 cấp phase](../design.md).

**Lựa chọn ban đầu:** không gửi `status`, tức server trả OPEN + MAKEUP_ASSIGNED, không giới hạn tuần (ADR-025 mục 2). Server xếp `createdAt` tăng dần, cũ nhất lên đầu; không đổi thứ tự.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Xung đột lịch học viên   ▓│
│▓    6 trường hợp             ▓│  total server, ẩn khi chưa có
├──────────────────────────────┤
│ ⓘ Buổi bù trùng với lịch học │
│   khác của học viên. Có thể  │
│   xếp học viên học ké một    │
│   buổi cùng nội dung ở lớp   │
│   khác.                      │
│ (Cần xử lý)(Chưa xếp)(Đã xếp)(Đã xong)  [≡ Lớp] → cuộn ngang
│ ┌──────────────────────────┐ │
│ │ (MA) Nguyễn Minh Anh  [Cần xếp lại]│
│ │ IELTS 6.5 Intensive K08  │ │  ẩn nếu không tra được
│ │ Buổi 19: Unit 10         │ │
│ │ T4, 11/11/2026 18:30–20:00│ │
│ │ ⚠ Trùng T4, 11/11 18:00–19:30│  buổi đầu tiên
│ │    và 1 buổi khác        │ │
│ │ Buổi đã xếp không còn dùng│ │  chỉ Cần xếp lại
│ │ được.                  › │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Thẻ `ConflictCard`: `Card` pressable, padding 14, gap 8. Avatar chữ cái 32, tên 14/600, chip trạng thái. Không dùng blur trên thẻ lặp.
- Bấm thẻ mở S7 với `conflictId`, `classId` = `sourceSession.classId`. Thẻ RESOLVED không bấm được, không có `chevron_right` (mục 3.2).
- Back về đúng filter và vị trí, refetch khi focus.
- Phụ đề từ `total`, theo filter đang chọn.

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Học viên | `student.displayName` | Null: "Chưa có tên" |
| Tên lớp | `sourceSession.classId` qua bảng tra | Ẩn dòng; **không hiện id** |
| Buổi nguồn | `sourceSession.title`, `.startsAt`, `.endsAt` | |
| Giờ trùng | `conflictingIntervals`: hiện buổi đầu tiên theo `startsAt`; có nhiều hơn thì thêm "và {n} buổi khác" | Chỉ có id và giờ, không có tên lớp trùng: không gọi thêm API từng buổi (ADR-025 mục 5). Đây là bằng chứng tại lúc ghi, không phải lịch hiện tại |
| Trạng thái | Mục 3.1 | |

### 3.1 Trạng thái hiển thị

Conflict DTO không có `placementStatus` (G-P4-12). Suy ở **một hàm duy nhất**, có test riêng:

| `status` | `makeupPlacementId` | Hiển thị | Nghĩa |
| --- | --- | --- | --- |
| OPEN | null | **Chưa xếp** (warning) | Chưa có placement hiệu lực |
| OPEN | khác null | **Cần xếp lại** (danger) | Placement ở NEEDS_REASSIGNMENT: buổi nhận đã hủy hoặc đã chốt mà học viên không có trong danh sách. Thêm dòng 13 "Buổi đã xếp không còn dùng được." |
| MAKEUP_ASSIGNED | khác null | **Đã xếp** (info) | Thêm dòng 13 "Đã xếp học ké một buổi ở lớp khác." **Không có buổi nhận** vì DTO không trả (G-P4-12) |
| RESOLVED | khác null | **Đã xong** (success) | Học viên đã có kết quả ở buổi nhận |
| Tổ hợp khác | | Coi là phản hồi sai định dạng ở schema | |

Tiêu chí "giữ NEEDS_REASSIGNMENT" được đáp ứng bằng dòng 2: không hiện như "Chưa xếp", vì phải hủy xếp cũ trước khi xếp mới (G-P4-14).

### 3.2 RESOLVED chỉ đọc

API cho hủy cả placement đã hoàn tất và thu hồi credit (G-P4-15), nhưng đó là quyết định có hậu quả với kết quả học tập, không thuộc UC-MG-06. Thẻ RESOLVED không mở S7, không có nút.

### 3.3 Bộ lọc

| Bộ lọc | Giá trị | Query |
| --- | --- | --- |
| Trạng thái | Cần xử lý / Chưa xếp / Đã xếp / Đã xong | bỏ `status` / `OPEN` / `MAKEUP_ASSIGNED` / `RESOLVED` |
| Lớp | Sheet danh sách lớp OPEN + IN_PROGRESS, có ô tìm cục bộ trên bảng tra | `classId` |

"Chưa xếp" gửi `OPEN` nên gồm cả dòng Cần xếp lại, phân biệt bằng chip trên thẻ; server không có query riêng. Chip không có số. "Cần xử lý" gồm cả Đã xếp, đúng mặc định server, vì buổi nhận chưa diễn ra thì chưa xong.

Đổi lọc: về trang 1, xóa danh sách cũ ngay, hiện skeleton. Response cũ về sau bị bỏ qua.

### 3.4 Phân trang và làm mới

`pageSize` 20. Tải thêm khi cuộn gần cuối, một request tại một thời điểm. Refetch khi focus; kéo để làm mới. Khử trùng theo `id`, luôn lấy `total` mới nhất. Trang rỗng mà `total` còn lớn hơn số đã tải: tải lại từ trang 1.

Bảng tra lớp theo [mục 10.1 cấp phase](../design.md), không chặn danh sách. Tra lỗi: ẩn dòng tên lớp; nút "Lớp" báo lỗi khi mở.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| MC-A | Đang tải | Skeleton 3 thẻ; bộ lọc dùng được; không có phụ đề số |
| MC-B | Có dữ liệu | Mục 2 |
| MC-C | Rỗng, không lọc | Khối căn giữa `task_alt`: "Không có xung đột lịch nào cần xử lý." |
| MC-D | Rỗng, có lọc | "Không có trường hợp phù hợp." + nút text "Xóa bộ lọc" |
| MC-E | Tải thêm: đang tải / lỗi | Giữ thẻ; skeleton footer / chữ lỗi + "Thử lại" đúng trang |
| MC-F | Lần đầu lỗi | `StatusBlock` + "Thử lại". **Không hiện như rỗng** |
| MC-G | Làm mới lỗi | Giữ thẻ của cùng query; `Alert` warning + mã hỗ trợ |
| MC-H | Offline: có dữ liệu | Giữ thẻ; `leave.stale`; không "Thử lại"; bấm thẻ vẫn mở |
| MC-I | Offline: chưa có | `leave.offlineEmpty`; không hiện rỗng |
| MC-J | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền, "Quay lại" |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `makeup.conflicts.title` | Xung đột lịch học viên | Student conflicts |
| `makeup.conflicts.subtitle` | {{count}} trường hợp | {{count}} cases |
| `makeup.conflicts.info` | Buổi bù trùng với lịch học khác của học viên. Có thể xếp học viên học ké một buổi cùng nội dung ở lớp khác. | A make-up session clashes with the student's other classes. You can place them in an equivalent session of another class. |
| `makeup.conflicts.filterActive` | Cần xử lý | Needs action |
| `makeup.conflicts.filterOpen` | Chưa xếp | Not placed |
| `makeup.conflicts.filterAssigned` | Đã xếp | Placed |
| `makeup.conflicts.filterResolved` | Đã xong | Done |
| `makeup.conflicts.class` | Lớp | Class |
| `makeup.conflicts.classSheet` | Chọn lớp | Choose a class |
| `makeup.conflicts.classSearch` | Tìm lớp | Search classes |
| `makeup.conflicts.classFailed` | Chưa tải được danh sách lớp. | Couldn't load classes. |
| `makeup.conflicts.noName` | Chưa có tên | No name |
| `makeup.conflicts.overlap` | Trùng {{time}} | Clashes with {{time}} |
| `makeup.conflicts.overlapMore` | và {{count}} buổi khác | and {{count}} more |
| `makeup.conflicts.reassignNote` | Buổi đã xếp không còn dùng được. | The placed session can no longer be used. |
| `makeup.conflicts.assignedNote` | Đã xếp học ké một buổi ở lớp khác. | Placed in a session of another class. |
| `makeup.conflicts.empty` | Không có xung đột lịch nào cần xử lý. | No conflicts need attention. |
| `makeup.conflicts.emptyFilter` | Không có trường hợp phù hợp. | No matching cases. |
| `makeup.conflicts.clear` | Xóa bộ lọc | Clear filters |
| `makeup.conflicts.failed` | Chưa tải được xung đột lịch. | Couldn't load conflicts. |

## 6. Accessibility

- Thẻ đọc thành một cụm: "Nguyễn Minh Anh, cần xếp lại, IELTS 6.5 Intensive K08, Buổi 19, thứ Tư 11 tháng 11, 18:30 đến 20:00, trùng 18:00 đến 19:30 và 1 buổi khác, buổi đã xếp không còn dùng được". Role `button` trừ RESOLVED.
- Avatar ẩn khỏi trình đọc. Bộ lọc role `radiogroup`.

## 7. testID

`makeup-conflicts-screen`, `makeup-conflicts-back`, `makeup-conflicts-subtitle`, `makeup-conflicts-info`, `makeup-conflicts-filter-active`, `makeup-conflicts-filter-open`, `makeup-conflicts-filter-assigned`, `makeup-conflicts-filter-resolved`, `makeup-conflicts-class-filter`, `makeup-conflicts-class-clear`, `makeup-conflicts-class-sheet`, `makeup-conflicts-class-option-<classId>`, `makeup-conflicts-row-<id>`, `makeup-conflicts-row-status-<id>`, `makeup-conflicts-row-class-<id>`, `makeup-conflicts-row-overlap-<id>`, `makeup-conflicts-empty`, `makeup-conflicts-empty-filter`, `makeup-conflicts-clear-filters`, `makeup-conflicts-error`, `makeup-conflicts-retry`, `makeup-conflicts-refresh-alert`, `makeup-conflicts-offline`, `makeup-conflicts-denied`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S6-01 | Mở màn | Xem request | Không có `status`, `classId`; `pageSize=20` |
| TC-P4-S6-02 | `total` 45, trang 1 có 20 | Xem | Phụ đề "45 trường hợp" |
| TC-P4-S6-03 | OPEN, placement null | Xem | "Chưa xếp" |
| TC-P4-S6-04 | OPEN, placement khác null | Xem | "Cần xếp lại" và dòng giải thích; không phải "Chưa xếp" |
| TC-P4-S6-05 | MAKEUP_ASSIGNED | Xem | "Đã xếp"; dòng "Đã xếp học ké…"; không có buổi nhận |
| TC-P4-S6-06 | RESOLVED | Xem, bấm | "Đã xong"; không mở S7; không có nút |
| TC-P4-S6-07 | MAKEUP_ASSIGNED, placement null | Parse | Lỗi định dạng, không hiện nhãn đoán |
| TC-P4-S6-08 | 3 `conflictingIntervals` | Xem | Giờ đầu tiên + "và 2 buổi khác"; không có request theo buổi trùng |
| TC-P4-S6-09 | Tìm chữ "vắng", "absent" | Xem mọi trạng thái | Không có |
| TC-P4-S6-10 | Lớp tra được | Xem | Hiện tên lớp |
| TC-P4-S6-11 | Tra lớp 500 | Xem | Thẻ vẫn hiện, không có id, bấm vẫn mở; `displayName` null thì "Chưa có tên" |
| TC-P4-S6-12 | | Chọn "Đã xong" | `status=RESOLVED`, về trang 1, thẻ cũ biến mất ngay |
| TC-P4-S6-13 | Request A chậm, đổi lọc sang B, A về sau | | Chỉ hiện B |
| TC-P4-S6-14 | | Chọn lớp | `classId` đúng; xóa được |
| TC-P4-S6-15 | Lọc xong rỗng | Xóa bộ lọc | Về Cần xử lý, bỏ lớp |
| TC-P4-S6-16 | `total` 0, không lọc | Xem | `makeup-conflicts-empty` |
| TC-P4-S6-17 | 500 lần đầu | Xem | `makeup-conflicts-error`; không phải rỗng |
| TC-P4-S6-18 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ thẻ |
| TC-P4-S6-19 | Trùng `id` giữa hai trang | Tải thêm | Không trùng thẻ |
| TC-P4-S6-20 | | Bấm thẻ OPEN | Mở S7 với `conflictId`, `classId`; params không có version |
| TC-P4-S6-21 | Xếp xong, Back | Focus | Refetch; thẻ đổi "Đã xếp"; giữ bộ lọc |
| TC-P4-S6-22 | Offline, đã có dữ liệu | Xem | Giữ thẻ; cảnh báo; không "Thử lại" |
| TC-P4-S6-23 | Offline, chưa có | Mở | `offlineEmpty`; không phải rỗng |
| TC-P4-S6-24 | 403 khi đã có dữ liệu | Refetch | Xóa thẻ; `makeup-conflicts-denied` |
| TC-P4-S6-25 | Đăng nhập Mentor | Tìm route | Không có `MakeupConflicts` |

Ứng viên Maestro E2E: TC-P4-S6-01, -03, -04, -05, -06, -12, -20, -21.
