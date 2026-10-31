# P0-S4 — settings · Kế hoạch triển khai slice

Ngày tách: 30/10/2026 (Asia/Bangkok). Người lập: Codex.

**Hiện hành 30/10/2026:** người dùng đã duyệt UI, cho tích hợp API, sau đó cập nhật design S4 và yêu cầu cập nhật UI. S4 nay gồm **Cài đặt + Hồ sơ**; tra [phạm vi và kiểm chứng cập nhật](settings-profile-update.md). Các task/bản ghi một trang Tài khoản bên dưới là lịch sử theo design cũ, không yêu cầu duyệt lại hoặc ngăn yêu cầu cập nhật hiện tại.

## 1. Mục tiêu và nguồn đối chiếu

Ngôn ngữ, giao diện và đăng xuất.

- BR/UC: BR-AUTH-03, BR-DATA-01, BR-DATA-02; UC-M-01, UC-MG-01.
- [Kế hoạch tổng phase 0](phase-000-foundation-auth.md).
- [Design slice của Claude](../../design/foundation-auth/settings/design.md).
- [Design cấp phase](../../design/foundation-auth/design.md): theme, token, primitives, navigation và khung workspace.
- [Tiến độ phase](../../progress/phase/phase-000-foundation-auth.md).

Đây là tài liệu triển khai, không sửa hoặc thay thế design Claude. Không tạo thêm phase sản phẩm hoặc đổi mã slice P0-S4.

## 2. Phụ thuộc và phạm vi mã nguồn dự kiến

UI-00 → UI-01 → UI-02; root P0-S1 và thành công P0-S2 đã có đường tới workspace. Tích hợp P0-S3 để dùng chung hành vi logout mà giữ khác biệt toast theo design.

`src/modules/auth/screens/SettingsScreen.tsx`, `WorkspaceScreen.tsx`, theme/preferences, resource dịch, hook logout/cache và Native Stack. Không tạo thêm slice cho khung workspace P0.

Phần nền dùng chung theo UI-00/01/02 của kế hoạch tổng được làm một lần, sau khi có yêu cầu implement; không nhân bản theme, mock boundary hoặc root navigation cho từng slice. Bản nháp hiện có phải được rà lại, không tự tính là task hoàn tất.

## 3. Task UI theo thứ tự

Mỗi nhóm hành vi áp dụng TDD: viết test từ design → xác nhận fail đúng nguyên nhân → hiện thực/sửa bản nháp tối thiểu → test pass → kiểm tra hồi quy. Chưa chạy chu trình này trong lượt tách tài liệu.

- [x] **S4-UI-01** — Rà source nháp; viết test fail theo TC-P0-S4-01–18 và các điểm khung workspace tại design cấp phase mục 6.
- [x] **S4-UI-02** — Khung workspace Mentor/Manager tối thiểu: profile/role, avatar initials 52px mở Settings, thân placeholder đúng chữ; không thêm lịch/lớp/chuông P1.
- [x] **S4-UI-03** — Settings push từ workspace; header/back, panel/profile, nhóm ngôn ngữ/theme/session, version/build từ app. Đổi theme không reset navigator hoặc mất vị trí trang.
- [x] **S4-UI-04** — Mặc định vi/system; đổi vi/en ngay và toast bằng ngôn ngữ mới; tên Tiếng Việt/English giữ nguyên. Theme system/light/dark đổi ngay, không toast, system theo thay đổi máy.
- [x] **S4-UI-05** — Lưu preference, giữ sau logout/relaunch và áp dụng ở Bootstrap/Login; lưu local lỗi vẫn áp dụng trong phiên hiện tại; không persist dữ liệu phiên/token/user trong preferences.
- [x] **S4-UI-06** — Mở sheet logout hoặc logout-all đúng nội dung; cancel/scrim/back khi chưa gửi không gọi mock; focus vào tiêu đề rồi trả về hàng đã mở khi đóng.
- [x] **S4-UI-07** — Loading khóa confirm lặp, cancel, scrim, kéo sheet và back. Logout lỗi giữ sheet và user, hiện alert/support code, mở khóa hủy/thử lại.
- [x] **S4-UI-08** — Ok hoặc expired mô phỏng 401: xóa user và query cache trước reset Login trống, đúng toast; phân biệt boundary logout(false)/logout(true), nút danger của logout-all.
- [x] **S4-UI-09** — Kiểm tra A logout rồi B login không lộ A; back không quay lại workspace cũ; recent-app snapshot cần native proof; không bổ sung draft/offline data khi Q-DATA-01 chưa chốt.
- [x] **S4-UI-10** — Hoàn thiện radiogroup/radio checked, action label/subtitle, vùng chạm, cuộn/font scale, vi/en/sáng/tối; ghi bằng chứng và bàn giao review toàn phase.

## 4. Dữ liệu mock và giới hạn

User Mentor/Manager, tài khoản A/B; preference lần đầu/đã lưu; hệ thống light/dark; lỗi lưu preference; logout/logout-all promise chờ, ok, expired mô phỏng 401, offline, timeout, server requestId req-5. Seed query cache chứa user A để kiểm tra cleanup.

Mock đặt ở service boundary, không mock thay hành vi component cần kiểm tra. Không gọi HTTP hoặc triển khai refresh/cookie/schema wire ở bước UI; mock model không phải contract backend. Không cho phép mock mở workspace trong release hoặc làm fallback khi API lỗi.

## 5. Mapping test case từ design

Bảng giữ nguyên ID, điều kiện, thao tác và kỳ vọng từ design Claude. Cột cuối là trạng thái kiểm chứng của kế hoạch mới; kết quả 25 tests bản nháp không tự được gán sang các TC nếu chưa mapping và kiểm tra lại. Những case thao tác thiết bị phải có bằng chứng native, không suy từ Jest.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi | Kiểm chứng |
| --- | --- | --- | --- | --- |
| TC-P0-S4-01 | Workspace Mentor, user "Trần Thị Linh" | Bấm avatar | Mở `settings-screen`; tên, email, chip "Mentor" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-02 | Workspace Quản lý | Mở Settings | Chip "Quản lý" (vi) / "Manager" (en) | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-03 | Mặc định lần đầu | Mở Settings | Đã chọn "Tiếng Việt" và "Theo hệ thống" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-04 | Đang vi | Chọn English | Toàn bộ chữ trang đổi sang tiếng Anh; toast "Switched to English"; radio English checked | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-05 | Đã chọn English, khởi động lại app | Mở Login | Login hiển thị tiếng Anh | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-06 | Theme hệ thống = sáng | Chọn Tối | Màu nền/chữ đổi sang bảng tối ngay; không toast | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-07 | Đang "Theo hệ thống" | Mô phỏng máy đổi sang dark | App đổi sang tối không cần mở lại | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-08 | Đã chọn Tối, đăng xuất | Tới Login | Login vẫn tối (thiết lập giữ sau đăng xuất) | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-09 | — | Bấm "Đăng xuất" rồi "Hủy" | Sheet mở với chữ đúng; đóng; không gọi service | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-10 | Logout chưa resolve | Xác nhận, bấm lại, bấm scrim, nhấn back | Chỉ 1 lần gọi service; sheet không đóng; nút "Đang đăng xuất…" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-11 | Logout → thành công | Xác nhận | Đích Login, 2 ô trống, toast "Đã đăng xuất"; cache truy vấn và user trong bộ nhớ đã xóa; back không về workspace | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-12 | Logout → 401 | Xác nhận | Như TC-P0-S4-11 | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-13 | Logout → mất mạng | Xác nhận | `logout-sheet-error` hiện; vẫn ở Settings, user vẫn đăng nhập; "Hủy" dùng được | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-14 | Logout → 500 requestId "req-5" | Xác nhận | Lỗi kèm "Mã hỗ trợ: req-5" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-15 | Logout-all → thành công | Bấm "Đăng xuất mọi phiên", xác nhận | Sheet dùng nút danger, chữ mục 4.3; gọi service logout-all (không gọi logout); Login + toast "Đã đăng xuất khỏi mọi thiết bị" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-16 | User A đăng xuất, user B đăng nhập | Mở Settings | Chỉ thấy tên/email của B; không còn dữ liệu A ở bất kỳ màn nào | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-17 | — | Bấm nút back / back Android | Về workspace đúng role | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S4-18 | Theme tối, en | Mở Settings | Toàn bộ chữ và màu đúng bảng | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |

Sau khi được implement, ghi cho từng TC: file/test name hoặc flow, command, môi trường/build, kết quả thật và đường dẫn bằng chứng; nếu chưa kiểm chứng ghi rõ thay vì đánh dấu pass.

## 6. Kiểm tra native và phần dùng chung

Push/back và hardware back; đổi ngôn ngữ/theme giữ màn; system theme khi app mở; persistence qua relaunch; sheet drag/scrim/back bị khóa khi chờ và focus trả lại khi đóng; switcher/recent snapshot sau logout; font scale và cuộn trên màn nhỏ.

Áp dụng thêm kiểm tra của UI-07 trong kế hoạch tổng: ESLint 0 error/0 warning, Prettier, typecheck, Jest; build và review Android UI mock. iOS có bằng chứng riêng theo Q-PLAT-01. Native smoke với mock không thay thế Maestro API tích hợp của phase.

## 7. Kế hoạch API — giữ đóng đến approve UI toàn phase

Sau approve UI toàn phase: nối logout/logout-all theo contract thực và ADR Auth, ok/401 và lỗi mạng/server; kiểm chứng cookie/user/query cleanup trước điều hướng và phiên trên nhiều thiết bị. Ngôn ngữ/theme tiếp tục chỉ local, không thêm API preference.

Chỉ thực hiện sau khi người dùng approve **toàn bộ UI P0-S1–S4** và xử lý ADR Auth/Q-ENV-01 cùng phụ thuộc liên quan. Không làm API sớm chỉ vì UI riêng slice đã xong. Lint/typecheck/Jest, native build, Maestro tích hợp và nghiệm thu vẫn theo kế hoạch tổng.

## 8. Đầu ra và điều kiện bàn giao UI

Workspace tối thiểu và Settings theo cả 2 role, đủ 18 TC có kết quả, preference/cleanup/back/native có bằng chứng. Không coi đủ UI Settings là approve UI toàn phase hoặc nghiệm thu.

- [x] Hoàn thành task UI và mapping TC theo bằng chứng sau chỉ thị implement.
- [x] Đối chiếu đúng design, vi/en, sáng/tối và accessibility; ghi khoảng thiếu thực tế.
- [x] Có mock scenario và hướng dẫn tái hiện để người dùng xem cùng UI toàn phase.
- [x] Cập nhật hồ sơ/progress; không tự đánh dấu phase Done hoặc UI được duyệt.

**Cổng hiện tại: chờ người dùng approve UI toàn phase trước API.**

## Bàn giao UI — 30/10/2026

Người dùng đã duyệt và yêu cầu triển khai. UI mock của slice đã hiện thực; `npm run check` pass 63 tests/3 suites, Android emulator build/run và các flow UI có kết quả tại [hồ sơ kiểm chứng](ui-verification.md). Xem [hướng dẫn review/ảnh](ui-review.md).

Các checkbox triển khai UI hoàn thành không thay thế approve UI hoặc nghiệm thu. iOS, TalkBack/VoiceOver, OS khác và E2E API tích hợp có giới hạn được ghi rõ trong hồ sơ. API vẫn Todo; chưa duyệt UI, chưa nghiệm thu phase.
