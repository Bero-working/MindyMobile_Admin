# Mindy Mobile Admin

React Native 0.80.1 / React 19.1.0 cho Mentor và Manager. Cấu hình theo [boilerplate](https://sohantalukder.github.io/react-native-boilerplate/docs/configuration/) và [ADR đã duyệt](docs/adr/README.md).

## Chuẩn bị và chạy

Node.js >=18, npm, Android Studio và SDK/NDK theo `android/build.gradle`. Dùng JDK 17 hoặc JBR tương thích Gradle, đặt `JAVA_HOME` và `ANDROID_HOME` hoặc `android/local.properties` phù hợp.

```powershell
npm ci
# Chỉ copy khi file local chưa tồn tại:
Copy-Item .env.development.example .env.development
Copy-Item .env.production.example .env.production
npm start
# Terminal khác, sau khi mở emulator hoặc kết nối thiết bị:
npm run android
```

Lần cấu hình ban đầu đã tạo hai file env local. Điền `API_URL` sau khi chốt URL/port/protocol/đường truy cập thiết bị theo Q-ENV-01. Development cho phép trống để làm UI, nhưng HTTP sẽ báo lỗi trước khi gửi request. Production bắt buộc HTTPS và `DEBUG_MODE=false`. Không có fallback URL. Env được đóng gói trong ứng dụng, không dùng để lưu secret.

Android chọn `.env.development` cho Debug, `.env.production` cho Release; iOS chọn tương ứng qua Podfile. Đổi env phải build lại native app. iOS cần macOS/Xcode/CocoaPods: `bundle install`, `npm run pod-install`, `npm run ios`.

## Kiểm tra và build

```powershell
npm run check
npm run lint:fix
npm run test:report
npm run build:android
npm run build:android:bundle
```

`check` chạy ESLint (0 warning), Prettier, TypeScript và Jest. Build Android dùng wrapper phù hợp Windows/macOS/Linux. Bản Release vẫn dùng debug signing của checkout; chưa cấu hình phát hành store.

## E2E theo phase

Mỗi phase có một script `test:e2e:phase-<số>`, flow đặt trong `.maestro/phase-NNN-<slug>/`. Phase 0 và phase 1 đã có E2E tích hợp; các flow `ui-mock/` là hồ sơ kiểm thử UI trước tích hợp API.

**Bắt buộc sau mỗi phase:** viết và chạy E2E Maestro tương ứng, gồm hồi quy các luồng bị ảnh hưởng, đạt pass trước khi trình nghiệm thu theo ADR-009. Chi tiết về flow tổng, lệnh npm và báo cáo riêng cho từng phase được ghi trong [ADR-020 — Accepted](docs/adr/ADR-020-e2e-suite-per-phase.md). Xem [quy ước E2E](docs/implement/e2e-maestro.md); người dùng vẫn quyết định chuyển phase sang Done.

`npm run test:e2e:phase-0` tự nạp tài khoản từ `.maestro/accounts.local.json` (file local được Git bỏ qua), theo cấu trúc `{ "mentor": { "email": "...", "password": "..." }, "manager": { "email": "...", "password": "..." } }`. Biến môi trường đã đặt trong terminal được ưu tiên hơn file local. Có thể dùng các biến sau nếu không dùng file local:

```powershell
$env:MAESTRO_MENTOR_EMAIL = "mentor-test-email"
$env:MAESTRO_MENTOR_PASSWORD = "mentor-test-password"
$env:MAESTRO_MANAGER_EMAIL = "manager-test-email"
$env:MAESTRO_MANAGER_PASSWORD = "manager-test-password"
npm run test:e2e:phase-0
```

Lệnh chạy lần lượt toàn bộ các ca E2E tích hợp hiện có của phase 0: signed-out/đăng nhập sai → Mentor/cài đặt/đăng xuất → Manager/cài đặt/đăng xuất mọi phiên. Flow tổng tự truyền tài khoản đúng role cho từng ca; khi một ca lỗi, lệnh dừng và trả kết quả thất bại. Trước khi chạy, cài Maestro, mở emulator đã cài app Debug và bật Metro bằng `npm start`. Thay các giá trị mẫu bằng tài khoản test thật trong môi trường terminal, không ghi credentials vào source. Các giới hạn độ bao phủ native vẫn theo hồ sơ kiểm chứng phase 0.

Nếu cấu hình bằng biến môi trường, đặt cả bốn biến trong **cùng terminal** chạy lệnh npm; `.env.development` chỉ cấu hình app, không tự nạp tài khoản cho Maestro. Flow kiểm tra đủ biến trước khi mở app và báo tên biến thiếu hoặc sai định dạng. Nếu debug hierarchy hiển thị email `undefined` và `login-email-error`, hãy kiểm tra các biến này trước: app chưa gửi request đăng nhập nên chưa thể hiện workspace. Khi chạy bằng Maestro Studio, cấu hình bốn biến trong environment của Studio; Studio không tự đọc biến của shell như CLI ([tài liệu Maestro](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/parameters-and-constants)).

## Cấu hình và cấu trúc

- `src/config/env.ts`: validate env bằng Zod; `app.ts`: metadata, timeout, feature flags.
- Alias Babel/TypeScript/Jest đồng bộ: `@/`, `@components/`, `@modules/`, `@services/`, `@utils/`.
- NativeWind 4 / Tailwind 3 qua `src/global.css`; Metro hỗ trợ SVG, Reanimated plugin cuối trong Babel.
- `src/components/ui/`: React Native Reusables theo design được duyệt; `src/utils/cn.ts`: ghép class.
- Feature mới theo `src/modules/<feature>/{screens,components,hooks,services,schemas,types,index.ts}`.
- `src/translations/{index,en,vi}.ts`: tiếng Anh/Việt, ghi nhớ lựa chọn qua MMKV.
- TypeScript strict gồm cả test/mock; ESLint cấm kiểu any/unknown tường minh theo ADR-002.

App chính đã dùng API auth thật cho bootstrap/login/access-denied/settings sau khi người dùng duyệt UI phase 0. Điền API_URL bao gồm `/api/v1`; không có fallback sang mock. Cookie HttpOnly do native networking quản lý; login xác minh lại bằng me trước khi mở workspace. MMKV chỉ lưu preferences. Demo Splash/Example và fixture UI mock vẫn được giữ ngoài entry chính. Nguồn token UI là `docs/design/global.css.md`.

Phase 0 được người dùng xác nhận duyệt ngày 31/10/2026; [hồ sơ rà soát và dọn dẹp](docs/implement/phase-000-foundation-auth/review-cleanup.md) ghi kết quả và phần còn thiếu bằng chứng. Contract và giới hạn kiểm chứng: [API phase 0](docs/api-contract/phase-000-foundation-auth/README.md), [hồ sơ tích hợp](docs/implement/phase-000-foundation-auth/api-integration.md). Kết quả Android không thay thế kiểm chứng iOS.

Kết quả và giới hạn kiểm chứng: [hồ sơ cấu hình nền P0](docs/implement/phase-000-foundation-auth/README.md).

Phase 1 đã nối API lịch/lớp/context/roster cho Mentor và Manager, gồm Home Today. App dùng API thật cả khi DEBUG_MODE=true. Xem [contract 7 slice](docs/api-contract/phase-001-teaching-workspace/README.md), [hồ sơ tích hợp](docs/implement/phase-001-teaching-workspace/api-integration.md) và [E2E API](docs/implement/phase-001-teaching-workspace/e2e.md).

```powershell
npm run test:api:phase-1
npm run test:e2e:phase-1
```

Lệnh đầu đọc backend bằng adapter thật và tạo `.maestro/phase-1-dataset.local.json` chứa ID để Maestro chọn đúng lớp/buổi. Lệnh E2E dùng tài khoản test local và dataset có học viên. Dữ liệu chưa có trong endpoint được để trống/“—”, không thay bằng mock. Phase 1 vẫn chờ người dùng nghiệm thu.
