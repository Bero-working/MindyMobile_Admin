# ADR-023 — Mở màn hình từ nút được bấm

## Status

**Accepted** — người dùng duyệt ngày 01/11/2026 (Asia/Bangkok) qua phản hồi “duyệt adr 23 24”. ADR được khởi tạo ngày 31/10/2026 từ yêu cầu mở UI từ nút; quyết định cuối cùng bên dưới ghi nhận chỉ thị ngày 01/11 bỏ animation khi mở và Back. Ghi nguồn/ngày duyệt và đóng băng file tại lần chuyển trạng thái này theo ADR-012.

## Context và phạm vi

Yêu cầu mới thay toàn bộ quy tắc chiều chuyển màn của [ADR-021](ADR-021-entry-side-navigation.md), gồm ngoại lệ avatar, Profile, MentorClasses, TeachingSchedule và Back. Giữ nguyên file ADR-021 đã đóng băng. Quyền truy cập, dữ liệu và lịch sử navigation stack tiếp tục giữ nguyên.

## Decision

- Tắt native slide và gesture vuốt để chuyển/back trên stack đang dùng của app.
- Theo chỉ thị mới nhất ngày 01/11/2026: “Bỏ luôn animation khi mở và back UI”. Mở màn, Back toolbar, Android Back và chuyển tab đều hiển thị trực tiếp, không slide, fade hay scale.
- Bỏ ButtonScreenTransition, lớp theo dõi tọa độ chạm và token thời gian navigation không còn dùng. Skeleton loading vẫn giữ nguyên.
- Không tạo route mới để giả Back; giữ cơ chế chặn rời màn khi auth đang bận.

## Kiểm chứng

TypeScript, ESLint và 100 test trong bốn suite App/auth UI/teaching UI/teaching manager đều qua sau sửa lỗi màn trắng.

Trên emulator Android/Fabric, animated child chỉ dùng flex bị co chiều cao về 0 sau cập nhật layout. Sửa wrapper thành absolute fill trong container có kích thước đầy đủ, dùng React Native Animated native driver và phục hồi opacity khi animation bị ngắt. Màn khởi động không cần chờ animation để hiển thị.

Đã kiểm tra trực tiếp khởi động lại app, Home → Profile → nút Back và Home → Settings → Android Back; nội dung hiển thị lại với kích thước toàn màn. Ảnh kiểm chứng tại `build-logs/mindy-fixed.png`. iOS chưa được kiểm chứng; Jest không chứng minh chất lượng chuyển động trên thiết bị.
