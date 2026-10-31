# P0 — Nền tảng → đăng nhập → đúng workspace

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Hiện hành 31/10/2026: người dùng xác nhận “Duyệt phase 0”, yêu cầu kiểm tra và dọn dẹp. UI đã duyệt, API thật 4/4 đã tích hợp; lint/format/typecheck và 102/102 Jest tests pass trong lượt rà soát. Xem [hồ sơ rà soát](../../implement/phase-000-foundation-auth/review-cleanup.md). Giới hạn native access expiry/iOS giữ nguyên; không suy thành đã kiểm chứng mọi nhánh.**
[Phạm vi/kế hoạch](../../implementation-plan.md#p0-foundation-auth). Ưu tiên P0.
Cổng UI trước API đã mở. Dùng HTTPS API_URL hiện có trong env development; [ADR Auth](../../adr/ADR-019-phase-0-cookie-auth.md) ghi quyết định và giới hạn native cookie. Kiểm chứng Android/iOS và nghiệm thu theo hồ sơ hiện hành; các bảng Todo/chờ duyệt bên dưới là lịch sử trước chỉ thị mới.
ADR liên quan: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-007, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Đã có [design Claude](../../design/foundation-auth/design.md), duyệt UI và tích hợp API. Các bản ghi “chờ duyệt/chưa tích hợp” trong nhật ký bên dưới mô tả thời điểm trước đó.

## Hồ sơ triển khai

Mục triển khai: [phase-000-foundation-auth](../../implement/README.md#phase-000-foundation-auth). Đã tạo [hồ sơ cấu hình nền](../../implement/phase-000-foundation-auth/README.md) ngày 30/10/2026; hồ sơ và bằng chứng triển khai đặt tại đó. Tiến độ và nhật ký phase tiếp tục cập nhật trong file này.

[Kế hoạch implement chi tiết](../../implement/phase-000-foundation-auth/phase-000-foundation-auth.md) — đã được duyệt và triển khai cả UI/API.

## Các mốc hiện hành

| Mốc                               | Trạng thái                | Ngày       | Bằng chứng / giới hạn                                                                                  |
| --------------------------------- | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Design toàn phase (Claude)        | Đã cung cấp               | 30/10/2026 | Đủ bốn slice; S4 cập nhật theo yêu cầu người dùng                                                      |
| Kế hoạch và yêu cầu implement     | Đã duyệt                  | 30/10/2026 | “duyệt và triển khai”                                                                                  |
| UI toàn phase và duyệt UI         | Đã triển khai / đã duyệt  | 30/10/2026 | “Duyệt UI, gắn API vào đi”; cập nhật S4/dialog ngày 31/10                                              |
| API toàn phase                    | Đã tích hợp 4/4           | 30/10/2026 | Contract/snapshot/service và native login/logout; giới hạn theo hồ sơ API                              |
| Cleanup + lint + typecheck + Jest | Pass                      | 31/10/2026 | ESLint 0 error/0 warning, Prettier, tsc, 8 suites/102 tests                                            |
| E2E Maestro                       | Signed-out rerun PASS 1/1 | 31/10/2026 | Signed-out rerun pass sau sửa assertion; Mentor/dialog mới pass lịch sử; chưa rerun Manager/dialog mới |
| Người dùng duyệt phase            | Đã xác nhận               | 31/10/2026 | “Duyệt phase 1, kiểm tra và dọn dẹp”, đính chính “Tôi nhầm, duyệt phase 0”                             |
| Kiểm chứng còn thiếu              | Theo dõi riêng            | 31/10/2026 | iOS, native access expiry/refresh rotation; không ghi Done kỹ thuật toàn bộ khi chưa đủ bằng chứng     |

## Slice hiện hành

| Slice                    | UI            | API         | UI được duyệt | Ghi chú                                                          |
| ------------------------ | ------------- | ----------- | ------------- | ---------------------------------------------------------------- |
| P0-S1 — bootstrap        | Đã triển khai | Đã tích hợp | Có            | me/refresh, kiểm role/status; native expiry còn thiếu bằng chứng |
| P0-S2 — login            | Đã triển khai | Đã tích hợp | Có            | Kiểm DTO/cookie cùng identity, không chọn role                   |
| P0-S3 — access-denied    | Đã triển khai | Đã tích hợp | Có            | Phòng vệ phiên không hợp lệ; không tạo role bổ sung              |
| P0-S4 — settings/profile | Đã triển khai | Đã tích hợp | Có            | vi/en/theme, logout/logout-all; dialog theo ảnh người dùng       |

## Nhật ký thực tế

| Ngày       | Người              | Sự kiện                              | Bằng chứng / giới hạn                                                                                                                | BR/ADR thay đổi                                                          |
| ---------- | ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 30/10/2026 | Codex              | Khởi tạo kế hoạch và khung tiến độ   | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git                                              | Khởi tạo, chưa có thay đổi luật đã duyệt                                 |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan                  | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai              | ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-007, ADR-009 → Accepted |
| 30/10/2026 | Codex              | Thực hiện ADR-011                    | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API                 | ADR-011 Accepted                                                         |
| 30/10/2026 | Codex              | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ                             | ADR-011 bổ sung quy ước tên                                              |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro             | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt                                                 |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR-013                        | Phản hồi “Duyệt 13”; Reanimated/Gesture Handler/Native Stack được chấp nhận; migration chưa thực hiện, tiến độ UI/API giữ nguyên     | ADR-013 Accepted                                                         |

## Ghi nhận khi thực hiện

Ngày 30/10/2026, thực hiện chỉ thị chuyển tài liệu design sang `docs/design/global.css.md` và entry runtime vào `src/global.css` theo ADR-014. Đã cập nhật Metro/import/tham chiếu, kiểm tra bảo toàn CSS mẫu và ADR cũ; `npm run lint` pass. Không tăng tiến độ UI/API hoặc coi là kiểm chứng E2E.

Ngày 30/10/2026, Codex thực hiện yêu cầu cấu hình dự án theo boilerplate: env/react-native-config, aliases, NativeWind + SVG, strict type policy, vi/en và npm tooling. `npm run lint` pass, Jest 2 suites/7 tests pass, Android JS bundle pass; native Android `:app:assembleDebug` BUILD SUCCESSFUL (4 ABI). Xem [hồ sơ](../../implement/phase-000-foundation-auth/README.md) để biết phạm vi và giới hạn. UI/API vẫn 0/4; chưa nghiệm thu phase hoặc thay đổi luật nghiệp vụ.

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.

## Cập nhật ngày 30/10/2026 — kế hoạch trước implement

Người dùng yêu cầu đổi tên nền tảng thành phase 0; đã đồng bộ tên hồ sơ phase-000–008 với P0–P8 theo ADR-015, giữ các ADR cũ nguyên trạng.

Đã nhận design Claude cấp phase và đủ bootstrap/login/access-denied/settings. Trong lượt tiếp tục trước chỉ thị mới, Codex đã viết UI/mock/test/primitives/theme và thay đổi navigation/tài nguyên trong working tree. Đây là bản nháp chưa duyệt. Test UI nháp: 25/25 pass nhưng có cảnh báo gradient SVG; typecheck riêng pass. Lint tổng hợp dừng tại format README; chưa có native build, chạy UI native hoặc Maestro cho bản UI mới. Không dùng bằng chứng config nền cũ cho UI mới.

Sau chỉ thị “Viết kế hoạch implement trong phase…”, đã dừng code và tạo [plan.md](../../implement/phase-000-foundation-auth/phase-000-foundation-auth.md), ghi quy trình mới tại ADR-016. Chờ người dùng đọc và yêu cầu implement trước khi rà soát/sửa tiếp bản nháp. UI/API hoàn tất giữ 0/4, chưa approve UI, chưa gắn API, chưa nghiệm thu. Không tự revert working tree hoặc tạo commit.

30/10/2026 — Theo chỉ thị người dùng, đổi plan.md thành phase-000-foundation-auth.md, cập nhật liên kết. Chờ duyệt kế hoạch tổng trước khi tách kế hoạch chi tiết theo slice trong folder phase; chưa tách và chưa tiếp tục code. ADR-017 ghi nhận thay đổi, tiến độ hoàn tất giữ nguyên.

## Duyệt kế hoạch tổng — 30/10/2026

Người dùng phản hồi “Duyệt”. Theo ADR-017, đã tách 4 kế hoạch slice trong folder implement phase 0, gồm task UI, phụ thuộc, mock, 71 TC design và điểm dừng API. Tra [mục lục slice](../../implement/phase-000-foundation-auth/phase-000-foundation-auth.md). Kế hoạch tổng được duyệt không phải approve UI hoặc chỉ thị implement. Lượt này chỉ thay đổi tài liệu; không sửa code/design/ADR đã đóng băng, không chạy test/build và không tăng số slice hoàn tất. Chờ yêu cầu implement.

30/10/2026 — Người dùng “duyệt và triển khai”: mở triển khai UI mock của 4 slice. Đã sửa gradient, bố cục nút/hàng, TextField, sheet/focus, mock scenario; npm run check pass 63 tests/3 suites, Android :app:assembleDebug pass. Đang chạy lại Maestro UI mock sau khi ảnh native phát hiện lỗi bố cục hàng và encoding nhãn. Chưa approve UI, API và E2E tích hợp chưa bắt đầu. Các ghi nhận chờ implement phía trên là lịch sử.

## Bàn giao UI — 30/10/2026

Đã thực hiện yêu cầu “duyệt và triển khai” đối với UI mock toàn phase: Bootstrap, Login, Access denied, Settings/workspace tối thiểu. UI 4/4 đã hiện thực và bàn giao để người dùng review; API 0/4, chưa approve UI, chưa tích hợp hoặc nghiệm thu phase.

`npm run check` pass 3 suites/63 tests, không skipped; lint 0 error/0 warning, format/typecheck pass. Native Debug x86_64 có keyboard-controller 1.18.5 build/run pass trên Pixel_8 Android 17 API 37; các flow keyboard/error đã rerun pass sau sửa. 01/02/04 có pass từ APK trước thay đổi bàn phím; không tuyên bố cùng-build full-suite hoặc E2E auth thật. Hạn chế font-scale live, iOS, a11y và OS khác ghi rõ tại hồ sơ, không bỏ qua thành pass.

- [Hướng dẫn/ảnh để duyệt UI](../../implement/phase-000-foundation-auth/ui-review.md).
- [Mapping 71 TC, build/log/report và giới hạn](../../implement/phase-000-foundation-auth/ui-verification.md).

Cổng tiếp theo: người dùng approve UI toàn phase. Mốc API, cleanup sau tích hợp, E2E Maestro tích hợp và nghiệm thu vẫn chưa hoàn tất. Không sửa design/ADR Accepted hoặc tạo commit/PR.

30/10/2026 — Người dùng đính chính chỉ có hai role MENTOR/MANAGER, không có role guest. Đã bỏ role giả trong UI mock/review; `signedOut` chỉ biểu thị chưa đăng nhập. Denied dùng fixture phiên không hợp lệ, không gán thêm role. `npm run check` pass lint/format/typecheck và 68/68 tests (3 suites), log `build-logs/phase-0-role-correction-check-final.log`. Maestro đã sửa flow nhưng chưa chạy lại sau đính chính; kết quả trước đó là lịch sử. Chưa approve UI hoặc tích hợp API.

## Hoàn thiện ADR UI — 30/10/2026

Theo chỉ thị người dùng, hoàn thiện NativeWind/Reusables, token dùng chung và schema Zod. `npm run check` pass 73/73 tests; 5/5 Maestro UI mock pass cùng lượt/source cuối. Reduced motion true/false được đọc trên native và khôi phục cài đặt. Xem [hồ sơ](../../implement/phase-000-foundation-auth/ui-adr-completion.md). UI vẫn chờ người dùng approve; API 0/4, chưa E2E tích hợp/nghiệm thu. Design và ADR Accepted giữ nguyên.

## Hạ tầng security/lazy loading — 30/10/2026

Triển khai theo chỉ thị trực tiếp và ADR-018: Keychain facade, Android main/debug network XML, lazy screen/panel và native list viewability. Lint/typecheck, 77 Jest tests, Metro bundle, assembleDebug và processReleaseResources đã pass. Chi tiết và giới hạn tại [hồ sơ hạ tầng](../../implement/phase-000-foundation-auth/security-lazy-loading.md). Không thay tiến độ duyệt UI, API hoặc nghiệm thu phase.

Maestro hạ tầng `06-lazy-loading.yaml` pass 1/1 trên APK mới (1m13s), gồm tail item viewability và Workspace/Settings lazy routes. Đã sửa placeholder/native clipping theo lỗi phát hiện trên emulator; report `build-logs/security-lazy-maestro.xml`. Không thay kết quả/cổng nghiệm thu phase.

## Kết quả tích hợp API — 30/10/2026

Người dùng duyệt UI và yêu cầu nối API, sau đó cung cấp tài khoản test cho hai role. Đã triển khai API 4/4 slice ở mức code theo ADR-019; app chính không dùng mock/review panel. Không sửa ADR Accepted cũ, backend hoặc lưu credentials test trong repo.

| Mốc hiện hành                         | Kết quả                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| UI người dùng duyệt                   | Đã duyệt toàn phase 0                                                                                                      |
| Contract + legacy                     | Đã có bốn contract và năm snapshot nguyên byte có SHA-256                                                                  |
| API code                              | Bootstrap/login/denied/settings đã nối API thật                                                                            |
| Cleanup/lint/typecheck/Jest           | npm run check pass, 8 suites/97 tests                                                                                      |
| Android Debug                         | Build/install pass, Pixel_8 Android 17/API 37                                                                              |
| Maestro API thật                      | 3/3 ca pass hiện hành: signed-out/invalid-login, Mentor/logout, Manager/logout-all; giữ lượt Mentor fail đầu và rerun pass |
| HTTP backend                          | Manager hai phiên: refresh/me 200; logout-all 204; phiên còn lại me/refresh 401                                            |
| Native access expiry/refresh rotation | Chưa có bằng chứng expiry thực trên thiết bị; đã kiểm điều phối bằng Jest và refresh thật qua HTTP                         |
| iOS                                   | Chưa build/run trên macOS                                                                                                  |
| Nghiệm thu phase                      | Chưa nghiệm thu/Done                                                                                                       |

Chi tiết lệnh, log, giới hạn và lịch sử fail tại [hồ sơ API](../../implement/phase-000-foundation-auth/api-integration.md) và [E2E](../../implement/phase-000-foundation-auth/e2e.md). Kết quả mới thay trạng thái Todo/chờ approve UI của snapshot lịch sử phía trên, không tự đóng các nhánh chưa kiểm chứng.

## Cập nhật S4 và dialog — 31/10/2026

Đã thực hiện yêu cầu sửa UI Cài đặt/Hồ sơ theo design cập nhật 30/10 và yêu cầu thay xác nhận logout theo ảnh người dùng. Avatar mở Hồ sơ, bánh răng mở Cài đặt; phone từ UserDto được giữ trong view model; theme cards/toast/ghi chú và hai trang đã hiện thực. Xác nhận logout/logout-all dùng dialog giữa màn hình, có email/phạm vi, danger icon và nút đỏ; giữ xử lý lỗi/busy/cache/API theo ADR-019.

Kiểm chứng: npm run check pass 8 suites/102 tests; typecheck và ESLint test mới pass riêng. Android Pixel_8 API 37 với emulator UI: Maestro Mentor/logout có dialog mới PASS 1/1, 2m19s. Đã xem ảnh native và giữ báo cáo startup fail/interrupted trước đó. Manager/logout-all với hai trang mới có pass 30/10 trước đổi dialog; với dialog mới hiện có unit regression, chưa có lượt native Manager mới. iOS/access expiry native chưa kiểm chứng; chưa nghiệm thu phase.

Chi tiết, ảnh, scope và giới hạn: [hồ sơ cập nhật S4](../../implement/phase-000-foundation-auth/settings-profile-update.md). Không sửa design nguồn/ADR Accepted cũ, không tạo commit hoặc đánh dấu phase Done.

## Duyệt phase 0 và rà soát — 31/10/2026

Người dùng xác nhận duyệt phase 0 và yêu cầu kiểm tra/dọn dẹp. Đã rà soát service auth, điều phối phiên/cache/role, navigation, Login, Settings/Profile và dialog; chưa phát hiện lỗi sản phẩm mới cần sửa qua rà soát và bộ test hiện có. Phát hiện flow E2E signed-out dùng ID workspace không tồn tại, đã thay bằng cả hai root role thật; thay hideKeyboard bằng scroll tới nút và đồng bộ timeout debug 120 giây với flow authenticated. Đồng bộ trạng thái đầu trang/mục lục/bảng tiến độ, giữ nhật ký và giới hạn lịch sử. Không sửa design/ADR đã duyệt, backend, env local hoặc tạo commit.

Bằng chứng và kết quả chạy lại: [review-cleanup.md](../../implement/phase-000-foundation-auth/review-cleanup.md).

Rà soát kết thúc: Maestro signed-out/invalid-login/relaunch PASS 1/1, exit 0 sau reset driver; log `build-logs/phase-0-review-maestro-driver-reset.log`. Hai lượt harness bị dừng giữ riêng, không tính pass. Liên kết 8 tài liệu đã sửa và lint sau dọn dẹp đều pass.
