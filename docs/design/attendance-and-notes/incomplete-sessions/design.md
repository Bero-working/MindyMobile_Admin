# P2-S3 — incomplete-sessions · Buổi học cần xử lý

Ngày: 01/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-ATT-01, BR-ATT-05, BR-REPORT-01; UC-MG-02, UC-MG-03. Endpoint tham chiếu: `GET /management/class-sessions/incomplete`; `GET /manager/classes` (tra tên lớp, chọn lớp).

## 1. Mục tiêu

Quản lý thấy toàn bộ buổi đã qua giờ kết thúc mà chưa bắt đầu hoặc chưa chốt, trên các lớp OPEN/IN_PROGRESS, rồi mở từng buổi để xử lý. Màn chỉ đọc. Danh sách này **không** nói học viên vắng: buổi chưa bắt đầu không phải ABSENT.

**Lựa chọn ban đầu:** không gán `issue`, `classId`, `from`, `to`, tức toàn bộ backlog theo API (ADR-025 mục 2). Không tự giới hạn tuần. Server xếp `endsAt` tăng dần, buổi cũ nhất lên đầu; không đổi thứ tự.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Buổi học chưa hoàn tất   ▓│
│▓    4 buổi cần xử lý         ▓│  total server, ẩn khi chưa có
├──────────────────────────────┤
│ ⓘ Các buổi đã qua giờ kết    │
│   thúc nhưng chưa bắt đầu    │
│   hoặc chưa chốt.            │
│ (Tất cả)(Chưa bắt đầu)(Chưa chốt)   [≡ Lớp] │
│ ┌──────────────────────────┐ │
│ │ ┌──┐ Giao tiếp B1 · Lớp 05│ │  15/600, ẩn nếu không tra được
│ │ │T3│ Buổi 14: Unit 7   ›  │ │  13 secondary
│ │ │27│ 18:00–19:30          │ │
│ │ └──┘ Lê Văn Phúc          │ │
│ │ [Chưa chốt] Đã qua 2 ngày │ │
│ │ ⚠ Đã hết hạn Mentor sửa   │ │  deadlineExpired true
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ┌──┐ IELTS Foundation K10 │ │
│ │ │CN│ Buổi 22: Unit 11  ›  │ │
│ │ │25│ 19:00–20:30          │ │
│ │ └──┘ Đinh Công Sơn        │ │
│ │ [Chưa bắt đầu] Đã qua 4 ngày│
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- Bộ lọc `issue` dùng `Filters` có sẵn. Nút "Lớp" (`filter_list`) nằm cuối hàng, khi đã chọn đổi thành tên lớp cắt 1 dòng kèm nút xóa, vùng chạm 44.
- **Thẻ:** `Card` pressable, padding 14, gap 12, theo mẫu [H]. Không dùng blur trên thẻ lặp (ADR-025 mục 11).
- **Ô ngày:** rộng 44, nền `--mdy-surface-muted`, thứ 10/600, ngày 16/700, tháng 10.
- Bấm thẻ mở `SessionContext` với `initialTab: 'attendance'` và `classTitle` nếu có. Back về đúng filter và vị trí, refetch khi focus: buổi đã xử lý xong tự biến mất.
- Tổng ở phụ đề luôn từ `total`, không phải số đã tải, và theo filter đang chọn.

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Tên lớp | `name` của lớp có `id` = `session.classId` trong bảng tra | Ẩn dòng; **không hiện id**. Thẻ vẫn đủ nghĩa nhờ tiêu đề buổi |
| Tiêu đề buổi | `session.title` | |
| Ngày, giờ | `session.startsAt`, `.endsAt` | |
| Người dạy | `session.effectiveMentor.displayName` | Null theo P1 mục 8: "Chưa có dữ liệu người dạy". Không lấy `primaryMentor` thay |
| Chip vấn đề | `issue` | Bắt buộc có |
| Đã qua | Số ngày theo lịch Việt Nam giữa `session.endsAt` và `asOf` của response | 0 ngày: "Hôm nay". Không dùng đồng hồ máy |
| Hạn sửa | `deadlineExpired` | Mục 3.1 |
| Buổi bù | `session.makeupForSessionId` khác null | Chip info "Buổi bù" cạnh chip vấn đề |

### 3.1 `deadlineExpired`

| Giá trị | Hiển thị |
| --- | --- |
| `true` | Icon `lock_clock` + "Đã hết hạn Mentor sửa" |
| `false` | "Mentor còn sửa được đến {editableUntil}" |
| `null` | Không có dòng. Xảy ra khi chưa start, không có hạn nào để nói |

### 3.2 Tra tên lớp (G-P2-03)

DTO không có tên lớp. Không gọi API từng hàng (ADR-025 mục 5). Khi mở màn, gọi `GET /manager/classes` với `status=IN_PROGRESS` và `status=OPEN`, `pageSize` 100, tải đủ theo `total`, vì endpoint incomplete chỉ trả buổi của hai trạng thái này. Tải song song với danh sách và **không chặn** danh sách:

- Đang tra: skeleton ở dòng tên lớp.
- Tra lỗi: ẩn dòng tên lớp, không báo lỗi trên từng thẻ. Thẻ vẫn bấm được. Nút "Lớp" hiện lỗi khi mở.

Bảng tra này cũng là danh sách của sheet chọn lớp, không gọi lại. Nếu backend bổ sung `class { code, name }` thì bỏ bước tra cho tên lớp.

### 3.3 Bộ lọc

| Bộ lọc | Giá trị | Query |
| --- | --- | --- |
| Vấn đề | Tất cả / Chưa bắt đầu / Chưa chốt | bỏ `issue` / `OVERDUE_NOT_STARTED` / `STARTED_NOT_FINALIZED` |
| Lớp | Sheet danh sách lớp OPEN + IN_PROGRESS, có ô tìm cục bộ trên bảng tra | `classId` |
| Khoảng ngày | **Không làm ở P2** | `from/to` có trong DTO, tối đa 93 ngày, nhưng repo chưa có date picker; danh sách đã xếp cũ nhất lên đầu |

Đổi bộ lọc: về trang 1, xóa danh sách cũ ngay, hiện skeleton. Không giữ thẻ cũ dưới bộ lọc mới. Response cũ về sau bị bỏ qua. Lựa chọn chỉ giữ khi còn trong màn.

**Không có:** ô KPI, biểu đồ, tỷ lệ chuyên cần, số theo từng `issue`. Q-ATT-01 đã chốt chỉ làm danh sách; đếm theo từng chip lại cần gọi thêm API. Chip không có số.

### 3.4 Phân trang và làm mới

`pageSize` 20. Tải thêm khi cuộn gần cuối, chỉ một request tại một thời điểm. Refetch khi focus lại; kéo để làm mới. Danh sách có thể đổi giữa hai trang vì buổi được xử lý: khử trùng theo `sessionId` khi nối trang và luôn lấy `total` mới nhất. Không tự kết luận hết việc khi một trang rỗng mà `total` còn lớn hơn số đã tải: thử tải lại từ trang 1.

## 4. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| IS-A | Đang tải | Skeleton 4 thẻ đúng kích thước; bộ lọc dùng được; không có phụ đề số |
| IS-B | Có dữ liệu | Mục 2 |
| IS-C | Rỗng, không lọc | Khối căn giữa `task_alt`: "Không có buổi học nào cần xử lý." Đây là rỗng thật từ `total` = 0 |
| IS-D | Rỗng, có lọc | "Không có buổi phù hợp." + nút text "Xóa bộ lọc" |
| IS-E | Tải thêm: đang tải / lỗi | Giữ thẻ; skeleton footer / chữ lỗi + "Thử lại" đúng trang |
| IS-F | Lần đầu lỗi | `StatusBlock` + "Thử lại". **Không hiện như rỗng** |
| IS-G | Làm mới lỗi | Giữ thẻ của cùng query; `Alert` warning + mã hỗ trợ khi có |
| IS-H | Offline: có dữ liệu | Giữ thẻ; cảnh báo "Dữ liệu có thể đã cũ."; không "Thử lại"; bấm thẻ vẫn mở, màn sau tự xử lý offline |
| IS-I | Offline: chưa có dữ liệu | `offlineEmpty`; không "Thử lại"; không hiện rỗng |
| IS-J | 401 / 403 | Về Login / xóa dữ liệu, `StatusBlock` không quyền, "Quay lại" |
| IS-K | 422 tham số | Lỗi chung + mã hỗ trợ. Không xảy ra khi không dùng `from/to`; `classId` luôn là UUID từ bảng tra |

## 5. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `attendance.incomplete.title` | Buổi học chưa hoàn tất | Incomplete sessions |
| `attendance.incomplete.subtitle` | {{count}} buổi cần xử lý | {{count}} sessions need attention |
| `attendance.incomplete.info` | Các buổi đã qua giờ kết thúc nhưng chưa bắt đầu hoặc chưa chốt. | Sessions past their end time that haven't been started or finalized. |
| `attendance.incomplete.all` | Tất cả | All |
| `attendance.incomplete.class` | Lớp | Class |
| `attendance.incomplete.classSheet` | Chọn lớp | Choose a class |
| `attendance.incomplete.classSearch` | Tìm lớp | Search classes |
| `attendance.incomplete.classFailed` | Chưa tải được danh sách lớp. | Couldn't load classes. |
| `attendance.incomplete.past` | Đã qua {{count}} ngày | {{count}} days ago |
| `attendance.incomplete.today` | Hôm nay | Today |
| `attendance.incomplete.expired` | Đã hết hạn Mentor sửa | Mentor editing period ended |
| `attendance.incomplete.editable` | Mentor còn sửa được đến {{deadline}} | Mentor can edit until {{deadline}} |
| `attendance.incomplete.noTeacher` | Chưa có dữ liệu người dạy | No teacher data |
| `attendance.incomplete.empty` | Không có buổi học nào cần xử lý. | No sessions need attention. |
| `attendance.incomplete.emptyFilter` | Không có buổi phù hợp. | No matching sessions. |
| `attendance.incomplete.clear` | Xóa bộ lọc | Clear filters |
| `attendance.incomplete.stale` | Dữ liệu có thể đã cũ. | Data may be out of date. |

## 6. Accessibility

- Thẻ đọc thành một cụm: "Giao tiếp B1 Lớp 05, Buổi 14 Unit 7, Thứ Ba 27 tháng 10, 18:00 đến 19:30, Lê Văn Phúc, Chưa chốt, đã qua 2 ngày, đã hết hạn Mentor sửa", role `button`.
- Ô ngày ẩn khỏi trình đọc.
- Bộ lọc role `radiogroup`. Đổi lọc xong đọc kết quả "{n} buổi cần xử lý".

## 7. testID

`incomplete-screen`, `incomplete-back`, `incomplete-subtitle`, `incomplete-info`, `incomplete-filter-all`, `incomplete-filter-not-started`, `incomplete-filter-not-finalized`, `incomplete-class-filter`, `incomplete-class-clear`, `incomplete-class-sheet`, `incomplete-class-option-<classId>`, `incomplete-row-<sessionId>`, `incomplete-row-class-<sessionId>`, `incomplete-row-issue-<sessionId>`, `incomplete-row-deadline-<sessionId>`, `incomplete-empty`, `incomplete-empty-filter`, `incomplete-clear-filters`, `incomplete-error`, `incomplete-retry`, `incomplete-refresh-alert`, `incomplete-offline`, `incomplete-denied`.

## 8. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P2-S3-01 | Mở màn | Xem request | Không có `issue`, `classId`, `from`, `to` |
| TC-P2-S3-02 | `total` 45, trang 1 có 20 | Xem | Phụ đề "45 buổi cần xử lý", không phải 20 |
| TC-P2-S3-03 | Trả cả hai issue | Xem | Giữ thứ tự server; chip đúng từng hàng |
| TC-P2-S3-04 | `session.status` SCHEDULED | Xem | "Chưa bắt đầu"; không có chữ hoặc số Vắng |
| TC-P2-S3-05 | `deadlineExpired` true / false / null | Xem | Đúng ba dòng ở mục 3.1; null không có dòng |
| TC-P2-S3-06 | `effectiveMentor` null, có `primaryMentor` | Xem | "Chưa có dữ liệu người dạy"; không dùng tên mentor chính |
| TC-P2-S3-07 | `endsAt` cách `asOf` 2 ngày theo giờ VN, máy múi giờ khác | Xem | "Đã qua 2 ngày" |
| TC-P2-S3-08 | Lớp tra được | Xem | Hiện tên lớp; không gọi API theo từng hàng |
| TC-P2-S3-09 | Tra lớp 500 | Xem | Thẻ vẫn hiện, không có dòng tên lớp, không hiện id; bấm vẫn mở |
| TC-P2-S3-10 | | Chọn "Chưa chốt" | `issue=STARTED_NOT_FINALIZED`, về trang 1, thẻ cũ biến mất ngay |
| TC-P2-S3-11 | Request A chậm, đổi lọc sang B, A về sau | | Chỉ hiện B |
| TC-P2-S3-12 | | Chọn lớp | `classId` đúng; nút đổi thành tên lớp; xóa được |
| TC-P2-S3-13 | Lọc xong rỗng | Xem | `incomplete-empty-filter`; "Xóa bộ lọc" trả về toàn backlog |
| TC-P2-S3-14 | `total` 0, không lọc | Xem | `incomplete-empty` |
| TC-P2-S3-15 | 500 lần đầu | Xem | `incomplete-error`; không phải `incomplete-empty` |
| TC-P2-S3-16 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ thẻ |
| TC-P2-S3-17 | Buổi xuất hiện ở cả trang 1 và 2 | Tải thêm | Không trùng thẻ |
| TC-P2-S3-18 | | Bấm thẻ | Mở chi tiết buổi đúng `sessionId`, tab Điểm danh, có `classTitle` |
| TC-P2-S3-19 | Xử lý xong, Back | Focus | Refetch; thẻ biến mất; `total` giảm; giữ bộ lọc |
| TC-P2-S3-20 | Offline, đã có dữ liệu | Xem | Giữ thẻ; cảnh báo; không "Thử lại" |
| TC-P2-S3-21 | Offline, chưa có | Mở | `offlineEmpty`; không phải rỗng |
| TC-P2-S3-22 | 403 khi đã có dữ liệu | Refetch | Xóa thẻ; `incomplete-denied` |
| TC-P2-S3-23 | Tìm KPI, biểu đồ, số trên chip | Xem | Không có |
| TC-P2-S3-24 | Đăng nhập Mentor | Tìm route | Không có `IncompleteSessions` |

Ứng viên Maestro E2E: TC-P2-S3-01, -03, -05, -10, -14, -18, -19.
