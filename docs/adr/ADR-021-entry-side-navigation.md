# ADR-021 — Hướng mở UI cho avatar, Back và điều hướng tiến

## Status

**Accepted** — người dùng duyệt ngày 31/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt tất cả adr”. ADR-021 chuyển Proposed → Accepted; ghi nguồn/ngày duyệt và đóng băng file theo ADR-012.

Lịch sử trước duyệt: cập nhật theo đính chính trực tiếp của người dùng ngày 31/10/2026: “Chỉ avatar, back khi thì UI hiện từ trái sang phải. Còn lại là từ phải sang trái”. Yêu cầu này thay cách hiểu trước đó về mọi nút nằm bên trái. Người dùng đã cho phép triển khai; tại thời điểm đó chưa có phản hồi duyệt riêng ADR-021.

Đính chính tiếp theo: “Chuyển UI back trong profile là từ phải sang trái”. Profile là ngoại lệ riêng cho chiều Back, theo chỉ thị mới nhất.

## Ngày

31/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Avatar mở Hồ sơ là ngoại lệ của chiều điều hướng tiến. Vị trí nút trên màn hình không quyết định hướng chuyển màn. Trong giai đoạn Proposed, ADR này được cập nhật trực tiếp theo đính chính; không sửa ADR Accepted cũ.

## Decision

1. Avatar → Profile: màn Hồ sơ đi từ trái sang phải (slide_from_left).
2. Back tại các màn ngoài Profile, MentorClasses và TeachingSchedule: chuyển về màn trước theo chiều trái sang phải. Các màn tiến dùng slide_from_right nên pop stack có chiều Back đúng sẵn.
3. Back riêng trong Profile: từ phải sang trái. Giữ slide_from_left cho cả vòng đời route để native pop đảo chiều mở: Hồ sơ thoát về bên trái. Áp dụng cho Back toolbar, Android Back và native pop; không đổi animation sau transitionEnd và không navigate mới để giả Back.
4. Hai tiện ích Mentor trên Home (Lớp phụ trách → MentorClasses, Lịch dạy → TeachingSchedule): mở màn và Back đều từ phải sang trái theo đính chính tiếp theo kèm ảnh. Khi mở dùng slide_from_right; sau transitionEnd mở, cấu hình route thành slide_from_left để pop thoát sang trái. Mỗi lần push mới vẫn mở từ phải. Không đổi hướng Back của drill-down bên trong hai luồng này.
5. Mọi nút mở màn khác, gồm MentorClasses, ManagerClasses, TeachingSchedule, Settings và các drill-down, dùng slide_from_right (từ phải sang trái), bất kể vị trí trái/phải của nút.
6. Reduced motion dùng none. Giữ motion token, khóa gesture/back khi auth busy, quyền, cache, cookie và API hiện có.

## Alternatives

Quy tắc theo vị trí nút trước đây: bỏ theo đính chính của người dùng. Đổi animation của Profile sau khi mở để ép Back sang phải: bỏ theo chỉ thị mới nhất. Tạo route mới cho Back: không chọn vì làm sai lịch sử stack.

## Consequences

Hai danh sách lớp trả về chiều mở từ phải. Hai tiện ích Mentor mở từ phải và Back thoát sang trái bằng cấu hình sau transitionEnd. Profile mở từ trái, Back trong Profile đảo chiều để thoát về trái; không còn listener đổi animation sau khi mở. Cần review trực tiếp chiều chuyển động trên Android; unit test xác nhận hồi quy điều hướng nhưng không chứng minh chuyển động native. iOS chưa được kiểm chứng.

## BR-slice bị ảnh hưởng

P0-S4 Profile và các cửa vào P1. Không đổi BR nghiệp vụ. [Hồ sơ UI](../implement/phase-001-teaching-workspace/ui-spacing-feedback-update.md).
