# P0-S3 — access-denied · Kế hoạch triển khai slice

Ngày tách: 30/10/2026 (Asia/Bangkok). Người lập: Codex.

**Kế hoạch tổng đã được người dùng duyệt qua phản hồi “Duyệt”. Người dùng đã duyệt và yêu cầu “duyệt và triển khai”; đã triển khai UI mock và bàn giao review. UI chưa được approve; API chưa được phép triển khai.**

## 1. Mục tiêu và nguồn đối chiếu

Thông báo không đủ quyền vào ứng dụng.

- BR/UC: BR-AUTH-01, BR-SCOPE-03; UC-M-01, UC-MG-01.
- [Kế hoạch tổng phase 0](phase-000-foundation-auth.md).
- [Design slice của Claude](../../design/foundation-auth/access-denied/design.md).
- [Design cấp phase](../../design/foundation-auth/design.md): theme, token, primitives, navigation và khung workspace.
- [Tiến độ phase](../../progress/phase/phase-000-foundation-auth.md).

Đây là tài liệu triển khai, không sửa hoặc thay thế design Claude. Không tạo thêm phase sản phẩm hoặc đổi mã slice P0-S3.

## 2. Phụ thuộc và phạm vi mã nguồn dự kiến

UI-00 → UI-01 → UI-02; nhận user mô phỏng đã xác minh từ root P0-S1 hoặc đăng nhập P0-S2. Không yêu cầu gọi API mới khi màn được mở.

`src/modules/auth/screens/DeniedScreen.tsx`, root navigation và hook logout dùng chung; dùng BrandHeader, GlassCard, StatusBlock, Chip, Alert và Button.

Phần nền dùng chung theo UI-00/01/02 của kế hoạch tổng được làm một lần, sau khi có yêu cầu implement; không nhân bản theme, mock boundary hoặc root navigation cho từng slice. Bản nháp hiện có phải được rà lại, không tự tính là task hoàn tất.

## 3. Task UI theo thứ tự

Mỗi nhóm hành vi áp dụng TDD: viết test từ design → xác nhận fail đúng nguyên nhân → hiện thực/sửa bản nháp tối thiểu → test pass → kiểm tra hồi quy. Chưa chạy chu trình này trong lượt tách tài liệu.

- [x] **S3-UI-01** — Rà source nháp; viết test fail theo TC-P0-S3-01–11 trước khi hoàn thiện các nhánh UI.
- [x] **S3-UI-02** — Hoàn thiện header auth/thẻ kính, icon lock_person và lời giải thích; chỉ render email và nhãn ADMIN/STUDENT, ẩn role chip với role lạ.
- [x] **S3-UI-03** — Test bằng fixture có displayName/phone để bảo đảm không render thông tin này hoặc thành phần workspace.
- [x] **S3-UI-04** — Logout mock khóa bấm lặp, spinner/nhãn busy; thành công hoặc expired mô phỏng 401 xóa user/cache trước reset Login trống, không toast.
- [x] **S3-UI-05** — Logout lỗi offline/timeout/server giữ nguyên Denied và mở khóa retry; lỗi server có requestId hiện support code; không báo đã logout.
- [x] **S3-UI-06** — Kiểm tra root back thoát app, không về Login/Workspace; mở lại với phiên role không hợp lệ tiếp tục đến Denied mà không lặp route.
- [x] **S3-UI-07** — Focus tiêu đề khi mở; nhóm tài khoản có accessibility label; nút busy; đối chiếu vi/en và sáng/tối, ghi kết quả từng TC.

## 4. Dữ liệu mock và giới hạn

User ADMIN/STUDENT/role lạ, bao gồm fixture chứa thêm thông tin phải ẩn. Logout promise chờ, ok, expired mô phỏng 401, offline, timeout và server requestId req-7. Relaunch với phiên role không hợp lệ vẫn qua bootstrap đến Denied.

Mock đặt ở service boundary, không mock thay hành vi component cần kiểm tra. Không gọi HTTP hoặc triển khai refresh/cookie/schema wire ở bước UI; mock model không phải contract backend. Không cho phép mock mở workspace trong release hoặc làm fallback khi API lỗi.

## 5. Mapping test case từ design

Bảng giữ nguyên ID, điều kiện, thao tác và kỳ vọng từ design Claude. Cột cuối là trạng thái kiểm chứng của kế hoạch mới; kết quả 25 tests bản nháp không tự được gán sang các TC nếu chưa mapping và kiểm tra lại. Những case thao tác thiết bị phải có bằng chứng native, không suy từ Jest.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi | Kiểm chứng |
| --- | --- | --- | --- | --- |
| TC-P0-S3-01 | User ADMIN `ha.nguyen@mindy.vn` | Mở màn | Tiêu đề, mô tả, email, chip "Quản trị viên", nút đăng xuất; không có thành phần workspace | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-02 | User STUDENT | Mở màn | Chip "Học viên" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-03 | User role lạ | Mở màn | Không có `denied-role-chip`; không crash | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-04 | User có displayName/phone | Mở màn | Không render displayName và phone | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-05 | Logout chưa resolve | Bấm nút 2 lần | "Đang đăng xuất…"; service logout gọi 1 lần | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-06 | Logout → thành công | Bấm nút | Đích Login, 2 ô trống; dữ liệu user trong bộ nhớ đã xóa | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-07 | Logout → 401 | Bấm nút | Như TC-P0-S3-06 | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-08 | Logout → mất mạng | Bấm nút | Hiện `denied-error`; vẫn ở màn; nút bấm lại được | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-09 | Logout → 500 requestId "req-7" | Bấm nút | Lỗi kèm "Mã hỗ trợ: req-7" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-10 | Đang ở màn | Nhấn back Android | App thoát (không điều hướng tới Login/Workspace) | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S3-11 | Ngôn ngữ en, theme tối | Mở màn | Chữ tiếng Anh, chip "Administrator", màu theo bảng tối | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |

Sau khi được implement, ghi cho từng TC: file/test name hoặc flow, command, môi trường/build, kết quả thật và đường dẫn bằng chứng; nếu chưa kiểm chứng ghi rõ thay vì đánh dấu pass.

## 6. Kiểm tra native và phần dùng chung

Back Android ở root thoát app; focus tiêu đề, nhóm tài khoản được đọc đúng; bấm lặp logout không tạo yêu cầu mới; không vòng lặp khi mở lại app. Kiểm tra text dài en, email dài và theme tối.

Áp dụng thêm kiểm tra của UI-07 trong kế hoạch tổng: ESLint 0 error/0 warning, Prettier, typecheck, Jest; build và review Android UI mock. iOS có bằng chứng riêng theo Q-PLAT-01. Native smoke với mock không thay thế Maestro API tích hợp của phase.

## 7. Kế hoạch API — giữ đóng đến approve UI toàn phase

Sau approve UI toàn phase: dùng user đã validate từ me/login và contract logout/expired đã chốt trong ADR Auth. Không triển khai một API “check permission” giả chỉ để mở Denied. Xác minh native clear-cookie và phiên không hợp lệ sau relaunch.

Chỉ thực hiện sau khi người dùng approve **toàn bộ UI P0-S1–S4** và xử lý ADR Auth/Q-ENV-01 cùng phụ thuộc liên quan. Không làm API sớm chỉ vì UI riêng slice đã xong. Lint/typecheck/Jest, native build, Maestro tích hợp và nghiệm thu vẫn theo kế hoạch tổng.

## 8. Đầu ra và điều kiện bàn giao UI

Denied đúng 3 nhóm role và giới hạn thông tin, đủ 11 TC có kết quả; logout lỗi/thành công và back có bằng chứng. Slice không cấp quyền truy cập workspace cho role bị chặn.

- [x] Hoàn thành task UI và mapping TC theo bằng chứng sau chỉ thị implement.
- [x] Đối chiếu đúng design, vi/en, sáng/tối và accessibility; ghi khoảng thiếu thực tế.
- [x] Có mock scenario và hướng dẫn tái hiện để người dùng xem cùng UI toàn phase.
- [x] Cập nhật hồ sơ/progress; không tự đánh dấu phase Done hoặc UI được duyệt.

**Cổng hiện tại: chờ người dùng approve UI toàn phase trước API.**

## Bàn giao UI — 30/10/2026

Người dùng đã duyệt và yêu cầu triển khai. UI mock của slice đã hiện thực; `npm run check` pass 63 tests/3 suites, Android emulator build/run và các flow UI có kết quả tại [hồ sơ kiểm chứng](ui-verification.md). Xem [hướng dẫn review/ảnh](ui-review.md).

Các checkbox triển khai UI hoàn thành không thay thế approve UI hoặc nghiệm thu. iOS, TalkBack/VoiceOver, OS khác và E2E API tích hợp có giới hạn được ghi rõ trong hồ sơ. API vẫn Todo; chưa duyệt UI, chưa nghiệm thu phase.
