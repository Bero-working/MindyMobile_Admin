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
