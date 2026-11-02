# P2-S7 — attendance-audits · Lịch sử điểm danh

Ngày: 01/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-ATT-10; UC-MG-03. Endpoint tham chiếu: `GET /management/class-sessions/:sessionId/attendance-audits`; `GET /class-sessions/:sessionId/attendance` (tra tên).

## 1. Mục tiêu

Quản lý đọc ai đã đổi gì, lúc nào, vì sao, cho một buổi hoặc một học viên trong buổi. Chỉ đọc. **Chỉ trình bày đúng dữ liệu audit server trả**, không dựng before/after và không gộp, không suy luận. Không có version nào hiển thị.

Mẫu [H] chỉ có tên "Lịch sử chỉnh sửa điểm danh". Bố cục ghép từ token có sẵn.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Lịch sử điểm danh        ▓│
│▓    IELTS 6.5 Intensive K08  ▓│
├──────────────────────────────┤
│ [Ngô Bảo Ngọc ✕]             │  chỉ khi đang lọc
│ 24 THAY ĐỔI                  │  total server
│ ┌──────────────────────────┐ │
│ │ [Sửa]        20:15 02/11/2026│
│ │ Ngô Bảo Ngọc              │ │  14/500
│ │ Có mặt → Vắng             │ │
│ │ Bởi Phạm Thu Hà           │ │  12 secondary
│ │ Lý do: Mentor báo nhầm…   │ │  13, tối đa 3 dòng, "Xem thêm"
│ ├──────────────────────────┤ │
│ │ [Khôi phục]  09:02 03/11/2026│
│ │ Trần Hà · Học bù          │ │
│ │ Có mặt                    │ │  oldStatus null: chỉ giá trị mới
│ │ Bởi Phạm Thu Hà           │ │
│ │ Lý do: Thiếu dữ liệu…     │ │
│ │ ▸ Xem bằng chứng          │ │  chỉ khi recoveryEvidence
│ ├──────────────────────────┤ │
│ │ [Điểm danh]  18:35 02/11/2026│
│ │ Châu Khoa                 │ │
│ │ Chưa điểm danh → Có mặt   │ │
│ │ Bởi Trần Thị Linh         │ │
│ └──────────────────────────┘ │  reason null: không có dòng lý do
└──────────────────────────────┘
```

`AuditRow`: padding 12, gap 4, đường chia `--mdy-divider` giữa các hàng, thứ tự server (`occurredAt` giảm dần). Không dùng thẻ blur. Hàng không bấm được, trừ "Xem thêm" và "Xem bằng chứng".

## 3. Dữ liệu

| Nội dung | Nguồn | Khi trống |
| --- | --- | --- |
| Hành động | `action` | Nhãn phase mục 9. Lạ: sai định dạng |
| Thời gian | `occurredAt` theo giờ VN | |
| Học viên | Tra `enrollmentId` + `entryType`/`makeupPlacementId` trong snapshot | Mục 3.1 |
| Chip "Học bù" | `entryType` MAKEUP | |
| Trạng thái | `oldStatus`, `newStatus` | `oldStatus` null: chỉ hiện giá trị mới. Không vẽ mũi tên từ giá trị đoán |
| Người thực hiện | `actor.displayName` | Null: "Chưa có tên". Không hiện id |
| Lý do | `reason` | Null: **ẩn dòng**. Thao tác của Mentor được phép không có lý do; không viết "Không có lý do" như một lỗi |

### 3.1 Tên học viên (G-P2-05)

Audit không có tên. Khi mở màn gọi `GET attendance` với `pageSize` 100, tải đủ theo `total` cho bảng tra, không gọi theo từng hàng. Bảng tra không chặn danh sách.

| Tình huống | Hiển thị |
| --- | --- |
| Có `studentName` trong params, đang lọc | Dùng tên đó cho mọi hàng; không gọi bảng tra |
| Đang tra | Skeleton ở dòng tên |
| Tra lỗi | Dòng tên: "Chưa tải được tên học viên" màu secondary; kèm "Thử lại" đầu danh sách. Phần còn lại vẫn đọc được |
| Tra xong, không thấy | "Học viên không xác định". Không hiện id |
| `displayName` null | "Chưa có tên" |

### 3.2 Bằng chứng khôi phục

Khi `recoveryEvidence` khác null, "Xem bằng chứng" mở rộng ngay trong hàng:

| Trường | Nhãn |
| --- | --- |
| `evidenceNote` | Nguồn bằng chứng (toàn văn) |
| `admissionBasis` | Cơ sở vào học |
| `paidAt` | Thời điểm thanh toán |
| `oldSessionStatus` → `newSessionStatus` | Trạng thái buổi |
| `oldActualStartedAt` → `newActualStartedAt` | Giờ bắt đầu thực tế. Cũ null: chỉ hiện giá trị mới |
| `oldActualEndedAt` → `newActualEndedAt` | Giờ kết thúc thực tế. Cũ null: chỉ hiện giá trị mới |

`recoveryAuditId`, `attendanceId`, `id`, `version` không hiển thị.

## 4. Bộ lọc

- **Lựa chọn ban đầu:** trang đầu của buổi, không lọc. Mở từ nút lịch sử trên hàng S4: lọc sẵn theo học viên đó.
- Mở từ hàng regular: query `enrollmentId`. Từ hàng guest: `makeupPlacementId` (và `enrollmentId`). Backend không có query theo action hay thời gian nên **không có các bộ lọc đó**, và không lọc phía client vì sẽ sai với dữ liệu nhiều trang.
- Chip tên có nút ✕: xóa lọc, về trang 1, xóa danh sách cũ ngay, hiện skeleton. Không có màn chọn học viên trong S7, để khỏi tải toàn bộ danh sách chỉ cho việc chọn; lọc bắt đầu từ hàng ở S4.
- Response cũ về sau khi đã đổi lọc bị bỏ qua.

## 5. Phân trang và làm mới

`pageSize` 20. Tải thêm khi cuộn gần cuối, một request một lúc; lỗi thì thử lại đúng trang và giữ hàng. Tiêu đề lấy `total` server. Vì lịch sử có thể mọc thêm ở đầu giữa hai lần tải, khử trùng theo `id` khi nối. Refetch khi focus lại, kéo để làm mới.

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| AU-A | Đang tải | Skeleton 5 hàng đúng bố cục |
| AU-B | Có dữ liệu | Mục 2 |
| AU-C | Rỗng, không lọc | `history`: "Chưa có thay đổi nào cho buổi này." |
| AU-D | Rỗng, có lọc | "Chưa có thay đổi nào của {tên}." + "Xem toàn bộ" |
| AU-E | Lần đầu lỗi | `StatusBlock` + "Thử lại". Không hiện như rỗng |
| AU-F | Làm mới lỗi | Giữ hàng cùng query; `Alert` warning, mã hỗ trợ khi có |
| AU-G | Tải thêm lỗi | Giữ hàng; thử lại đúng trang |
| AU-H | 422 `ATTENDANCE_ENROLLMENT_NOT_ELIGIBLE` | Tham số lọc không thuộc buổi. Xóa lọc, tải lại toàn buổi, dòng "Không xem được lịch sử của học viên này." |
| AU-I | Offline: có dữ liệu / chưa có | Giữ hàng + cảnh báo, không "Thử lại" / `offlineEmpty` không "Thử lại", không phải rỗng |
| AU-J | 401 / 403 / 404 | Về Login / xóa dữ liệu, `StatusBlock` / xóa, "Không tìm thấy buổi học" |

Bảo mật: bằng chứng và lý do là dữ liệu nội bộ, không log, không lưu thiết bị. Khi mở rộng xong rời màn thì không giữ trạng thái mở.

## 7. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `attendance.audit.title` | Lịch sử điểm danh | Attendance history |
| `attendance.audit.count` | {{count}} THAY ĐỔI | {{count}} CHANGES |
| `attendance.audit.by` | Bởi {{name}} | By {{name}} |
| `attendance.audit.reason` | Lý do: {{reason}} | Reason: {{reason}} |
| `attendance.audit.more` / `.less` | Xem thêm / Thu gọn | Show more / Show less |
| `attendance.audit.evidenceOpen` / `.evidenceClose` | Xem bằng chứng / Ẩn bằng chứng | View evidence / Hide evidence |
| `attendance.audit.evidenceNote` | Nguồn bằng chứng | Evidence source |
| `attendance.audit.basis` | Cơ sở vào học | Admission basis |
| `attendance.audit.paidAt` | Thời điểm thanh toán | Paid at |
| `attendance.audit.sessionStatus` | Trạng thái buổi | Session status |
| `attendance.audit.actualStart` / `.actualEnd` | Giờ bắt đầu thực tế / Giờ kết thúc thực tế | Actual start / Actual end |
| `attendance.audit.nameFailed` | Chưa tải được tên học viên | Couldn't load student name |
| `attendance.audit.nameUnknown` | Học viên không xác định | Unknown student |
| `attendance.audit.empty` | Chưa có thay đổi nào cho buổi này. | No changes for this session yet. |
| `attendance.audit.emptyFilter` | Chưa có thay đổi nào của {{name}}. | No changes for {{name}} yet. |
| `attendance.audit.viewAll` | Xem toàn bộ | View all |
| `attendance.audit.filterInvalid` | Không xem được lịch sử của học viên này. | This student's history isn't available. |
| `attendance.audit.removeFilter` (a11y) | Bỏ lọc theo {{name}} | Remove filter for {{name}} |

## 8. Accessibility

- Hàng đọc thành cụm: "Sửa, 20 giờ 15 ngày 02/11/2026, Ngô Bảo Ngọc, từ Có mặt sang Vắng, bởi Phạm Thu Hà, lý do …". Mũi tên không đọc thành ký hiệu.
- "Xem bằng chứng" role `button`, có trạng thái `expanded`.
- Các nhãn bằng chứng đọc cặp nhãn–giá trị.

## 9. testID

`audit-screen`, `audit-back`, `audit-filter-chip`, `audit-filter-clear`, `audit-count`, `audit-row-<id>`, `audit-row-action-<id>`, `audit-row-time-<id>`, `audit-row-student-<id>`, `audit-row-change-<id>`, `audit-row-actor-<id>`, `audit-row-reason-<id>`, `audit-row-more-<id>`, `audit-evidence-toggle-<id>`, `audit-evidence-<id>`, `audit-name-retry`, `audit-empty`, `audit-empty-filter`, `audit-view-all`, `audit-filter-invalid`, `audit-error`, `audit-retry`, `audit-refresh-alert`, `audit-offline`, `audit-denied`, `audit-not-found`.

## 10. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P2-S7-01 | Mở từ S4 tab Tổng quan | Xem request | Không có `enrollmentId`, `makeupPlacementId` |
| TC-P2-S7-02 | `total` 24, trang 1 có 20 | Xem | "24 THAY ĐỔI"; giữ thứ tự server |
| TC-P2-S7-03 | Đủ năm `action` | Xem | Đúng nhãn và tone |
| TC-P2-S7-04 | `oldStatus` null | Xem | Chỉ giá trị mới, không có mũi tên |
| TC-P2-S7-05 | `reason` null | Xem | Không có dòng lý do |
| TC-P2-S7-06 | `actor.displayName` null | Xem | "Chưa có tên"; không hiện id |
| TC-P2-S7-07 | `occurredAt` UTC, máy múi giờ khác | Xem | Theo giờ VN |
| TC-P2-S7-08 | Lý do dài | Xem thêm | Mở toàn văn; thu gọn được |
| TC-P2-S7-09 | Có `recoveryEvidence`, giờ cũ null | Mở bằng chứng | Đủ trường; giờ cũ null chỉ hiện giá trị mới |
| TC-P2-S7-10 | `recoveryEvidence` null | Xem | Không có toggle |
| TC-P2-S7-11 | Mở từ hàng regular của S4 | Xem | Query `enrollmentId`; chip tên; không gọi bảng tra |
| TC-P2-S7-12 | Mở từ hàng guest | Xem | Query có `makeupPlacementId` |
| TC-P2-S7-13 | Đang lọc | Bấm ✕ | Về trang 1, bỏ query; hàng cũ biến mất ngay; bảng tra được gọi |
| TC-P2-S7-14 | Request lọc chậm, đã bỏ lọc, response về sau | | Chỉ hiện toàn buổi |
| TC-P2-S7-15 | Không lọc | Xem | Bảng tra gọi `pageSize=100`, đủ trang; không gọi theo hàng; tên đúng cả guest |
| TC-P2-S7-16 | Bảng tra 500 | Xem | Hàng vẫn hiện; `nameFailed`; có `audit-name-retry` |
| TC-P2-S7-17 | `enrollmentId` không có trong bảng | Xem | "Học viên không xác định"; không hiện id |
| TC-P2-S7-18 | `total` 0 | Xem | `audit-empty` |
| TC-P2-S7-19 | Lọc, `total` 0 | Xem | `audit-empty-filter`; "Xem toàn bộ" |
| TC-P2-S7-20 | 500 lần đầu | Xem | `audit-error`; không phải rỗng |
| TC-P2-S7-21 | Tải thêm lỗi trang 2 | Thử lại | Gọi lại trang 2; giữ hàng |
| TC-P2-S7-22 | Hàng mới chèn đầu giữa hai lần tải | Tải thêm | Không trùng `id` |
| TC-P2-S7-23 | 422 không thuộc buổi | Xem | Xóa lọc; `audit-filter-invalid`; tải toàn buổi |
| TC-P2-S7-24 | Offline, đã có / chưa có | Xem | Giữ + cảnh báo / `offlineEmpty`; không "Thử lại" |
| TC-P2-S7-25 | 403 khi đã có | Refetch | Xóa; `audit-denied` |
| TC-P2-S7-26 | Sau correction ở S5 | Mở S7 | Có hàng "Sửa" mới với đúng lý do, từ dữ liệu server |
| TC-P2-S7-27 | Tìm version, id, bộ lọc action | Xem | Không có |
| TC-P2-S7-28 | Đăng nhập Mentor | Tìm route | Không có `AttendanceAudits` |

Ứng viên Maestro E2E: TC-P2-S7-01, -03, -09, -11, -13, -18, -26.
