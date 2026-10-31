# ADR-018 — Secure storage, network security và tải theo nhu cầu

## Status

**Accepted** — chỉ thị triển khai trực tiếp ngày 30/10/2026 (Asia/Bangkok): “Hãy thêm 2 phần secure storage và android network security vào. Áp dụng lazy loading cho component và router. Áp dụng interceptionObserver. Thêm vào ADR cho tôi”. Ghi quyết định trước code; giữ nguyên các ADR Accepted theo ADR-012.

## Context

Config hiện tại đã có env, Metro, Babel và i18n nhưng chưa có secure storage hoặc Android network security XML. Navigator import sẵn tất cả màn hình. React Native không có DOM IntersectionObserver; yêu cầu được áp dụng bằng native list viewability, không đưa DOM/polyfill vào runtime mobile.

## Decision

- Dùng `react-native-keychain` 10.0.0 qua `secureStorage.setItem/getItem/removeItem`, mỗi key có service namespace riêng. iOS dùng Keychain với WHEN_UNLOCKED_THIS_DEVICE_ONLY; Android dùng encrypted storage được bảo vệ bởi Keystore. Không nuốt lỗi, log secret hoặc fallback sang MMKV. MMKV tiếp tục chỉ lưu preferences; chưa thay cookie jar hay triển khai token/auth persistence.
- Android main/release chặn cleartext toàn bộ domain và chỉ tin system CA. Debug có resource XML riêng cho phép HTTP để Metro và backend local hoạt động; không thêm user CA hay bỏ TLS validation. Không có domain API giả hoặc certificate pinning khi chưa chốt host.
- Native Stack dùng `getComponent` với require theo đường dẫn tĩnh và kiểu module cụ thể. Không import màn hình runtime qua barrel ở navigator. Metro bật inlineRequires để giảm khởi tạo module sớm.
- Panel review dùng React.lazy + Suspense và error boundary có nút thử lại/đóng. Chỉ tải khi người dùng mở panel. Không trì hoãn control thiết yếu của login/bootstrap.
- Hook `useIntersectionObserver` dùng FlatList `onViewableItemsChanged`/`viewabilityConfig`: đánh dấu item đã vào viewport ít nhất 50%, không cần timer/polling/DOM. Callback giữ identity ổn định; cập nhật theo danh sách hiện tại và chỉ mount nội dung item lần đầu nhìn thấy, giữ nội dung khi cuộn ra ngoài. Áp dụng vào danh sách scenario của panel review; placeholder giữ chiều cao tối thiểu để FlatList đo được. Danh sách lớn về sau dùng virtualization/viewability tương tự.
- Đây là trì hoãn đánh giá module và mount nội dung trong bundle native; không cam kết tách bundle hoặc tải JavaScript từ mạng ở release.

## Quan hệ với ADR hiện tại

Bổ sung ADR-001/003/004/005/013 về hạ tầng lưu trữ và thời điểm tải màn hình/component. Không thay policy dữ liệu, role, cache, cookie auth, thiết kế UI hoặc cổng approve UI trước API. Theo yêu cầu triển khai trực tiếp, thực hiện phạm vi hạ tầng này; không tăng tiến độ nghiệm thu phase. Giữ nguyên ADR-001–017.

## Alternatives

Sao chép react-native-encrypted-storage trong ví dụ boilerplate; lưu secret trong MMKV không mã hóa; dùng DOM IntersectionObserver/polyfill cho native; lazy toàn bộ UI nhỏ. Không chọn vì cần storage native được duy trì, đúng runtime mobile và không tăng độ trễ cho control thiết yếu.

## Consequences

Cần rebuild app và `pod install` trên macOS sau khi thêm native dependency. Service chưa có consumer auth cho đến khi duyệt contract/UI; test mock không chứng minh mã hóa trên thiết bị. Native viewability chỉ áp dụng cho item trong list, không phải API quan sát DOM tùy ý.

## Kế hoạch và kiểm chứng

Xem [kế hoạch hạ tầng](../implement/phase-000-foundation-auth/security-lazy-loading.md). Kiểm tra storage roundtrip/missing/failure/key isolation, viewport enter/leave và stable callback, panel load/close, routing hiện có; chạy lint/typecheck/Jest, Metro bundle và Android build nếu môi trường hỗ trợ. Ghi kết quả thực tế vào hồ sơ triển khai, không sửa ADR đã ghi.

## BR-slice bị ảnh hưởng

Hạ tầng P0; không đổi BR nghiệp vụ hoặc tích hợp API. Các câu hỏi auth/cookie và Q-ENV-01 giữ nguyên.

## Nguồn

- [Boilerplate configuration](https://sohantalukder.github.io/react-native-boilerplate/docs/configuration/)
- [Keychain usage](https://oblador.github.io/react-native-keychain/docs/usage/)
- [Android network security](https://developer.android.com/privacy-and-security/security-config)
- [React Navigation getComponent](https://reactnavigation.org/docs/screen/)
- [React Native FlatList viewability](https://reactnative.dev/docs/flatlist)
