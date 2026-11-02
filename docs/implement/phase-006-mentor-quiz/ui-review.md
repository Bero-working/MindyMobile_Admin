# P6 — UI mock để review

**Hiện hành API — 02/11/2026:** Đã tích hợp API thật S1–S3 theo chỉ thị “Tích hợp luôn api”, xem [bằng chứng](api-integration.md) và [ADR-032](../../adr/ADR-032-phase-6-api-integration.md). API 3/3, chưa nghiệm thu. E2E/Maestro tiếp tục được miễn; các dòng “API 0/3/chờ duyệt UI trước API” trong lịch sử bên dưới đã được thay bằng chỉ thị này.

Ngày: **02/11/2026 (Asia/Bangkok)**. Đã nhận chỉ thị triển khai, chốt gói design và bỏ qua E2E theo [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md). **Chưa duyệt UI, chưa nối API quiz, chưa nghiệm thu.**

## Phần đã có

Module `src/modules/quiz/` có list, editor và detail; mock provider chỉ RAM, không HTTP/storage. Route chỉ đăng ký cho Mentor ở development, entry từ chi tiết lớp/buổi; không thêm tile Trang chủ hoặc action Manager. Có nhãn “UI mock · Chưa kết nối API”. Query context/lớp/buổi tái sử dụng P1, không phải tích hợp API assignment.

- S1: lọc trạng thái/buổi, danh sách giới hạn mỗi lần hiển thị, chọn buổi tạo draft, khóa buổi hủy, read-only theo lớp/buổi.
- S2: tạo nháp với mặc định 10 và purpose bắt buộc; hai tab lưu riêng; form câu ABCD không chọn sẵn đáp án, thêm/sửa/xóa/đổi thứ tự, giới hạn 200 câu; cảnh báo RAM/dirty Back, ngày giờ UTC+7, khóa trường chỉ-create.
- S3: đọc nội dung, hiện/ẩn đáp án theo lifecycle, xác nhận publish/archive/xóa draft, lý do archive; không có điểm học viên hoặc dashboard kết quả.
- Model/mock kiểm revision, freeze sau publish, mất response phải “Kiểm tra”, không gửi lại mù. Điểm dùng decimal string/hundredths chính xác; không tính điểm bài làm local.
- UI có loading/empty/error/offline/denied/not-found/conflict/uncertain/closed và controls review. Mạng thật offline cũng khóa mutation; vẫn giữ form RAM.

## Cách xem

Android development với DEBUG_MODE=true: ở màn Login mở “Review UI” → MENTOR → Lớp phụ trách → lớp → Quiz; hoặc mở chi tiết buổi → Quiz của buổi. Trong quiz bấm nhãn mock để đổi scenario. Không nhập thông tin thật vào form mock; dữ liệu không gửi lên backend.

## Kiểm chứng

- TDD: model ban đầu fail do thiếu module; UI fail do thiếu screen; sau triển khai đã chạy các test model/UI/mock. Bộ P6 model/UI/mock và review host trên bản cuối: **20/20 test pass**. Kết quả toàn repo cuối cập nhật trong tiến độ.
- TypeScript toàn repo (`npm run lint:type-check`), ESLint phạm vi file thay đổi và Prettier đã pass trên bản cuối; 0 lỗi/cảnh báo lint trong phạm vi kiểm.
- Android `ENVFILE=.env.development`, `gradlew.bat assembleDebug`: **BUILD SUCCESSFUL**, emulator `emulator-5554` / Pixel_8. JS tiếp tục được sửa qua Metro sau build này; build không xác nhận toàn bộ UI cuối đã kiểm trên native.
- Đã tạo ảnh native list/detail/editor/form câu và trực tiếp xem ảnh editor/form câu ở `build-logs/phase-6-ui/report/2026-11-02_230737/`. Phát hiện keyboard Back mở dialog bỏ câu khi hideKeyboard; đã thêm xử lý tránh chặn Back khi keyboard đang mở. Đồng thời sửa title input thành một dòng, header Back icon và spacing. Chưa xác nhận lại toàn bộ bản sửa bằng native flow.
- Maestro UI mock lần đầu **fail** tại bước tìm `quiz-editor-back`; lượt chạy lại **interrupted** theo yêu cầu “Không cần test e2e”. Không tiếp tục chạy, không báo pass và không coi đây là E2E API thật. Giữ `.maestro/phase-006-mentor-quiz/ui-review.yaml` để truy vết; chưa tạo command npm E2E P6 rỗng.
- Lần Jest toàn repo: **373/374 test pass**, 36/37 suite pass; lỗi `teaching-ui.test.tsx` tại TC-P1-S2-04/09/S3-02/06/S4-15 do không tìm thấy `workspace-open-classes`. Chạy riêng với timeout mặc định vẫn fail; sau tăng chờ khởi tạo Trang chủ từ 1 giây lên 10 giây, ca chạy riêng đã pass. Không sửa hành vi ứng dụng để né test; lượt chạy lại toàn repo cuối đã **37/37 suite, 376/376 test pass** (168,457 giây). Log: `build-logs/phase-6-jest-final.log`, JSON: `build-logs/phase-6-jest-final.json`.

## Giới hạn trước API

UI mock không chứng minh phân trang server, refresh/invalidation đa thiết bị, quyền backend, việc void attempt sau archive hoặc khôi phục lost-response thật. Contract, schema/service/hook, account isolation trên API và dataset thật vẫn chưa triển khai. Chưa bao phủ toàn bộ test case design trên native, vi/en/theme/accessibility/performance 200 câu cần review thực tế thêm. Giữ cổng duyệt UI trước API của ADR-009/016/017; chưa chuyển phase Done.
