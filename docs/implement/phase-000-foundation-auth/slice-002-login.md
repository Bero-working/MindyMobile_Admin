# P0-S2 — login · Kế hoạch triển khai slice

Ngày tách: 30/10/2026 (Asia/Bangkok). Người lập: Codex.

**Kế hoạch tổng đã được người dùng duyệt qua phản hồi “Duyệt”. Người dùng đã duyệt và yêu cầu “duyệt và triển khai”; đã triển khai UI mock và bàn giao review. UI chưa được approve; API chưa được phép triển khai.**

## 1. Mục tiêu và nguồn đối chiếu

Đăng nhập email/mật khẩu.

- BR/UC: BR-AUTH-01, BR-AUTH-02, BR-AUTH-03; UC-M-01, UC-MG-01.
- [Kế hoạch tổng phase 0](phase-000-foundation-auth.md).
- [Design slice của Claude](../../design/foundation-auth/login/design.md).
- [Design cấp phase](../../design/foundation-auth/design.md): theme, token, primitives, navigation và khung workspace.
- [Tiến độ phase](../../progress/phase/phase-000-foundation-auth.md).

Đây là tài liệu triển khai, không sửa hoặc thay thế design Claude. Không tạo thêm phase sản phẩm hoặc đổi mã slice P0-S2.

## 2. Phụ thuộc và phạm vi mã nguồn dự kiến

UI-00 → UI-01 → UI-02 và root routing P0-S1. Tích hợp đích thành công với workspace tối thiểu/P0-S4 và Denied/P0-S3 khi các UI đó đã sẵn sàng.

`src/modules/auth/screens/LoginScreen.tsx`, state/hook auth và resource dịch; dùng TextField/Button/Alert/Sheet chung. Boundary đăng nhập chỉ là mock tại bước UI.

Phần nền dùng chung theo UI-00/01/02 của kế hoạch tổng được làm một lần, sau khi có yêu cầu implement; không nhân bản theme, mock boundary hoặc root navigation cho từng slice. Bản nháp hiện có phải được rà lại, không tự tính là task hoàn tất.

## 3. Task UI theo thứ tự

Mỗi nhóm hành vi áp dụng TDD: viết test từ design → xác nhận fail đúng nguyên nhân → hiện thực/sửa bản nháp tối thiểu → test pass → kiểm tra hồi quy. Chưa chạy chu trình này trong lượt tách tài liệu.

- [x] **S2-UI-01** — Rà source nháp; viết test fail theo TC-P0-S2-01–23, kiểm tra bố cục/header/thẻ/footer và không có Google, “hoặc”, ghi nhớ đăng nhập.
- [x] **S2-UI-02** — Hoàn thiện email/password trống mặc định, giới hạn 320/128, autofill, keyboard email, return tiếp/go và nút hiện/ẩn có label đúng trạng thái.
- [x] **S2-UI-03** — Validation chỉ sau submit rồi cập nhật khi gõ; email required/format và password required; focus field lỗi đầu. Trim email khi kiểm tra/gửi, không trim password và không thêm yêu cầu độ dài tối thiểu.
- [x] **S2-UI-04** — Khóa field, mắt, forgot và back khi gửi; ẩn bàn phím, spinner/nhãn đúng; bấm hoặc submit từ bàn phím lặp chỉ gọi mock một lần.
- [x] **S2-UI-05** — Sai thông tin: giữ email, xóa password, focus password, viền cả hai ô lỗi; gõ bất kỳ field nào ẩn hộp sai thông tin. Offline/timeout/server/invalidResponse giữ cả hai giá trị.
- [x] **S2-UI-06** — Thông báo expired/inactive từ bootstrap bị ẩn khi submit; một alert đầu thẻ; lỗi 5xx có support code selectable; config không gửi HTTP.
- [x] **S2-UI-07** — Thành công MENTOR/MANAGER reset workspace + toast; ADMIN/STUDENT/role lạ reset Denied không toast thành công. Sau logout form trống.
- [x] **S2-UI-08** — Sheet quên mật khẩu chỉ hướng dẫn liên hệ và đóng bằng Đã hiểu; không gọi reset-password/email API.
- [x] **S2-UI-09** — Kiểm tra scroll khi bàn phím mở, focus/alert, vùng chạm và font scale; đối chiếu vi/en, sáng/tối và motion với design; ghi bằng chứng.

## 4. Dữ liệu mock và giới hạn

Login promise đang chờ; thành công theo từng role; invalidCredentials (bao gồm account khóa/chưa active dưới cùng thông báo); offline, timeout, server có requestId, invalidResponse, config. Đầu vào bootstrap có sessionExpired/accountInactive; đầu vào sau logout không có dữ liệu user cũ. Chỉ thêm hành vi 429 khi contract sau này xác nhận.

Mock đặt ở service boundary, không mock thay hành vi component cần kiểm tra. Không gọi HTTP hoặc triển khai refresh/cookie/schema wire ở bước UI; mock model không phải contract backend. Không cho phép mock mở workspace trong release hoặc làm fallback khi API lỗi.

## 5. Mapping test case từ design

Bảng giữ nguyên ID, điều kiện, thao tác và kỳ vọng từ design Claude. Cột cuối là trạng thái kiểm chứng của kế hoạch mới; kết quả 25 tests bản nháp không tự được gán sang các TC nếu chưa mapping và kiểm tra lại. Những case thao tác thiết bị phải có bằng chứng native, không suy từ Jest.

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi | Kiểm chứng |
| --- | --- | --- | --- | --- |
| TC-P0-S2-01 | — | Mở Login | Có tiêu đề, phụ đề, 2 ô, "Quên mật khẩu?", nút Đăng nhập, footer; **không** có nút Google, "hoặc", "Ghi nhớ đăng nhập" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-02 | — | Bấm Đăng nhập khi 2 ô trống | Hiện "Nhập email" và "Nhập mật khẩu"; không gửi; focus ô Email | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-03 | — | Email "linh.tran", mật khẩu "x", bấm Đăng nhập | "Email không hợp lệ"; không gửi | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-04 | Đang hiện lỗi email | Sửa thành "linh.tran@mindy.vn" | Lỗi email biến mất ngay | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-05 | — | Email "  linh.tran@mindy.vn  ", mật khẩu " p@ss ", gửi | Service nhận email đã cắt khoảng trắng, mật khẩu giữ nguyên " p@ss " | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-06 | Service chưa resolve | Gửi hợp lệ, bấm Đăng nhập lần 2 | Nút "Đang đăng nhập…" + spinner; ô bị khóa; service chỉ được gọi 1 lần | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-07 | Service → INVALID_CREDENTIALS | Gửi | Hộp lỗi "Email hoặc mật khẩu không đúng…"; email giữ, mật khẩu trống, focus Mật khẩu; không điều hướng | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-08 | Đang hiện hộp lỗi sai thông tin | Gõ vào ô Mật khẩu | Hộp lỗi biến mất | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-09 | Service → mất mạng | Gửi | Hộp lỗi mất mạng; email và mật khẩu giữ nguyên | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-10 | Service → timeout | Gửi | Hộp lỗi timeout | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-11 | Service → 503 requestId "req-9" | Gửi | Hộp lỗi hệ thống + "Mã hỗ trợ: req-9" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-12 | Service → MENTOR | Gửi | Đích `workspace-mentor-root`; toast "Đăng nhập thành công"; back không về Login | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-13 | Service → MANAGER | Gửi | Đích `workspace-manager-root` | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-14 | Service → ADMIN | Gửi | Đích Access denied; không toast thành công | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-15 | Service → STUDENT | Gửi | Đích Access denied | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-16 | — | Bấm nút mắt 2 lần | Mật khẩu hiện rồi ẩn; label đổi "Hiện mật khẩu" ↔ "Ẩn mật khẩu" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-17 | — | Bấm "Quên mật khẩu?" rồi "Đã hiểu" | Sheet mở với nội dung mục 6, đóng lại; không gọi service nào | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-18 | Vào từ bootstrap với `sessionExpired` | Mở Login | Hộp cảnh báo phiên hết hạn; bấm Đăng nhập thì ẩn | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-19 | Vào từ bootstrap với `accountInactive` | Mở Login | Hộp cảnh báo tài khoản ngừng hoạt động | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-20 | Vào sau đăng xuất | Mở Login | Hai ô trống; toast "Đã đăng xuất" | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-21 | Ô Email đang focus | Bấm phím "Tiếp" | Focus ô Mật khẩu; phím return ở Mật khẩu gửi form | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-22 | Thiếu cấu hình | Gửi hợp lệ | Hộp lỗi cấu hình; service HTTP không được gọi | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |
| TC-P0-S2-23 | Ngôn ngữ en, theme tối | Gửi khi 2 ô trống | Chữ tiếng Anh theo bảng mục 7; màu theo bảng tối | UI mock đã kiểm tra — [mapping/bằng chứng](ui-verification.md); API chưa kiểm tra |

Sau khi được implement, ghi cho từng TC: file/test name hoặc flow, command, môi trường/build, kết quả thật và đường dẫn bằng chứng; nếu chưa kiểm chứng ghi rõ thay vì đánh dấu pass.

## 6. Kiểm tra native và phần dùng chung

Keyboard/return key và autofill; focus email lỗi đầu/password sau sai thông tin; password toggle không mất dữ liệu; back bị khóa lúc submitting; scroll luôn tiếp cận được ô/nút; sheet focus/đóng; chuyển root và toast trên đúng màn.

Áp dụng thêm kiểm tra của UI-07 trong kế hoạch tổng: ESLint 0 error/0 warning, Prettier, typecheck, Jest; build và review Android UI mock. iOS có bằng chứng riêng theo Q-PLAT-01. Native smoke với mock không thay thế Maestro API tích hợp của phase.

## 7. Kế hoạch API — giữ đóng đến approve UI toàn phase

Sau approve UI toàn phase: lập contract login thực (email/password/deviceName nếu áp dụng), map mã lỗi hiện hữu và response user/role qua Zod; kiểm chứng cookie native và session sau relaunch. Không suy wire shape hoặc role đã xác minh từ mock. Trạng thái 429 chỉ nối khi contract có căn cứ.

Chỉ thực hiện sau khi người dùng approve **toàn bộ UI P0-S1–S4** và xử lý ADR Auth/Q-ENV-01 cùng phụ thuộc liên quan. Không làm API sớm chỉ vì UI riêng slice đã xong. Lint/typecheck/Jest, native build, Maestro tích hợp và nghiệm thu vẫn theo kế hoạch tổng.

## 8. Đầu ra và điều kiện bàn giao UI

Form và các nhánh đăng nhập mock đúng design, đủ 23 TC có kết quả, không lộ trạng thái khóa tài khoản; có bằng chứng keyboard/back/focus. Không coi login mock thành công là auth thật.

- [x] Hoàn thành task UI và mapping TC theo bằng chứng sau chỉ thị implement.
- [x] Đối chiếu đúng design, vi/en, sáng/tối và accessibility; ghi khoảng thiếu thực tế.
- [x] Có mock scenario và hướng dẫn tái hiện để người dùng xem cùng UI toàn phase.
- [x] Cập nhật hồ sơ/progress; không tự đánh dấu phase Done hoặc UI được duyệt.

**Cổng hiện tại: chờ người dùng approve UI toàn phase trước API.**

## Bàn giao UI — 30/10/2026

Người dùng đã duyệt và yêu cầu triển khai. UI mock của slice đã hiện thực; `npm run check` pass 63 tests/3 suites, Android emulator build/run và các flow UI có kết quả tại [hồ sơ kiểm chứng](ui-verification.md). Xem [hướng dẫn review/ảnh](ui-review.md).

Các checkbox triển khai UI hoàn thành không thay thế approve UI hoặc nghiệm thu. iOS, TalkBack/VoiceOver, OS khác và E2E API tích hợp có giới hạn được ghi rõ trong hồ sơ. API vẫn Todo; chưa duyệt UI, chưa nghiệm thu phase.
