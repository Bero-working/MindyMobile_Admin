# P4-S5 — leave-review-detail · Duyệt đơn nghỉ

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-LEAVE-04, BR-LEAVE-05, BR-MAKEUP-01; UC-MG-05. Endpoint tham chiếu: `GET /management/mentor-leave-requests/:requestId`, `POST …/approve`, `POST …/reject`; `GET /manager/mentors/:mentorId`; `GET /manager/classes` (tra tên lớp).

## 1. Mục tiêu

Quản lý đọc đủ để quyết định, rồi duyệt hoặc từ chối có lý do. **Duyệt là thao tác nặng và không có nút hoàn tác:** trong một giao dịch, server hủy mọi buổi gốc, tạo buổi bù do chính Mentor đó dạy, ghi khoảng nghỉ đã duyệt và kéo dài lớp nếu cần. Vì vậy màn phải nói rõ tác động trước khi bấm, kiểm được lịch sau khi duyệt, và **tuyệt đối không báo thành công khi server chưa xác nhận**.

Bố cục theo mẫu [H], với các khác biệt ở [mục 1 cấp phase](../design.md): không có phân công dạy thay trong đơn, duyệt cũng cần lý do, còn trùng lịch thì không duyệt được.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Chi tiết đơn nghỉ        ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ (NL) Nguyễn Hoàng Long   │ │
│ │      Gửi 02/11, 09:12  [Chờ duyệt]│
│ │ ──────────────────────── │ │
│ │ Thời gian  06/11 – 08/11/2026│
│ │ Ca         Cả ngày       │ │
│ │ Hạn xử lý  18:30 06/11   │ │
│ │ Lý do      Việc gia đình │ │
│ └──────────────────────────┘ │
│ [Khối chặn duyệt, mục 4]     │
│ BUỔI BỊ ẢNH HƯỞNG      3 buổi │
│ ┌──────────────────────────┐ │
│ │ IELTS 6.5 Intensive K08  │ │
│ │ Lịch gốc T6, 06/11 18:30–20:00│
│ │ ↻ Lịch bù T4, 11/11 18:30–20:00│
│ │ ⚠ 2 trùng lịch học viên  │ │  khi có trong trang đã tải
│ └──────────────────────────┘ │
│  ( Xem thêm )                │
│ NGÀY KẾT THÚC DỰ KIẾN CỦA LỚP │
│ IELTS 6.5 Intensive K08: 20/12/2026│
├──────────────────────────────┤
│ ( Từ chối )    ( Duyệt đơn ) │  thanh dính đáy, chỉ PENDING
└──────────────────────────────┘
```

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Tên Mentor | `GET /manager/mentors/:mentorId`, một request | Đang tải: skeleton. Lỗi: "Chưa có tên". **Không hiện id** |
| Khoảng ngày, ca, hạn, lý do, thời gian gửi | Từ request | |
| Tên lớp | `classId` qua bảng tra | Ẩn dòng |
| Buổi | `items`: `sourceStartsAt/EndsAt`, `startsAt/endsAt`. `pageSize` 20, tổng `itemCount` | Không có tiêu đề buổi (G-P4-03) |
| Trùng lịch | `studentConflictCount` là tổng; `studentConflicts` của trang đã tải, gộp theo `sourceSessionId` thành "{n} trùng lịch học viên". Không có tên học viên (G-P4-03). `page` dùng chung với `items` (G-P4-16) | Chỉ hiện khi PENDING |
| Buổi còn nguyên | `sourcesCurrent` | |
| Ngày kết thúc | `classExtensions`. Chữ trung tính (G-P4-10) | |
| Kết quả | `LeaveReviewBlock` theo `status` | |

Làm mới khi focus và kéo. Đang có sheet mở thì không thay `version` dưới tay người dùng: chỉ cập nhật lớp dữ liệu và báo khi gửi (mục 6).

## 4. Khi nào được duyệt

`canAct` = `status` PENDING. `canApprove` = `canAct` và `sourcesCurrent` và `studentConflictCount` = 0. **Từ chối luôn có khi `canAct`**, kể cả khi không duyệt được: đó chính là lối ra.

| Điều kiện | Khối hiển thị | Nút Duyệt |
| --- | --- | --- |
| `sourcesCurrent` false | `Alert` danger: "Các buổi trong đơn đã thay đổi sau khi Mentor gửi. Đơn này không duyệt được nữa. Hãy từ chối để Mentor tạo đơn mới." | Khóa |
| `studentConflictCount` > 0 | `Alert` danger: "Lịch bù đang trùng lịch học của {n} trường hợp học viên, nên chưa duyệt được. Có thể từ chối để Mentor đề xuất lịch khác, hoặc chờ nếu lịch học viên thay đổi." | Khóa |
| Cả hai | Hai khối, stale trước | Khóa |
| Không có | Không có khối | Mở |

Nút khóa vẫn thấy được, kèm chữ lý do ở khối phía trên, để Quản lý không tưởng thiếu quyền. Offline: cả hai nút khóa, dòng `leave.needOnline`. Khi làm mới lỗi: khóa cả hai vì dữ liệu có thể cũ, hiện cảnh báo.

**Vì sao không có ô "Tôi đã biết trùng lịch":** BR-LEAVE-05 và tiêu chí slice ghi yêu cầu acknowledgment, nhưng backend hiện không cho vượt qua (G-P4-01, Q-P4-01). Một ô xác nhận sẽ hứa điều server từ chối. `acknowledgeStudentConflicts` luôn gửi `false`. Nếu Q-P4-01 đổi và backend mở lại, thêm một checkbox trong sheet duyệt là đủ, bố cục không đổi.

## 5. Sheet duyệt và từ chối

**Duyệt:**

```
│ Duyệt đơn nghỉ?              │
│ Nguyễn Hoàng Long · 06/11 – 08/11│
│ ⚠ Sau khi duyệt:             │
│  • Hủy 3 buổi gốc            │
│  • Tạo 3 buổi bù do Nguyễn   │
│    Hoàng Long dạy            │
│  • Lớp có thể kéo dài theo   │
│    ngày kết thúc dự kiến     │
│ Thao tác này không tự hoàn   │
│ tác được.                    │
│ Lý do *                      │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                      0/1000  │
│ ( Duyệt đơn )    Quay lại    │
```

Số buổi lấy `itemCount`, không đếm trang đã tải. Lý do 1–1000 sau trim, bắt buộc. Body `expectedVersion`, `reason`, `acknowledgeStudentConflicts: false`, key UUID v4.

**Từ chối:** `Sheet` tiêu đề "Từ chối đơn nghỉ?", thân "Lịch dạy không thay đổi. Mentor sẽ thấy lý do này." Cùng `ReasonField`. Body `expectedVersion`, `reason`.

### 5.1 Sau khi duyệt

Response gồm `request`, `replacements`, `classExtensions`, `studentConflictCount`. Đóng sheet và hiển thị tại chỗ, không rời màn, để Quản lý kiểm lịch ngay:

```
│ ✓ Đã duyệt đơn. Đã tạo 3 buổi bù.│
│ KIỂM TRA LỊCH SAU DUYỆT      │
│ ┌──────────────────────────┐ │
│ │ IELTS 6.5 Intensive K08  │ │
│ │ Buổi 19: Unit 10       › │ │  từ replacements, mở SessionContext
│ │ T4, 11/11/2026 18:30–20:00│ │
│ │ [Buổi bù]                │ │
│ └──────────────────────────┘ │
```

- `replacements` có tiêu đề buổi nên dùng cho khối này. Khi vào lại màn không còn `replacements` (không có trong GET), danh sách buổi đọc từ `items` qua `replacementSessionId`, không có tiêu đề: đúng dữ liệu hiện có.
- Toast "Đã duyệt đơn." Invalidate theo [mục 10.1 cấp phase](../design.md).
- Từ chối thành công: hiển thị REJECTED từ response, gỡ thanh nút, toast "Đã từ chối đơn."
- Khi đã APPROVED, hàng hiện "Lịch gốc … Đã hủy" và "Buổi bù …" mở `SessionContext`, như S3 mục 3.

## 6. Lỗi khi gửi

Không bao giờ hiện trạng thái Đã duyệt trước khi có 200. Giữ lý do. Intent chưa rõ dùng `IntentBanner`, sheet không đóng được, "Gửi lại" cùng key, body, version: server trả lại kết quả cũ, **không tạo buổi bù lần hai**.

| Mã | Hành vi |
| --- | --- |
| 409 `LEAVE_VERSION_CONFLICT` | Tải lại, giữ lý do, `leave.changed`. Người dùng xem và bấm lại, intent mới |
| 409 `LEAVE_STATE_CONFLICT` | Đóng sheet, tải lại, hiện trạng thái mới: "Đơn đã được xử lý." Gỡ nút |
| 409 `LEAVE_REQUEST_EXPIRED` | Đóng sheet, tải lại, hiện Hết hạn: "Đơn đã hết hạn nên không duyệt được. Lịch dạy không thay đổi." |
| 409 `LEAVE_REQUEST_STALE` | Đóng sheet, tải lại. Hiện khối `sourcesCurrent` false ở mục 4 |
| 409 `LEAVE_STUDENT_CONFLICT`, `LEAVE_STUDENT_CONFLICT_ACK_REQUIRED` | Đóng sheet, tải lại. Hiện khối trùng lịch ở mục 4. Không tự bật cờ rồi gửi lại |
| 409 `LEAVE_TARGET_CONFLICT` | `Alert` danger trong màn: "Lịch bù vừa bị trùng với lịch dạy, lớp hoặc ngày nghỉ đã duyệt, nên chưa duyệt được. Có thể từ chối để Mentor đề xuất lịch khác." PENDING không giữ chỗ nên đây là lỗi bình thường. Lịch không đổi |
| 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | `Alert` danger: "Có buổi đang có học viên được xếp học bù. Xử lý xếp học bù trước rồi duyệt lại." Kèm nút mở S6 khi S6 có trong phạm vi |
| 409 `LEAVE_MENTOR_INACTIVE` | `Alert` danger: "Mentor này không còn hoạt động nên chưa duyệt được." |
| 422 khác | Dải danger + mã hỗ trợ; giữ sheet |
| 403 | Xóa dữ liệu; `StatusBlock` không quyền |

Sau mọi 409 ở trên, **lịch không đổi**; câu chữ không được ngụ ý đã xử lý một phần vì server rollback toàn bộ.

## 7. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| LR-A | Đang tải | Skeleton thẻ đầu + 2 hàng; không có thanh nút |
| LR-B | PENDING, duyệt được | Mục 2 |
| LR-C | PENDING, bị chặn | Mục 4, Duyệt khóa, Từ chối mở |
| LR-D | APPROVED vừa xong | Mục 5.1 |
| LR-E | APPROVED mở lại | `LeaveReviewBlock`; hàng có buổi bù; không có thanh nút |
| LR-F | REJECTED, WITHDRAWN, EXPIRED | `LeaveReviewBlock`; hàng đề xuất xám; không có thanh nút và không có khối trùng lịch |
| LR-G | Lần đầu lỗi | `StatusBlock` + "Thử lại" |
| LR-H | Làm mới lỗi | Giữ dữ liệu; `Alert` warning; hai nút khóa |
| LR-I | Tải thêm lỗi | Giữ hàng; chữ lỗi + "Thử lại" đúng trang |
| LR-J | Offline: có dữ liệu | Giữ; `leave.stale`; hai nút khóa; `leave.needOnline` |
| LR-K | Offline: chưa có | `leave.offlineEmpty` |
| LR-L | 404 | `StatusBlock` không tìm thấy |
| LR-M | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền |

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `leave.review.title` | Chi tiết đơn nghỉ | Leave request |
| `leave.review.sessions` | Buổi bị ảnh hưởng | Affected sessions |
| `leave.review.sessionCount` | {{count}} buổi | {{count}} sessions |
| `leave.review.rowConflict` | {{count}} trùng lịch học viên | {{count}} student clashes |
| `leave.review.classEnd` | Ngày kết thúc dự kiến của lớp | Expected class end date |
| `leave.review.staleBlock` | Các buổi trong đơn đã thay đổi sau khi Mentor gửi. Đơn này không duyệt được nữa. Hãy từ chối để Mentor tạo đơn mới. | The sessions changed after this was submitted, so it can't be approved. Reject it so the mentor can submit a new one. |
| `leave.review.conflictBlock` | Lịch bù đang trùng lịch học của {{count}} trường hợp học viên, nên chưa duyệt được. Có thể từ chối để Mentor đề xuất lịch khác, hoặc chờ nếu lịch học viên thay đổi. | The make-up times clash with {{count}} student timetable entries, so this can't be approved yet. Reject it so the mentor can propose other times, or wait if timetables change. |
| `leave.review.reject` / `.approve` | Từ chối / Duyệt đơn | Reject / Approve |
| `leave.review.approveTitle` | Duyệt đơn nghỉ? | Approve this request? |
| `leave.review.approveAfter` | Sau khi duyệt: | After approval: |
| `leave.review.approveCancel` | Hủy {{count}} buổi gốc | {{count}} original sessions are cancelled |
| `leave.review.approveCreate` | Tạo {{count}} buổi bù do {{mentor}} dạy | {{count}} make-up sessions are created, taught by {{mentor}} |
| `leave.review.approveExtend` | Lớp có thể kéo dài theo ngày kết thúc dự kiến | Classes may run until the expected end date |
| `leave.review.noUndo` | Thao tác này không tự hoàn tác được. | This can't be undone automatically. |
| `leave.review.back` | Quay lại | Back |
| `leave.review.rejectTitle` | Từ chối đơn nghỉ? | Reject this request? |
| `leave.review.rejectBody` | Lịch dạy không thay đổi. Mentor sẽ thấy lý do này. | The schedule won't change. The mentor will see this reason. |
| `leave.review.approved` | Đã duyệt đơn. | Request approved. |
| `leave.review.approvedCreated` | Đã duyệt đơn. Đã tạo {{count}} buổi bù. | Request approved. {{count}} make-up sessions created. |
| `leave.review.check` | Kiểm tra lịch sau duyệt | Check the schedule |
| `leave.review.rejected` | Đã từ chối đơn. | Request rejected. |
| `leave.review.handled` | Đơn đã được xử lý. | This request was already handled. |
| `leave.review.expiredNow` | Đơn đã hết hạn nên không duyệt được. Lịch dạy không thay đổi. | This request expired, so it can't be approved. The schedule hasn't changed. |
| `leave.review.targetConflict` | Lịch bù vừa bị trùng với lịch dạy, lớp hoặc ngày nghỉ đã duyệt, nên chưa duyệt được. Có thể từ chối để Mentor đề xuất lịch khác. | A make-up time now clashes with a schedule, class or approved leave, so this can't be approved. Reject it so the mentor can propose other times. |
| `leave.review.hasPlacements` | Có buổi đang có học viên được xếp học bù. Xử lý xếp học bù trước rồi duyệt lại. | A session has students placed for make-up. Resolve those placements, then approve again. |
| `leave.review.openConflicts` | Mở xung đột lịch học viên | Open student conflicts |
| `leave.review.mentorInactive` | Mentor này không còn hoạt động nên chưa duyệt được. | This mentor is no longer active, so this can't be approved. |

## 9. Accessibility

- Nút khóa: `accessibilityState.disabled` kèm `accessibilityHint` nói lý do bị khóa.
- Sheet duyệt đọc đủ danh sách tác động trước ô lý do.
- Hàng buổi đọc đủ lịch gốc, lịch bù, số trùng.
- Mở sheet focus tiêu đề. Kết quả đọc qua live region.

## 10. testID

`leave-review-screen`, `leave-review-back`, `leave-review-mentor`, `leave-review-status`, `leave-review-range`, `leave-review-period`, `leave-review-due`, `leave-review-reason`, `leave-review-result`, `leave-review-stale-block`, `leave-review-conflict-block`, `leave-review-session-<sourceSessionId>`, `leave-review-session-conflict-<sourceSessionId>`, `leave-review-session-open-<sourceSessionId>`, `leave-review-more`, `leave-review-class-end-<classId>`, `leave-review-approve`, `leave-review-reject`, `leave-review-approve-sheet`, `leave-review-reject-sheet`, `leave-review-approve-reason`, `leave-review-reject-reason`, `leave-review-approve-send`, `leave-review-reject-send`, `leave-review-send-error`, `leave-review-replacement-<sessionId>`, `leave-review-open-conflicts`, `leave-review-error`, `leave-review-retry`, `leave-review-refresh-alert`, `leave-review-offline`, `leave-review-not-found`, `leave-review-denied`.

## 11. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S5-01 | PENDING, `sourcesCurrent` true, count 0 | Mở | Duyệt, Từ chối đều mở; không có khối chặn |
| TC-P4-S5-02 | `sourcesCurrent` false | Mở | Khối stale; Duyệt khóa; Từ chối mở |
| TC-P4-S5-03 | `studentConflictCount` 2 | Mở | Khối trùng có số 2; Duyệt khóa; Từ chối mở; **không có ô xác nhận** |
| TC-P4-S5-04 | Cả hai | Mở | Hai khối, stale trước |
| TC-P4-S5-05 | Conflict ở trang đã tải | Xem | Hàng đúng `sourceSessionId` có "{n} trùng lịch học viên"; không có id học viên |
| TC-P4-S5-06 | `itemCount` 45, trang 1 có 20 | Mở, Xem thêm | Tiêu đề 45 buổi; gọi page 2; hàng và conflict của page 2 được gộp |
| TC-P4-S5-07 | Bấm Duyệt | Xem sheet | Số 45 từ `itemCount`, có tên Mentor, chữ không hoàn tác |
| TC-P4-S5-08 | Lý do trống | Gửi | `leave.reasonRequired`; không request |
| TC-P4-S5-09 | Hợp lệ | Gửi | Body có `expectedVersion`, `reason`, `acknowledgeStudentConflicts: false`; UUID v4 |
| TC-P4-S5-10 | 200 | Gửi | Khối kiểm tra lịch từ `replacements`; bấm mở `SessionContext` đúng id; thanh nút biến mất; toast không chứa lý do |
| TC-P4-S5-11 | 200 | Xem request sau | Invalidate đúng danh sách, số tile, lịch các lớp trong `classExtensions`, `student-schedule-conflicts`; không refetch mọi lớp |
| TC-P4-S5-12 | Vào lại đơn APPROVED | Mở | Hàng có "Đã hủy" và buổi bù từ `replacementSessionId`; không có thanh nút |
| TC-P4-S5-13 | Đang chờ response | Xem | **Không** có chữ Đã duyệt; sheet busy; Back bị chặn |
| TC-P4-S5-14 | 409 `LEAVE_VERSION_CONFLICT` | Gửi | Tải lại; giữ lý do; không tự gửi; lần sau key và version mới |
| TC-P4-S5-15 | 409 `LEAVE_STATE_CONFLICT` | Gửi | Hiện trạng thái mới; gỡ nút |
| TC-P4-S5-16 | 409 `LEAVE_REQUEST_EXPIRED` | Gửi | Hiện Hết hạn; chữ lịch không đổi |
| TC-P4-S5-17 | 409 `LEAVE_REQUEST_STALE` | Gửi | Tải lại; khối stale; không báo thành công |
| TC-P4-S5-18 | 409 `LEAVE_STUDENT_CONFLICT` | Gửi | Tải lại; khối trùng; không gửi lại với cờ true |
| TC-P4-S5-19 | 409 `LEAVE_STUDENT_CONFLICT_ACK_REQUIRED` | Gửi | Như -18 |
| TC-P4-S5-20 | 409 `LEAVE_TARGET_CONFLICT` | Gửi | Alert; đơn vẫn Chờ duyệt |
| TC-P4-S5-21 | 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | Gửi | Alert + nút mở S6 |
| TC-P4-S5-22 | 409 `LEAVE_MENTOR_INACTIVE` | Gửi | Alert riêng |
| TC-P4-S5-23 | Mất mạng sau khi gửi | Gửi | `IntentBanner`; Gửi lại cùng key, body, version; 200 hiện đúng một bộ buổi bù |
| TC-P4-S5-24 | Double tap | Gửi | Một request |
| TC-P4-S5-25 | Từ chối, lý do hợp lệ | Gửi | Body `expectedVersion`, `reason`; không có cờ ack; hiện REJECTED |
| TC-P4-S5-26 | Hai Quản lý cùng duyệt | Người sau gửi | 409; người sau thấy trạng thái mới; không có hai bộ buổi bù |
| TC-P4-S5-27 | REJECTED / WITHDRAWN / EXPIRED | Mở | Không có thanh nút; không có khối trùng; EXPIRED không có chữ tiếng Anh |
| TC-P4-S5-28 | Tên Mentor 404 | Mở | "Chưa có tên"; đơn vẫn xử lý được; tên trong sheet thay bằng "Mentor" |
| TC-P4-S5-29 | Làm mới lỗi khi PENDING | Xem | Hai nút khóa; giữ dữ liệu |
| TC-P4-S5-30 | Offline, có dữ liệu | Xem | Hai nút khóa; không "Thử lại"; có mạng lại không tự gửi |
| TC-P4-S5-31 | 404 | Mở | `leave-review-not-found` |
| TC-P4-S5-32 | 403 khi đang mở sheet | Gửi | Xóa dữ liệu và lý do; `leave-review-denied` |
| TC-P4-S5-33 | Tìm "Phân công", "Dạy thay", "Đổi" | Xem | Không có; thuộc P5 |
| TC-P4-S5-34 | Lịch sau duyệt (E2E) | Mở lịch Mentor và lớp | Buổi gốc đã hủy; buổi bù đúng giờ; refetch khi focus |

Ứng viên Maestro E2E: TC-P4-S5-01, -03, -09, -10, -12, -14, -25, -26, -34.
