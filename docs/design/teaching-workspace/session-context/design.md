# P1-S4 — session-context · Chi tiết buổi học theo quyền

Ngày: 31/10/2026; bố cục Quản lý cập nhật 01/11/2026 theo `Manager Mobile UI.html` [H]. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-TEACH-01, BR-TEACH-02, BR-TIME-01, BR-AUTH-04, BR-ATT-01; UC-M-02, UC-M-03, UC-MG-02. Endpoint tham chiếu: `GET /class-sessions/:sessionId/context`; học viên qua `GET /class-sessions/:sessionId/attendance-candidates` hoặc `GET /class-sessions/:sessionId/attendance` (mục 4).

## 1. Mục tiêu

Người dạy và Quản lý đọc đúng thông tin một buổi: thời gian, phòng, link, người dạy, học viên. Chỉ đọc. Mentor và Quản lý dùng chung route và dữ liệu, nhưng mỗi role một bố cục: Quản lý theo mục 2.1, Mentor theo mục 2. Quyền do server quyết định: Mentor chỉ khi đang là effective mentor, Quản lý theo role.

## 2. Bố cục Mentor

Sơ đồ này chưa được đối chiếu lại với `Mentor Mobile UI.html`; bản mock Mentor hiện đã khác (xem ghi chú 31/10/2026 trong progress phase 1).

```
┌──────────────────────────────┐
│▓ ←  Chi tiết buổi            ▓│
│▓    IELTS Foundation K12     ▓│  classTitle, ẩn nếu không có
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ [Theo lịch] [Dạy thay]    │ │
│ │ Buổi 8: Line graphs       │ │  17/600
│ │ ▦ Thứ Hai, 02/11/2026     │ │
│ │ ◷ 18:30–20:00             │ │
│ └──────────────────────────┘ │
│ ĐỊA ĐIỂM                     │
│ ┌──────────────────────────┐ │
│ │ (▣) Phòng                 │ │
│ │     Phòng 302             │ │
│ │ (▶) Link học              │ │
│ │     meet.google.com     ↗ │ │  bấm mở ngoài app
│ └──────────────────────────┘ │
│ NGƯỜI DẠY                    │
│ ┌──────────────────────────┐ │
│ │ (☺) Người dạy buổi này    │ │
│ │     Trần Thị Linh         │ │
│ │ (☺) Mentor chính của lớp  │ │
│ │     Lê Văn Phúc           │ │
│ └──────────────────────────┘ │
│ HỌC VIÊN · 18                │
│ ⓘ Danh sách tạm tính…        │
│ ┌──────────────────────────┐ │
│ │ (NB) Ngô Bảo Ngọc         │ │
│ │ (CK) Châu Minh Khoa [Học bù]│
│ └──────────────────────────┘ │
│ Giờ hiển thị theo giờ VN…    │  khi máy khác +07:00
└──────────────────────────────┘
```

- Header và panel theo [P0-S4 mục 3](../../foundation-auth/settings/design.md). Thứ tự nhóm cố định như sơ đồ.
- Thẻ đầu: `GlassCard` padding 16, gap 8. Chip theo `status` và `assignmentType` (phase mục 8). Icon `calendar_month`, `schedule` cỡ 16.
- Nhóm Địa điểm và Người dạy dùng `ListRow info`.
- Buổi bù (`makeupForSessionId` khác null): thêm chip info "Buổi bù" vào thẻ đầu. Không có link tới buổi gốc.
- Có thời gian thực tế: thêm dòng dưới giờ, "Bắt đầu thực tế {HH:mm}", "Kết thúc thực tế {HH:mm}".
- `version` không hiển thị. Model giữ nguyên giá trị đọc được để P2 dùng; không tự tăng hay giả định.
- **Không có action:** không điểm danh, không ghi chú, không dạy thay, không đổi lịch, không sửa link (Q-CLASS-02).

### 2.1 Bố cục Quản lý

Mở từ tab Buổi học của S7.

```
┌──────────────────────────────┐
│▓ ←  Chi tiết buổi học        ▓│
│▓    IELTS 6.5 Intensive K08  ▓│  classTitle, ẩn nếu không có
│▓┌────────┐┌───────┐          ▓│
│ │Tổng quan││Học viên│         ▓│  tab dính vào panel
├─┘        └┴───────┴──────────┤
│ ┌──────────────────────────┐ │
│ │ ┌──┐ Buổi 8: Line graphs [Theo lịch]│  17/600; chip góc phải
│ │ │T2│ T2, 02/11/2026 ·     │ │
│ │ │02│ 18:30–20:00          │ │
│ │ └──┘                      │ │
│ │ [Dạy thay] [Buổi bù]      │ │  chỉ khi có
│ │ Bắt đầu thực tế 18:32     │ │  chỉ khi có
│ └──────────────────────────┘ │
│ THÔNG TIN BUỔI HỌC           │
│ ┌──────────────────────────┐ │
│ │ (☺) Người dạy buổi này    │ │
│ │     Trần Thị Linh         │ │
│ │ (☺) Mentor chính của lớp  │ │  chỉ khi khác người dạy
│ │     Lê Văn Phúc           │ │
│ │ (⚲) Phòng học             │ │
│ │     Phòng 301             │ │
│ │ (▶) Link học              │ │
│ │     meet.google.com     ↗ │ │  bấm mở ngoài app
│ └──────────────────────────┘ │
│ Giờ hiển thị theo giờ VN…    │  khi máy khác +07:00
└──────────────────────────────┘
```

- **Header:** `Screen` biến thể `app`; tiêu đề "Chi tiết buổi học". Tab theo [S7 mục 2](../manager-class-detail/design.md). Mặc định Tổng quan. Tab Học viên chỉ tải khi mở lần đầu, đổi tab không gọi lại.
- **Thẻ đầu:** `GlassCard`, gap 14, padding ngang 24, dọc 16 như thẻ tóm tắt S7 sau đợt sửa spacing 31/10/2026 ([H] ghi 16).
- **Ô ngày:** rộng 52, padding dọc 8, radius 14, nền `--mdy-surface-muted`; thứ 12 `--mdy-text-secondary`, ngày 20/700. Buổi của hôm nay theo giờ Việt Nam: nền `--mdy-brand-800`, chữ `--mdy-on-brand`. Không có tháng vì dòng ngày giờ đã có.
- **Cột nội dung:** gap 4, chiếm phần còn lại, cách ô ngày 12. `session.title` 17/600; dòng ngày giờ 13 `--mdy-text-secondary`, dạng "T2, 02/11/2026 · 18:30–20:00".
- **Chip `status`:** góc phải, căn theo đỉnh, nhãn theo phase mục 8.
- **Hàng chip phụ:** gap 8, chỉ hiện khi có "Dạy thay" (SUBSTITUTE, tone info) hoặc "Buổi bù". Không hiện "Dạy chính".
- **Thời gian thực tế:** các dòng 13 `--mdy-text-secondary` dưới hàng chip phụ.
- **Nhóm "THÔNG TIN BUỔI HỌC":** nhãn và hàng thông tin như "THÔNG TIN LỚP" của S7, `GlassCard` padding 6. Thứ tự cố định như sơ đồ. Chỉ hàng link bấm được, với `open_in_new` 18 ở bên phải.
- **Hàng "Mentor chính của lớp":** ẩn khi `assignmentType` là PRIMARY và có `effectiveMentor`, vì hai hàng sẽ cùng một tên. Các trường hợp còn lại vẫn hiện.
- **Tab Học viên:** mục 4.

**Không có:** nhóm "THAO TÁC", tab Điểm danh, tab Ghi chú, số Có mặt/Vắng, dòng gợi ý về điểm danh.

### 2.2 Đối chiếu `Manager Mobile UI.html`

| Phần của mẫu | P1 | Lý do |
| --- | --- | --- |
| Header, tab trong header, thẻ đầu có ô ngày, nhóm "THÔNG TIN BUỔI HỌC" | Giữ | |
| Ba ô Có mặt / Vắng có phép / Vắng | Ẩn | Điểm danh thuộc P2-S4 (G-08) |
| Dòng gợi ý "Điểm danh… sẽ có sau khi buổi học diễn ra" | Ẩn | Hứa nội dung chưa có ở P1 |
| Tab "Điểm danh" | Thay | Thành tab "Học viên", chỉ tên và loại vào học. Giữ được đường đọc học viên hiện có mà không lộ trạng thái điểm danh. P2-S4 đổi lại thành Điểm danh |
| Tab "Ghi chú" | Ẩn | Ghi chú giảng dạy thuộc P2 (mục 10 phase). Không để tab rỗng |
| Nhóm "THAO TÁC" | Ẩn | Sửa điểm danh, lịch sử thuộc P2; buổi bù, đổi lịch, dạy thay, hủy buổi thuộc P4/P5. Màn chỉ đọc |
| Chip "Đã học" / "Hôm nay" / "Sắp tới" | Đổi | Dùng nhãn server (phase mục 8), không suy diễn ở client. "Hôm nay" chỉ thể hiện ở màu ô ngày |
| Tiêu đề "Buổi n · Unit u" | Đổi | Dùng `session.title` |
| Hàng "Mentor" | Đổi | Thành "Người dạy buổi này" theo `effectiveMentor`, không lấy mentor chính thay thế (BR-TEACH-01, BR-TEACH-02). Thêm hàng mentor chính khi khác người |
| "Chưa phân công" | Bỏ | Dùng quy tắc null ở mục 3 |
| Hàng "Nội dung · Unit · Phần" | Ẩn | Context không có trường này |
| Hàng "Link học" | Thêm | Mẫu không có. Giữ vì `roomName` null không phân biệt được buổi online và buổi thiếu phòng, mà không được suy luận hình thức học (mục 3) |
| Chip "Dạy thay", "Buổi bù", thời gian thực tế | Thêm | Mẫu không có; dữ liệu có thật và đổi nghĩa của buổi |

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Phụ đề | Param `classTitle` | Ẩn phụ đề. Context không có tên lớp (G-07) |
| Tiêu đề, ngày, giờ | `session.title`, `.startsAt`, `.endsAt` | |
| Phòng | `roomName` | "Chưa cập nhật", màu secondary |
| Link học | `meetingUrl` | Buổi SCHEDULED/IN_PROGRESS: "Chưa có link". COMPLETED/CANCELLED: **ẩn cả hàng**, vì server không trả link cho buổi đã kết thúc |
| Người dạy | `session.effectiveMentor` | null theo phase mục 8: IN_PROGRESS/COMPLETED → "Chưa có dữ liệu người dạy"; CANCELLED → ẩn hàng. **Không thay bằng `primaryMentor`** |
| Mentor chính | `session.primaryMentor` | `displayName` null → "Chưa có tên" |

- Khi `effectiveMentor.id` trùng người đang đăng nhập, giá trị đọc là "{tên} (bạn)".
- **Không suy luận hình thức học** từ phòng hay link: phòng và link đều có thể có hoặc trống.
- **Mở link:** chỉ mở `http`/`https` qua hệ điều hành, trong app chỉ hiện tên miền kèm `open_in_new`. Scheme khác: hiện "Link không hợp lệ", không bấm được. Mở thất bại: toast "Không mở được link học." Không ghi URL vào log.

## 4. Học viên của buổi

Đây là đường đọc học viên duy nhất của người dạy thay. **Không bao giờ gọi roster toàn lớp `GET /mentor/classes/:classId/students` từ màn này.**

| `session.status` | Nguồn | Hiển thị |
| --- | --- | --- |
| SCHEDULED | `attendance-candidates` | Dòng info "Danh sách tạm tính. Danh sách chính thức được chốt khi bắt đầu buổi." Đây là bản xem trước theo BR-ATT-01 |
| IN_PROGRESS, COMPLETED | `attendance` | Danh sách đã chụp khi bắt đầu. **Chỉ hiện tên và loại vào học**, không hiện trạng thái điểm danh, giờ vào, tổng hay `pendingPaymentCount` (P2, G-08) |
| CANCELLED | Không gọi | Ẩn cả nhóm Học viên |

- Tiêu đề nhóm "HỌC VIÊN · {total}" lấy `total` của server. Phân trang `pageSize` 20 bằng nút text "Xem thêm học viên".
- Hàng dùng `StudentRow` chỉ có tên; MAKEUP có chip "Học bù". `displayName` null → "Chưa có tên".
- Nhóm này tải độc lập với phần trên: nhóm lỗi không làm màn lỗi. Riêng 401/403 áp dụng cả màn theo phase mục 9.3.

**Quản lý:** nhóm này nằm trong tab Học viên, nguồn theo bảng trên.

- Nhãn nhóm "HỌC VIÊN · {total}"; chưa có `total` thì chỉ "HỌC VIÊN", không hiện số 0. Dòng "Danh sách tạm tính" giữ nguyên dưới nhãn. `GlassCard` padding 6.
- Hàng padding 8/10, gap 12: avatar 36, tên 14/500, chip "Học bù" khi MAKEUP. Hàng không bấm được.
- Không có chip trạng thái điểm danh, kể cả "Chưa điểm danh".
- **Trống:** rỗng, 422 và CANCELLED dùng khối căn giữa của [H]: padding 48/24, gap 10, ô tròn 56 nền `--mdy-brand-tint-2`, icon `groups` 26 `--mdy-link`, chữ 14 `--mdy-text-secondary`.
- **CANCELLED:** vẫn có tab để bố cục không đổi sau khi context về. Không gọi đường học viên nào; hiện "Buổi đã hủy nên không có danh sách học viên."

## 5. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| S4-A | Đang tải | Skeleton thẻ đầu và 2 nhóm; header "Chi tiết buổi" |
| S4-B | SCHEDULED, dạy chính | Mục 2, học viên tạm tính |
| S4-C | IN_PROGRESS | Có link nếu server trả; học viên theo danh sách đã chụp |
| S4-D | COMPLETED | Không có hàng link; có thời gian thực tế nếu có |
| S4-E | CANCELLED | Chip "Đã hủy", không có hàng link, không có nhóm học viên |
| S4-F | Dạy thay | Chip "Dạy thay"; người dạy khác mentor chính |
| S4-G | Thiếu người dạy (legacy) | "Chưa có dữ liệu người dạy" |
| S4-H | Thiếu phòng và link | "Chưa cập nhật", "Chưa có link" |
| S4-I | Học viên: đang tải / rỗng | 3 hàng skeleton / "Chưa có học viên trong buổi này." |
| S4-J | Học viên: 422 từ `attendance-candidates` | Dòng info "Chưa có danh sách học viên cho buổi này." Xảy ra khi lớp không còn OPEN/IN_PROGRESS |
| S4-K | Học viên: lỗi mạng/5xx | Trong nhóm: chữ lỗi + "Thử lại" |
| S4-L | Lỗi context, chưa có dữ liệu | `StatusBlock` + "Thử lại" |
| S4-M | Làm mới lỗi mạng/5xx, đã có dữ liệu | Giữ dữ liệu + `InlineAlert` warning |
| S4-N | 401 | Về Login theo P0 |
| S4-O | 403 `SESSION_ASSIGNMENT_REQUIRED` | Xóa dữ liệu, gồm cả học viên; `StatusBlock` "Bạn không còn được giao buổi này"; "Quay lại" |
| S4-P | 404 | Xóa dữ liệu; `StatusBlock` "Không tìm thấy buổi học"; "Quay lại" |
| Offline thuần | Theo S4-L/S4-M | P1 không có dữ liệu lưu thiết bị |
| Conflict | Không áp dụng | Màn chỉ đọc |

Với Quản lý: S4-A giữ tab dùng được, skeleton là thẻ đầu và nhóm thông tin. S4-E không có hàng link, tab Học viên theo mục 4. S4-F hiện hai hàng người dạy. S4-I, S4-J, S4-K nằm trong tab Học viên, tab Tổng quan giữ nguyên. S4-L nằm trong tab Tổng quan. S4-O và S4-P xóa cả hai tab.

## 6. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `teaching.session.title` | Chi tiết buổi học | Session details |
| `teaching.session.tabOverview` / `.tabStudents` | Tổng quan / Học viên | Overview / Students |
| `teaching.session.info` | THÔNG TIN BUỔI HỌC | SESSION INFORMATION |
| `teaching.session.place` | ĐỊA ĐIỂM | LOCATION |
| `teaching.session.room` / `.roomEmpty` | Phòng học / Chưa cập nhật | Room / Not provided |
| `teaching.session.cancelledNoRoster` | Buổi đã hủy nên không có danh sách học viên. | This session was cancelled, so there's no student list. |
| `teaching.session.link` / `.linkEmpty` / `.linkInvalid` | Link học / Chưa có link / Link không hợp lệ | Class link / No link yet / Invalid link |
| `teaching.session.linkOpenFailed` | Không mở được link học. | Couldn't open the class link. |
| `teaching.session.teachers` | NGƯỜI DẠY | TEACHERS |
| `teaching.session.effective` / `.primary` | Người dạy buổi này / Mentor chính của lớp | Teaching this session / Class primary mentor |
| `teaching.session.you` | {{name}} (bạn) | {{name}} (you) |
| `teaching.session.makeup` | Buổi bù | Make-up session |
| `teaching.session.actualStart` / `.actualEnd` | Bắt đầu thực tế {{time}} / Kết thúc thực tế {{time}} | Started at {{time}} / Ended at {{time}} |
| `teaching.session.students` | HỌC VIÊN · {{count}} | STUDENTS · {{count}} |
| `teaching.session.provisional` | Danh sách tạm tính. Danh sách chính thức được chốt khi bắt đầu buổi. | Provisional list. The official list is set when the session starts. |
| `teaching.session.noStudents` | Chưa có học viên trong buổi này. | No students in this session yet. |
| `teaching.session.noRoster` | Chưa có danh sách học viên cho buổi này. | No student list for this session yet. |
| `teaching.session.moreStudents` | Xem thêm học viên | More students |
| `teaching.session.deniedTitle` / `.deniedBody` | Bạn không còn được giao buổi này / Lịch của bạn sẽ được cập nhật khi bạn quay lại. | You're no longer assigned to this session / Your schedule will update when you go back. |
| `teaching.session.notFound` | Không tìm thấy buổi học | Session not found |
| `teaching.timezoneNote` | Giờ hiển thị theo giờ Việt Nam (GMT+7). | Times are shown in Vietnam time (GMT+7). |

## 7. Accessibility

- Hàng thông tin đọc thành một cụm: "Phòng, Phòng 302".
- Hàng link `accessibilityRole="link"`, label "Mở link học, meet.google.com", hint báo mở ngoài ứng dụng.
- Chip không tách focus khỏi thẻ đầu: "Buổi 8: Line graphs, Thứ Hai 02/11/2026, 18:30 đến 20:00, Theo lịch, Dạy thay".
- Hàng học viên đọc tên và "Học bù" nếu có; không có hành động nên không có role `button`.
- Nội dung không giới hạn phóng chữ, chỉ giới hạn tiêu đề header 1.3.
- Quản lý: hai tab như S7 mục 8. Ô ngày ẩn khỏi trình đọc màn hình vì dòng ngày giờ đã đọc đủ. "T2" ở dòng ngày giờ đọc thành "Thứ Hai".

## 8. testID

`session-screen`, `session-back-button`, `session-tab-overview`, `session-tab-students`, `session-title`, `session-status`, `session-assignment`, `session-date-tile`, `session-date`, `session-time`, `session-makeup-chip`, `session-actual-start`, `session-actual-end`, `session-room`, `session-link`, `session-link-empty`, `session-effective-mentor`, `session-primary-mentor`, `session-students-group`, `session-students-count`, `session-students-provisional`, `session-student-<enrollmentId>`, `session-students-more`, `session-students-empty`, `session-students-unavailable`, `session-students-cancelled`, `session-students-error`, `session-students-retry`, `session-error`, `session-retry`, `session-denied`, `session-not-found`, `session-refresh-alert`, `session-timezone-note`.

## 9. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P1-S4-01 | Mentor effective, SCHEDULED, đủ dữ liệu | Mở từ S1 | Đúng tiêu đề, ngày, giờ theo Asia/Ho_Chi_Minh, phòng, link, người dạy |
| TC-P1-S4-02 | `startsAt` 2026-11-02T11:30:00Z, máy ở Asia/Tokyo | Xem | Hiện 18:30, có `session-timezone-note` |
| TC-P1-S4-03 | SUBSTITUTE, effective ≠ primary | Xem | Chip "Dạy thay"; hai hàng người dạy đúng hai tên |
| TC-P1-S4-04 | Effective trùng user hiện tại | Xem | "Trần Thị Linh (bạn)" |
| TC-P1-S4-05 | COMPLETED, `effectiveMentor` null, có `primaryMentor` | Xem | "Chưa có dữ liệu người dạy"; **không** dùng tên mentor chính ở hàng người dạy |
| TC-P1-S4-06 | `roomName` null, `meetingUrl` null, SCHEDULED | Xem | "Chưa cập nhật", `session-link-empty`; không đoán online/offline |
| TC-P1-S4-07 | COMPLETED, `meetingUrl` null | Xem | Không có hàng link; có `session-actual-start`, `session-actual-end` |
| TC-P1-S4-08 | `meetingUrl` https | Bấm `session-link` | Gọi mở URL đúng một lần; hiển thị chỉ tên miền |
| TC-P1-S4-09 | `meetingUrl` `javascript:alert(1)` | Bấm hàng | Hiện "Link không hợp lệ"; không gọi mở URL |
| TC-P1-S4-10 | Mở URL thất bại | Bấm `session-link` | Toast "Không mở được link học." |
| TC-P1-S4-11 | `makeupForSessionId` khác null | Xem | Có `session-makeup-chip`; không có link tới buổi gốc |
| TC-P1-S4-12 | SCHEDULED | Xem | Gọi `attendance-candidates`, **không** gọi `attendance` và không gọi roster lớp; có `session-students-provisional` |
| TC-P1-S4-13 | IN_PROGRESS, item có `status` ABSENT | Xem | Gọi `attendance`; chỉ hiện tên; **không** hiện trạng thái, tổng hay `pendingPaymentCount` |
| TC-P1-S4-14 | CANCELLED | Xem | Không gọi cả hai đường học viên; Mentor: không có `session-students-group`; Quản lý: mở tab Học viên thấy `session-students-cancelled` |
| TC-P1-S4-15 | Mentor thay, SESSION | Xem | Đọc được học viên buổi; **0 lần** gọi `GET /mentor/classes/:id/students` |
| TC-P1-S4-16 | Item MAKEUP | Xem | Chip "Học bù"; khóa theo `enrollmentId` + loại vào học không trùng |
| TC-P1-S4-17 | `total` = 25 | Bấm "Xem thêm học viên" | Tải trang 2; tiêu đề giữ `total` server |
| TC-P1-S4-18 | Candidates trả 422 | Xem | `session-students-unavailable`; phần trên giữ nguyên |
| TC-P1-S4-19 | Học viên lỗi mạng | Xem, bấm "Thử lại" | `session-students-error` chỉ trong nhóm; phần trên giữ nguyên |
| TC-P1-S4-20 | Context 403 `SESSION_ASSIGNMENT_REQUIRED`, đã có dữ liệu | Quay về từ nền | Không còn dữ liệu trên màn, kể cả học viên; `session-denied` |
| TC-P1-S4-21 | Attendance 403, context đã hiện | Mở màn | Xóa toàn bộ; `session-denied` |
| TC-P1-S4-22 | Mở bằng id buổi không còn quyền | Mở màn | `session-denied`; không hiện dữ liệu cũ từ danh sách trước |
| TC-P1-S4-23 | 404 | Mở màn | `session-not-found` |
| TC-P1-S4-24 | Context lỗi mạng lần đầu | Mở, "Thử lại" | `session-error` rồi hiện dữ liệu |
| TC-P1-S4-25 | Đã có dữ liệu, 500 "req-7" | Kéo làm mới | Giữ dữ liệu; alert kèm "Mã hỗ trợ: req-7" |
| TC-P1-S4-26 | Quản lý, mở từ S7 | Xem | Bố cục mục 2.1, tiêu đề "Chi tiết buổi học", đúng hai tab, mở Tổng quan; back về S7, giữ tab và vị trí; không có action |
| TC-P1-S4-27 | Không có `classTitle` | Xem | Không có phụ đề; không gọi API khác để lấy tên |
| TC-P1-S4-28 | Mentor | Xem màn | Không có nút điểm danh, ghi chú, dạy thay, sửa link |
| TC-P1-S4-29 | Thay đổi `version` từ 3 lên 4 giữa hai lần refetch | Refetch | Model giữ 4; không hiển thị số version |
| TC-P1-S4-30 | en, theme tối | Xem | Chữ tiếng Anh, màu đúng bảng |
| TC-P1-S4-31 | Quản lý, CANCELLED, `effectiveMentor` null | Xem | Không có hàng người dạy buổi này; vẫn có hàng mentor chính |
| TC-P1-S4-32 | Mentor thay, scope SESSION, buổi SCHEDULED được giao, context có `meetingUrl` | Mở từ S1, bấm `session-link` | Link lấy từ context của buổi; mở đúng URL; không gọi route lớp hay roster lớp để lấy link |
| TC-P1-S4-33 | Quản lý, mở màn, chưa bấm tab | Xem | Chỉ gọi context; chưa gọi `attendance-candidates` hay `attendance` |
| TC-P1-S4-34 | Quản lý, có học viên | Đổi tab qua lại | Đường học viên gọi đúng một lần; tab Tổng quan giữ nguyên |
| TC-P1-S4-35 | Quản lý, buổi hôm nay theo giờ Việt Nam, SCHEDULED, máy khác múi giờ | Xem | `session-date-tile` nổi bật; chip vẫn "Theo lịch", không có "Hôm nay" |
| TC-P1-S4-36 | Quản lý, PRIMARY, có `effectiveMentor` | Xem | Có `session-effective-mentor`; không có `session-primary-mentor` và chip "Dạy chính" |
| TC-P1-S4-37 | Quản lý, COMPLETED, `attendance` có trạng thái, có ghi chú ở server | Xem cả hai tab | Không có Có mặt, Vắng, "Chưa điểm danh", ghi chú, tab Điểm danh, tab Ghi chú, "THAO TÁC" |

Ứng viên Maestro E2E: TC-P1-S4-01, -03, -07, -12, -15, -20, -26, -32, -37.
