# ADR-025 — Quy tắc chung về UI, tải dữ liệu và kiểm chứng cho các phase

## Status

**Accepted** — 01/11/2026 (Asia/Bangkok), theo chỉ thị trực tiếp của người dùng “Viết thành adr để áp dụng đi”, sau khi đã được liệt kê 15 quy tắc chung từ các lần sửa Phase 1. Chỉ thị này cho phép ghi và áp dụng bộ quy tắc vừa liệt kê. Ghi nguồn/ngày duyệt tại lần tạo này và đóng băng file theo ADR-012.

Không quy đổi chỉ thị này thành duyệt toàn bộ ADR-023/024 hoặc các ADR khác. Hiệu lực của các quy tắc trùng phạm vi đến từ ADR-025 này; giữ nguyên các file ADR cũ.

## Ngày và phạm vi

01/11/2026 (Asia/Bangkok). Người soạn: Codex. Áp dụng cho các màn, slice và phase tiếp theo của Mindy Mobile, gồm các lần chỉnh sửa màn hiện hữu. Không mở rộng phạm vi nghiệp vụ hoặc tự triển khai/migrate các phase trong lượt ghi ADR.

## Context

Các lần sửa Phase 1 đã thống nhất cách điều hướng, tải API theo phần đang sử dụng, skeleton, feedback, spacing và ghi nhận kết quả kiểm chứng. Các quy tắc này cần thành chuẩn dùng chung để không phải nhắc lại ở từng màn. Đặc thù P1 như bỏ tiến độ thẻ Mentor hoặc số tab của một màn vẫn nằm trong hồ sơ P1; không mặc định xóa tiến độ hay ép mọi màn về cùng số tab ở các phase sau.

## Decision

### 1. Điều hướng trực tiếp

Mở màn, Back toolbar, Android Back và chuyển tab hiển thị trực tiếp, không dùng slide, fade, scale hoặc hiệu ứng mở từ tọa độ nút. Không dùng gesture vuốt để chuyển/back màn. Giữ navigation stack và hành vi Back thật. Quy tắc này chỉ áp dụng chuyển màn/tab; skeleton và feedback trong màn vẫn theo thiết kế và trợ năng.

### 2. Tải dữ liệu theo nhu cầu

Chỉ tải status, ngày, tab hoặc phần nội dung đang sử dụng, không mặc định tải trước mọi lựa chọn. Mỗi màn xác định rõ lựa chọn ban đầu trong kế hoạch/design. Với danh sách lớp Mentor/Manager hiện hữu, lựa chọn ban đầu là IN_PROGRESS; với lịch dạy là hôm nay theo ngày nghiệp vụ UTC+7. Giữ quy tắc timezone của ADR-008, không ép calendar date qua UTC midnight.

Chọn status khác mới tải dữ liệu tương ứng; lịch chỉ tải ngày được chọn, thanh tuần không buộc tải cả tuần. Tải thông tin phụ khi thật sự cần cho nội dung đang hiển thị. Các request cần để xác thực phiên, kiểm quyền và bảo đảm đúng dữ liệu vẫn phải thực hiện.

### 3. Phân trang theo phần đang mở

Chỉ kích hoạt tải thêm cho danh sách/tab đang hiển thị; tránh request trùng hoặc tăng trang khi request trước chưa hoàn tất. Khi lỗi tải thêm, retry đúng trang lỗi và giữ các hàng đã tải. Không dùng một trang dữ liệu để kết luận tổng hợp toàn bộ resource.

### 4. Không giả dữ liệu

Phân biệt chưa tải, đang tải, rỗng, số 0 thật và không có nguồn dữ liệu. Số đếm của status/ngày chưa tải không được gán 0. Không suy cả tuần không có lịch từ một ngày rỗng. Số liệu/tổng hợp chỉ hiển thị khi có nguồn xác thực và đủ phạm vi cần tính; không suy thời gian đã qua thành nghiệp vụ đã hoàn thành.

### 5. Chi phí của thông tin phụ

Không mặc định gọi API cho từng hàng chỉ để dựng thông tin trang trí hoặc số liệu phụ. Khi chi phí lớn, ghi nhận lựa chọn bỏ thông tin hoặc bổ sung dữ liệu vào API tổng hợp. Việc thay UI hay contract vẫn phải trong phạm vi được người dùng cho phép; ADR này không tự cho phép sửa backend hoặc xóa thông tin nghiệp vụ ở phase khác.

### 6. Skeleton theo nội dung thật

Skeleton bám kích thước/vị trí của nội dung tương ứng và hạn chế thay đổi chiều cao khi dữ liệu đến. Không chèn một số hàng lớn cố định không liên quan bố cục. Phần đang tải có placeholder riêng; tải thêm giữ các hàng hiện có, dùng skeleton phù hợp footer. Không thêm footer loading khi đã đủ dữ liệu. Tôn trọng reduced motion và dọn animation khi unmount.

### 7. Feedback theo từng phần

Nội dung hoặc empty state hiển thị trước warning và Retry. Lỗi một phần không khóa các phần độc lập còn lại, trừ khi lỗi quyền/phiên đòi hỏi chặn dữ liệu theo ADR-005/019. Refresh lỗi có thể giữ dữ liệu đã tải của đúng query; mã hỗ trợ/requestId được giữ khi có.

### 8. Offline

Offline chỉ hiển thị warning, không có nút Retry trong phần đang offline. Cho phép phục hồi qua cơ chế tải lại khi có kết nối, pull-to-refresh hoặc app active/focus hiện hành. Mỗi loại nội dung phải quy định rõ giữ hay ẩn cache; không áp dụng ngoại lệ Home P1 cho mọi màn. Riêng Home Today P1 tiếp tục chỉ một warning và ẩn dữ liệu/action khi offline. Không thay chính sách draft/queue nghiệp vụ của ADR-006.

### 9. Dữ liệu đúng ngữ cảnh

Refresh lỗi chỉ giữ dữ liệu của cùng query. Đổi filter, ngày, resource hoặc tài khoản không được hiển thị kết quả cũ dưới lựa chọn mới. Kết quả request cũ không được ghi đè request mới; dữ liệu mất quyền hoặc phiên hết hiệu lực phải được xử lý theo quyền và ranh giới tài khoản hiện hành. Không coi lazy loading là cache một lần vĩnh viễn hoặc lý do tắt refresh cần thiết.

### 10. Spacing và vùng chạm

Dùng token spacing chung, khoảng cách rõ giữa header, tab, nội dung và feedback; không sao chép số pixel đặc thù P1 thành mặc định cho mọi layout. Nút gọn nhưng giữ vùng chạm tối thiểu theo design/hệ thống UI hiện hành. Các action độc lập không được chồng vùng bấm; nút disabled không kích hoạt action của vùng cha.

### 11. Hiệu ứng có giới hạn

Khi design cần kính mờ, dùng blur thật theo ADR-022, không giả blur bằng gradient đục. Chỉ dùng nơi cần thiết; tránh blur trên thẻ lặp trong danh sách. Duy trì token độ trong suốt, fallback trợ năng và giới hạn hiệu năng theo ADR-022. Kiểm hiệu ứng trên thiết bị, không kết luận chỉ từ Jest mock.

### 12. Phạm vi phase và quyền

Chỉ cung cấp thao tác nghiệp vụ đã triển khai trong phase được phép. Placeholder cho phase sau phải rõ, không tạo số liệu hay mutation giả. Quyền/capability và scope do server quyết định; lazy loading vẫn kiểm quyền ở service, kể cả deep link. Không lấy roster toàn lớp thay dữ liệu buổi khi chỉ có scope SESSION; không fallback mock khi API thật lỗi.

### 13. Yêu cầu mới nhất và đồng bộ

Yêu cầu trực tiếp mới nhất của người dùng là căn cứ cho phần được thay đổi. Đồng bộ code, test, tài liệu và trạng thái hiện hành trong phạm vi được giao; giữ nhật ký lịch sử và ghi rõ quy tắc bị thay thế. Nếu liên quan ADR Accepted, ghi quyết định mới và mapping tại sổ ADR theo ADR-012, không sửa hồi tố file đã đóng băng.

### 14. Kiểm chứng đúng bản sửa

Chạy kiểm tra phù hợp với thay đổi trên source hiện tại; phân biệt unit/UI mock, API thật, Android build và E2E native. Không lấy kết quả cũ làm bằng chứng bản sửa mới pass. Ghi rõ failed, skipped, blocked, môi trường, nguồn dữ liệu và giới hạn; xem ảnh native trước khi kết luận bố cục. Giữ cổng E2E/nghiệm thu theo ADR-009/020; không tự nâng trạng thái hoàn tất hoặc nghiệm thu từ unit test/build.

### 15. Quyết định dùng lâu dài ghi bằng ADR

Quy tắc áp dụng nhiều màn/phase phải có ADR với phạm vi, quan hệ bổ sung/thay thế và nguồn quyết định. Không sửa ADR đã duyệt và không tự coi yêu cầu sửa code là duyệt toàn bộ ADR. Chỉ ghi Accepted khi có phản hồi rõ ràng hoặc chỉ thị trực tiếp ghi và áp dụng chính bộ quy tắc đã được trình như nguồn của ADR-025 này.

## Quan hệ với ADR hiện có

| ADR                 | Quan hệ và phần tiếp tục có hiệu lực                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-003/010/014     | Bổ sung quy tắc sử dụng token/layout; giữ nguồn design và stylesheet hiện hành                                                                                                                            |
| ADR-004/007/008     | Bổ sung thời điểm tải, ranh giới query và feedback; giữ contract, storage, kiểu dữ liệu và timezone                                                                                                       |
| ADR-005/019         | Giữ quyền, scope và auth; bổ sung yêu cầu không lộ dữ liệu khi tải chậm/đổi ngữ cảnh                                                                                                                      |
| ADR-006             | Không thay draft/queue offline nghiệp vụ; warning offline ở đây là quy tắc UI tải dữ liệu                                                                                                                 |
| ADR-009/016/017/020 | Giữ quy trình kế hoạch, duyệt UI, API, E2E và nghiệm thu; bổ sung chuẩn chung khi lập kế hoạch và kiểm chứng                                                                                              |
| ADR-012             | Giữ nguyên hiệu lực quản lý ADR bất biến                                                                                                                                                                  |
| ADR-013/021         | Thay quy tắc animation/gesture chuyển màn và ngoại lệ hướng mở/Back bằng mục 1. Giữ Native Stack, công cụ animation/gesture cho tương tác khác và các quyết định ngoài phạm vi chuyển màn                 |
| ADR-018             | Bổ sung lazy API theo nhu cầu; giữ lazy component/router, native viewability và security                                                                                                                  |
| ADR-022             | Giữ quyết định blur native; khái quát thành quy tắc dùng hiệu ứng có giới hạn                                                                                                                             |
| ADR-023/024         | Giữ Proposed, không tự chuyển trạng thái. Các quy tắc bỏ animation và tải theo status/ngày/tab được áp dụng theo ADR-025 trong phạm vi mục 1–9; hồ sơ/đặc thù P1 còn lại không mặc định thành chuẩn chung |

Các mã trong bảng tra tại [sổ ADR](README.md). File Accepted cũ giữ nguyên; mapping hiệu lực được cập nhật tại sổ.

## Alternatives

- Chỉ giữ trong chat hoặc hồ sơ P1: khó tìm và dễ bỏ sót khi làm phase mới.
- Sửa trực tiếp các ADR Accepted: không giữ bản quyết định đã duyệt và vi phạm ADR-012.
- Áp toàn bộ chi tiết P1 cho mọi màn: làm sai phạm vi nghiệp vụ và bố cục của phase sau.

## Consequences và cách áp dụng

Khi lập kế hoạch phase mới, ghi lựa chọn ban đầu, thời điểm tải từng phần, hành vi cache/offline, quyền, trạng thái UI và cách kiểm chứng theo 15 quy tắc trên. Khi sửa màn hiện hữu, áp dụng trong phần được thay đổi; không mở một đợt refactor toàn app chỉ vì ADR có hiệu lực. Khác biệt với chuẩn này phải có chỉ thị/ADR mới theo ADR-012.

Không quy định cố định số request cho mọi màn hoặc ép status IN_PROGRESS cho loại resource không có status đó. Chi tiết API, nghiệp vụ và design của phase vẫn phải được xác minh/duyệt riêng.

## BR/slice bị ảnh hưởng và kiểm chứng

Áp dụng chung cho P0–P8 và các phase bổ sung, không đổi BR nghiệp vụ hoặc số slice. Lượt này chỉ ghi tài liệu, đồng bộ sổ ADR, changelog và hướng dẫn; không thay source ứng dụng, không chạy lại test ứng dụng và không ghi nhận thêm bằng chứng E2E.

Nguồn truy vết: [hồ sơ lazy loading P1](../implement/phase-001-teaching-workspace/lazy-api-loading.md), [spacing/feedback P1](../implement/phase-001-teaching-workspace/ui-spacing-feedback-update.md), [tiến độ P1](../progress/phase/phase-001-teaching-workspace.md). Kết quả lịch sử trong các hồ sơ này không phải kết quả kiểm chứng cho các phase tương lai.
