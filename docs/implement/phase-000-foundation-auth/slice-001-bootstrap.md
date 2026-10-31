# P0-S1 — bootstrap · Kế hoạch triển khai slice

**Cập nhật 31/10/2026:** bootstrap skeleton dùng layout card đăng nhập thật, không có spinner/delay; cold start không hiện cảnh báo mất phiên. Người dùng đã duyệt phase 0 và đóng đợt sửa. Xem [hồ sơ cập nhật](startup-ui-update.md); nội dung kế hoạch cũ bên dưới là lịch sử khi khác với cập nhật này.

Ngày tách: 30/10/2026 (Asia/Bangkok). Người lập: Codex.

**Kế hoạch tổng đã được người dùng duyệt qua phản hồi “Duyệt”. Người dùng đã duyệt và yêu cầu “duyệt và triển khai”; đã triển khai UI mock và bàn giao review. UI chưa được approve; API chưa được phép triển khai.**

## 1. Mục tiêu và nguồn đối chiếu

Khôi phục phiên và mở workspace.

- BR/UC: BR-AUTH-01, BR-AUTH-03, BR-AUTH-04; UC-M-01, UC-MG-01.
- [Kế hoạch tổng phase 0](phase-000-foundation-auth.md).
- [Design slice của Claude](../../design/foundation-auth/bootstrap/design.md).
- [Design cấp phase](../../design/foundation-auth/design.md): theme, token, primitives, navigation và khung workspace.
- [Tiến độ phase](../../progress/phase/phase-000-foundation-auth.md).

Đây là tài liệu triển khai, không sửa hoặc thay thế design Claude. Không tạo thêm phase sản phẩm hoặc đổi mã slice P0-S1.

## 2. Phụ thuộc và phạm vi mã nguồn dự kiến

UI-00 → UI-01 → UI-02 trong kế hoạch tổng. Slice này xác định root route để Login, Denied và Settings cùng sử dụng; các đích chưa hoàn thiện có thể được stub trong test trước khi tích hợp UI toàn phase.

`src/modules/auth/screens/BootstrapScreen.tsx`, state/hook auth và root navigation; dùng primitives/theme chung, không đặt HTTP trong screen.

Phần nền dùng chung theo UI-00/01/02 của kế hoạch tổng được làm một lần, sau khi có yêu cầu implement; không nhân bản theme, mock boundary hoặc root navigation cho từng slice. Bản nháp hiện có phải được rà lại, không tự tính là task hoàn tất.

## 3. Task UI theo thứ tự

Mỗi nhóm hành vi áp dụng TDD: viết test từ design → xác nhận fail đúng nguyên nhân → hiện thực/sửa bản nháp tối thiểu → test pass → kiểm tra hồi quy. Chưa chạy chu trình này trong lượt tách tài liệu.

- [x] **S1-UI-01** — Rà source nháp và lập test fail theo TC-P0-S1-01–19; giữ đúng nội dung vi/en và testID từ design.
- [x] **S1-UI-02** — Hoàn thiện header auth và native splash theo phần dùng chung; trước 600ms chưa hiện checking, sau 600ms hiện spinner/nhãn; hủy timer khi rời màn.
- [x] **S1-UI-03** — Mock guest/expired/inactive và reset stack đến Login; chuyển đúng thông báo, xóa dữ liệu phiên mô phỏng với inactive.
- [x] **S1-UI-04** — Mock user đã xác minh cho MENTOR/MANAGER/ADMIN/STUDENT/role lạ; chọn workspace hoặc Denied chỉ bằng kết quả lần kiểm tra hiện tại.
- [x] **S1-UI-05** — Hoàn thiện thẻ lỗi offline/timeout/server/payload sai/config; đúng icon, focus tiêu đề và mã hỗ trợ selectable. Config không có retry.
- [x] **S1-UI-06** — Retry chỉ theo thao tác người dùng, khóa bấm lặp, giữ loading đúng design rồi nhận kết quả; không retry khi foreground hoặc ngầm định kỳ.
- [x] **S1-UI-07** — Kiểm tra không render workspace khi lỗi dù fixture có user/role cũ; root không back về bootstrap sau chuyển đích.
- [x] **S1-UI-08** — Đối chiếu sáng/tối, vi/en, safe area, font scale, reduced motion; ghi bằng chứng và kết quả từng TC trong bảng dưới.

## 4. Dữ liệu mock và giới hạn

Promise kiểm tra phiên đang chờ; guest; sessionExpired; accountInactive; user role MENTOR/MANAGER/ADMIN/STUDENT/NEW_ROLE; offline; timeout; server có/không requestId; invalidResponse; config. Retry có thể đổi kết quả lần 1/lần 2. Fixture user cache cũ không được dùng làm nguồn route.

Mock đặt ở service boundary, không mock thay hành vi component cần kiểm tra. Không gọi HTTP hoặc triển khai refresh/cookie/schema wire ở bước UI; mock model không phải contract backend. Không cho phép mock mở workspace trong release hoặc làm fallback khi API lỗi.

## 5. Mapping test case từ design

Bảng giữ nguyên ID, điều kiện, thao tác và kỳ vọng từ design Claude. Cột cuối là trạng thái kiểm chứng của kế hoạch mới; kết quả 25 tests bản nháp không tự được gán sang các TC nếu chưa mapping và kiểm tra lại. Những case thao tác thiết bị phải có bằng chứng native, không suy từ Jest.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi | Kiểm chứng |
| --- | --- | --- | --- | --- |
| TC-P0-S1-01 | Kiểm tra phiên đang chờ (promise chưa resolve) | Mở app, chưa đủ 600ms | Có `bootstrap-screen`, header; **chưa** có `bootstrap-checking` | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-02 | Như trên | Chờ quá 600ms | Hiện `bootstrap-checking` với chữ đúng ngôn ngữ (vi và en) | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-03 | Không có phiên | Mở app | Đích là Login; không có thông báo phiên hết hạn | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-04 | `me` → MENTOR ACTIVE | Mở app | Đích là `workspace-mentor-root`; back không về bootstrap | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-05 | `me` → MANAGER ACTIVE | Mở app | Đích là `workspace-manager-root` | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-06 | Máy còn lưu user MENTOR cũ; `me` → MANAGER | Mở app | Đích là workspace Quản lý (role từ server, không từ cache) | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-07 | Máy còn lưu user cũ; kiểm tra phiên lỗi mất mạng | Mở app | Hiện thẻ lỗi offline; **không** render workspace nào | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-08 | `me` → ADMIN | Mở app | Đích là Access denied | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-09 | `me` → STUDENT | Mở app | Đích là Access denied | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-10 | `me` → role ngoài enum đã biết | Mở app | Đích là Access denied (không crash, không vào workspace) | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-11 | Phiên hết hạn (refresh không hợp lệ) | Mở app | Đích là Login, hiện cảnh báo `sessionExpired` | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-12 | `me` → 404 USER_NOT_FOUND | Mở app | Phiên cục bộ bị xóa; đích Login với cảnh báo `accountInactive` | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-13 | Timeout | Mở app | Thẻ lỗi timeout, có nút Thử lại | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-14 | 500 có requestId "req-123" | Mở app | Thẻ lỗi server, hiện "Mã hỗ trợ: req-123" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-15 | Payload `me` sai định dạng | Mở app | Thẻ lỗi server (sai định dạng); không vào workspace | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-16 | Thiếu cấu hình API | Mở app | Thẻ lỗi cấu hình; không có `bootstrap-retry-button` | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-17 | Lần 1 offline, lần 2 MENTOR | Bấm Thử lại | Nút chuyển "Đang thử lại…", bấm thêm không gửi yêu cầu thứ hai; sau đó vào workspace Mentor | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-18 | Lần 1 offline, lần 2 vẫn offline | Bấm Thử lại | Quay lại thẻ lỗi offline, nút hết loading | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S1-19 | Theme tối, ngôn ngữ en | Hiện thẻ lỗi | Màu theo bảng tối; chữ tiếng Anh | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |

Sau khi được implement, ghi cho từng TC: file/test name hoặc flow, command, môi trường/build, kết quả thật và đường dẫn bằng chứng; nếu chưa kiểm chứng ghi rõ thay vì đánh dấu pass.

## 6. Kiểm tra native và phần dùng chung

Mốc 600ms và chuyển cảnh không nháy; splash/font; back Android thoát ở root, sau reset không quay về bootstrap; foreground tại lỗi không tự retry; focus screen reader vào tiêu đề lỗi; palette/typography ở vi/en và sáng/tối.

Áp dụng thêm kiểm tra của UI-07 trong kế hoạch tổng: ESLint 0 error/0 warning, Prettier, typecheck, Jest; build và review Android UI mock. iOS có bằng chứng riêng theo Q-PLAT-01. Native smoke với mock không thay thế Maestro API tích hợp của phase.

## 7. Kế hoạch API — giữ đóng đến approve UI toàn phase

Sau approve UI toàn phase: đối chiếu me/refresh, trạng thái không có phiên/hết phiên/USER_NOT_FOUND và clear-session với ADR Auth/contract. Viết schema/service/query test trước khi nối HTTP; chặn mọi fallback role cache. Cookie jar và refresh native cần bằng chứng riêng.

Chỉ thực hiện sau khi người dùng approve **toàn bộ UI P0-S1–S4** và xử lý ADR Auth/Q-ENV-01 cùng phụ thuộc liên quan. Không làm API sớm chỉ vì UI riêng slice đã xong. Lint/typecheck/Jest, native build, Maestro tích hợp và nghiệm thu vẫn theo kế hoạch tổng.

## 8. Đầu ra và điều kiện bàn giao UI

Header, checking, thẻ lỗi và điều hướng root mock đúng design; đủ 19 TC có kết quả; ảnh/bằng chứng native tương ứng. Hoàn tất riêng slice không cho phép gắn API trước UI toàn phase.

- [x] Hoàn thành task UI và mapping TC theo bằng chứng sau chỉ thị implement.
- [x] Đối chiếu đúng design, vi/en, sáng/tối và accessibility; ghi khoảng thiếu thực tế.
- [x] Có mock scenario và hướng dẫn tái hiện để người dùng xem cùng UI toàn phase.
- [x] Cập nhật hồ sơ/progress; không tự đánh dấu phase Done hoặc UI được duyệt.

**Cổng hiện tại: chờ người dùng approve UI toàn phase trước API.**

## Bàn giao UI — 30/10/2026

Người dùng đã duyệt và yêu cầu triển khai. UI mock của slice đã hiện thực; `npm run check` pass 63 tests/3 suites, Android emulator build/run và các flow UI có kết quả tại [hồ sơ kiểm chứng](ui-verification.md). Xem [hướng dẫn review/ảnh](ui-review.md).

Các checkbox triển khai UI hoàn thành không thay thế approve UI hoặc nghiệm thu. iOS, TalkBack/VoiceOver, OS khác và E2E API tích hợp có giới hạn được ghi rõ trong hồ sơ. API vẫn Todo; chưa duyệt UI, chưa nghiệm thu phase.
