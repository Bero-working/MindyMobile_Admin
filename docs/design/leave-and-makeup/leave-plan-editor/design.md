# P4-S2 — leave-plan-editor · Lập đơn nghỉ

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-LEAVE-01, BR-LEAVE-02, BR-LEAVE-03, BR-TEACH-03, BR-TIME-01; UC-M-09. Endpoint tham chiếu: `POST /mentor/leave-requests/preview`, `POST /mentor/leave-requests/makeup-slots`, `POST /mentor/leave-requests`.

## 1. Mục tiêu

Mentor chọn khoảng nghỉ và ca, xem đúng các buổi bị ảnh hưởng, chọn lịch bù cho **từng buổi**, ghi lý do và gửi. Đơn gửi xong là PENDING: **lịch chưa đổi và giờ bù chưa được giữ**, màn phải nói rõ điều này.

Là màn phức tạp nhất phase và không có mẫu. Dùng một màn cuộn ba phần thay vì wizard nhiều bước: người dùng thấy toàn bộ đơn, và không phát sinh thêm chuyển màn (ADR-025 mục 1).

**Lựa chọn ban đầu:** chưa có ngày, ca "Cả ngày", chưa gọi API. Preview chỉ chạy khi bấm nút, vì chọn hai ngày và ca là ba thao tác; gọi tự động sẽ tốn request ở các trạng thái trung gian.

## 2. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Tạo đơn nghỉ             ▓│
├──────────────────────────────┤
│ 1. KHOẢNG NGHỈ               │
│ Từ ngày        Đến ngày      │
│ [T6, 06/11/2026][CN, 08/11/2026]│
│ Ca nghỉ                      │
│ ┌────────────┐┌────────────┐ │
│ │ Sáng       ││ Chiều      │ │
│ │ 00:00–12:00││ 12:00–18:00│ │
│ └────────────┘└────────────┘ │
│ ┌────────────┐┌────────────┐ │
│ │ Tối        ││●Cả ngày    │ │
│ │ 18:00–24:00││            │ │
│ └────────────┘└────────────┘ │
│ ( Xem buổi bị ảnh hưởng )    │
│                              │
│ 2. LỊCH BÙ · đã chọn 1/3     │
│ ⓘ Gửi trước 00:00 05/11/2026 │
│ ┌──────────────────────────┐ │
│ │ ┌──┐ IELTS 6.5 Intensive │ │
│ │ │T6│ Buổi 19: Unit 10    │ │
│ │ │06│ 18:30–20:00         │ │
│ │ └──┘ [Dạy thay]          │ │  khi SUBSTITUTE
│ │ ↻ Lịch bù T4, 11/11 18:30–20:00  [Đổi]│
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ┌──┐ Giao tiếp B1 · Lớp 07│ │
│ │ │T7│ Buổi 7: Unit 4      │ │
│ │ │07│ 09:00–10:30         │ │
│ │ └──┘ ( Chọn lịch bù )    │ │
│ └──────────────────────────┘ │
│                              │
│ 3. LÝ DO                     │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                      0/1000  │
│ Đơn cần Quản lý duyệt mới đổi│
│ lịch. Giờ bù chưa được giữ   │
│ cho đến khi duyệt.           │
├──────────────────────────────┤
│ Đã chọn 1/3 buổi ( Gửi đơn ) │  thanh dính đáy, khóa khi chưa đủ
└──────────────────────────────┘
```

Phần 2 và 3 chỉ xuất hiện sau khi có preview hợp lệ (có buổi và đủ notice).

## 3. Phần 1: Khoảng nghỉ

- Hai `DateField`. Chọn "Từ ngày" khi "Đến ngày" còn trống thì điền luôn "Đến ngày" bằng cùng ngày, vì nghỉ một ngày là trường hợp thường gặp. Ngày nhỏ nhất là hôm nay theo UTC+7.
- `PeriodSelector`, mặc định Cả ngày, luôn hiện khung giờ (Q-LEAVE-01b). Ca áp dụng cho **mọi ngày** trong khoảng.
- Một buổi bị ảnh hưởng nếu **giao** với ca: buổi 11:30–13:00 thuộc cả ca Sáng và ca Chiều. Có dòng 12 dưới ca: "Buổi có giờ nằm trong ca này đều bị ảnh hưởng."
- Kiểm trên client trước khi gọi, chỉ để báo sớm; server vẫn kiểm:

| Điều kiện | Chữ |
| --- | --- |
| Thiếu ngày | Nút "Xem buổi bị ảnh hưởng" khóa |
| `toDate` < `fromDate` | "Ngày kết thúc phải từ ngày bắt đầu trở đi." |
| Quá 93 ngày, tính cả hai đầu | "Khoảng nghỉ tối đa 93 ngày." |

**Đổi ngày hoặc ca sau khi đã có preview:** kết quả cũ không còn đúng. Chưa chọn lịch bù nào thì xóa preview ngay và hiện lại nút. Đã chọn ít nhất một: dialog "Đổi khoảng nghỉ sẽ xóa {n} lịch bù đã chọn." với "Giữ nguyên" (primary) và "Đổi và xóa" (danger). Lý do đã gõ được giữ.

## 4. Kết quả preview

| Kết quả | Hiển thị |
| --- | --- |
| Đang gọi | Skeleton 2 thẻ buổi ở phần 2, nút xem hiện busy; phần 1 khóa |
| `affectedSessions` rỗng | `Alert` info: "Không có buổi dạy nào trong khoảng này, bạn không cần tạo đơn." Không có phần 2, 3, thanh gửi. **Không tạo được đơn 0 buổi** |
| `noticeEligible` false | `Alert` danger: "Đã quá hạn gửi đơn cho khoảng nghỉ này. Buổi đầu tiên {buổi}; hạn gửi là trước {noticeDeadline}. Nếu cần nghỉ gấp, hãy liên hệ Quản lý." Vẫn liệt kê các buổi để Mentor biết, **không có** nút chọn lịch bù, phần 3 và thanh gửi. Không có nút gọi điện: app chưa có số Quản lý |
| `noticeEligible` true | Dòng info 13 ở đầu phần 2: "Gửi trước {noticeDeadline}". Mục 5 |
| 422 `LEAVE_TOO_MANY_SESSIONS` | Dưới phần 1: "Khoảng nghỉ có quá nhiều buổi. Hãy chia thành các khoảng ngắn hơn." |
| 422 `LEAVE_RANGE_INVALID` | Như dòng kiểm client tương ứng |
| Lỗi khác | `Alert` danger + "Thử lại" gọi lại đúng ngày và ca |
| Offline | Nút khóa, dòng `leave.needOnline` |

**Không tính notice ở client:** không so sánh đồng hồ máy, chỉ đọc `noticeEligible`. Ví dụ để Codex kiểm: buổi sớm nhất 23/10 thì hạn là 00:00 22/10; `asOf` 23:59 21/10 hợp lệ, 00:00 22/10 không hợp lệ.

Danh sách buổi: **sắp `startsAt` tăng dần trên client** vì server trả theo id (G-P4-02). `sourceVersions` giữ nguyên từ preview, không suy từ `affectedSessions`. Chip "Dạy thay" khi `assignmentType` là SUBSTITUTE: buổi dạy thay cũng thuộc đơn vì tính theo người dạy hiệu lực (BR-TEACH-03).

## 5. Phần 2: Chọn lịch bù

Mỗi buổi cần đúng một lịch bù. Bấm "Chọn lịch bù" hoặc "Đổi" mở `Sheet`:

```
│ Chọn lịch bù                 │
│ Buổi 19: Unit 10             │
│ IELTS 6.5 · T6, 06/11 18:30–20:00│
│ Thời lượng 90 phút           │
│ Ngày bù                      │
│ [ T4, 11/11/2026           ] │
│ Ca  (Sáng)(Chiều)(●Tối)      │
│ Giờ bù                       │
│ [18:00–19:30][18:15–19:45]   │
│ [●18:30–20:00][18:45–20:15]  │  cuộn trong sheet
│ [19:00–20:30][19:15–20:45]   │
│ ( Chọn giờ này )   Hủy       │
```

- Chỉ ba ca Sáng, Chiều, Tối, không có Cả ngày (G-P4-06). Mặc định chọn sẵn ca chứa giờ bắt đầu của buổi gốc. Ngày bù để trống.
- Gọi `makeup-slots` khi đã có ngày và ca, mỗi lần đổi lựa chọn. Response cũ về sau bị bỏ qua. Không cache: giờ trống đổi liên tục.
- Giữ nguyên `startsAt`, `endsAt` của slot khi gửi, không tự làm tròn hay đổi múi giờ.
- `SlotGrid` tự cuộn tới giờ có đồng hồ gần giờ gốc nhất (Q-P4-04). Không tự chọn: người dùng phải bấm.

**Lọc trên client** (G-P4-05), vì API không biết khoảng nghỉ và các lựa chọn khác trong đơn đang lập. Bỏ khỏi lưới các slot:

1. Giao với khoảng nghỉ đang xin: mỗi ngày trong `fromDate`–`toDate`, ca `period`, tính theo UTC+7 đúng khung ở mục 9 cấp phase.
2. Giao với lịch bù đã chọn cho **buổi khác** trong đơn này.

Đây chỉ là bước giảm lỗi; server vẫn kiểm khi gửi. Nghỉ theo ca được phép bù cùng ngày nếu ngoài ca nghỉ.

| Trạng thái sheet | Hiển thị |
| --- | --- |
| Chưa chọn ngày | "Chọn ngày để xem giờ còn trống." Không có request |
| Đang tải | Skeleton 6 chip |
| Rỗng sau khi lọc | "Không còn giờ trống trong ca này. Thử ca hoặc ngày khác." (G-P4-07) |
| Lỗi | Chữ lỗi + "Thử lại" trong sheet |
| Offline | Dòng `leave.needOnline`; không gọi |
| `sessionVersion` khác version trong `sourceVersions` | Đóng sheet, chạy lại preview như mục 6.1 |

Thanh dưới cùng và tiêu đề phần: "Đã chọn {x}/{y} buổi". Hàng đã chọn hiện "Lịch bù …" và nút "Đổi". Không có chọn hàng loạt: mỗi buổi có thời lượng và lớp riêng nên một giờ không dùng được cho nhiều buổi.

## 6. Gửi đơn

Nút "Gửi đơn" mở khi: preview hợp lệ, đủ lịch bù, lý do hợp lệ, online, không có intent chưa rõ. Lý do 1–1000 ký tự sau trim; trống mà bấm thì cuộn tới ô và báo `leave.reasonRequired`. Nút khóa khi chưa đủ lịch bù, với dòng "Đã chọn {x}/{y} buổi" là lời giải thích.

Trình tự khi bấm:

1. **Kiểm kích thước** body UTF-8: quá 64 KiB báo "Đơn có quá nhiều buổi để gửi một lần. Hãy chia thành các khoảng ngắn hơn." và dừng (G-P4-08).
2. **Preview lại** với cùng ngày và ca. Đây là nơi thực hiện tiêu chí "preview cũ bị kiểm lại". Nếu khác, chuyển mục 6.1, **không gửi**.
3. `ConfirmationDialog` tiêu đề "Gửi đơn nghỉ?", thân "{y} buổi sẽ được đề xuất đổi lịch. Lịch chỉ đổi khi Quản lý duyệt. Nếu chưa được duyệt trước {giờ buổi đầu tiên}, đơn sẽ hết hạn." Nút "Gửi đơn" và "Xem lại".
4. Gửi `POST /mentor/leave-requests` với `Idempotency-Key`. Body gồm `sourceVersions` từ lần preview vừa rồi và `sessionMappings`, mỗi buổi đúng một `{sourceSessionId, targetDate, targetPeriod, startsAt, endsAt}`. Không gửi `dayMappings`.
5. Thành công: `replace` sang S3 với `id` trả về, toast "Đã gửi đơn nghỉ." Invalidate danh sách.

### 6.1 Preview đã đổi

So `sourceVersions` mới với cũ theo `sessionId`:

| Khác biệt | Xử lý |
| --- | --- |
| Buổi còn nguyên version | Giữ lịch bù đã chọn |
| Buổi đổi version | Bỏ lịch bù, hàng hiện dòng warning "Buổi này vừa thay đổi. Chọn lại lịch bù." |
| Buổi mới xuất hiện | Thêm hàng, chưa có lịch bù |
| Buổi không còn | Bỏ hàng và lịch bù |
| `noticeEligible` thành false | Chuyển trạng thái quá hạn ở mục 4 |
| Không còn buổi nào | Trạng thái 0 buổi ở mục 4 |

Đầu phần 2 hiện `Alert` warning "Lịch dạy vừa thay đổi. Kiểm tra lại các buổi bên dưới rồi gửi lại." Người dùng phải bấm gửi lại: **không tự gửi**. Lần gửi sau là intent mới.

### 6.2 Lỗi khi gửi

Giữ toàn bộ form. Intent chưa rõ dùng `IntentBanner`. Lỗi chung ở [mục 6.1 cấp phase](../design.md).

| Mã | Hành vi |
| --- | --- |
| 409 `LEAVE_REQUEST_STALE` | Chạy mục 6.1 |
| 409 `LEAVE_TARGET_CONFLICT` | `Alert` danger: "Có lịch bù vừa bị trùng với lịch dạy, lớp hoặc ngày nghỉ đã duyệt. Đổi lịch bù rồi gửi lại." Backend không nói buổi nào: giữ mọi lựa chọn, không tự xóa |
| 409 `LEAVE_STUDENT_CONFLICT` | Như trên: "Có lịch bù trùng lịch học của học viên. Đổi lịch bù rồi gửi lại." |
| 422 `LEAVE_NOTICE_TOO_SHORT` | Preview lại, ra trạng thái quá hạn ở mục 4 |
| 422 `LEAVE_MAPPING_INVALID`, `LEAVE_TARGET_INVALID` | "Có lịch bù không còn hợp lệ. Chọn lại rồi gửi." + mã hỗ trợ. Giữ lựa chọn |
| 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | `Alert` danger: "Có buổi đang có học viên được xếp học bù nên chưa đổi lịch được. Hãy liên hệ Quản lý." Không có cách tự xử lý |

## 7. Dữ liệu đang nhập

Chỉ trong bộ nhớ (Q-P4-02): ngày, ca, preview, lịch bù, lý do, intent. Tắt app thì mất; dòng 12 dưới phần 3: "Đóng ứng dụng lúc này sẽ mất đơn đang lập." Mở lại S2 là form trống. Rời màn khi có bất kỳ dữ liệu đã nhập nào: dialog chung, thân "Đơn đang lập sẽ bị bỏ." Không phát hiện trùng đơn: backend không cấm hai đơn PENDING giao nhau, và không có API để biết trước.

## 8. Trạng thái khác

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| LP-A | Offline khi đang nhập | Form giữ nguyên, ngày/ca/lý do sửa được; Xem buổi, chọn giờ, Gửi khóa; `leave.needOnline` |
| LP-B | Có mạng lại | Không tự gọi; người dùng bấm lại. Hai lần preview cách nhau được kiểm ở mục 6 |
| LP-C | Đang gửi | Thanh gửi busy, form khóa, Back bị chặn |
| LP-D | Chưa rõ kết quả | `IntentBanner`, form khóa, "Gửi lại" cùng key, body. Thoát: dialog "Vẫn thoát" |
| LP-E | 403 | Xóa form, `StatusBlock` không quyền |
| LP-F | 401 | Về Login, xóa form |

## 9. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `leave.plan.title` | Tạo đơn nghỉ | New leave request |
| `leave.plan.sectionRange` | Khoảng nghỉ | Leave dates |
| `leave.plan.from` / `.to` | Từ ngày / Đến ngày | From / To |
| `leave.plan.period` | Ca nghỉ | Time of day |
| `leave.plan.periodHint` | Buổi có giờ nằm trong ca này đều bị ảnh hưởng. | Sessions overlapping this time are affected. |
| `leave.plan.preview` | Xem buổi bị ảnh hưởng | See affected sessions |
| `leave.plan.toBeforeFrom` | Ngày kết thúc phải từ ngày bắt đầu trở đi. | The end date can't be before the start date. |
| `leave.plan.rangeMax` | Khoảng nghỉ tối đa 93 ngày. | Leave can be at most 93 days. |
| `leave.plan.tooMany` | Khoảng nghỉ có quá nhiều buổi. Hãy chia thành các khoảng ngắn hơn. | Too many sessions. Split this into shorter ranges. |
| `leave.plan.noSessions` | Không có buổi dạy nào trong khoảng này, bạn không cần tạo đơn. | No sessions in this range, so you don't need a request. |
| `leave.plan.noticeLate` | Đã quá hạn gửi đơn cho khoảng nghỉ này. Buổi đầu tiên {{session}}; hạn gửi là trước {{deadline}}. Nếu cần nghỉ gấp, hãy liên hệ Quản lý. | It's too late to request this leave. First session: {{session}}; requests were due before {{deadline}}. For urgent leave, contact your manager. |
| `leave.plan.noticeOk` | Gửi trước {{deadline}} | Submit before {{deadline}} |
| `leave.plan.sectionMakeup` | Lịch bù · đã chọn {{done}}/{{total}} | Make-up · {{done}} of {{total}} chosen |
| `leave.plan.pick` / `.change` | Chọn lịch bù / Đổi | Choose make-up / Change |
| `leave.plan.substitute` | Dạy thay | Substitute |
| `leave.plan.pickTitle` | Chọn lịch bù | Choose make-up time |
| `leave.plan.duration` | Thời lượng {{minutes}} phút | {{minutes}} minutes |
| `leave.plan.targetDate` / `.targetPeriod` / `.targetSlot` | Ngày bù / Ca / Giờ bù | Date / Time of day / Time |
| `leave.plan.pickDateFirst` | Chọn ngày để xem giờ còn trống. | Choose a date to see available times. |
| `leave.plan.noSlots` | Không còn giờ trống trong ca này. Thử ca hoặc ngày khác. | No times left here. Try another time of day or date. |
| `leave.plan.useSlot` | Chọn giờ này | Use this time |
| `leave.plan.sectionReason` | Lý do | Reason |
| `leave.plan.pendingNote` | Đơn cần Quản lý duyệt mới đổi lịch. Giờ bù chưa được giữ cho đến khi duyệt. | Your schedule changes only after approval. Make-up times aren't held until then. |
| `leave.plan.memoryNote` | Đóng ứng dụng lúc này sẽ mất đơn đang lập. | Closing the app now will lose this draft. |
| `leave.plan.progress` | Đã chọn {{done}}/{{total}} buổi | {{done}} of {{total}} chosen |
| `leave.plan.submit` | Gửi đơn | Submit |
| `leave.plan.confirmTitle` | Gửi đơn nghỉ? | Submit leave request? |
| `leave.plan.confirmBody` | {{count}} buổi sẽ được đề xuất đổi lịch. Lịch chỉ đổi khi Quản lý duyệt. Nếu chưa được duyệt trước {{expires}}, đơn sẽ hết hạn. | {{count}} sessions would move. Nothing changes until a manager approves. The request expires if not approved before {{expires}}. |
| `leave.plan.confirmBack` | Xem lại | Review |
| `leave.plan.success` | Đã gửi đơn nghỉ. | Leave request submitted. |
| `leave.plan.changedTitle` | Lịch dạy vừa thay đổi. Kiểm tra lại các buổi bên dưới rồi gửi lại. | Your schedule just changed. Check the sessions below and submit again. |
| `leave.plan.sessionChanged` | Buổi này vừa thay đổi. Chọn lại lịch bù. | This session changed. Choose a make-up time again. |
| `leave.plan.targetConflict` | Có lịch bù vừa bị trùng với lịch dạy, lớp hoặc ngày nghỉ đã duyệt. Đổi lịch bù rồi gửi lại. | A make-up time now clashes with a schedule, class or approved leave. Change it and submit again. |
| `leave.plan.studentConflict` | Có lịch bù trùng lịch học của học viên. Đổi lịch bù rồi gửi lại. | A make-up time clashes with a student's timetable. Change it and submit again. |
| `leave.plan.mappingInvalid` | Có lịch bù không còn hợp lệ. Chọn lại rồi gửi. | A make-up time is no longer valid. Choose again and submit. |
| `leave.plan.hasPlacements` | Có buổi đang có học viên được xếp học bù nên chưa đổi lịch được. Hãy liên hệ Quản lý. | A session has students placed for make-up, so it can't move yet. Contact your manager. |
| `leave.plan.bodyTooLarge` | Đơn có quá nhiều buổi để gửi một lần. Hãy chia thành các khoảng ngắn hơn. | Too many sessions to submit at once. Split this into shorter ranges. |
| `leave.plan.resetTitle` | Đổi khoảng nghỉ sẽ xóa {{count}} lịch bù đã chọn. | Changing the dates clears {{count}} chosen make-up times. |
| `leave.plan.resetKeep` / `.resetConfirm` | Giữ nguyên / Đổi và xóa | Keep / Change and clear |
| `leave.plan.leaveBody` | Đơn đang lập sẽ bị bỏ. | This draft will be discarded. |

## 10. Accessibility

- `PeriodSelector`, chọn ca trong sheet: `radiogroup`. Tên đọc kèm khung giờ: "Sáng, từ 0 giờ đến 12 giờ".
- `DateField` đọc giá trị ngày đầy đủ. Mở lịch focus tiêu đề.
- Chip giờ là `radio`, đọc "Từ 18:30 đến 20:00". Vùng chạm 44.
- Hàng buổi đọc cả lịch gốc và lịch bù đã chọn.
- Khi preview xong, focus chuyển tới tiêu đề phần 2 và đọc "{n} buổi bị ảnh hưởng".

## 11. testID

`leave-plan-screen`, `leave-plan-back`, `leave-plan-from`, `leave-plan-to`, `leave-plan-calendar`, `leave-plan-period-morning`, `leave-plan-period-afternoon`, `leave-plan-period-evening`, `leave-plan-period-full-day`, `leave-plan-range-error`, `leave-plan-preview`, `leave-plan-preview-error`, `leave-plan-preview-retry`, `leave-plan-no-sessions`, `leave-plan-notice-late`, `leave-plan-notice-ok`, `leave-plan-too-many`, `leave-plan-session-<sessionId>`, `leave-plan-session-substitute-<sessionId>`, `leave-plan-session-target-<sessionId>`, `leave-plan-session-changed-<sessionId>`, `leave-plan-pick-<sessionId>`, `leave-plan-slot-sheet`, `leave-plan-slot-date`, `leave-plan-slot-period-morning`, `leave-plan-slot-period-afternoon`, `leave-plan-slot-period-evening`, `leave-plan-slot-<HHmm>`, `leave-plan-slot-empty`, `leave-plan-slot-confirm`, `leave-plan-reason`, `leave-plan-progress`, `leave-plan-submit`, `leave-plan-confirm`, `leave-plan-confirm-send`, `leave-plan-changed`, `leave-plan-submit-error`, `leave-plan-reset-dialog`, `leave-plan-offline`, `leave-plan-denied`.

## 12. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P4-S2-01 | Mở màn | Xem request | Không có request nào; ca Cả ngày; nút xem khóa |
| TC-P4-S2-02 | | Chọn "Từ ngày", "Đến ngày" trống | "Đến ngày" = "Từ ngày"; nút xem mở |
| TC-P4-S2-03 | `toDate` < `fromDate` | Xem | Lỗi ngày; không request |
| TC-P4-S2-04 | Khoảng 94 ngày tính cả hai đầu | Xem | Lỗi 93 ngày; khoảng đúng 93 ngày thì cho qua |
| TC-P4-S2-05 | Máy múi giờ khác | Chọn 06/11 | Body `fromDate` = `2026-11-06` đúng ngày đã chọn |
| TC-P4-S2-06 | Preview rỗng, `noticeDeadline` null | Xem | `leave-plan-no-sessions`; không có phần 2, 3, không có nút gửi |
| TC-P4-S2-07 | `noticeEligible` false | Xem | `leave-plan-notice-late` có hạn và lời nhắc liên hệ; có danh sách buổi; không có nút chọn lịch bù, không có nút gửi |
| TC-P4-S2-08 | Buổi đầu 23/10, `asOf` 21/10 23:59, `noticeEligible` true | Xem | Cho lập đơn, chữ hạn "00:00 22/10". Client không tự tính lại |
| TC-P4-S2-09 | Đồng hồ máy khác `asOf`, `noticeEligible` true | Xem | Theo `noticeEligible`, không theo đồng hồ máy |
| TC-P4-S2-10 | 422 `LEAVE_TOO_MANY_SESSIONS` | Xem | `leave-plan-too-many` |
| TC-P4-S2-11 | `affectedSessions` trả theo id không theo giờ | Xem | Hàng sắp theo `startsAt` tăng dần |
| TC-P4-S2-12 | `assignmentType` SUBSTITUTE | Xem | Có chip Dạy thay |
| TC-P4-S2-13 | Mở sheet, chưa chọn ngày | Xem | Không gọi `makeup-slots`; có chữ hướng dẫn; ca đã chọn sẵn theo giờ gốc |
| TC-P4-S2-14 | Chọn ngày và ca | Xem request | Đúng `sourceSessionId`, `targetDate`, `targetPeriod`; lưới hiện giờ Việt Nam |
| TC-P4-S2-15 | Đổi ca khi request cũ chậm, cũ về sau | | Chỉ hiện giờ của ca mới |
| TC-P4-S2-16 | Slot giao ca nghỉ cùng ngày | Xem | Không có trong lưới |
| TC-P4-S2-17 | Slot giao lịch bù đã chọn cho buổi khác | Xem | Không có trong lưới |
| TC-P4-S2-18 | Nghỉ ca Sáng, slot ca Chiều cùng ngày | Xem | Vẫn có trong lưới |
| TC-P4-S2-19 | Slots rỗng | Xem | `leave-plan-slot-empty` |
| TC-P4-S2-20 | Có 48 slot gồm giờ khuya | Mở | Không lọc; cuộn tới giờ gần giờ gốc; không có slot nào được chọn sẵn |
| TC-P4-S2-21 | `sessionVersion` khác preview | Mở sheet | Đóng sheet; preview lại; mục 6.1 |
| TC-P4-S2-22 | Chọn 1/3 buổi | Xem | "Đã chọn 1/3 buổi"; nút gửi khóa |
| TC-P4-S2-23 | Đủ 3/3, lý do trống | Bấm gửi | Báo `leave.reasonRequired`; focus ô lý do; không request |
| TC-P4-S2-24 | Lý do chỉ khoảng trắng; 1001 ký tự | Bấm gửi | Không request; 1001 ký tự bộ đếm danger |
| TC-P4-S2-25 | Đủ điều kiện | Bấm gửi | Gọi preview lại **trước** dialog xác nhận; rồi tới dialog |
| TC-P4-S2-26 | Xác nhận gửi | Xem body | Có `sourceVersions` từ lần preview gần nhất; đủ `sessionMappings`, `startsAt`/`endsAt` đúng nguyên slot; **không có** `dayMappings`; có UUID v4 |
| TC-P4-S2-27 | Lần preview lại đổi version 1 buổi | Bấm gửi | Không gửi; bỏ lịch bù buổi đó; giữ buổi khác; `leave-plan-changed` |
| TC-P4-S2-28 | Lần preview lại thêm 1 buổi | Bấm gửi | Thêm hàng chưa có lịch bù; tiến độ giảm; nút gửi khóa |
| TC-P4-S2-29 | Lần preview lại `noticeEligible` false | Bấm gửi | Trạng thái quá hạn; không gửi |
| TC-P4-S2-30 | Body > 64 KiB | Bấm gửi | Báo chia khoảng; không request |
| TC-P4-S2-31 | 201 | Gửi | Replace S3 đúng `id`; Back về S1; toast không có lý do nghỉ |
| TC-P4-S2-32 | 409 `LEAVE_REQUEST_STALE` | Gửi | Mục 6.1; không báo thành công |
| TC-P4-S2-33 | 409 `LEAVE_TARGET_CONFLICT` | Gửi | Alert; giữ mọi lựa chọn và lý do |
| TC-P4-S2-34 | 409 `LEAVE_STUDENT_CONFLICT` | Gửi | Alert riêng; giữ form |
| TC-P4-S2-35 | 422 `LEAVE_NOTICE_TOO_SHORT` | Gửi | Preview lại, trạng thái quá hạn |
| TC-P4-S2-36 | 409 `SESSION_HAS_MAKEUP_PLACEMENTS` | Gửi | Alert liên hệ Quản lý |
| TC-P4-S2-37 | Mất mạng sau khi gửi | Gửi | `IntentBanner`; form khóa; "Gửi lại" giữ nguyên key, body |
| TC-P4-S2-38 | Sau intent bị từ chối, sửa lịch bù | Gửi lại | Key mới |
| TC-P4-S2-39 | Double tap Gửi | | Một request |
| TC-P4-S2-40 | Có lịch bù đã chọn | Đổi ngày | Dialog xóa; "Giữ nguyên" không đổi gì; "Đổi và xóa" xóa lịch bù, giữ lý do, yêu cầu preview lại |
| TC-P4-S2-41 | Chưa có lịch bù | Đổi ca | Xóa preview, không dialog |
| TC-P4-S2-42 | Có dữ liệu | Back, Android Back | Dialog thoát; "Ở lại" giữ nguyên |
| TC-P4-S2-43 | Offline | Xem | Form sửa được; nút cần mạng khóa; không tự gọi khi có mạng lại |
| TC-P4-S2-44 | 403 giữa lúc nhập | Gửi | Xóa form; `leave-plan-denied` |
| TC-P4-S2-45 | Đang nhập, đăng xuất | Đăng nhập lại | Form trống |

Ứng viên Maestro E2E: TC-P4-S2-02, -06, -07, -12, -14, -22, -26, -27, -31, -40.
