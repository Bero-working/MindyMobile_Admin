# Phase 0 — Kế hoạch triển khai Foundation & Auth

**Hiện hành 31/10/2026:** kế hoạch/UI đã duyệt, API thật 4/4 đã tích hợp. Người dùng xác nhận duyệt phase 0 và yêu cầu kiểm tra/dọn dẹp; xem [hồ sơ rà soát](review-cleanup.md). Các điểm dừng đã vượt qua bên dưới được giữ như kế hoạch lịch sử.

Ngày lập: 30/10/2026 (Asia/Bangkok). Người lập: Codex.

**Trạng thái hiện hành 30/10/2026: người dùng “Duyệt UI, gắn API vào đi”. UI bốn slice đã được duyệt và cổng API đã mở. Đã nối service thật; xem [hồ sơ API](api-integration.md) để biết phạm vi, kiểm chứng và phần còn chờ. Chưa nghiệm thu phase.**

Các ghi nhận chờ approve UI bên dưới là lịch sử kế hoạch trước chỉ thị mới, không yêu cầu xin duyệt lại.

Tên file kế hoạch tổng trùng tên folder: `phase-000-foundation-auth.md`. Theo [ADR-017](../../adr/ADR-017-phase-plan-name-and-slice-breakdown.md), người dùng đã duyệt kế hoạch tổng nên đã tách các tài liệu chi tiết bên dưới. Việc duyệt này mở bước tách tài liệu; code vẫn chờ yêu cầu implement, API vẫn chờ approve UI toàn phase.

| Slice                                   | Kế hoạch chi tiết                                        | Trạng thái                   |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------- |
| P0-S1 — bootstrap                       | [slice-001-bootstrap.md](slice-001-bootstrap.md)         | UI đã duyệt; API đã tích hợp |
| P0-S2 — login                           | [slice-002-login.md](slice-002-login.md)                 | UI đã duyệt; API đã tích hợp |
| P0-S3 — access-denied                   | [slice-003-access-denied.md](slice-003-access-denied.md) | UI đã duyệt; API đã tích hợp |
| P0-S4 — settings và workspace tối thiểu | [slice-004-settings.md](slice-004-settings.md)           | UI đã duyệt; API đã tích hợp |

Bốn file slice phân rã phần UI-03–UI-06 và giữ mapping đủ 71 test case từ design. UI-00/01/02 là phần dùng chung, UI-07 và cổng approve UI/API/nghiệm thu quản lý ở file tổng. Không tạo thêm phase sản phẩm hoặc nhân bản công việc nền.

## 1. Quy trình thực hiện và các điểm dừng

| Bước | Công việc                                                                | Điều kiện chuyển bước                                            |
| ---- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1    | Viết kế hoạch tổng trong folder phase, tên file trùng tên folder         | Người dùng đọc và duyệt kế hoạch tổng                            |
| 1a   | Sau duyệt, tách kế hoạch chi tiết theo các slice trong cùng folder phase | Hoàn tất tài liệu slice; tiếp tục chờ chỉ thị implement          |
| 2    | Chờ chỉ thị implement từ người dùng                                      | Chỉ bắt đầu code khi người dùng yêu cầu implement                |
| 3    | Implement UI toàn phase bằng mock, TDD theo design Claude                | Đủ 4 slice, kiểm tra và chuẩn bị bản UI để duyệt                 |
| 4    | Dừng để người dùng xem và approve UI toàn phase                          | Chưa approve UI thì không gắn API                                |
| 5    | Hoàn thiện contract và tích hợp API bằng TDD                             | UI được approve và các điều kiện auth/môi trường được giải quyết |
| 6    | Cleanup, lint, typecheck, Jest, native build và E2E Maestro              | Có bằng chứng pass toàn phase và hồi quy liên quan               |
| 7    | Trình người dùng nghiệm thu                                              | Chỉ đánh dấu Done sau nghiệm thu rõ ràng                         |

Chỉ thị implement lần đầu mở bước UI mock; không tự mở bước API. Nếu người dùng yêu cầu sửa UI tại bước 4, sửa trong phạm vi UI rồi trình lại. Việc có design, test pass hoặc đọc kế hoạch không thay thế yêu cầu implement và approve UI.

Quy trình này theo chỉ thị mới của người dùng, được ghi tại [ADR-016](../../adr/ADR-016-plan-before-implementation.md), bổ sung [ADR-009](../../adr/ADR-009-phase-tdd-and-ownership.md). Tên hồ sơ phase 0 theo [ADR-015](../../adr/ADR-015-zero-based-phase-numbering.md).

## 2. Mục tiêu và phạm vi

Phase 0 đưa Mentor và Quản lý từ mở ứng dụng đến đúng workspace, quản lý ngôn ngữ/giao diện và đăng xuất. Giữ đúng 4 slice của kế hoạch P0:

| Slice                 | Kết quả cần đạt                                                                    | Design Claude                                                         |
| --------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P0-S1 — bootstrap     | Kiểm tra phiên; vào Login, Denied hoặc workspace đúng role; có loading/lỗi/thử lại | [Bootstrap](../../design/foundation-auth/bootstrap/design.md)         |
| P0-S2 — login         | Email/mật khẩu, validation, hiện/ẩn mật khẩu, lỗi và hướng dẫn quên mật khẩu       | [Login](../../design/foundation-auth/login/design.md)                 |
| P0-S3 — access-denied | ADMIN/STUDENT/role lạ bị chặn; có thể đăng xuất để dùng tài khoản khác             | [Access denied](../../design/foundation-auth/access-denied/design.md) |
| P0-S4 — settings      | Hồ sơ, vi/en, system/light/dark, đăng xuất thiết bị này hoặc mọi phiên             | [Settings](../../design/foundation-auth/settings/design.md)           |

Dùng [design cấp phase](../../design/foundation-auth/design.md) cho luồng điều hướng, token sáng/tối, font/icon, primitives và khung workspace tối thiểu. Nguồn CSS tham chiếu: [global.css.md](../../design/global.css.md). Không sửa các file design của Claude.

Khung workspace chỉ thể hiện người dùng/role và cửa vào Settings. Lịch, lớp học và chức năng vận hành thuộc phase sau. Google login, đăng ký, chọn role, chọn chi nhánh và API đặt lại mật khẩu không thuộc phase 0.

## 3. Hiện trạng trước khi thực hiện kế hoạch

- Cấu hình nền đã có hồ sơ và bằng chứng cũ tại [README](README.md). Không dùng các kết quả đó để kết luận UI mới đã pass.
- Claude đã cung cấp design cấp phase và đủ design/test case của 4 slice. Design xác định defaultTheme `system`, ngôn ngữ mặc định `vi` và palette sáng/tối cho P0.
- Trước khi người dùng bổ sung cổng kế hoạch, Codex đã viết bản nháp UI, test, mock service, theme/primitives, tài nguyên và thay đổi Native Stack trong working tree. Bản nháp chưa được duyệt, chưa được coi là triển khai hoàn tất và không được tiếp tục sửa trước chỉ thị implement.
- Riêng test UI bản nháp đã chạy: 25 tests pass; có cảnh báo giá trị gradient SVG cần xử lý. Lần lint tổng hợp gần nhất dừng ở kiểm tra format README; chưa có kết quả lint tổng hợp pass cho bản nháp. Typecheck riêng đã pass trước đó.
- Chưa build/chạy xác minh native cho bản UI mới; chưa có Maestro cho phase 0; chưa tích hợp API. Không có commit/PR cho phần này.
- Khi được yêu cầu implement: rà soát bản nháp theo kế hoạch trước, giữ các thay đổi có sẵn của người dùng; không reset/clean toàn working tree hoặc tự coi bản nháp là baseline đã approve.

## 4. Cấu trúc mã nguồn dự kiến

| Vị trí                                                   | Trách nhiệm                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/components/ui/`                                     | Primitives theo React Native Reusables, NativeWind, CSS variables; theme và thành phần dùng chung |
| `src/modules/auth/screens/`                              | Bootstrap, Login, Denied, Settings và khung workspace P0                                          |
| `src/modules/auth/components/`                           | Thành phần riêng auth và công cụ review mock chỉ dành cho development                             |
| `src/modules/auth/hooks/`                                | View state, xử lý hành động, khóa thao tác lặp, phối hợp điều hướng và cache                      |
| `src/modules/auth/services/`                             | Boundary UI và mock ở bước UI; service HTTP thật chỉ sau duyệt UI                                 |
| `src/modules/auth/types/`                                | Kiểu UI/boundary; không coi mock model là wire contract backend                                   |
| `src/modules/auth/schemas/`                              | Schema response Zod; chỉ triển khai tại bước API                                                  |
| `src/navigation/`                                        | Native Stack, root theo trạng thái phiên, role và trang con Settings                              |
| `src/translations/` hoặc resource theo namespace feature | Đủ vi/en cùng key và đúng nội dung design                                                         |
| `src/services/storage/`                                  | Preference ngôn ngữ/theme; không persist token/user/role để mở workspace                          |
| `__tests__/`                                             | Test component, điều hướng, state và service/schema ở giai đoạn phù hợp                           |
| `docs/implement/phase-000-foundation-auth/`              | Kế hoạch, mapping test, bằng chứng và ghi chú kiểm chứng                                          |

Theo ADR-001/002/003/004/005/007/013/014: giữ RN hiện tại, TypeScript strict, không explicit `any`/`unknown`, không tự nâng major. Native Stack xử lý transition màn; Reanimated xử lý motion UI; Gesture Handler cho gesture tùy chỉnh. Thông số và reduced motion phải theo design/ADR.

## 5. Danh sách task UI — chỉ thực hiện sau yêu cầu implement

Trạng thái task dưới đây là việc cần kiểm tra và hoàn thành theo kế hoạch, kể cả khi working tree đã có source nháp. Chưa đánh dấu task Done từ source hoặc kết quả test nháp.

### UI-00 — Rà soát baseline và lập mapping kiểm chứng

- [x] Đọc lại design cấp phase, 4 slice và các ADR có hiệu lực; đối chiếu bản nháp với working tree hiện tại.
- [x] Lập bảng mapping toàn bộ `TC-P0-S1-*` đến `TC-P0-S4-*`: test tự động, kiểm thử native hoặc lý do chưa kiểm chứng.
- [x] Ghi khoảng thiếu hoặc mâu thuẫn design trước phần phụ thuộc; Codex không tự sửa design.
- [x] Xác định dependency thực cần giữ/thêm và ảnh hưởng native; giữ nguyên các thay đổi ngoài phạm vi của người dùng.

### UI-01 — Token, theme, tài nguyên và primitives

Phụ thuộc: UI-00.

- [x] Ánh xạ palette sáng/tối từ design sang runtime/CSS variables; mặc định theo hệ thống và phản ứng khi hệ thống đổi theme.
- [x] Dùng Be Vietnam Pro 400/500/600/700 được đóng gói local, Material Symbols Rounded đúng glyph/weight/fill và linh vật của Claude; giữ license/nguồn asset.
- [x] Hoàn thiện Screen, BrandHeader, GlassCard, Button, TextField, InlineAlert, StatusBlock, Toast, BottomSheet, Avatar, ListRow và Chip.
- [x] Kiểm tra safe area, cuộn/bàn phím, font scale, vùng chạm ≥44px, accessibility label/state/focus và reduced motion.
- [x] Hoàn thiện native splash nền teal/wordmark; kiểm tra liên kết font ở Android và cấu hình iOS.
- [x] Xử lý cảnh báo gradient của bản nháp và kiểm tra tài nguyên offline; không tải font/icon lúc app chạy.

### UI-02 — Boundary mock và root navigation

Phụ thuộc: UI-01.

- [x] Mock ở service boundary, phản hồi quyết định được theo scenario: guest, role hợp lệ/không hợp lệ, phiên hết hạn, tài khoản ngừng hoạt động, offline, timeout, 5xx, payload sai, thiếu cấu hình.
- [x] Nhãn chế độ mock rõ ràng trong development; có hướng dẫn mở từng scenario để người dùng review.
- [x] Mock không gọi HTTP, không fallback từ API lỗi sang mock; release không thể mở workspace bằng mock.
- [x] Root Bootstrap/Login/Denied/Workspace thay toàn bộ stack; Settings push từ workspace. Theme/ngôn ngữ đổi không reset vị trí trang.
- [x] Kiểm tra back Android, back gesture và khóa back/thao tác lặp khi hành động đang chờ.

### UI-03 — P0-S1 Bootstrap

Phụ thuộc: UI-02. Test: `TC-P0-S1-01`–`19`.

- [x] TDD trạng thái checking: chỉ header trước 600ms, sau đó spinner và nhãn đúng vi/en.
- [x] Không có phiên → Login; hết phiên/ngừng hoạt động → Login với đúng thông báo.
- [x] Role MENTOR/MANAGER → workspace tương ứng; ADMIN/STUDENT/role lạ → Denied.
- [x] Offline/timeout/server/payload sai không mở workspace bằng role cache.
- [x] Thẻ lỗi, mã hỗ trợ chọn/copy được, retry có khóa bấm lặp; thiếu cấu hình không có retry.
- [x] Không tự retry khi foreground hoặc theo chu kỳ.

### UI-04 — P0-S2 Login

Phụ thuộc: UI-02 và UI-03. Test: `TC-P0-S2-01`–`23`.

- [x] Đúng layout header/thẻ/footer; email/password trống ban đầu; không có Google/ghi nhớ đăng nhập.
- [x] Validation chỉ sau submit, sau đó cập nhật theo nhập; trim email và giữ nguyên mật khẩu; giới hạn 320/128; focus field lỗi đầu tiên.
- [x] Autofill, keyboard/return key, hiện/ẩn mật khẩu, cuộn được khi bàn phím mở.
- [x] Loading khóa field/nút mắt/quên mật khẩu/back và không submit hai lần.
- [x] Sai thông tin giữ email, xóa password, focus password; nhập lại ẩn lỗi. Lỗi mạng/server giữ cả hai field.
- [x] Hộp thông báo phiên hết hạn/ngừng hoạt động; lỗi/mã hỗ trợ; tối đa một thông báo đầu thẻ.
- [x] Thành công reset về đúng workspace + toast; role khác sang Denied, không toast thành công.
- [x] Sheet quên mật khẩu chỉ hướng dẫn liên hệ, không giả gọi API gửi email.

### UI-05 — P0-S3 Access denied

Phụ thuộc: UI-02. Test: `TC-P0-S3-01`–`11`.

- [x] Chỉ hiện email và nhãn role được nhận diện; ẩn chip với role lạ; không lộ displayName/phone/workspace.
- [x] Logout mock khóa thao tác lặp; thành công hoặc expired → Login trống.
- [x] Logout lỗi giữ màn, hiện lỗi/mã hỗ trợ và cho thử lại; không báo thành công giả.
- [x] Back không về workspace hoặc vòng lặp Login/Bootstrap; mở lại với role không hợp lệ vẫn bị chặn.

### UI-06 — P0-S4 Settings và khung workspace

Phụ thuộc: UI-02–UI-05. Test: `TC-P0-S4-01`–`18`.

- [x] Workspace tối thiểu đúng role, avatar/initials và cửa vào Settings; không thêm nội dung nghiệp vụ phase 1.
- [x] Settings hồ sơ/role, phiên bản build, radio vi/en và system/light/dark theo design.
- [x] Chọn ngôn ngữ/theme áp dụng ngay, lưu preference; giữ sau logout/relaunch; lỗi lưu local không chặn lựa chọn trong phiên hiện tại.
- [x] Toast đổi ngôn ngữ bằng ngôn ngữ mới; đổi theme không toast.
- [x] Sheet logout/logout-all đúng nội dung, biến thể nút và loại hành động; cancel không gọi mock service.
- [x] Khi đang logout: khóa confirm lặp, cancel, scrim, gesture kéo và back. Lỗi mở khóa để hủy/thử lại.
- [x] Thành công/expired xóa user và query cache trước reset Login, email/password trống, đúng toast; không quay lại workspace cũ.
- [x] Kiểm tra tài khoản A → logout → tài khoản B không còn dữ liệu A; hành vi recent-app snapshot theo design phải có kiểm chứng native.

### UI-07 — Kiểm tra và gói bản UI để người dùng duyệt

Phụ thuộc: UI-03–UI-06.

- [x] Hoàn tất mapping toàn bộ test case design và ghi kết quả thật; không coi một số test pass là đủ toàn phase.
- [x] `npm run lint`: ESLint 0 error/0 warning, Prettier và `tsc --noEmit` pass.
- [x] `npm test -- --runInBand` pass; test không che lỗi thật bằng mock nội bộ component.
- [x] Build/chạy Android UI mock trên emulator hoặc thiết bị; rà sáng/tối, vi/en, font scale, bàn phím, scroll, focus và back.
- [x] Lưu ảnh/video hoặc bằng chứng màn và hướng dẫn chọn scenario; ghi rõ môi trường, phần chưa kiểm chứng và giới hạn iOS.
- [x] Cập nhật hồ sơ và tiến độ UI theo bằng chứng. **Dừng tại đây, trình người dùng approve toàn bộ UI phase 0.**

Không coi UI mock/native smoke là E2E API tích hợp hoặc nghiệm thu phase.

## 6. Kế hoạch API — chỉ sau khi người dùng approve UI

Phần này là thứ tự dự kiến, không phải cho phép bắt đầu API trong bước UI.

| Task   | Nội dung                                                                              | Điều kiện/đầu ra                                                                       |
| ------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| API-00 | Ghi bằng chứng approve UI toàn phase và xử lý các thay đổi sau review                 | Xác nhận rõ từ người dùng                                                              |
| API-01 | Đối chiếu legacy/backend; hoàn thiện ADR Auth và Q-ENV-01                             | Cookie jar/path/refresh/Origin/CSRF/logout rõ ràng; ADR cần thiết được duyệt           |
| API-02 | Snapshot legacy và contract theo từng UI; schema request/response/error               | Không bịa endpoint, error code hoặc wire shape từ mock                                 |
| API-03 | TDD schema/service: me, login, refresh, logout, logout-all theo contract thực         | Fail → pass; kiểm tra timeout, payload sai và lỗi có requestId                         |
| API-04 | TDD query/hook, refresh đồng thời, expired và session cleanup                         | Không retry vô hạn, không mở workspace bằng role cache, không persist token trong MMKV |
| API-05 | Thay mock bằng service thật cho toàn phase, kiểm tra cả Mentor/Manager và denied role | Không fallback mock; giữ UI đã approve; nếu lệch design thì xử lý đúng cổng            |
| API-06 | Cleanup/lint/typecheck/Jest và native build                                           | Lưu command/output, phiên bản/build, thiết bị thật dùng kiểm chứng                     |
| API-07 | Viết/chạy Maestro cho toàn phase và hồi quy điều hướng                                | Bằng chứng từng flow pass trên app tích hợp, không skipped                             |
| API-08 | Gói kết quả trình nghiệm thu                                                          | Chỉ Done khi người dùng nghiệm thu                                                     |

Endpoint nêu trong design là đầu mối để khảo sát; contract cuối cùng phải đối chiếu source/runtime tại bước API. Giai đoạn này không tự sửa backend hoặc đặt giá trị host/Origin chưa được xác nhận.

## 7. Điều kiện còn chờ và thời điểm cần giải quyết

| Điểm                             | Hiện trạng                                                              | Chặn bước nào                                       |
| -------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Duyệt kế hoạch tổng              | Đã duyệt qua phản hồi “Duyệt” ngày 30/10/2026; đã tách 4 kế hoạch slice | Cổng tách tài liệu đã hoàn tất                      |
| Người dùng yêu cầu implement     | Đã nhận “duyệt và triển khai” ngày 30/10/2026                           | Đã mở bước UI mock; không mở API                    |
| Design P0                        | Claude đã cung cấp đủ file và test case; cần đối chiếu khi implement    | Không còn lý do chờ file design để lập kế hoạch     |
| Q-DESIGN-01 / Q-THEME-01         | Design P0 đã mô tả ranh giới 4 slice, `system`, `vi` và bảng màu        | Không tự mở rộng các quyết định này sang phase khác |
| Người dùng approve UI toàn phase | Chưa có                                                                 | Contract/service/hook/API integration               |
| ADR Auth, Q-ENV-01               | Chưa chốt native cookie, refresh, logout/clear, host/protocol/Origin    | API và kiểm chứng native tích hợp                   |
| Q-PLAT-01                        | Cần xác nhận mốc nghiệm thu Android/iOS và thiết bị/OS tối thiểu        | Phạm vi bằng chứng native/nghiệm thu                |
| Q-DATA-01                        | Chính sách draft chưa chốt; P0 không có draft                           | Không thêm draft/offline persistence trong P0       |
| Tài khoản thử tích hợp           | Cần Mentor, Manager, denied role và dữ liệu theo flow                   | Maestro tích hợp sau API                            |

Không hỏi lại các điểm đã có câu trả lời hợp lệ trong phiên làm việc; chỉ làm rõ thông tin còn thiếu tại bước phụ thuộc.

## 8. Hồ sơ bàn giao

- Kế hoạch tổng: file hiện tại đã được người dùng duyệt ngày 30/10/2026.
- Kế hoạch chi tiết: 4 file slice đã được tách, tra bảng ở đầu file. Code vẫn chờ yêu cầu implement.
- Mapping test và bằng chứng: tạo trong folder phase khi được triển khai; ghi test ID, lệnh, kết quả, build/device và giới hạn.
- Tiến độ/mốc duyệt: [phase-000-foundation-auth](../../progress/phase/phase-000-foundation-auth.md).
- Nhật ký kỹ thuật/cấu hình nền: [README](README.md).
- Quy ước E2E: [e2e-maestro.md](../e2e-maestro.md).

Kế hoạch tổng đã duyệt, đã bàn giao 4 kế hoạch slice; chờ yêu cầu implement. Chưa duyệt UI, chưa tích hợp API và chưa nghiệm thu phase 0.

## Bắt đầu triển khai UI — 30/10/2026

Nguồn: người dùng “duyệt và triển khai”. Duyệt các kế hoạch slice và cho phép triển khai UI mock toàn P0. Rà bản nháp, test theo design, kiểm chứng native và trình duyệt UI. Chưa approve UI/API hoặc nghiệm thu; không sửa design/ADR Accepted.

## Kết quả bước UI — 30/10/2026

UI mock 4/4 slice đã hiện thực và bàn giao review. Kiểm tra: `npm run check` pass 63 tests/3 suites; Android Debug x86_64 build/run pass; có kết quả 5 flow Maestro UI mock qua các lượt ghi rõ build (03/05 được chạy lại sau sửa lỗi). Đây không phải E2E auth tích hợp hoặc bằng chứng iOS.

- [Hướng dẫn và ảnh để người dùng duyệt UI](ui-review.md).
- [Mapping 71 TC và hồ sơ kiểm chứng/giới hạn](ui-verification.md).

Chưa approve UI, chưa gắn API, chưa nghiệm thu hoặc chuyển phase Done. Các mô tả baseline “chờ implement” ở phần lịch sử phía trên không phải trạng thái hiện tại.

## Đính chính role từ người dùng — 30/10/2026

Chỉ có MENTOR và MANAGER; không có role thứ ba, kể cả guest. UI mock đã bỏ fixture role ADMIN/STUDENT/NEW_ROLE và các nhãn tương ứng. Trạng thái phiên chưa đăng nhập được đổi từ `guest` sang `signedOut`, hiển thị “Chưa đăng nhập”. Màn Denied chỉ là phòng vệ cho phiên không hợp lệ, không định nghĩa role bổ sung. Tài khoản demo: mentor@mindy.vn và manager@mindy.vn, mật khẩu bất kỳ không trống. Design/ADR và báo cáo trước đó giữ nguyên để bảo toàn lịch sử; phần role giả trong tài liệu cũ được thay thế bởi đính chính trực tiếp này. Maestro flow đã cập nhật; kết quả pass trước thay đổi không phải bằng chứng cho flow mới. Chưa tích hợp API, UI vẫn chờ duyệt.
