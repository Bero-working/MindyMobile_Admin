# ADR-022 — Kính mờ thật bằng thư viện blur native

## Status

**Accepted** — người dùng duyệt ngày 31/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt tất cả adr”. ADR-022 chuyển Proposed → Accepted; ghi nguồn/ngày duyệt và đóng băng file theo ADR-012.

Lịch sử trước duyệt: ghi nhận yêu cầu trực tiếp ngày 31/10/2026: “Hãy dùng cho tôi kính mờ đi”. Đã triển khai theo chỉ thị này; tại thời điểm đó chưa có phản hồi duyệt riêng ADR-022.

## Ngày

31/10/2026 (Asia/Bangkok). Người soạn: Claude.

## Context

Thiết kế dùng `.mdy-glass` với `backdrop-filter: blur(18px) saturate(170%)`, nhưng `Card` chỉ vẽ gradient nên nội dung phía sau không bị làm mờ. Gradient này còn bị đục hoàn toàn: `react-native-svg` bỏ alpha của `stopColor` và chỉ đọc `stopOpacity`, nên token `glass` và `glassEnd` chưa từng có tác dụng trong suốt. React Native không có `backdrop-filter`, nên cần thư viện native. Dự án là React Native 0.80 không dùng Expo, bật New Architecture.

## Decision

1. Dùng `@react-native-community/blur` 4.4.1, ghim đúng phiên bản.
2. `Card` có prop `frosted`. Lớp blur nằm dưới gradient kính hiện có; giữ nguyên token `glass` và `glassEnd` theo thiết kế.
3. `Gradient` tách alpha của token sang `stopOpacity`. Việc này làm mọi `Card` và tile dùng gradient kính trở nên trong suốt đúng theo token.
4. Độ mờ lấy từ token `layout.glassBlur` (18). Không tái tạo `saturate(170%)` vì thư viện không hỗ trợ.
5. Bật blur cho thẻ đè lên header: thẻ Hôm nay, thẻ khung Home và mọi `Card overlap` (đăng nhập, khởi động, từ chối truy cập). Nếu không, mép header lộ sắc nét qua thẻ. Không dùng cho thẻ lặp trong danh sách để tránh giật khi cuộn trên Android.
6. `HomeTile` trên nền màn dùng gradient kính, viền kính và bóng tile theo đặc tả, thay cho `tint2` gần trùng màu nền. Tile không có lớp blur vì nền phía sau gần như đồng màu.
7. iOS bật "Giảm độ trong suốt" thì dùng màu dự phòng `glass`.

## Alternatives

`@callstack/liquid-glass`: chỉ có trên iOS 26, Android vẫn cần phương án khác. `@shopify/react-native-skia`: thư viện nặng và tốn công hơn nhiều so với nhu cầu. `expo-blur`: kéo thêm Expo Modules vào dự án không dùng Expo. Giữ gradient hiện tại: không làm mờ được nội dung phía sau.

## Consequences

Thêm một phụ thuộc native: phải build lại ứng dụng và chạy `pod install` trên iOS. Jest dùng mock `BlurView` nên test không chứng minh hiệu ứng hiển thị; cần kiểm tra trên thiết bị. Blur tốn GPU hơn gradient, nên mở rộng sang màn khác cần đo lại trên máy Android đời thấp. Trên Android, thư viện chụp cả nội dung bên trong thẻ khi làm mờ, nên nút tối trong thẻ có quầng mờ nhẹ giống bóng đổ. Đã kiểm tra trên emulator Android API 37; chưa kiểm tra iOS và Android dưới API 31.

## BR-slice bị ảnh hưởng

Màn Home của P1; màn đăng nhập, khởi động và từ chối truy cập của P0; mọi `Card` về mặt hiển thị. Không thay đổi BR nghiệp vụ, quyền, cache hoặc API.
