# P7-S2 — manager-attendance-report · Manager đọc chuyên cần theo lớp

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-REPORT-01, BR-REPORT-02, BR-REPORT-03; UC-MG-10. Endpoint tham chiếu: `GET /management/classes/:classId/attendance-summary`.

## 1. Mục tiêu

Quản lý đọc chuyên cần từng lượt ghi danh của một lớp, đúng công thức server, thấy rõ mẫu số, các phần chưa tính và thời điểm của số liệu. Chỉ đọc; correction nằm ở P2.

UC-MG-10 ghi "chốt KPI → đọc endpoint đủ scope". Q-P7-01 đề xuất không thêm KPI: màn chỉ hiện đúng các trường server trả, không có số cấp lớp, không có ngưỡng cảnh báo.

**Lựa chọn ban đầu** (ADR-025 mục 2):

| Lựa chọn | Mặc định |
| --- | --- |
| Khoảng ngày | Toàn bộ thời gian, không gửi `from`, `to` |

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Báo cáo chuyên cần       ▓│
│▓    IELTS Foundation K12     ▓│
├──────────────────────────────┤
│ (📅 Toàn bộ thời gian)  ⓘ Cách tính│
│ 24 LƯỢT GHI DANH             │
│ Số liệu lúc 14:32 02/11/2026 │
│ ┌──────────────────────────┐ │
│ │ (NN) Ngô Bảo Ngọc  83,33%│ │
│ │ 5/6 buổi đã chốt         │ │
│ │ Có mặt 5 · Vắng 1        │ │
│ │ [Chờ học bù 1] Không tính 4│
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ (CK) Châu Minh Khoa     —│ │
│ │ Chưa có buổi đã chốt     │ │
│ │ Không tính 10            │ │
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
└──────────────────────────────┘
```

- Dùng lại `AttendanceSummaryRow`, `RateText`, `CountChips`, `RangeFilter`, `MeaningSheet`, `AsOfLine` từ S1.
- **Hàng không bấm được**: không có `chevron_right`, không có vai trò `button` (Q-P7-03, G-P7-04).
- Theo [phase mục 3](../design.md): `rate` null hiện "—"; không có dòng "Có mặt · Vắng" khi `rate` null; chip chỉ khi > 0.
- Không có tab Tiến độ: Manager không có endpoint (Q-P7-02). Không có chữ giải thích về việc này; không hiện chức năng không dùng được.
- Không sắp xếp, không tô màu theo tỷ lệ, không lọc học viên dưới ngưỡng: server không có tham số, BR chưa chốt ([phase mục 1](../design.md)).
- Thứ tự server: theo tên. `pageSize` 20, nút "Xem thêm". **Không tự tải hết trang để tính gì.**
- Lớp ở mọi trạng thái trừ DRAFT đều đọc được. DTO Manager không có `readonly`, màn cũng không cần `Alert` này (G-P7-07).
- Scope: mọi Manager active đọc mọi lớp. Route `/management` cũng nhận ADMIN, nhưng mobile không có vai trò này.

Không gọi `/manager/classes/:id/students` để bổ sung trạng thái ghi danh: không ghép được qua trang (G-P7-01), và ADR-025 mục 5 tránh gọi thêm cho thông tin phụ.

## 3. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| M-A | Đang tải trang đầu | Skeleton 4 thẻ đúng bố cục; **không hiện 0, không hiện "—"**; chưa có `AsOfLine` |
| M-B | Có dữ liệu | Mục 2 |
| M-C | Rỗng | `reports.empty` |
| M-D | Có khoảng ngày | Mọi hàng vẫn hiện (server trả mọi enrollment), đa số có thể `rate` null. Không dùng chữ rỗng |
| M-E | Lỗi lần đầu | `StatusBlock` + "Thử lại"; không hiện rỗng hay 0 |
| M-F | Làm mới lỗi | Giữ dữ liệu cùng query, `refreshFailed`; `AsOfLine` vẫn là lần tải trước |
| M-G | Tải thêm lỗi | Giữ hàng, thử lại đúng trang |
| M-H | Offline, có dữ liệu | Hiện, `stale`, `AsOfLine`; không "Thử lại" |
| M-I | Offline, chưa có dữ liệu | `offlineEmpty`; không có 0 |
| M-J | 403 | Xóa dữ liệu; `StatusBlock` không quyền |
| M-K | 404 | Xóa dữ liệu; `StatusBlock` không tìm thấy, "Quay lại" |
| M-L | 422 khoảng ngày | Phase mục 7; giữ dữ liệu khoảng trước |
| M-M | 401 | Về Login |

Kéo làm mới tải lại đúng query đang hiện, từ trang 1. Rời màn rồi quay lại: làm mới, giữ khoảng ngày.

## 4. Nội dung chữ

Chữ chung ở [phase mục 11](../design.md), "Cách tính" ở [phase mục 8](../design.md).

| Key gợi ý | vi | en |
| --- | --- | --- |
| `reports.manager.title` | Báo cáo chuyên cần | Attendance report |

## 5. Accessibility

- Hàng là một khối đọc, vai trò văn bản: "Ngô Bảo Ngọc, 83 phẩy 33 phần trăm, 5 trên 6 buổi đã chốt, có mặt 5, vắng 1, chờ học bù 1, không tính 4".
- `rate` null: "Châu Minh Khoa, chưa có buổi đã chốt, không tính 10".
- `AsOfLine` đọc đủ giờ và ngày.

## 6. testID

`manager-report-screen`, `manager-report-back`, `manager-report-range`, `manager-report-range-clear`, `manager-report-range-sheet`, `manager-report-range-from`, `manager-report-range-to`, `manager-report-range-apply`, `manager-report-meaning`, `manager-report-meaning-sheet`, `manager-report-count`, `manager-report-as-of`, `manager-report-row-<enrollmentId>`, `manager-report-row-<enrollmentId>-rate`, `manager-report-row-<enrollmentId>-denominator`, `manager-report-row-<enrollmentId>-makeup`, `manager-report-row-<enrollmentId>-unmarked`, `manager-report-row-<enrollmentId>-excluded`, `manager-report-more`, `manager-report-empty`, `manager-report-error`, `manager-report-retry`, `manager-report-offline`, `manager-report-denied`, `manager-report-not-found`, `manager-report-skeleton`.

## 7. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P7-S2-01 | Quản lý, từ tab Tổng quan | Bấm `manager-detail-report` | Mở màn; đúng 1 request `/management/classes/:id/attendance-summary?page=1&pageSize=20`; không gọi roster, sessions, progress, trang 2 |
| TC-P7-S2-02 | Đang tải | Xem | Skeleton; không có 0, không có "—" |
| TC-P7-S2-03 | Có đủ loại hàng | Xem | Mỗi hàng đúng TC-P7-SEM-01 đến 05 |
| TC-P7-S2-04 | `total` 24 | Xem | "24 lượt ghi danh"; đúng `total`, không phải số hàng đã tải |
| TC-P7-S2-05 | | Xem | `AsOfLine` từ `asOf` của response theo giờ Việt Nam, không theo đồng hồ máy |
| TC-P7-S2-06 | Có 20/45 hàng đã tải | Tìm | Không có số trung bình, tổng có mặt, số dưới ngưỡng |
| TC-P7-S2-07 | 45 enrollment | Xem thêm | Trang 2 rồi 3; không tự tải; không lặp hàng dù server trả trùng `enrollmentId` |
| TC-P7-S2-08 | Trang 2 lỗi | Xem | Giữ 20 hàng; thử lại đúng trang 2 |
| TC-P7-S2-09 | Có khoảng ngày | Xem thêm | Trang 2 giữ đúng `from`, `to` |
| TC-P7-S2-10 | Khoảng ngày không có buổi | Xem | Hàng vẫn hiện, `rate` null; không có chữ rỗng |
| TC-P7-S2-11 | Hàng | Bấm | Không có điều hướng; không có `chevron_right` |
| TC-P7-S2-12 | Toàn màn | Tìm | Không có tab Tiến độ, `%` tiến độ, chữ về stored progress |
| TC-P7-S2-13 | Hai hàng cùng `student.id` | Xem | Hiện cả hai, key theo `enrollmentId` |
| TC-P7-S2-14 | `displayName` null | Xem | "Chưa có tên" |
| TC-P7-S2-15 | Bấm `info` | | `manager-report-meaning-sheet`, đúng chữ phase mục 8 |
| TC-P7-S2-16 | Rỗng | Xem | `reports.empty` |
| TC-P7-S2-17 | 500 lần đầu | Xem | `error`, "Thử lại"; **không** hiện chữ rỗng hay 0 |
| TC-P7-S2-18 | Làm mới lỗi | Xem | Giữ dữ liệu; `refreshFailed`; `AsOfLine` không đổi |
| TC-P7-S2-19 | Offline, có dữ liệu | Xem | `stale`; không "Thử lại" |
| TC-P7-S2-20 | Offline, chưa có | Xem | `offlineEmpty`; không có 0 |
| TC-P7-S2-21 | 403 khi đã có dữ liệu | Làm mới | Xóa dữ liệu; `denied` |
| TC-P7-S2-22 | 404 | Mở | `not-found`, "Quay lại" |
| TC-P7-S2-23 | Đổi tài khoản | Xem | Không còn dữ liệu của tài khoản trước |
| TC-P7-S2-24 | E2E: cùng lớp, Mentor chính và Quản lý | So sánh | Cùng enrollment có cùng số; Quản lý chỉnh điểm danh (P2) thì lần tải sau đổi đúng |
| TC-P7-S2-25 | E2E: học bù được tính | Xem | Không đếm đôi: buổi gốc và buổi học bù tính một lần |

Ứng viên Maestro E2E: TC-P7-S2-01, -03, -04, -07, -11, -12, -21, -24, -25.
