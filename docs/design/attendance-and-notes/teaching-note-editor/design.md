# P2-S2 — teaching-note-editor · Ghi chú nội bộ của buổi

Ngày: 01/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-NOTE-01, BR-NOTE-02, BR-ATT-06; UC-M-07. Endpoint tham chiếu: `GET` và `PUT /class-sessions/:sessionId/teaching-notes`, `GET /class-sessions/:sessionId/context`.

## 1. Mục tiêu

Người dạy ghi nội dung đã dạy và việc cần làm tiếp cho một buổi. Ghi chú là nội bộ, học viên không đọc được, có version riêng và không bao giờ dùng `session.version`. Không có offline: chưa lưu được thì nội dung vẫn ở trên màn, nhưng không xếp hàng gửi sau (kế hoạch mục 5.8).

Mẫu [M] không có màn này. Bố cục ghép từ `MultilineField` và `SaveBar`.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Ghi chú buổi học         ▓│
│▓    IELTS Foundation K12     ▓│
├──────────────────────────────┤
│ Buổi 8: Line graphs          │  14/600
│ T2, 02/11/2026 · 18:30–20:00 │  13 secondary
│ 🔒 Chỉ Mentor và Quản lý xem  │  12 secondary, icon lock_person
│    được. Học viên không      │
│    đọc được ghi chú này.     │
│                              │
│ Nội dung buổi học            │
│ ┌──────────────────────────┐ │
│ │                          │ │  MultilineField
│ └──────────────────────────┘ │
│                     0/10000  │
│ Việc cần làm tiếp            │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                      0/5000  │
│ Cập nhật lần cuối 20:15      │  khi đã có note
│ 02/11/2026                   │
├──────────────────────────────┤
│ Chưa lưu             ( Lưu ) │  chỉ khi nội dung khác bản server
└──────────────────────────────┘
```

- Hai ô đều không bắt buộc. Server cho phép chuỗi rỗng, nên người dùng xóa hết rồi lưu được.
- Nút Lưu khóa khi nội dung giống bản server: tránh tạo version mới không có thay đổi.
- Không trim nội dung trước khi gửi: server lưu đúng chuỗi nhận được.
- Đếm ký tự theo code point. Vượt giới hạn: bộ đếm `--mdy-danger-fg`, dòng "Vượt quá {max} ký tự.", khóa Lưu, **không cắt nội dung của người dùng**.
- Ô nhập tự giãn đến tối đa 40% chiều cao màn rồi cuộn trong ô. Bàn phím không che ô đang nhập.

## 3. Quyền và chế độ

Note không trả `permissions` (G-P2-04). Client suy ra chế độ từ context để chọn giao diện; **server vẫn quyết định khi lưu**. So hạn bằng `asOf`, không dùng đồng hồ máy.

| Điều kiện | Chế độ | Hiển thị |
| --- | --- | --- |
| `effectiveMentor` là người dùng, IN_PROGRESS/COMPLETED, `asOf` < `editableUntil` | Sửa | Mục 2. COMPLETED: dòng 12 "Sửa được đến {editableUntil}." |
| Như trên nhưng `asOf` ≥ `editableUntil` | Chỉ đọc | Dải neutral `lock_clock`: "Đã hết hạn sửa ghi chú." |
| Người dùng là mentor chính, không phải người dạy buổi | Chỉ đọc | Dải: "Chỉ người dạy buổi này mới sửa được ghi chú." Thực tế hiện không vào được qua S4 vì context trả 403 (G-09 của P1), nhưng vẫn cần cho trường hợp đổi assignment |
| SCHEDULED, CANCELLED | Chỉ đọc | SCHEDULED: "Ghi chú mở sau khi buổi học bắt đầu." CANCELLED: "Buổi đã hủy." Có note thì hiện, không thì trống |

Chỉ đọc: nội dung hiện dạng chữ thường, không có ô nhập và `SaveBar`. Note trống: "Chưa có ghi chú."

Lối vào ở chi tiết buổi của Mentor (phase mục 4.1) chỉ hiện khi IN_PROGRESS/COMPLETED.

## 4. Lưu

Body: `expectedVersion`, `content`, `nextSteps`. Header: UUID v4 `Idempotency-Key`. Chưa có note (`note` null, `version` 0): gửi `expectedVersion: 0`.

Lấy version từ **response note** (`version` ngoài cùng), không lấy từ context hay attendance. Lưu xong dùng version mới, cập nhật bản server, hết "Chưa lưu", toast "Đã lưu ghi chú". Người dùng ở lại màn.

| Kết quả | Hành vi |
| --- | --- |
| 200 | Như trên |
| Chưa rõ | `IntentBanner`, **ô nhập khóa** vì body của intent không được đổi. "Gửi lại" dùng cùng key, body, version. Nếu người dùng cần sửa tiếp: phải đợi rõ kết quả |
| 409 `TEACHING_VERSION_CONFLICT` | Mục 5. **Đây là conflict của note, khác `SESSION_VERSION_CONFLICT`** |
| 409 `TEACHING_NOTE_WINDOW_CLOSED` | Chuyển chỉ đọc **nhưng giữ chữ đang gõ** trong khung có viền warning, dòng "Đã hết hạn sửa. Nội dung này chưa được lưu." Nút "Sao chép nội dung" để không mất |
| 409 `TEACHING_NOTE_STATE_CONFLICT` | Như trên với "Trạng thái buổi học đã thay đổi. Nội dung này chưa được lưu." |
| 409 `IDEMPOTENCY_KEY_REUSED` | Lỗi chung + mã hỗ trợ; giữ nội dung; bỏ intent |
| 403 `MENTOR_SCOPE_REQUIRED` | **Xóa nội dung trên màn**, `StatusBlock` không quyền, kèm "Nội dung chưa lưu không còn được giữ." |
| 401 | Về Login theo P0 |
| 404 | `StatusBlock` không tìm thấy |
| 422, 5xx, sai định dạng | Dải danger, giữ nội dung, có mã hỗ trợ khi có. 5xx: thử lại cùng intent |
| Offline | Khóa Lưu; dòng "Bạn đang offline. Nội dung chưa được lưu và sẽ mất nếu đóng màn này." Gõ tiếp được. Không có "Thử lại" |

"Sao chép nội dung" dùng clipboard hệ thống. Nếu repo chưa có thư viện clipboard, nút này là phần cần Codex báo lại; nội dung vẫn phải hiện đủ để người dùng tự chọn và sao chép.

## 5. Conflict

Khi 409 version: tải lại note, **giữ nguyên chữ của người dùng trong hai ô**, hiện panel trên đầu:

```
┌──────────────────────────────┐
│ ⚠ Ghi chú vừa được cập nhật  │
│   ở nơi khác                 │
│ Bản mới:                     │
│  Nội dung: …                 │  tối đa 6 dòng, "Xem thêm"
│  Việc cần làm tiếp: …        │
│ ( Dùng bản mới ) ( Giữ của tôi ) │
└──────────────────────────────┘
```

- "Dùng bản mới": thay nội dung ô bằng bản mới; có dialog xác nhận vì chữ đang gõ sẽ mất.
- "Giữ của tôi": đóng panel, giữ chữ. Lần Lưu tiếp theo là intent mới: key mới, `expectedVersion` là version vừa tải. Người dùng phải tự bấm Lưu.
- Không tự trộn hai bản.

## 6. Làm mới

Refetch khi focus/foreground chỉ cập nhật bản server. Đang có nội dung chưa lưu: không đổi ô nhập, không hỏi gì; conflict sẽ được phát hiện khi lưu. Không có thay đổi chưa lưu: cập nhật ô nhập theo bản mới.

Rời màn khi có thay đổi: dialog chung phase mục 6.5, với thân đổi thành "Nội dung chưa lưu sẽ bị bỏ."

## 7. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| N-A | Đang tải | Skeleton tiêu đề và hai ô, đúng chiều cao |
| N-B | `note` null, version 0 | Hai ô trống; không có "Cập nhật lần cuối" |
| N-C | Có note | Điền sẵn; có thời gian cập nhật |
| N-D | Có thay đổi | `SaveBar` |
| N-E | Đang lưu | Spinner; ô nhập khóa |
| N-F | Lưu thành công / chưa rõ / conflict / hết hạn / đổi trạng thái | Mục 4, 5 |
| N-G | Chỉ đọc | Mục 3 |
| N-H | Vượt giới hạn | Mục 2 |
| N-I | Tải lỗi lần đầu | `StatusBlock` + "Thử lại". **Không hiện hai ô trống**, tránh người dùng tưởng chưa có note rồi ghi đè |
| N-J | Làm mới lỗi | Giữ dữ liệu, `Alert` warning |
| N-K | Offline: có dữ liệu / chưa có | Mục 4 / `offlineEmpty` không có "Thử lại", không hiện ô nhập |
| N-L | 401 / 403 / 404 | Mục 4 |

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `attendance.note.title` | Ghi chú buổi học | Session notes |
| `attendance.note.internal` | Chỉ Mentor và Quản lý xem được. Học viên không đọc được ghi chú này. | Only mentors and managers can see this. Students can't read these notes. |
| `attendance.note.content` | Nội dung buổi học | What was covered |
| `attendance.note.nextSteps` | Việc cần làm tiếp | Next steps |
| `attendance.note.counter` | {{count}}/{{max}} | {{count}}/{{max}} |
| `attendance.note.tooLong` | Vượt quá {{max}} ký tự. | Over the {{max}}-character limit. |
| `attendance.note.updatedAt` | Cập nhật lần cuối {{time}} {{date}} | Last updated {{time}} {{date}} |
| `attendance.note.unsaved` | Chưa lưu | Not saved |
| `attendance.note.save` / `.saved` | Lưu / Đã lưu ghi chú | Save / Notes saved |
| `attendance.note.editUntil` | Sửa được đến {{deadline}}. | Editable until {{deadline}}. |
| `attendance.note.expired` | Đã hết hạn sửa ghi chú. | The editing period for these notes has ended. |
| `attendance.note.notTeacher` | Chỉ người dạy buổi này mới sửa được ghi chú. | Only the teacher of this session can edit these notes. |
| `attendance.note.notStarted` | Ghi chú mở sau khi buổi học bắt đầu. | Notes open after the session starts. |
| `attendance.note.cancelled` | Buổi đã hủy. | This session was cancelled. |
| `attendance.note.empty` | Chưa có ghi chú. | No notes yet. |
| `attendance.note.closedUnsaved` | Đã hết hạn sửa. Nội dung này chưa được lưu. | The editing period has ended. This text wasn't saved. |
| `attendance.note.stateUnsaved` | Trạng thái buổi học đã thay đổi. Nội dung này chưa được lưu. | The session status changed. This text wasn't saved. |
| `attendance.note.copy` | Sao chép nội dung | Copy text |
| `attendance.note.conflictTitle` | Ghi chú vừa được cập nhật ở nơi khác | These notes were just updated elsewhere |
| `attendance.note.latest` | Bản mới | Latest version |
| `attendance.note.useLatest` / `.keepMine` | Dùng bản mới / Giữ của tôi | Use latest / Keep mine |
| `attendance.note.useLatestConfirm` | Nội dung bạn đang gõ sẽ bị thay bằng bản mới. | The text you're typing will be replaced with the latest version. |
| `attendance.note.offline` | Bạn đang offline. Nội dung chưa được lưu và sẽ mất nếu đóng màn này. | You're offline. This text isn't saved and will be lost if you leave. |
| `attendance.note.deniedExtra` | Nội dung chưa lưu không còn được giữ. | Unsaved text is no longer kept. |
| `attendance.note.leaveBody` | Nội dung chưa lưu sẽ bị bỏ. | Unsaved text will be discarded. |

## 9. Accessibility

- Ô nhập có `accessibilityLabel` là nhãn kèm "tối đa {max} ký tự"; bộ đếm chỉ thông báo khi vượt giới hạn, không đọc từng ký tự.
- Panel conflict nhận focus khi xuất hiện.
- Phần chỉ đọc đọc theo thứ tự: nhãn rồi nội dung.

## 10. testID

`note-screen`, `note-back`, `note-session-title`, `note-internal`, `note-content`, `note-next-steps`, `note-content-count`, `note-next-steps-count`, `note-too-long`, `note-updated-at`, `note-save`, `note-unsaved`, `note-edit-until`, `note-readonly`, `note-empty`, `note-intent-banner`, `note-resend`, `note-conflict`, `note-use-latest`, `note-keep-mine`, `note-closed-unsaved`, `note-copy`, `note-offline`, `note-error`, `note-retry`, `note-denied`, `note-not-found`, `note-refresh-alert`.

## 11. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P2-S2-01 | `note` null, `version` 0 | Mở, gõ, lưu | Hai ô trống lúc đầu; body `expectedVersion: 0`; có UUID v4 |
| TC-P2-S2-02 | Tiếp -01, response version 1 | Sửa, lưu lần 2 | `expectedVersion: 1`, key mới |
| TC-P2-S2-03 | `session.version` 7, note version 2 | Lưu | Gửi 2, **không** gửi 7 |
| TC-P2-S2-04 | Có note | Mở | Điền đúng hai ô; có thời gian cập nhật theo giờ VN; không có tên người sửa |
| TC-P2-S2-05 | Không đổi nội dung | Xem | Không có `SaveBar`; không gửi được |
| TC-P2-S2-06 | Có note | Xóa hết, lưu | Gửi chuỗi rỗng; thành công |
| TC-P2-S2-07 | Nội dung có khoảng trắng đầu cuối | Lưu | Gửi nguyên văn |
| TC-P2-S2-08 | 10000 ký tự / 10001 ký tự | Nhập | Lưu được / `note-too-long`, khóa Lưu, không cắt chữ |
| TC-P2-S2-09 | `nextSteps` 5001 ký tự | Nhập | Như trên với 5000 |
| TC-P2-S2-10 | Chuỗi có emoji | Đếm | Đếm theo code point |
| TC-P2-S2-11 | | Double tap Lưu | Đúng 1 request |
| TC-P2-S2-12 | Mất response | Xem, Gửi lại | Ô khóa; cùng key, body, version; lưu một lần |
| TC-P2-S2-13 | 409 `TEACHING_VERSION_CONFLICT` | Xem | `note-conflict` có bản mới; chữ của tôi còn trong ô; không tự gửi |
| TC-P2-S2-14 | Tiếp -13 | Giữ của tôi, Lưu | Key mới, version vừa tải |
| TC-P2-S2-15 | Tiếp -13 | Dùng bản mới, xác nhận | Ô theo bản mới; hết "Chưa lưu" |
| TC-P2-S2-16 | 409 `TEACHING_NOTE_WINDOW_CLOSED` | Lưu | Chữ còn hiện; `note-closed-unsaved`; có `note-copy`; **không** hiện conflict panel |
| TC-P2-S2-17 | 409 `TEACHING_NOTE_STATE_CONFLICT` | Lưu | Thông báo riêng; chữ còn |
| TC-P2-S2-18 | 403 khi đang gõ | Lưu | Xóa nội dung; `note-denied` |
| TC-P2-S2-19 | COMPLETED, `asOf` < hạn | Mở | Chế độ sửa; `note-edit-until` đúng giá trị server |
| TC-P2-S2-20 | COMPLETED, `asOf` ≥ hạn, đồng hồ máy còn trước hạn | Mở | Chỉ đọc theo `asOf` |
| TC-P2-S2-21 | Mentor chính, người khác dạy | Mở | Chỉ đọc; `notTeacher` |
| TC-P2-S2-22 | SCHEDULED | Mở | Chỉ đọc; không có ô nhập |
| TC-P2-S2-23 | Chỉ đọc, note null | Mở | "Chưa có ghi chú." |
| TC-P2-S2-24 | Có thay đổi | Back, Android Back | `leave-dialog`; Ở lại giữ chữ |
| TC-P2-S2-25 | Có thay đổi, refetch version mới | Foreground | Chữ không đổi; lưu thì conflict |
| TC-P2-S2-26 | Không có thay đổi, refetch version mới | Foreground | Ô theo bản mới |
| TC-P2-S2-27 | Tải lần đầu 500 | Mở | `note-error`; **không** có ô trống |
| TC-P2-S2-28 | Offline, đã có dữ liệu | Gõ | Gõ được; Lưu khóa; `note-offline`; không có "Thử lại"; không xếp hàng |
| TC-P2-S2-29 | Offline rồi có mạng | | Không tự lưu; người dùng bấm Lưu |
| TC-P2-S2-30 | Offline, chưa tải | Mở | `offlineEmpty`; không có ô nhập |
| TC-P2-S2-31 | Lưu note thành công | Xem request | Không gọi attendance; không invalidate attendance |
| TC-P2-S2-32 | Bàn phím mở, màn 360 | Gõ ô dưới | Ô và `SaveBar` không bị che |

Ứng viên Maestro E2E: TC-P2-S2-01, -02, -03, -13, -14, -16, -19, -21, -24.
