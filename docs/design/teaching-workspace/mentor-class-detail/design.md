# P1-S3 — mentor-class-detail · Workspace lớp và chương/buổi

Ngày: 31/10/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-01, BR-TEACH-02, BR-CLASS-02, BR-CLASS-03, BR-MAT-06; UC-M-02. Endpoint tham chiếu: `GET /mentor/classes/:classId`; `GET /mentor/classes/:classId/units`; `GET /mentor/classes/:classId/sessions` (`unitId`, `page`, `pageSize`).

## 1. Mục tiêu

Mentor đọc thông tin lớp, duyệt chương và buổi trong phạm vi được giao, rồi đi tới chi tiết buổi hoặc danh sách học viên nếu server cho phép.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  IELTS Foundation K12     ▓│
│▓    IF-K12                   ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ [Đang học] [Mentor chính · Toàn lớp]│
│ │ ▤ IELTS Foundation        │ │  tên khóa học
│ │ 16 chương · 48 buổi       │ │
│ │ [ ▣ Học viên ]            │ │  chỉ khi readClassRoster
│ └──────────────────────────┘ │
│ CHƯƠNG VÀ BUỔI               │
│ ┌──────────────────────────┐ │
│ │ Chương 1 · Introduction ⌄ │ │  mở sẵn
│ │ T2  Buổi 1: Getting…      │ │  SessionRow
│ │ 02  18:30–20:00           │ │
│ │Th11 [Đã hoàn tất]       › │ │
│ │ T4  Buổi 2: Pronunciation │ │
│ │ 04  18:30–20:00           │ │
│ │Th11 Đã giao cho Lê Văn Phúc│ │  không bấm được
│ ├──────────────────────────┤ │
│ │ Chương 2 · Line graphs  › │ │  đóng
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- **Thẻ tóm tắt:** `GlassCard` padding 16, gap 10. Hàng chip tự xuống dòng khi không đủ rộng.
- **Dòng số lượng:** `visibleUnitCount`, `visibleSessionCount` là số trong phạm vi được xem. Scope CLASS: "16 chương · 48 buổi". Scope SESSION: "Bạn được giao 2 buổi trong 1 chương".
- **Nút "Học viên":** `Button secondary` cỡ 44, icon `groups`. **Chỉ hiện khi `capabilities.readClassRoster` = true.** Bấm → S5. Không hiện dạng disabled.
- **Thông báo theo scope và trạng thái** nằm giữa thẻ tóm tắt và danh sách:

| Điều kiện | Tone | Chữ |
| --- | --- | --- |
| `accessScope` = SESSION | info | Bạn dạy thay theo buổi. Bạn chỉ thấy các buổi được giao; danh sách học viên toàn lớp không khả dụng. |
| `status` = COMPLETED | info | Lớp đã kết thúc. Bạn chỉ có thể xem. |
| `status` = CANCELLED | warning | Lớp đã hủy. Bạn chỉ có thể xem lịch sử các buổi. |

- Quyền hiển thị dựa trên `accessScope`, `capabilities`, `status` của server. `readonly` đi cùng hai trạng thái kết thúc nên không cần nhãn riêng.

### 2.1 Chương dạng accordion

- Nhóm trong một `GlassCard` padding 6. Tiêu đề chương "Chương {position} · {title}" 14/600, tối đa 2 dòng, icon `expand_more` xoay 180° khi mở, chuyển động `--mdy-dur-fast`.
- Chương đầu tiên mở sẵn. Mở nhiều chương cùng lúc được. Trạng thái mở giữ nguyên khi quay lại từ S4.
- Buổi của chương **chỉ tải khi mở lần đầu**: `GET .../sessions?unitId=&pageSize=20`. Phân trang riêng trong từng chương bằng nút text "Xem thêm buổi" khi còn dữ liệu. Danh sách chương phân trang bằng `ListFooter`.
- **Không hiển thị `status` và `unlockAt` của chương**, không có biểu tượng khóa, không có nút mở khóa (BR-MAT-06, G-04).

### 2.2 Lớp đã hủy

Không gọi `GET .../units` vì server từ chối với lớp CANCELLED (G-03). Nhãn nhóm đổi thành "CÁC BUỔI", hiện danh sách buổi phẳng từ `GET .../sessions`, phân trang bằng `ListFooter`.

### 2.3 Hàng buổi

Dùng `SessionRow`.

| Điều kiện | Bấm được | Hiển thị |
| --- | --- | --- |
| `capabilities.readSessionContext` = true | Có → S4 với `classTitle` = tên lớp | Chip trạng thái + chip theo `assignmentType` nếu là SUBSTITUTE, có chevron |
| false, có `effectiveMentor` | Không | Chip trạng thái + "Đã giao cho {displayName}"; tên null → "Đã giao cho người khác" |
| false, `effectiveMentor` = null, IN_PROGRESS/COMPLETED | Không | Chip trạng thái + "Chưa có dữ liệu người dạy" |
| false, `effectiveMentor` = null, CANCELLED | Không | Chỉ chip "Đã hủy" |

Quy tắc người dạy null theo phase mục 8. Không hiện meeting link ở đây; endpoint này không trả link.

## 3. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S3-A | Đang tải thông tin lớp | Skeleton thẻ tóm tắt và 3 hàng; header hiện "Lớp học" |
| S3-B | Scope CLASS | Mục 2, có nút Học viên |
| S3-C | Scope SESSION | Không có nút Học viên, có thông báo info, chỉ chương/buổi được giao |
| S3-D | Lớp COMPLETED | Thông báo info, chương/buổi vẫn đọc |
| S3-E | Lớp CANCELLED | Mục 2.2 |
| S3-F | Không có chương | Chữ căn giữa "Lớp chưa có chương nào." |
| S3-G | Chương không có buổi | Trong chương: "Chương này chưa có buổi." |
| S3-H | Đang tải buổi của chương | 2 hàng skeleton trong chương |
| S3-I | Lỗi tải buổi của chương | Trong chương: chữ lỗi 13 + "Thử lại"; các chương khác không ảnh hưởng |
| S3-J | Lỗi lấy thông tin lớp, chưa có dữ liệu | `StatusBlock` + "Thử lại" |
| S3-K | Làm mới lỗi mạng/5xx, đã có dữ liệu | Giữ dữ liệu + `InlineAlert` warning |
| S3-L | 401 | Về Login theo P0 |
| S3-M | 403 ở bất kỳ request nào | Xóa dữ liệu; `StatusBlock` "Bạn không còn được giao lớp này"; "Quay lại" về S2 |
| S3-N | 404 lớp | Xóa dữ liệu; `StatusBlock` "Không tìm thấy lớp" |
| S3-O | 404 chương khi mở | Refetch danh sách chương |
| Conflict | Không áp dụng | Màn chỉ đọc |

## 4. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.classDetail.fallbackTitle` | Lớp học | Class |
| `teaching.classDetail.countClass` | {{units}} chương · {{sessions}} buổi | {{units}} units · {{sessions}} sessions |
| `teaching.classDetail.countSession` | Bạn được giao {{sessions}} buổi trong {{units}} chương | {{sessions}} assigned sessions in {{units}} units |
| `teaching.classDetail.students` | Học viên | Students |
| `teaching.classDetail.scopeSession` | Bạn dạy thay theo buổi. Bạn chỉ thấy các buổi được giao; danh sách học viên toàn lớp không khả dụng. | You're substituting by session. You only see assigned sessions; the whole-class student list isn't available. |
| `teaching.classDetail.completed` | Lớp đã kết thúc. Bạn chỉ có thể xem. | This class has ended. View only. |
| `teaching.classDetail.cancelled` | Lớp đã hủy. Bạn chỉ có thể xem lịch sử các buổi. | This class was cancelled. You can only view past sessions. |
| `teaching.classDetail.unitsGroup` / `.sessionsGroup` | CHƯƠNG VÀ BUỔI / CÁC BUỔI | UNITS AND SESSIONS / SESSIONS |
| `teaching.classDetail.unitTitle` | Chương {{position}} · {{title}} | Unit {{position}} · {{title}} |
| `teaching.classDetail.moreSessions` | Xem thêm buổi | More sessions |
| `teaching.classDetail.noUnits` / `.noSessions` | Lớp chưa có chương nào. / Chương này chưa có buổi. | No units yet. / No sessions in this unit. |
| `teaching.classDetail.assignedTo` / `.assignedOther` | Đã giao cho {{name}} / Đã giao cho người khác | Assigned to {{name}} / Assigned to someone else |
| `teaching.teacherMissing` | Chưa có dữ liệu người dạy | Teacher not recorded |
| `teaching.classDetail.deniedTitle` / `.deniedBody` | Bạn không còn được giao lớp này / Danh sách lớp sẽ được cập nhật khi bạn quay lại. | You're no longer assigned to this class / Your class list will update when you go back. |
| `teaching.classDetail.notFound` | Không tìm thấy lớp | Class not found |

## 5. Accessibility

- Tiêu đề chương `accessibilityRole="button"`, `accessibilityState.expanded`, label gồm tên chương.
- Hàng bấm được đọc thành một cụm; hàng không bấm được không có role `button` và đọc đủ lý do, ví dụ "Đã giao cho Lê Văn Phúc".
- `InlineAlert` scope SESSION chỉ đọc một lần khi màn mở, không đọc lại mỗi lần refetch.
- Không dùng màu làm tín hiệu duy nhất cho hàng không bấm được: thiếu chevron và có dòng chữ.

## 6. testID

`class-detail-screen`, `class-detail-back-button`, `class-detail-status`, `class-detail-scope`, `class-detail-course`, `class-detail-count`, `class-detail-students-button`, `class-detail-scope-alert`, `class-detail-readonly-alert`, `class-detail-unit-<unitId>`, `class-detail-unit-more-<unitId>`, `class-detail-session-<sessionId>`, `class-detail-session-owner-<sessionId>`, `class-detail-session-error-<unitId>`, `class-detail-no-units`, `class-detail-error`, `class-detail-retry`, `class-detail-denied`, `class-detail-not-found`, `class-detail-refresh-alert`.

## 7. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S3-01 | CLASS, `readClassRoster` true | Mở màn | Có `class-detail-students-button`; chip "Mentor chính · Toàn lớp"; "16 chương · 48 buổi" |
| TC-P1-S3-02 | SESSION, `readClassRoster` false | Mở màn | **Không có** nút Học viên; có `class-detail-scope-alert`; dòng "Bạn được giao 2 buổi trong 1 chương" |
| TC-P1-S3-03 | CLASS nhưng mock `readClassRoster` false | Mở màn | Không có nút Học viên: quyết định theo capability, không theo scope |
| TC-P1-S3-04 | Có chương | Mở màn | Chương đầu mở, chỉ gọi sessions của chương đó |
| TC-P1-S3-05 | Chương 2 đóng | Bấm chương 2 | Gọi `unitId` chương 2 đúng một lần; đóng mở lại không gọi lại |
| TC-P1-S3-06 | `readSessionContext` true | Bấm hàng buổi | Mở S4 đúng `sessionId`, `classTitle` là tên lớp |
| TC-P1-S3-07 | `readSessionContext` false, effective "Lê Văn Phúc" | Bấm hàng | Không điều hướng; hiện "Đã giao cho Lê Văn Phúc"; không có chevron |
| TC-P1-S3-08 | `effectiveMentor` null, status COMPLETED, có `primaryMentor` | Xem hàng | Hiện "Chưa có dữ liệu người dạy", **không** hiện tên mentor chính |
| TC-P1-S3-09 | Effective có `displayName` null | Xem hàng | "Đã giao cho người khác" |
| TC-P1-S3-23 | Buổi CANCELLED, `effectiveMentor` null, `readSessionContext` false | Xem, bấm hàng | Chỉ chip "Đã hủy"; không có "Chưa có dữ liệu người dạy"; không điều hướng |
| TC-P1-S3-10 | Chương có `status` LOCKED, `unlockAt` tương lai | Xem màn | Không có biểu tượng khóa, ngày mở hay nút mở khóa; buổi vẫn mở được theo capability |
| TC-P1-S3-11 | Lớp CANCELLED | Mở màn | **Không gọi** units; danh sách buổi phẳng; thông báo warning; không có lỗi |
| TC-P1-S3-12 | Lớp COMPLETED | Mở màn | Thông báo info; chương và buổi vẫn đọc được |
| TC-P1-S3-13 | Chương có 25 buổi | Bấm "Xem thêm buổi" | Gọi trang 2 của đúng `unitId`; không trùng; nút ẩn khi đủ |
| TC-P1-S3-14 | Sessions chương 1 lỗi mạng | Mở màn | Lỗi trong chương 1; thẻ tóm tắt vẫn hiện; "Thử lại" gọi lại đúng chương |
| TC-P1-S3-15 | Có `authorMaterials`, `readClassReports` true | Xem màn | Không có nút tài liệu, báo cáo, điểm danh, ghi chú |
| TC-P1-S3-16 | Thu hồi assignment trong lúc mở, 403 `MENTOR_SCOPE_REQUIRED` | Mở chương tiếp theo | Xóa dữ liệu trên màn; `class-detail-denied`; "Quay lại" về S2 |
| TC-P1-S3-17 | Thu hồi xong, app từ nền trở lại | Foreground | Refetch, 403, `class-detail-denied` |
| TC-P1-S3-18 | Lỗi 404 lớp | Mở màn | `class-detail-not-found` |
| TC-P1-S3-19 | 404 `CLASS_UNIT_NOT_FOUND` | Bấm chương | Refetch danh sách chương |
| TC-P1-S3-20 | Lỗi mạng, đã có dữ liệu | Kéo làm mới | Giữ dữ liệu; `class-detail-refresh-alert` |
| TC-P1-S3-21 | Đang mở 2 chương | Vào S4 rồi back | Vẫn mở 2 chương đó; dữ liệu refetch |
| TC-P1-S3-22 | en, theme tối, phóng chữ 1.3 | Xem màn | Chữ tiếng Anh; chip xuống dòng, không tràn |

Ứng viên Maestro E2E: TC-P1-S3-01, -02, -06, -07, -11, -16.
