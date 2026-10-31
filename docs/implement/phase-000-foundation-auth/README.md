# Phase 0 — Hồ sơ triển khai Foundation & Auth

**Hiện hành 31/10/2026:** UI và kế hoạch đã duyệt; API thật đã tích hợp cả 4 slice. Người dùng xác nhận duyệt phase 0 và yêu cầu kiểm tra/dọn dẹp. Tra [hồ sơ rà soát](review-cleanup.md), [cập nhật S4](settings-profile-update.md) và [API](api-integration.md). Các mục chờ triển khai/duyệt ở dưới là lịch sử.

**Hiện tại: người dùng đã yêu cầu “duyệt và triển khai”; đã triển khai UI mock 4/4 slice và bàn giao review. API vẫn chờ approve UI.** Theo [ADR-016](../../adr/ADR-016-plan-before-implementation.md): kế hoạch → người dùng yêu cầu implement → UI mock toàn phase → người dùng approve UI → API → kiểm chứng/E2E → nghiệm thu.

Design Claude đã có tại [foundation-auth/design.md](../../design/foundation-auth/design.md), gồm đủ 4 slice. Bản nháp UI/mock/test đã được viết trong working tree trước khi nhận cổng kế hoạch mới; chưa được duyệt, chưa hoàn tất native verification và chưa gắn API. Dừng mọi thay đổi code tiếp theo để người dùng đọc kế hoạch. Các ghi nhận cấu hình nền bên dưới là lịch sử của công việc trước đó.

Ngày thực hiện: 30/10/2026 (Asia/Bangkok). Người thực hiện: Codex.

Phạm vi được yêu cầu: “Bây giờ config dự án cho tôi theo yêu cầu của boilerplate”. Đối chiếu [configuration boilerplate](https://sohantalukder.github.io/react-native-boilerplate/docs/configuration/), [kiến trúc](../../architecture.md) và ADR-001/002/003/009/010 đã Accepted. Đây là công việc nền phục vụ P0, chưa hoàn thành UI/API slice.

## Thay đổi

- Metadata package chuyển thành app private `mindy-mobile-admin`, entry `index.js`; giữ RN 0.80.1 / React 19.1.0.
- Cài react-native-config 1.7.2, thay inline-dotenv; `src/config/env.ts` parse bằng Zod. Development cho phép thiếu API_URL để làm UI nhưng chặn HTTP trước khi gửi; production yêu cầu HTTPS và debug off. Không dùng dummyjson hoặc host fallback.
- Tạo env example và hai file local bị gitignore. Android map Debug/Release, iOS map qua Podfile. Chưa quyết định host/port/protocol/đường thiết bị của Q-ENV-01.
- `src/config/app.ts` gom metadata, feature flags tắt, timeout 10 giây, retry 0. HTTP demo bỏ Bearer, log nhạy cảm và retry timeout; xóa API ghi/đọc token MMKV, giữ thao tác xóa token legacy. Chưa triển khai cookie auth/refresh/API contract.
- Alias Babel/TS/Jest đồng bộ; gồm `.ts/.tsx/.js/.jsx/.json`. Typecheck gồm test/mock, strict giữ nguyên. ESLint cấm explicit any/unknown; loại declaration Metro chưa dùng, thay PNG/SVG bằng kiểu cụ thể; utility dùng generic và logger dùng kiểu cụ thể. Không ẩn toàn bộ LogBox như demo cũ.
- NativeWind 4.2.7 / Tailwind 3.4.19 / Reanimated 3.19.5, Metro SVG transformer React Native, Babel preset NativeWind và Reanimated plugin cuối. Tạo runtime `src/global.css`, type NativeWind, `cn()` và nơi đặt UI primitives. Chưa chọn theme/token hoặc cài primitive khi thiếu design.
- i18n `en`/`vi`, bản dịch TypeScript, lưu lựa chọn qua MMKV. Entry i18n cũ chỉ re-export để giữ demo.
- CLI 19.1.2 đồng bộ cho RN 0.80 theo [bảng tương thích](https://github.com/react-native-community/cli#compatibility). Bỏ plugin Babel/type package dư thừa, thêm jest-junit cho script report có sẵn.
- Scripts dùng npm nhất quán, Android release wrapper chạy trên Windows/POSIX, thêm `npm run check`. Prettier/ESLint bỏ docs/design bundle và thư mục sinh tự động; không format lại tài liệu/design đã có.

## Kiểm chứng thực tế

| Lệnh                                                                                                                                                                           | Kết quả                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                                                                                                                                 | Pass: ESLint 0 error/0 warning, Prettier và `tsc --noEmit`                                                             |
| `npm test -- --runInBand --no-cache`                                                                                                                                           | Pass: 2 suites, 7 tests; gồm App smoke test và env URL/production/debug guard                                          |
| `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output build-logs/index.android.bundle --assets-dest build-logs/assets --max-workers 2` | Pass: bundle và 20 assets; artifact local trong thư mục gitignore                                                      |
| Android `:app:assembleDebug --console=plain`                                                                                                                                   | Pass: BUILD SUCCESSFUL, 395 tasks (73 executed); APK tại `android/app/build/outputs/apk/debug/app-debug.apk`, đủ 4 ABI |

Môi trường: Windows, Node 24.16.0, npm 11.13.0, JBR của Android Studio được đặt qua JAVA_HOME cho lệnh Gradle. Chưa chạy app trên thiết bị hoặc build iOS trên macOS. Jest cold run mất khoảng 19 phút, native build khoảng 22 phút ở môi trường này. Gradle cảnh báo SDK XML, đường dẫn CMake dài và deprecated features nhưng build thành công. Đã kiểm tra generated BuildConfig nhận APP_ENV=development và DEBUG_MODE=true. `npm install` báo 32 advisories (11 low, 9 moderate, 12 high); chưa tự nâng major hoặc chạy audit fix force ngoài phạm vi.

## Điểm còn chờ

### Cập nhật đường dẫn CSS — 30/10/2026

Theo chỉ thị trực tiếp của người dùng và ADR-014, tài liệu design hiện tại là `docs/design/global.css.md`, giữ nguyên CSS mẫu trong code block; entry NativeWind chuyển vào `src/global.css`, Metro và import app đã được cập nhật. Đã kiểm tra nội dung CSS mẫu được bảo toàn, các file ADR đóng băng không đổi và `npm run lint` pass (ESLint/Prettier/typecheck). Không đổi theme/token hoặc tiến độ UI/API; lần di chuyển này chưa chạy lại native build/E2E.

Q-ENV-01, Q-THEME-01, Q-DESIGN-01, Q-PLAT-01 và ADR Auth giữ nguyên. Demo rn-kit/Splash/Example còn để kiểm chứng nền; chưa chuyển sang UI Mindy hoặc React Native Reusables khi thiếu design. Release signing vẫn là debug signing của checkout. Không coi config/test pass là duyệt UI, nghiệm thu phase hoặc xác nhận API Mindy.

Tiến độ và nhật ký: [phase-000-foundation-auth](../../progress/phase/phase-000-foundation-auth.md).

## Cập nhật tên kế hoạch và bước tách slice — 30/10/2026

Kế hoạch tổng hiện tại: [phase-000-foundation-auth.md](phase-000-foundation-auth.md), trùng tên folder. Chờ người dùng duyệt kế hoạch tổng, sau đó mới tách kế hoạch chi tiết theo các slice trong folder này. Chưa tách slice, chưa tiếp tục code. Theo ADR-017; code vẫn chờ chỉ thị implement, API chờ approve UI toàn phase.

## Duyệt kế hoạch tổng và tách slice — 30/10/2026

Người dùng phản hồi “Duyệt” cho kế hoạch tổng. Đã tách 4 kế hoạch chi tiết trong cùng folder:

| Slice                 | Tài liệu                                                 | Test case design |
| --------------------- | -------------------------------------------------------- | ---------------: |
| P0-S1 — bootstrap     | [slice-001-bootstrap.md](slice-001-bootstrap.md)         |               19 |
| P0-S2 — login         | [slice-002-login.md](slice-002-login.md)                 |               23 |
| P0-S3 — access-denied | [slice-003-access-denied.md](slice-003-access-denied.md) |               11 |
| P0-S4 — settings      | [slice-004-settings.md](slice-004-settings.md)           |               18 |

Tổng 71 TC được mapping nguyên kỳ vọng từ design, trạng thái chưa kiểm chứng theo kế hoạch mới. UI-00/01/02/07 và cổng chung tiếp tục ở [kế hoạch tổng](phase-000-foundation-auth.md). Các đoạn “chờ duyệt tổng/chưa tách” phía trên là lịch sử trước phản hồi này. Đã tách tài liệu, chờ yêu cầu implement; chưa tiếp tục code và chưa approve UI/API.

## Bàn giao UI mock phase 0 — 30/10/2026

Nguồn triển khai: người dùng “duyệt và triển khai”. Đã hoàn thiện Bootstrap/Login/Denied/Settings và workspace tối thiểu theo design Claude; vi/en, system/light/dark, font/icon local, mock boundary/review scenarios, root navigation và cleanup khi logout. Native Stack thay JS Stack ở phần còn dùng; không đổi route/role policy hoặc tích hợp auth thật.

Đã xử lý lỗi native thấy qua ảnh/flow: gradient phủ thiếu padding, style callback của Pressable làm mất bố cục trong NativeWind, nhãn Tiếng Việt lỗi encoding, keyboard che field/button và stale focus Android sau khi khóa TextInput. Thêm keyboard-controller 1.18.5 (Reanimated 3 tương thích) theo nhu cầu UI đã có; không nâng RN/React major. Windows CMake dùng object limit/staging ngắn để build được, không sửa thư viện trong node_modules.

`npm run check` pass 63/63 tests; Android Debug x86_64 APK mới build/run pass. Có bằng chứng native UI của 5 flow qua các lượt; các flow keyboard/error đã rerun pass sau sửa, không gọi là E2E API tích hợp hoặc cùng-build full-suite. iOS chưa build; cần cập nhật Pods trên macOS. SHA/build/ABI/môi trường, lịch sử fail và giới hạn font-scale/a11y tại [ui-verification.md](ui-verification.md).

**Mở [hướng dẫn review và ảnh UI](ui-review.md). Chờ người dùng approve UI toàn phase trước API.** API 0/4; chưa nghiệm thu, chưa Done. Các mục chờ implement/bản nháp ở phần lịch sử phía trên mô tả thời điểm trước chỉ thị triển khai mới.

## Đính chính role từ người dùng — 30/10/2026

Chỉ có MENTOR và MANAGER; không có role thứ ba, kể cả guest. UI mock đã bỏ fixture role ADMIN/STUDENT/NEW_ROLE và các nhãn tương ứng. Trạng thái phiên chưa đăng nhập được đổi từ `guest` sang `signedOut`, hiển thị “Chưa đăng nhập”. Màn Denied chỉ là phòng vệ cho phiên không hợp lệ, không định nghĩa role bổ sung. Tài khoản demo: mentor@mindy.vn và manager@mindy.vn, mật khẩu bất kỳ không trống. Design/ADR và báo cáo trước đó giữ nguyên để bảo toàn lịch sử; phần role giả trong tài liệu cũ được thay thế bởi đính chính trực tiếp này. Maestro flow đã cập nhật; kết quả pass trước thay đổi không phải bằng chứng cho flow mới. Chưa tích hợp API, UI vẫn chờ duyệt.

## Hoàn thiện UI theo ADR — 30/10/2026

Theo yêu cầu tiếp theo của người dùng, đã refactor UI mock sang NativeWind, gom token runtime, hoàn thiện Button/Text composition và dùng Zod cho form Login. Hồ sơ hiện hành: [ui-adr-completion.md](ui-adr-completion.md). Các mô tả StyleSheet/validation thủ công ở phần trước là lịch sử trước refactor. UI vẫn chờ người dùng approve; API chưa mở.
