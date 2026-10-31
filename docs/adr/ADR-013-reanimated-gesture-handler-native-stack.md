# ADR-013 — Reanimated, Gesture Handler và Native Stack

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt 13”. Ghi nhận nguồn/ngày duyệt và đóng băng file tại lần chuyển trạng thái này theo ADR-012. Migration code/dependencies chưa thực hiện; tiến độ triển khai theo hồ sơ phase.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Repo dùng React Native Community CLI 0.80.1, React 19.1.0, Hermes và New Architecture. Reanimated và Gesture Handler đã có trong package; lockfile đang resolve Reanimated 3.19.5. App root đã có GestureHandlerRootView và Babel đã đặt Reanimated plugin cuối.

Navigator hiện dùng `@react-navigation/stack`, với cardStyleInterpolator/transitionSpec riêng cho Android. Các navigation type và useNavigationHeader còn phụ thuộc JS Stack; hook header có dùng Animated từ React Native. Chưa có `@react-navigation/native-stack`; `react-native-screens` hiện là 4.14.0.

Người dùng chọn bộ thư viện cho repo. Cần xác định trách nhiệm từng thư viện, cách migrate và giữ tương thích NativeWind, bottom sheet và native build.

Nguồn kỹ thuật đối chiếu ngày 30/10/2026:

- [React Navigation Native Stack](https://reactnavigation.org/docs/native-stack-navigator/): navigator dùng API native cho chuyển màn hình, có giới hạn tùy biến khác JS Stack.
- [Reanimated 3 compatibility](https://docs.swmansion.com/react-native-reanimated/docs/3.x/guides/compatibility/): kiểm tra tương thích theo phiên bản RN, kiến trúc và patch đang dùng.
- [Gesture Handler installation](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation/): cấu hình native/root theo phiên bản được chọn.

## Decision

### Phân công thư viện

| Thành phần | Quy tắc sử dụng |
| --- | --- |
| `react-native-reanimated` | Animation UI tùy chỉnh: opacity/transform, phản hồi tương tác, layout/enter/exit khi design yêu cầu; dùng shared values và animated styles cho cập nhật theo frame |
| `react-native-gesture-handler` | Nhận và phối hợp gesture tùy chỉnh như pan/swipe/drag; kết hợp Reanimated để cập nhật animation tương ứng |
| `@react-navigation/native-stack` | Navigator stack chuẩn của repo, phụ trách push/pop/modal và chuyển màn native qua react-native-screens |

Native Stack là thư viện điều hướng có transition native, không phải công cụ thay Reanimated cho animation bên trong component. Gesture điều hướng của Native Stack theo navigator/platform; Gesture Handler dùng cho tương tác tùy chỉnh trong màn hình.

### Quy tắc animation và tương tác

- Animation mới do repo viết dùng Reanimated; không tạo thêm hệ animation dựa trên Animated/PanResponder của React Native hoặc cài thư viện animation cạnh tranh cho cùng nhu cầu.
- Không yêu cầu thư viện bên thứ ba phải đổi nội bộ. Mã Animated cũ do repo sở hữu được migrate trong phạm vi component/hook được giữ lại; rà useNavigationHeader khi đổi navigator.
- Gesture tùy chỉnh dùng API phù hợp của Gesture Handler. Pressable/Button thông thường vẫn dùng bình thường; không biến mọi tap thành gesture tùy chỉnh.
- Tránh cập nhật React state hoặc gọi network theo từng frame; tác vụ JS/nghiệp vụ chỉ chạy tại thời điểm cần thiết. Dọn animation/gesture khi unmount hoặc hủy tương tác.
- Tôn trọng reduced motion của hệ điều hành; animation không cản nhập liệu, back hoặc quyền truy cập. Gesture không phải cách duy nhất thực hiện thao tác quan trọng.
- Thời lượng, easing, spring, hiệu ứng và layout theo design được duyệt cùng nguồn token ADR-010; không tự chọn thông số hoặc thêm motion ngoài design.

### Native Stack và phạm vi migration

- Chuyển stack thuộc repo sang createNativeStackNavigator; đổi navigation props, screen options và header hook sang type/API Native Stack tương ứng.
- Không sao chép cardStyleInterpolator, cardStyle, cardOverlayEnabled hoặc transitionSpec của JS Stack sang Native Stack. Chọn option được Native Stack hỗ trợ theo design; nếu design chưa thể biểu diễn thì ghi rõ khoảng thiếu trước khi triển khai phần đó.
- Giữ nguyên route contract, auth/role/scope guard của ADR-005, cách truyền params và các cổng duyệt của ADR-009. Migration thư viện không tự phê duyệt UI, auth hoặc tính năng mới.
- Rà import và dependency trước khi gỡ `@react-navigation/stack`; chỉ bỏ khi không còn nơi dùng hoặc phụ thuộc cần giữ. Các tab navigator hiện hữu không tự đổi chỉ vì áp dụng Native Stack.

### Tương thích và cấu hình

- Giữ nền CLI; không thêm Expo hoặc Expo Router cho quyết định này.
- Khi triển khai, chọn bản Native Stack thuộc dòng React Navigation 7 tương thích dependency graph thực tế. Kiểm tra peer dependencies cùng screens, safe-area-context, Gesture Handler, Reanimated, NativeWind và bottom sheet trước cài đặt; ghi phiên bản đã kiểm chứng trong hồ sơ.
- Không tự nâng major Reanimated/RN. Reanimated 3 đang có là điểm xuất phát; giữ plugin/config đúng major thực dùng và kiểm tra native build. Việc chọn bộ thư viện không có nghĩa đổi sang bản mới nhất.
- Giữ GestureHandlerRootView ở gốc phù hợp; rà modal/portal/bottom sheet và khả năng phối hợp gesture khi migrate. Native dependency thay đổi cần rebuild Android và cập nhật Pods trên macOS cho iOS.

### Kiểm chứng trước nghiệm thu

Lint/typecheck/Jest phải pass. Test component/hook dùng mock phù hợp nhưng không coi mock là bằng chứng animation native hoạt động. Build Android và chạy Maestro cho luồng điều hướng/gesture bị ảnh hưởng: push/back, Android hardware back, modal nếu có, gesture và scroll không xung đột, trạng thái sau hủy/chạy lại thao tác; xác minh auth/role guard khi luồng đó đã được triển khai.

Đối chiếu motion thực tế và reduced motion trên emulator/thiết bị; không tuyên bố đạt FPS hoặc độ mượt từ Jest/Maestro đơn thuần. Lưu bằng chứng trong hồ sơ phase; iOS kiểm chứng riêng theo Q-PLAT-01. Maestro E2E phải pass trước người dùng nghiệm thu theo ADR-009.

## Quan hệ với ADR cũ

- Bổ sung [ADR-001](ADR-001-boilerplate-feature-modules.md) về bộ thư viện UI/native dùng trên nền hiện có.
- Bổ sung [ADR-003](ADR-003-reusables-nativewind-theme.md) và [ADR-010](ADR-010-global-design-tokens-css.md): công cụ hiện thực motion, giữ nguyên quyền quyết định design/token.
- Bổ sung [ADR-005](ADR-005-role-navigation-and-scope.md): chọn Native Stack làm cơ chế stack, giữ toàn bộ luật role/scope. JS Stack hiện tại là hiện trạng code, không phải một quyết định ADR-005 đã chỉ định cần hủy.
- Giữ nguyên [ADR-009](ADR-009-phase-tdd-and-ownership.md) và [ADR-012](ADR-012-immutable-approved-adrs-and-precedence.md). Sau khi Accepted, ADR-013 được ưu tiên trong phạm vi lựa chọn animation/gesture/stack nếu có xung đột với quyết định cũ; không thay thế toàn bộ các ADR trên và không sửa file đã duyệt.

## Alternatives

Giữ JS Stack và các animation rải rác từ React Native Animated; thêm thư viện animation khác; chuyển sang Expo Router. Không chọn vì không thống nhất với bộ thư viện người dùng yêu cầu hoặc mở rộng migration ngoài phạm vi.

## Consequences

Cần migrate navigator, options, types và header hook, kiểm tra gesture/native transition thay vì chỉ sửa import. Native Stack có giới hạn tùy biến khác JS Stack; mọi chênh lệch design phải được xử lý theo cổng hiện có. Không tự báo hoàn tất migration từ việc viết ADR hoặc đã cài sẵn Reanimated/Gesture Handler.

## BR-slice bị ảnh hưởng

Không thay đổi luật nghiệp vụ. Ảnh hưởng nền P0 và mọi slice có điều hướng/animation/gesture P0–P8 khi được triển khai; bảo toàn BR-AUTH-01, BR-SCOPE-02, BR-SCOPE-03 theo ADR-005. Cổng design/theme/platform hiện có tiếp tục áp dụng.

## Điều kiện chuyển trạng thái

Proposed → Accepted/Rejected theo phản hồi rõ ràng của người dùng. Khi Accepted, ghi nguồn/ngày duyệt rồi đóng băng file theo ADR-012; cập nhật mapping hiệu lực, changelog và phase trước triển khai. Mọi thay đổi sau duyệt phải tạo ADR mới.
