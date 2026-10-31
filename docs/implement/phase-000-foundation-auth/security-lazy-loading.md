# Hạ tầng security và lazy loading

Ngày: 30/10/2026 (Asia/Bangkok). Phạm vi triển khai được người dùng yêu cầu trực tiếp; quyết định tại [ADR-018](../../adr/ADR-018-secure-storage-network-and-lazy-loading.md). Không triển khai API auth hoặc thay cổng approve UI.

## Kế hoạch

1. Thêm Keychain dependency và facade storage, test roundtrip, cách ly key, lỗi native và không fallback.
2. Thêm Android main network policy HTTPS/system CA và debug override cho HTTP local/Metro.
3. Chuyển cả auth/legacy navigator sang getComponent, bật inlineRequires.
4. Tách panel review để React.lazy tải khi mở, fallback/error/retry/close. Áp dụng native IntersectionObserver qua FlatList viewability, mount nội dung scenario khi visible.
5. Chạy kiểm chứng; ghi kết quả cùng giới hạn native/iOS ở đây.

## Kết quả

- `npm run lint`: pass ESLint, Prettier và TypeScript strict.
- `npm test -- --runInBand`: pass 7 suites, 77 tests; gồm secure-storage failure/isolation, observer callback và lazy panel/viewport interaction.
- Metro Android production bundle: pass, 20 assets; `build-logs/security-lazy.android.bundle`.
- Gradle `:app:assembleDebug :app:processReleaseResources --console=plain`: BUILD SUCCESSFUL, 599 tasks, 5m38s. Đã compile native Keychain; APK debug tại `android/app/build/outputs/apk/debug/app-debug.apk`.
- AAPT2 dump tài nguyên đã link: debug `cleartextTrafficPermitted=true`, release `false`; cả hai trust system CA. Manifest debug/release đều tham chiếu XML đúng.
- Maestro `06-lazy-loading.yaml`: PASS 1/1 flow, 1m13s trên APK mới; report `build-logs/security-lazy-maestro.xml`. Kiểm tra lazy panel, cuộn đến scenario cuối `login-config`, mở lại panel, chọn Manager, mở Settings và quay lại. Lượt kiểm tra trước phát hiện scenario cuối không hiện: đã đồng bộ min-height placeholder với button (52), giữ native view không collapse và tắt removeClippedSubviews trong panel nhỏ; lượt sau pass.

Môi trường: Windows, JBR Android Studio, Android SDK 35, emulator Android. Chưa build iOS/Pod install (cần macOS); chưa kiểm chứng Keychain/Keystore roundtrip trên thiết bị hoặc HTTP/TLS bằng server thực. Native build/resource inspection không thay thế các kiểm tra runtime này. Auth vẫn dùng mock/dev và unavailable/release, chưa gắn secure storage vào cookie/refresh chưa được duyệt.

FlatList có thể unmount item ngoài window; hook nhớ key đã xuất hiện để remount không phải chờ callback mới. Không bảo đảm giữ local state của item bị virtualization unmount. Lazy loading native trì hoãn module evaluation/mount, không tải chunk từ mạng ở release. Cần restart Metro hiện có để nhận inlineRequires mới.

## Giới hạn sau kiểm chứng

Maestro kiểm chứng UI mock và viewability trên Android, không kiểm chứng encryption/hardware-backed storage hoặc API/TLS trên server thực. Không thay nghiệm thu toàn phase hay duyệt UI/API. Native clipping được tắt riêng cho panel 17 scenario để tránh cell rỗng ở cuối danh sách; virtualization/windowSize vẫn hoạt động. Không áp dụng tắt clipping mặc định cho danh sách lớn.
