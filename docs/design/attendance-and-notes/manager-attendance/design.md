# P2-S4 — manager-attendance · Quản lý đọc điểm danh và hành động hợp lệ

Ngày: 01/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-ATT-03, BR-ATT-10, BR-REPORT-01; UC-MG-03. Endpoint tham chiếu: `GET /class-sessions/:sessionId/context`, `GET /class-sessions/:sessionId/attendance`, `GET /class-sessions/:sessionId/attendance-candidates`.

## 1. Mục tiêu

Quản lý đọc kết quả điểm danh của một buổi, biết còn thiếu gì và mở đúng thao tác: **sửa** dữ liệu có sẵn, **khôi phục** dữ liệu còn thiếu, xem lịch sử. Slice này không tự ghi gì; thao tác chốt buổi thay (Q-P2-01) mở sheet ở S5 mục 7.

**Không tạo route mới.** S4 là phần mở rộng của màn "Chi tiết buổi học" bố cục Quản lý ([P1-S4 mục 2.1](../../teaching-workspace/session-context/design.md)). Đúng như P1-S4 mục 2.2 đã ghi: tab "Học viên" được đổi lại thành tab "Điểm danh" của mẫu [H].

## 2. Bố cục

### 2.1 Tab Tổng quan

Giữ nguyên P1, thêm ba ô số dưới thẻ đầu và nhóm "THAO TÁC" dưới nhóm thông tin.

```
┌──────────────────────────────┐
│▓ ←  Chi tiết buổi học        ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
│▓┌────────┐┌────────┐         ▓│
│ │Tổng quan││Điểm danh│        ▓│
├─┘        └┴────────┴─────────┤
│ ┌──────────────────────────┐ │
│ │ ┌──┐ Buổi 8: Line graphs [Đang diễn ra]│
│ │ │T2│ T2, 02/11/2026 · 18:30–20:00│
│ │ └──┘                      │ │
│ │ Bắt đầu thực tế 18:32     │ │
│ │ ┌─────┐┌─────┐┌─────┐     │ │
│ │ │ 10  ││  2  ││  6  │     │ │  TotalsStrip
│ │ │Có mặt││Vắng ││Chưa…│     │ │
│ │ └─────┘└─────┘└─────┘     │ │
│ └──────────────────────────┘ │
│ THÔNG TIN BUỔI HỌC           │
│ ┌──────────────────────────┐ │  như P1
│ └──────────────────────────┘ │
│ THAO TÁC                     │
│ ┌──────────────────────────┐ │
│ │ (✎) Sửa điểm danh       › │ │
│ │     Đổi kết quả của học   │ │
│ │     viên đã có trong danh │ │
│ │     sách                  │ │
│ │ (⟲) Khôi phục điểm danh › │ │
│ │     Thêm bản ghi còn thiếu│ │
│ │     từ bằng chứng lịch sử │ │
│ │ (◷) Lịch sử điểm danh   › │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 2.2 Tab Điểm danh

```
│ 2 học viên đang chờ thanh toán│  pendingPaymentCount > 0
│ nên chưa vào danh sách.       │
│ ĐIỂM DANH · 18               │
│ ┌──────────────────────────┐ │
│ │ (NB) Ngô Bảo Ngọc  [Có mặt] ◷│
│ │      Vào lúc 18:35        │ │
│ │ (TH) Trần Hà         [Vắng] ◷│
│ │ (CK) Châu Khoa [Học bù]   │ │
│ │              [Chưa điểm danh] ◷│
│ └──────────────────────────┘ │
│      Xem thêm học viên       │
```

- Hàng là `AttendanceRow` chỉ đọc. Nút `history` 20 (vùng chạm 44) mở S7 lọc theo học viên, **chỉ khi `canViewAttendanceAudits`**. Bản thân hàng không bấm được.
- Không có `MarkToggle`: sửa đi qua S5 để luôn có lý do.
- Tải thêm bằng nút, `pageSize` 20.

## 3. Nguồn dữ liệu theo trạng thái buổi

| `session.status` | Ba ô số | Tab Điểm danh |
| --- | --- | --- |
| SCHEDULED, chưa từng start | **Ẩn cả hàng ô số.** Totals 0 không phải số thật | Candidates, dòng "Danh sách tạm tính…", nhãn "HỌC VIÊN DỰ KIẾN · {total}", không có chip trạng thái. Candidates 422: "Chưa có danh sách học viên cho buổi này." |
| IN_PROGRESS | `totals` | Snapshot |
| COMPLETED | `totals` | Snapshot |
| CANCELLED, có `actualStartedAt` | `totals` | Snapshot, chỉ đọc nếu không có quyền |
| CANCELLED, chưa start | Ẩn | Như P1: "Buổi đã hủy nên không có danh sách học viên." Không gọi đường nào |
| COMPLETED, `eligible` 0 | Ô số 0 là thật, vẫn hiện | "Chưa có bản ghi điểm danh nào." + dòng gợi ý Khôi phục nếu có quyền. **Không suy thành cả lớp vắng** |

Tỷ lệ chuyên cần: **không hiện**. Dữ liệu buổi đang mở chưa phải credit đã chốt (BR-REPORT-01), và đó là việc của P7.

## 4. Nhóm Thao tác

Mỗi action chỉ hiện khi có quyền từ `session.permissions` của response hiện tại, không suy từ role hay status riêng lẻ. Không có nút disabled. Không có action nào thì ẩn cả nhóm.

| Action | Điều kiện hiện | Đích | Icon |
| --- | --- | --- | --- |
| Sửa điểm danh | `canEditAttendance` và `totals.eligible` > 0 | S5 | `edit_note` |
| Chốt buổi thay | `canFinalize` | S5 mục 7 | `task_alt` |
| Khôi phục điểm danh | `canRecover` và `session.endsAt` ≤ `asOf` (G-P2-06) | S6 | `restore` |
| Lịch sử điểm danh | `canViewAttendanceAudits` | S7 | `history` |

Dòng mô tả ngắn phân biệt rõ hai thao tác dễ nhầm. Thứ tự cố định như bảng.

**Gợi ý theo vấn đề của buổi**, dòng 12 `--mdy-text-secondary` đầu nhóm, chỉ để định hướng, không đổi quyền:

| Trạng thái | Gợi ý |
| --- | --- |
| SCHEDULED đã qua `endsAt` | "Buổi chưa được bắt đầu. Nếu buổi đã diễn ra, dùng Khôi phục điểm danh với bằng chứng." |
| IN_PROGRESS đã qua `endsAt` | "Buổi chưa được chốt." `canFinalize` true: "Mentor chốt, hoặc bạn chốt thay." `canFinalize` false: "Chờ Mentor chốt." |

Buổi thật sự không diễn ra thì việc hủy buổi thuộc P5; không có nút hủy ở đây.

**Đang tải quyền:** skeleton một hàng action. **Lỗi:** dòng "Chưa tải được thao tác." + "Thử lại"; không hiện action phỏng đoán. **Offline:** hàng action vẫn hiện nếu đã có dữ liệu cùng query, kèm "Cần kết nối mạng", mở được màn đích nhưng không gửi được.

## 5. Tải dữ liệu

| Khi | Gọi | Ghi chú |
| --- | --- | --- |
| Mở màn | Context; `attendance?page=1&pageSize=1` | Cho ô số và quyền. Bỏ qua khi CANCELLED chưa start sau khi context về |
| Mở tab Điểm danh lần đầu | `attendance?page=1&pageSize=20`, hoặc candidates nếu SCHEDULED | Đổi tab qua lại không gọi lại |
| `initialTab: 'attendance'` từ S3 | Như hai dòng trên, tab Điểm danh hiện trước | Không chờ người dùng bấm |
| Focus lại từ S5/S6 | Theo invalidate phase mục 10.1 | Không tự cuộn về đầu |

Note, audit không tải ở màn này. Response trễ của session cũ bị bỏ qua.

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| MA-A | Đang tải | Tổng quan: skeleton thẻ đầu, ô số, thông tin, một hàng action. Tab: 5 hàng skeleton |
| MA-B | Có snapshot | Mục 2 |
| MA-C | Chưa start | Mục 3 |
| MA-D | Rỗng | Mục 3 |
| MA-E | Attendance lỗi, context đã có | Thông tin buổi giữ; ô số "—" + `Alert`; tab: chữ lỗi + "Thử lại" trong tab. Không khóa tab Tổng quan |
| MA-F | Context lỗi lần đầu | `StatusBlock` trong tab Tổng quan + "Thử lại" |
| MA-G | Làm mới lỗi | Giữ dữ liệu cùng query; `Alert` warning, mã hỗ trợ khi có |
| MA-H | Tải thêm lỗi | Giữ hàng; thử lại đúng trang |
| MA-I | Offline | Phase mục 10.2 |
| MA-J | 401 / 403 / 404 | Về Login / xóa cả hai tab, `StatusBlock` / xóa, "Không tìm thấy buổi học" |

## 7. Nội dung chữ

Tái sử dụng chữ P1-S4 và phase mục 9.

| Key gợi ý | vi | en |
| --- | --- | --- |
| `attendance.manager.tab` | Điểm danh | Attendance |
| `attendance.manager.group` | ĐIỂM DANH · {{count}} | ATTENDANCE · {{count}} |
| `attendance.manager.actions` | THAO TÁC | ACTIONS |
| `attendance.manager.correct` / `.correctHint` | Sửa điểm danh / Đổi kết quả của học viên đã có trong danh sách | Edit attendance / Change results for students on the list |
| `attendance.manager.finalize` / `.finalizeHint` | Chốt buổi thay / Chốt buổi khi Mentor chưa chốt | Finalize for mentor / Finalize when the mentor hasn't |
| `attendance.manager.recover` / `.recoverHint` | Khôi phục điểm danh / Thêm bản ghi còn thiếu từ bằng chứng lịch sử | Recover attendance / Add missing records from historical evidence |
| `attendance.manager.history` | Lịch sử điểm danh | Attendance history |
| `attendance.manager.hintNotStarted` | Buổi chưa được bắt đầu. Nếu buổi đã diễn ra, dùng Khôi phục điểm danh với bằng chứng. | This session wasn't started. If it took place, use Recover attendance with evidence. |
| `attendance.manager.hintNotFinalized` | Buổi chưa được chốt. | This session hasn't been finalized. |
| `attendance.manager.hintFinalizeBoth` | Mentor chốt, hoặc bạn chốt thay. | The mentor can finalize it, or you can. |
| `attendance.manager.hintWaitMentor` | Chờ Mentor chốt. | Waiting for the mentor to finalize. |
| `attendance.manager.noRecords` | Chưa có bản ghi điểm danh nào. | There are no attendance records yet. |
| `attendance.manager.actionsFailed` | Chưa tải được thao tác. | Couldn't load actions. |
| `attendance.manager.rowHistory` (a11y) | Xem lịch sử của {{name}} | View history for {{name}} |

## 8. Accessibility

- Hai tab theo P1-S7 mục 8.
- Hàng đọc "Ngô Bảo Ngọc, Có mặt, vào lúc 18:35"; nút lịch sử là mục focus riêng.
- Hàng action đọc nhãn và mô tả, role `button`.
- `totals` đọc thành một cụm.

## 9. testID

Giữ testID P1-S4, bỏ `session-tab-students`. Thêm: `session-tab-attendance`, `manager-att-totals`, `manager-att-total-present`, `manager-att-total-absent`, `manager-att-total-unmarked`, `manager-att-pending`, `manager-att-group`, `manager-att-row-<attendanceId>`, `manager-att-row-status-<attendanceId>`, `manager-att-row-history-<attendanceId>`, `manager-att-more`, `manager-att-empty`, `manager-att-provisional`, `manager-att-candidate-<enrollmentId>-<entryType>`, `manager-att-actions`, `manager-att-hint`, `manager-att-correct`, `manager-att-finalize`, `manager-att-recover`, `manager-att-history`, `manager-att-error`, `manager-att-retry`, `manager-att-actions-error`.

## 10. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P2-S4-01 | Quản lý mở từ P1-S7 | Xem | Đúng hai tab Tổng quan, Điểm danh; không có tab Học viên, Ghi chú |
| TC-P2-S4-02 | Mở từ S3 | Xem | Tab Điểm danh hiện ngay, gọi danh sách đúng một lần |
| TC-P2-S4-03 | IN_PROGRESS, `totals` 10/2/6, `eligible` 18, trang 1 có 5 hàng | Xem | Ô 10/2/6; nhãn "ĐIỂM DANH · 18"; không đếm từ hàng |
| TC-P2-S4-04 | SCHEDULED, totals 0 | Xem | Không có ô số; tab dùng candidates kèm "tạm tính"; không có chip trạng thái |
| TC-P2-S4-05 | Mở màn, chưa bấm tab | Xem request | `attendance` chỉ `pageSize=1`; chưa gọi `pageSize=20` hay candidates |
| TC-P2-S4-06 | | Đổi tab qua lại | Danh sách gọi đúng một lần |
| TC-P2-S4-07 | Mở màn | Xem request | Không gọi `teaching-notes`, `attendance-audits` |
| TC-P2-S4-08 | Regular và guest | Xem | Chip "Học bù"; khóa theo `attendanceId` |
| TC-P2-S4-09 | Hàng UNMARKED | Xem | "Chưa điểm danh", không phải Vắng |
| TC-P2-S4-10 | COMPLETED, `eligible` 0 | Xem | Ô 0; `manager-att-empty`; không có chữ cả lớp vắng |
| TC-P2-S4-11 | `canEditAttendance` true, `eligible` 5 | Xem | Có `manager-att-correct` |
| TC-P2-S4-12 | `canEditAttendance` true, `eligible` 0 | Xem | Không có `manager-att-correct` |
| TC-P2-S4-13 | `canRecover` true, SCHEDULED, `endsAt` > `asOf` | Xem | Không có `manager-att-recover` (buổi tương lai) |
| TC-P2-S4-14 | `canRecover` true, `endsAt` ≤ `asOf` | Xem | Có `manager-att-recover` |
| TC-P2-S4-15 | `canRecover` false, status SCHEDULED, role MANAGER | Xem | Không có; chứng minh không suy từ role/status |
| TC-P2-S4-16 | `canViewAttendanceAudits` false | Xem | Không có `manager-att-history` và nút lịch sử trên hàng |
| TC-P2-S4-17 | Mọi quyền false | Xem | Ẩn cả nhóm `manager-att-actions` |
| TC-P2-S4-18 | `canFinalize` true, IN_PROGRESS đã qua giờ | Xem | Có `manager-att-finalize`; gợi ý "Mentor chốt, hoặc bạn chốt thay." |
| TC-P2-S4-19 | `canFinalize` false, IN_PROGRESS đã qua giờ | Xem | Không có `manager-att-finalize`; gợi ý "Chờ Mentor chốt." |
| TC-P2-S4-20 | SCHEDULED đã qua giờ | Xem | `manager-att-hint` gợi ý Khôi phục; chip vẫn "Theo lịch" |
| TC-P2-S4-21 | | Bấm nút lịch sử trên hàng guest | Mở S7 với `enrollmentId`, `makeupPlacementId`, tên |
| TC-P2-S4-22 | `pendingPaymentCount` 2 | Xem | Có dòng; không có hàng cho họ; không có nút thu tiền |
| TC-P2-S4-23 | Attendance 500, context có | Xem | Thông tin buổi giữ; ô "—"; không có action phỏng đoán |
| TC-P2-S4-24 | Quay về từ S5 sau khi sửa | Focus | Ô số và hàng cập nhật; giữ tab và vị trí |
| TC-P2-S4-25 | 403 khi đã có dữ liệu | Refetch | Xóa cả hai tab; `session-denied` |
| TC-P2-S4-26 | Đổi session qua S3 | Mở buổi khác | Không thấy hàng của buổi cũ, kể cả khi response cũ về sau |
| TC-P2-S4-27 | Offline, đã có dữ liệu | Xem | Giữ dữ liệu; cảnh báo; không "Thử lại"; action ghi "Cần kết nối mạng" |
| TC-P2-S4-28 | Tìm tỷ lệ chuyên cần, Vắng có phép, đổi lịch, dạy thay, hủy buổi | Xem | Không có |

Ứng viên Maestro E2E: TC-P2-S4-01, -02, -03, -04, -08, -14, -16, -18, -21, -24.
