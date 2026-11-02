# P6-S1 — quiz-list · Quiz theo lớp và buổi

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-QUIZ-01, BR-QUIZ-04, BR-TEACH-02; UC-M-11. Endpoint tham chiếu: `GET /mentor/classes/:classId/assignments`; `GET /mentor/class-sessions/:sessionId/assignments`; `GET /mentor/classes/:classId`; `GET /mentor/classes/:classId/sessions`; `GET /class-sessions/:sessionId/context`.

## 1. Mục tiêu

Mentor thấy các quiz thuộc lớp hoặc buổi mình được giao, biết quiz nào đang nháp, đã công bố hay đã lưu trữ, rồi mở chi tiết hoặc tạo quiz mới. Mentor dạy thay chỉ thấy quiz của buổi được giao; server giới hạn việc này.

**Lựa chọn ban đầu** (ADR-025 mục 2):

| Lựa chọn | Mặc định |
| --- | --- |
| Trạng thái | Tất cả, không gửi `status` |
| Buổi (khi vào từ lớp) | Tất cả buổi, không gửi `sessionId` |
| Loại | Luôn `type=QUIZ`, không có bộ lọc |

## 2. Bố cục

**Quiz của lớp:**

```
┌──────────────────────────────┐
│▓ ←  Quiz                     ▓│
│▓    IELTS Foundation K12     ▓│
├──────────────────────────────┤
│ [ + Tạo quiz ]               │
│ (Tất cả)(Nháp)(Đã công bố)(Đã lưu trữ) → │ cuộn ngang
│ (📅 Tất cả buổi ▾)           │
│ 12 QUIZ                      │
│ ┌──────────────────────────┐ │
│ │ Kiểm tra Unit 8    [Nháp] │ │
│ │ [Kiểm tra]                │ │
│ │ 📅 Buổi 8 · Line graphs   │ │
│ │ ★ 10 điểm · ⏱ 30 phút     │ │
│ │ ⏰ Hạn 18:30 30/10/2026    │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Từ vựng Unit 7 [Đã công bố]│
│ │ [Bài về nhà]              │ │
│ │ 📅 Buổi 7 · Bar charts    │ │
│ │ ★ 10 điểm · ⏱ Không giới hạn│
│ │ ⏰ Không có hạn nộp        │ │
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
└──────────────────────────────┘
```

**Mở từ trang chủ:** chưa có `classId` nên hiện màn chọn lớp trước (header "Quiz" / "Chọn lớp"), lọc theo trạng thái lớp. Chọn lớp thì mở danh sách quiz của lớp đó.

**Quiz của buổi:** hiện chưa có lối vào từ UI. Header là "Quiz của buổi" / tên buổi. Không có chip "Tất cả buổi" và không có dòng buổi trên thẻ. Vẫn có bộ lọc trạng thái.

- **Tạo quiz:** `Button` primary, icon `add`. Từ buổi: mở S2 ngay. Từ lớp: mở sheet chọn buổi (mục 2.3). **Ẩn hẳn** khi lớp COMPLETED hoặc CANCELLED, hoặc buổi CANCELLED; lúc đó có `Alert` info `quiz.list.readonly`. Trong lúc chưa biết trạng thái lớp: chưa hiện nút.
- **Scope SESSION:** thêm `Alert` info "Bạn dạy thay nên chỉ thấy quiz của các buổi được giao."
- **Không có trên thẻ:** số câu (G-P6-05), người tạo (G-P6-03), số lượt làm và điểm (G-P6-02), nút thao tác nhanh.

### 2.1 Thẻ quiz

Cả thẻ bấm được, mở S3.

| Vị trí | Nội dung | Nguồn |
| --- | --- | --- |
| Hàng 1 | Tiêu đề 15/600 tối đa 2 dòng, chip trạng thái | `title`, `status` |
| Hàng 2 | Chip mục đích | `purpose` |
| Hàng 3 | Tên buổi 13, chỉ ở quiz của lớp | Tra `sessionId` trong bảng tra; không có thì ẩn dòng, không hiện id |
| Hàng 4 | Thang điểm, thời gian làm | `QuizConfigLines` |
| Hàng 5 | Hạn nộp | `QuizConfigLines`. `dueAt` đã qua và `status` DRAFT: màu danger kèm icon `warning`, vì sẽ không công bố được |

Bảng tra buổi là trang đầu `pageSize=100`, song song và không chặn. Lớp có hơn 100 buổi thì có thể thiếu tên buổi ở một số thẻ; không tải thêm trang chỉ để tra tên.

### 2.2 Thứ tự, phân trang, bộ lọc

- Giữ thứ tự server: `createdAt` mới nhất trước. Không sắp lại.
- `pageSize` 20, nút "Xem thêm". Tải thêm giữ hàng cũ; lỗi thử lại đúng trang. Khử trùng theo `id` khi ghép trang.
- Số đầu danh sách là `total` của query đang hiện, chỉ hiện khi đã có dữ liệu. Chip trạng thái không có số (ADR-025 mục 4).
- Trạng thái: `Filters` dùng chung, cuộn ngang, testID `quiz-list-filter-<STATUS>`; chọn đúng một, mỗi lựa chọn là một filter server.
- Buổi: chip nhỏ cùng kiểu `Filters`, icon `calendar_month` và `expand_more`, mở `Sheet` như mục 2.3, không có câu dẫn, thêm hàng đầu "Tất cả buổi". Chọn buổi thì chip đổi thành tên buổi kèm nút `close`; gửi thêm `sessionId`.
- Không có quiz: khối trống không có thẻ, gồm icon `edit_note` và câu thông báo căn giữa.

### 2.3 Sheet chọn buổi khi tạo

```
┌──────────────────────────────┐
│ Tạo quiz cho buổi nào?       │
│ ┌──────────────────────────┐ │
│ │ Buổi 9 · Maps            │ │
│ │ 18:30 04/11/2026 [Sắp dạy]│ │
│ ├──────────────────────────┤ │
│ │ Buổi 8 · Line graphs     │ │
│ │ 18:30 02/11/2026 [Đã xong]│ │
│ ├──────────────────────────┤ │
│ │ Buổi 7 · Bar charts      │ │
│ │ 18:30 28/10 [Đã hủy] 🔒   │ │ khóa, không chọn được
│ └──────────────────────────┘ │
│ ( Xem thêm )                 │
└──────────────────────────────┘
```

- Tải khi mở sheet: `GET /mentor/classes/:classId/sessions` trang 1, dùng lại query của bảng tra nếu có. Thứ tự server.
- Buổi CANCELLED hiện nhưng khóa, không lọc bỏ, để Mentor không tưởng thiếu dữ liệu. Buổi COMPLETED chọn được: backend cho tạo quiz sau buổi.
- Chọn buổi: đóng sheet, mở S2 với `sessionId`, `sessionTitle`.
- Lỗi: hiện trong sheet, danh sách quiz không bị ảnh hưởng.

## 3. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| L-A | Đang tải trang đầu | Skeleton 3 thẻ đúng bố cục; không hiện số |
| L-B | Có dữ liệu | Mục 2 |
| L-C | Rỗng, không lọc, ghi được | `quiz.list.empty` + nút Tạo quiz đã có ở đầu màn |
| L-D | Rỗng, không lọc, chỉ đọc | `quiz.list.emptyReadonly` |
| L-E | Rỗng, có lọc trạng thái hoặc buổi | `quiz.list.emptyFilter` + "Xem tất cả" |
| L-F | Lỗi lần đầu | `StatusBlock` + "Thử lại"; không hiện rỗng |
| L-G | Làm mới lỗi | Giữ dữ liệu cùng query, `Alert` "Chưa cập nhật được." |
| L-H | Tải thêm lỗi | Giữ hàng, thử lại đúng trang |
| L-I | Offline, có dữ liệu | Hiện, kèm `quiz.stale`, không "Thử lại"; nút Tạo quiz khóa, có `quiz.needOnline` |
| L-J | Offline, chưa có dữ liệu | `quiz.offlineEmpty`; không hiện rỗng |
| L-K | 403 | Xóa dữ liệu; `StatusBlock` không quyền |
| L-L | 404 lớp hoặc buổi | Xóa dữ liệu; `StatusBlock` không tìm thấy |
| L-M | 401 | Về Login |

Kéo làm mới tải lại đúng query đang hiện. Quay về từ S2, S3 làm mới trang đầu, giữ bộ lọc và vị trí cuộn. Quiz vừa xóa biến mất khỏi danh sách.

## 4. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `quiz.list.title` | Quiz | Quizzes |
| `quiz.list.sessionTitle` | Quiz của buổi | Session quizzes |
| `quiz.list.create` | Tạo quiz | Create quiz |
| `quiz.list.pickSession` | Tạo quiz cho buổi nào? | Which session is this quiz for? |
| `quiz.list.allSessions` | Tất cả buổi | All sessions |
| `quiz.list.count` | {{count}} quiz | {{count}} quizzes |
| `quiz.list.all` | Tất cả | All |
| `quiz.list.substitute` | Bạn dạy thay nên chỉ thấy quiz của các buổi được giao. | You're substituting, so you only see quizzes for your assigned sessions. |
| `quiz.list.readonly` | Lớp đã kết thúc hoặc buổi đã hủy nên chỉ xem được quiz. | The class has ended or the session was cancelled, so quizzes are read-only. |
| `quiz.list.empty` | Chưa có quiz nào. | No quizzes yet. |
| `quiz.list.emptyReadonly` | Lớp này không có quiz nào. | This class has no quizzes. |
| `quiz.list.emptyFilter` | Không có quiz nào khớp bộ lọc. | No quizzes match this filter. |
| `quiz.list.showAll` | Xem tất cả | Show all |
| `quiz.list.refreshFailed` | Chưa cập nhật được. | Couldn't refresh. |
| `quiz.list.more` | Xem thêm | Show more |

Nhãn trạng thái, mục đích và dòng cấu hình ở phase mục 5, 8.

## 5. Accessibility

- Thẻ đọc một câu: "Kiểm tra Unit 8, nháp, loại kiểm tra, buổi 8 Line graphs, 10 điểm, 30 phút, hạn 18 giờ 30 ngày 30 tháng 10".
- Chip trạng thái dùng vai trò `radio`.
- Buổi bị khóa trong sheet có `accessibilityState.disabled` và đọc "đã hủy".

## 6. testID

`quiz-list-screen`, `quiz-list-back`, `quiz-list-create`, `quiz-list-status-all`, `quiz-list-status-draft`, `quiz-list-status-published`, `quiz-list-status-archived`, `quiz-list-session`, `quiz-list-session-clear`, `quiz-list-session-sheet`, `quiz-list-session-<sessionId>`, `quiz-list-count`, `quiz-list-row-<id>`, `quiz-list-row-<id>-status`, `quiz-list-row-<id>-purpose`, `quiz-list-row-<id>-session`, `quiz-list-row-<id>-due`, `quiz-list-more`, `quiz-list-empty`, `quiz-list-empty-filter`, `quiz-list-show-all`, `quiz-list-error`, `quiz-list-retry`, `quiz-list-offline`, `quiz-list-denied`, `quiz-list-not-found`, `quiz-list-skeleton`, `quiz-list-readonly`, `quiz-list-substitute`.

## 7. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P6-S1-01 | Từ lớp | Mở | Đúng 1 request `/mentor/classes/:id/assignments?type=QUIZ&page=1&pageSize=20`; không có `status`, `sessionId`; không gọi chi tiết từng quiz |
| TC-P6-S1-02 | Từ buổi | Mở | Đúng 1 request `/mentor/class-sessions/:id/assignments?type=QUIZ&…`; không gọi danh sách buổi; không có chip buổi |
| TC-P6-S1-03 | Đang tải | Xem | Skeleton; không hiện số 0 hay chữ rỗng |
| TC-P6-S1-04 | Có đủ 3 trạng thái | Xem | Mỗi thẻ đúng tiêu đề, chip trạng thái, chip mục đích |
| TC-P6-S1-05 | `maxScore` `"7.50"`, vi / en | Xem | "7,5 điểm" / "7.5 points"; `"10.00"` là "10 điểm" |
| TC-P6-S1-06 | `dueAt`, `timeLimitMinutes` null | Xem | "Không có hạn nộp", "Không giới hạn thời gian"; không có "null" |
| TC-P6-S1-07 | DRAFT có `dueAt` đã qua theo header `Date`, đồng hồ máy lệch | Xem | Dòng hạn màu danger, có icon; theo header, không theo máy |
| TC-P6-S1-08 | PUBLISHED có `dueAt` đã qua | Xem | Không có cảnh báo |
| TC-P6-S1-09 | Bảng tra buổi có `sessionId` | Xem | Đúng tên buổi |
| TC-P6-S1-10 | Bảng tra lỗi hoặc không có `sessionId` | Xem | Danh sách vẫn hiện; ẩn dòng buổi; không hiện id |
| TC-P6-S1-11 | Backend có thêm ZIP nháp | Xem | Mọi request có `type=QUIZ`; không có chữ ZIP trên màn |
| TC-P6-S1-12 | Bấm "Đã công bố" | | Request mới có `status=PUBLISHED`; không hiện dữ liệu của filter trước trong lúc tải |
| TC-P6-S1-13 | Chọn buổi trong sheet lọc | | Gửi thêm `sessionId`; chip có tên buổi; `close` về tất cả |
| TC-P6-S1-14 | 45 quiz | Xem thêm | Trang 2 rồi 3; không song song; không lặp hàng dù server trả trùng id |
| TC-P6-S1-15 | Trang 2 lỗi | Xem | Giữ 20 hàng; thử lại đúng trang 2 |
| TC-P6-S1-16 | Mentor dạy thay | Xem | Có `quiz-list-substitute`; chỉ thấy dữ liệu server trả; có nút Tạo quiz |
| TC-P6-S1-17 | Lớp COMPLETED | Xem | Không có `quiz-list-create`, có `quiz-list-readonly`; danh sách vẫn đọc được |
| TC-P6-S1-18 | Buổi CANCELLED, từ buổi | Xem | Như trên |
| TC-P6-S1-19 | Đang tải chi tiết lớp | Xem | Chưa có nút Tạo quiz |
| TC-P6-S1-20 | Từ buổi | Bấm Tạo quiz | Mở S2 đúng `sessionId`; không có sheet |
| TC-P6-S1-21 | Từ lớp | Bấm Tạo quiz | Sheet chọn buổi; buổi CANCELLED khóa; COMPLETED chọn được; chọn mở S2 đúng buổi |
| TC-P6-S1-22 | Sheet lỗi | Xem | Lỗi trong sheet; danh sách còn nguyên |
| TC-P6-S1-23 | Rỗng, không lọc, ghi được | Xem | `quiz-list-empty`, nút Tạo quiz vẫn có |
| TC-P6-S1-24 | Rỗng, có lọc | Bấm "Xem tất cả" | Về Tất cả, Tất cả buổi |
| TC-P6-S1-25 | 500 lần đầu | Xem | `quiz-list-error`, "Thử lại"; **không** hiện chữ rỗng |
| TC-P6-S1-26 | Làm mới lỗi | Xem | Giữ dữ liệu; `refreshFailed` |
| TC-P6-S1-27 | Offline, có dữ liệu | Xem | Cảnh báo; không "Thử lại"; nút tạo khóa |
| TC-P6-S1-28 | Offline, chưa có | Xem | `offlineEmpty`; không hiện rỗng |
| TC-P6-S1-29 | 403 khi đã có dữ liệu | Làm mới | Xóa dữ liệu; `quiz-list-denied` |
| TC-P6-S1-30 | Bấm thẻ | Back | Mở S3 đúng id; Back giữ bộ lọc, vị trí cuộn; danh sách làm mới |
| TC-P6-S1-31 | Thẻ quiz | Xem | Không có số câu, người tạo, điểm, số lượt làm, nút thao tác |
| TC-P6-S1-32 | Đổi tài khoản | Xem | Không còn dữ liệu của tài khoản trước |

Ứng viên Maestro E2E: TC-P6-S1-01, -02, -04, -11, -12, -14, -16, -17, -21, -30.
