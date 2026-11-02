# P6-S3 — quiz-detail · Đọc, công bố, lưu trữ, xóa nháp

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-QUIZ-01–04, BR-AUTH-04; UC-M-11. Endpoint tham chiếu: `GET`, `DELETE /mentor/assignments/:assignmentId`; `POST /mentor/assignments/:assignmentId/publish`; `POST /mentor/assignments/:assignmentId/archive`; `GET /class-sessions/:sessionId/context`; `GET /mentor/classes/:classId`.

## 1. Mục tiêu

Mentor xem đúng nội dung đang lưu trên server, gồm đáp án, rồi công bố cho học viên hoặc lưu trữ khi không dùng nữa. Đây là nơi duy nhất có thao tác đổi trạng thái, và cũng là cửa duy nhất đi tới công bố, để Mentor luôn đọc lại trước khi đóng băng.

Màn không có điểm, số bài nộp hay tỷ lệ đúng: backend chưa có endpoint và tiêu chí P6-S3 cấm tự dựng (G-P6-02).

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Chi tiết quiz            ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Kiểm tra Unit 8          │ │
│ │ [Nháp] [Kiểm tra]        │ │
│ │ 📅 Buổi 8 · Line graphs   │ │
│ │ ★ 10 điểm                 │ │
│ │ ⏰ Hạn 18:30 30/10/2026    │ │
│ │ ⏱ 30 phút                 │ │
│ │ ↻ Mỗi học viên làm 1 lượt │ │
│ │ Mô tả ôn tập phần line…   │ │
│ └──────────────────────────┘ │
│ ⚠ Hạn nộp đã qua. Sửa hạn…   │ chỉ khi DRAFT và đã quá hạn
│ 12 CÂU HỎI      (👁 Ẩn đáp án)│
│ ┌──────────────────────────┐ │
│ │ 1. Which line shows the  │ │
│ │    highest growth?       │ │
│ │  A  Line A               │ │
│ │  B  Line B  ✓ Đáp án đúng│ │
│ │  C  Line C               │ │
│ │  D  Line D               │ │
│ └──────────────────────────┘ │
│ ⓘ Điểm và bài nộp chưa xem   │
│   được trên ứng dụng.        │
├──────────────────────────────┤
│ [ Công bố ]                  │
│ ( ✎ Sửa )    ( 🗑 Xóa nháp ) │
└──────────────────────────────┘
```

### 2.1 Thẻ thông tin

- Tiêu đề 17/600, không giới hạn dòng. Chip trạng thái và chip mục đích.
- Dòng buổi từ context. Context lỗi: ẩn dòng, màn vẫn dùng được.
- `publishedAt` có giá trị: thêm dòng "Công bố {HH:mm dd/MM/yyyy}".
- `description` trống: không có khối mô tả. Dài hơn 4 dòng: "Xem thêm" mở rộng tại chỗ.
- "Mỗi học viên làm 1 lượt" là chữ cố định theo `maxAttempts`; `maxAttempts` khác 1 ở QUIZ là phản hồi sai định dạng.

### 2.2 Câu hỏi và đáp án

- Hiện đủ câu theo `position`, danh sách ảo hóa. Không phân trang vì GET trả toàn bộ.
- Mỗi câu dùng `QuestionReadView`. Lựa chọn đúng có `check_circle`, chữ "Đáp án đúng" và tone success. Không chỉ dùng màu.
- **Công tắc "Ẩn đáp án" / "Hiện đáp án":**

| `status` | Mặc định | Lý do |
| --- | --- | --- |
| DRAFT | Hiện | Mentor đang kiểm tra đáp án trước khi công bố |
| PUBLISHED, ARCHIVED | Ẩn | Học viên đang làm hoặc đã có thể nhìn màn hình của Mentor |

Trạng thái công tắc chỉ ở bộ nhớ của màn, không lưu. Khi ẩn, các lựa chọn hiện như nhau và vẫn đọc được nội dung.

- **Chưa có câu:** thay danh sách bằng "Chưa có câu hỏi nào." + "Soạn câu hỏi" (mở S2, tab Câu hỏi). "Công bố" khóa, kèm dòng "Quiz cần ít nhất 1 câu hỏi."

### 2.3 Thanh hành động

| `status` | Lớp và buổi còn mở | Lớp đã đóng hoặc buổi đã hủy |
| --- | --- | --- |
| DRAFT | Công bố (primary), Sửa, Xóa nháp (danger) | Không có nút; `Alert` `quiz.closed` |
| PUBLISHED | Lưu trữ (danger, outline) | Như trên |
| ARCHIVED | Không có nút; `Alert` `quiz.detail.archivedNote` | Như vậy |

Trong lúc chưa tải xong context và chi tiết lớp: nút vẫn hiện theo `status`. Nếu các request phụ lỗi, nút vẫn hiện, server quyết định và trả `ASSIGNMENT_CLOSED` nếu cần. Không chặn thao tác vì một request phụ.

Dòng "Điểm và bài nộp chưa xem được trên ứng dụng." chỉ hiện ở PUBLISHED và ARCHIVED.

## 3. Công bố

`ConfirmationDialog`, không có ô nhập:

```
Công bố quiz này?
Kiểm tra Unit 8
12 câu · 10 điểm · 30 phút
Hạn 18:30 30/10/2026

Học viên của buổi sẽ thấy và làm được ngay.
Sau khi công bố không sửa được nội dung, số câu
và cấu hình.

( Hủy )  [ Công bố ]
```

- Số câu và cấu hình lấy từ GET gần nhất của màn, không từ form S2.
- Dùng đúng `revision` của GET đó, nên Mentor chỉ công bố được bản đang nhìn thấy.
- **Hạn đã qua, biết trước khi bấm:** `Alert` warning `quiz.detail.duePast` + "Sửa hạn nộp" mở S2, tab Thông tin. Nút Công bố vẫn bấm được: đồng hồ client có thể sai, server quyết định.
- Thành công: toast, **GET lại** vì response không có `questions`, chip đổi, công tắc đáp án về Ẩn. Không về danh sách.
- Không nói "học viên sẽ nhận thông báo": P6 không có đảm bảo về thông báo (BR-REPORT-03).

| Lỗi | Hành vi |
| --- | --- |
| 422 `QUIZ_QUESTIONS_REQUIRED` | Đóng dialog; "Quiz cần ít nhất 1 câu hỏi." + "Soạn câu hỏi"; GET lại |
| 422 `INVALID_ASSIGNMENT_DEADLINE` | Đóng dialog; `duePast` + "Sửa hạn nộp" |
| 409 `ASSIGNMENT_VERSION_CONFLICT` | Đóng dialog; GET lại; `quiz.conflict`. Không tự gửi |
| 409 `ASSIGNMENT_CONTENT_FROZEN` | Đóng dialog; GET lại; hiện theo trạng thái mới |
| 409 `ASSIGNMENT_CLOSED` | Đóng dialog; ẩn nút; `quiz.closed` |
| Timeout | Phase mục 6.2 |

## 4. Lưu trữ

`Sheet` có ô bắt buộc:

```
Lưu trữ quiz này?
• Học viên không còn thấy và làm được quiz.
• Lượt đang làm dở sẽ bị hủy. Bài đã nộp vẫn giữ.
• Không mở lại được.

Lý do *
[                            ]

( Hủy )  [ Lưu trữ ]
```

- Lý do 1–2000 ký tự sau trim. Lỗi: "Nhập lý do." Lý do chỉ lưu ở audit và **không đọc lại được** (G-P6-09), nên không hiện về sau.
- Không có số học viên đang làm: backend không có số này.
- Thành công: toast, GET lại, chip đổi. Không về danh sách.
- Timeout: phase mục 6.2; khóa ô lý do đến khi có kết quả.
- 409 `ASSIGNMENT_STATE_CONFLICT`: đóng sheet, GET lại, hiện theo trạng thái mới.

## 5. Xóa nháp

`ConfirmationDialog` danger: "Xóa bản nháp này? Không khôi phục được." Gửi `DELETE` kèm body `expectedRevision`. Thành công (204): toast, về màn trước, danh sách làm mới. 409 version: như mục 3. Timeout: phase mục 6.2. Không có xóa với PUBLISHED hay ARCHIVED; server trả `ASSIGNMENT_CONTENT_FROZEN`.

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| D-A | Đang tải | Skeleton đúng bố cục; không có nút |
| D-B | DRAFT | Mục 2, đáp án hiện |
| D-C | DRAFT, chưa có câu | Mục 2.2 |
| D-D | DRAFT, quá hạn | Mục 3 |
| D-E | PUBLISHED | Lưu trữ; đáp án ẩn |
| D-F | ARCHIVED | Không có nút; đáp án ẩn |
| D-G | Lớp đóng hoặc buổi hủy | Không có nút; `quiz.closed` |
| D-H | Chưa rõ kết quả | `IntentBanner`; mọi nút khóa |
| D-I | Offline, có dữ liệu | Hiện, `quiz.stale`; nút khóa, `quiz.needOnline` |
| D-J | Offline, chưa có dữ liệu | `quiz.offlineEmpty` |
| D-K | Lỗi lần đầu | `StatusBlock` + "Thử lại" |
| D-L | Làm mới lỗi | Giữ dữ liệu, `Alert` "Chưa cập nhật được." |
| D-M | 403 | Xóa dữ liệu; `StatusBlock` không quyền |
| D-N | 404 | Xóa dữ liệu; `StatusBlock` không tìm thấy, "Quay lại" |
| D-O | 401 | Về Login |

Kéo làm mới tải lại chi tiết. Quay về từ S2 tải lại.

## 7. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `quiz.detail.title` | Chi tiết quiz | Quiz details |
| `quiz.detail.publishedAt` | Công bố {{time}} | Published {{time}} |
| `quiz.detail.oneAttempt` | Mỗi học viên làm 1 lượt | One attempt per student |
| `quiz.detail.count` | {{count}} câu hỏi | {{count}} questions |
| `quiz.detail.showAnswers` | Hiện đáp án | Show answers |
| `quiz.detail.hideAnswers` | Ẩn đáp án | Hide answers |
| `quiz.detail.correct` | Đáp án đúng | Correct answer |
| `quiz.detail.noQuestions` | Chưa có câu hỏi nào. | No questions yet. |
| `quiz.detail.compose` | Soạn câu hỏi | Add questions |
| `quiz.detail.needOne` | Quiz cần ít nhất 1 câu hỏi. | A quiz needs at least 1 question. |
| `quiz.detail.noResults` | Điểm và bài nộp chưa xem được trên ứng dụng. | Scores and submissions aren't available in the app yet. |
| `quiz.detail.archivedNote` | Quiz đã lưu trữ, học viên không còn thấy và làm được. | This quiz is archived. Students can no longer see or take it. |
| `quiz.detail.publish` | Công bố | Publish |
| `quiz.detail.publishTitle` | Công bố quiz này? | Publish this quiz? |
| `quiz.detail.publishBody` | Học viên của buổi sẽ thấy và làm được ngay. Sau khi công bố không sửa được nội dung, số câu và cấu hình. | Students in this session can see and take it right away. After publishing, its content, questions and settings can't be changed. |
| `quiz.detail.published` | Đã công bố quiz. | Quiz published. |
| `quiz.detail.duePast` | Hạn nộp đã qua. Sửa hạn rồi công bố. | The due date has passed. Change it, then publish. |
| `quiz.detail.fixDue` | Sửa hạn nộp | Change due date |
| `quiz.detail.edit` | Sửa | Edit |
| `quiz.detail.delete` | Xóa nháp | Delete draft |
| `quiz.detail.deleteBody` | Xóa bản nháp này? Không khôi phục được. | Delete this draft? This can't be undone. |
| `quiz.detail.deleted` | Đã xóa bản nháp. | Draft deleted. |
| `quiz.detail.archive` | Lưu trữ | Archive |
| `quiz.detail.archiveTitle` | Lưu trữ quiz này? | Archive this quiz? |
| `quiz.detail.archiveEffect1` | Học viên không còn thấy và làm được quiz. | Students can no longer see or take the quiz. |
| `quiz.detail.archiveEffect2` | Lượt đang làm dở sẽ bị hủy. Bài đã nộp vẫn giữ. | Attempts in progress will be cancelled. Submitted attempts are kept. |
| `quiz.detail.archiveEffect3` | Không mở lại được. | This can't be reopened. |
| `quiz.detail.reason` | Lý do | Reason |
| `quiz.detail.reasonRequired` | Nhập lý do. | Enter a reason. |
| `quiz.detail.archived` | Đã lưu trữ quiz. | Quiz archived. |
| `quiz.detail.refreshFailed` | Chưa cập nhật được. | Couldn't refresh. |
| `quiz.detail.cancel` | Hủy | Cancel |

## 8. Accessibility

- Mỗi câu là một nhóm: đọc "Câu 1. Nội dung. Lựa chọn A: …". Khi hiện đáp án, lựa chọn đúng đọc thêm "đáp án đúng"; khi ẩn, không đọc gì thêm.
- Công tắc đáp án có vai trò `switch`, nhãn "Hiện đáp án".
- Bấm Công bố: focus vào tiêu đề dialog. Thành công đọc qua `Toast`.

## 9. testID

`quiz-detail-screen`, `quiz-detail-back`, `quiz-detail-title`, `quiz-detail-status`, `quiz-detail-purpose`, `quiz-detail-session`, `quiz-detail-score`, `quiz-detail-due`, `quiz-detail-limit`, `quiz-detail-published-at`, `quiz-detail-description`, `quiz-detail-count`, `quiz-detail-toggle-answers`, `quiz-detail-question-<id>`, `quiz-detail-correct-<id>`, `quiz-detail-no-questions`, `quiz-detail-compose`, `quiz-detail-no-results`, `quiz-detail-publish`, `quiz-detail-publish-dialog`, `quiz-detail-due-warning`, `quiz-detail-fix-due`, `quiz-detail-edit`, `quiz-detail-delete`, `quiz-detail-delete-dialog`, `quiz-detail-archive`, `quiz-detail-archive-sheet`, `quiz-detail-archive-reason`, `quiz-detail-archive-confirm`, `quiz-detail-closed`, `quiz-detail-archived-note`, `quiz-detail-intent`, `quiz-detail-offline`, `quiz-detail-error`, `quiz-detail-denied`, `quiz-detail-not-found`, `quiz-detail-skeleton`.

## 10. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P6-S3-01 | | Mở | GET chi tiết, context, lớp; **không có request nào tới bài nộp, kết quả** |
| TC-P6-S3-02 | Đang tải | Xem | Skeleton; không có nút |
| TC-P6-S3-03 | DRAFT có câu, còn mở | Xem | Đáp án hiện; có Công bố, Sửa, Xóa nháp; không có Lưu trữ |
| TC-P6-S3-04 | PUBLISHED, còn mở | Xem | Đáp án ẩn; chỉ có Lưu trữ; có `publishedAt`, `no-results` |
| TC-P6-S3-05 | ARCHIVED | Xem | Đáp án ẩn; không có nút; có `archived-note` |
| TC-P6-S3-06 | DRAFT, lớp COMPLETED | Xem | Không có nút; có `closed` |
| TC-P6-S3-07 | DRAFT, buổi CANCELLED | Xem | Như trên |
| TC-P6-S3-08 | Context lỗi | Xem | Màn hiện; ẩn dòng buổi; nút theo `status` |
| TC-P6-S3-09 | Đáp án ẩn | Bật công tắc | Hiện `check_circle` + chữ, không chỉ màu; tắt thì ẩn |
| TC-P6-S3-10 | Quay lại màn | Xem | Công tắc về mặc định; không lưu |
| TC-P6-S3-11 | DRAFT chưa có câu | Xem | `no-questions`; Công bố khóa; "Soạn câu hỏi" mở S2 tab Câu hỏi |
| TC-P6-S3-12 | `maxAttempts` 2 ở QUIZ | Mở | Coi là phản hồi sai định dạng |
| TC-P6-S3-13 | | Bấm Công bố | Dialog có đúng số câu, điểm, thời gian, hạn từ GET gần nhất |
| TC-P6-S3-14 | | Xác nhận | POST `expectedRevision` đúng GET; sau 200 có GET lại; chip đổi; đáp án về ẩn; không về danh sách |
| TC-P6-S3-15 | `dueAt` qua theo header `Date` | Xem | `due-warning`, `fix-due` mở S2 tab Thông tin; Công bố vẫn bấm được |
| TC-P6-S3-16 | 422 `INVALID_ASSIGNMENT_DEADLINE` | Xác nhận | `duePast`; dialog đóng |
| TC-P6-S3-17 | 422 `QUIZ_QUESTIONS_REQUIRED` | Xác nhận | `needOne`, có lối soạn |
| TC-P6-S3-18 | 409 version | Xác nhận | GET lại; `conflict`; không gửi tự động; lần sau dùng `revision` mới |
| TC-P6-S3-19 | 409 `ASSIGNMENT_CONTENT_FROZEN`, đã có người công bố | Xác nhận | Hiện PUBLISHED; không báo lỗi đáng sợ |
| TC-P6-S3-20 | 409 `ASSIGNMENT_CLOSED` | Xác nhận | Ẩn nút; `closed` |
| TC-P6-S3-21 | Timeout publish, GET PUBLISHED | Kiểm tra | Toast thành công; **không gửi lần hai** |
| TC-P6-S3-22 | Timeout publish, GET còn DRAFT cùng `revision` | Kiểm tra | "Gửi lại" cùng `revision` |
| TC-P6-S3-23 | Lý do chỉ khoảng trắng | Lưu trữ | Lỗi; không có request |
| TC-P6-S3-24 | Hợp lệ | Lưu trữ | POST đúng `reason`, `expectedRevision`; GET lại; chip đổi; không có nút |
| TC-P6-S3-25 | Timeout archive, GET còn PUBLISHED | Kiểm tra | "Gửi lại", lý do giữ nguyên và bị khóa |
| TC-P6-S3-26 | 409 `ASSIGNMENT_STATE_CONFLICT` | Lưu trữ | Sheet đóng; hiện theo trạng thái mới |
| TC-P6-S3-27 | E2E: Student đang làm dở | Lưu trữ | Lượt của Student thành VOIDED, xem qua API Student |
| TC-P6-S3-28 | DRAFT | Xóa, xác nhận | `DELETE` có body `expectedRevision`; 204 → toast, về danh sách, quiz biến mất |
| TC-P6-S3-29 | Timeout DELETE, GET 404 | Kiểm tra | Coi là thành công, về danh sách |
| TC-P6-S3-30 | Timeout DELETE, GET còn DRAFT | Kiểm tra | "Gửi lại" |
| TC-P6-S3-31 | Offline, có dữ liệu | Xem | `stale`; nút khóa; `needOnline` |
| TC-P6-S3-32 | Offline, chưa có | Xem | `offlineEmpty` |
| TC-P6-S3-33 | Có lệnh chưa rõ | Xem | Mọi nút khóa; `quiz-detail-intent` còn hiện đến khi có kết quả kiểm tra |
| TC-P6-S3-34 | 403 khi đã có dữ liệu | Làm mới | Xóa câu hỏi và đáp án; `denied` |
| TC-P6-S3-35 | 404 | Mở | `not-found`, "Quay lại" |
| TC-P6-S3-36 | Quiz đã công bố | Tìm trong màn | Không có điểm, số bài nộp, tỷ lệ, nút xem kết quả |
| TC-P6-S3-37 | `description` rỗng, `dueAt`, `timeLimitMinutes`, `publishedAt` null | Xem | Không có khối mô tả; có chữ thay thế; không có "null" |

Ứng viên Maestro E2E: TC-P6-S3-03, -04, -05, -06, -09, -14, -16, -18, -24, -27, -28, -36.
