# ADR-024 — Tải dữ liệu theo status, ngày lịch và tab đang mở

## Status

**Accepted** — người dùng duyệt ngày 01/11/2026 (Asia/Bangkok) qua phản hồi “duyệt adr 23 24”. ADR được tạo theo yêu cầu “Ghi adr về lazy loading cho mở UI theo status, schedule chưa”, ghi nhận hành vi đã triển khai trong P1. Nguồn duyệt là phản hồi riêng này, không suy từ nghiệm thu P1. Ghi nguồn/ngày duyệt và đóng băng file tại lần chuyển trạng thái này theo ADR-012.

## Context và phạm vi

[ADR-018](ADR-018-secure-storage-network-and-lazy-loading.md) đã quy định lazy component/router và native list viewability, nhưng chưa quy định thời điểm gọi API theo status/ngày/tab. Tải mọi trạng thái, cả tuần lịch hoặc dữ liệu mọi tab khi vừa mở UI tạo request và dữ liệu không cần thiết.

ADR này bổ sung ADR-004/018 trong phạm vi tải dữ liệu Teaching Workspace. Giữ nguyên ADR Accepted theo ADR-012; không thay quyền backend, scope, contract, timezone hay quy tắc lưu dữ liệu nhạy cảm.

## Decision

1. **Mở danh sách lớp theo status:** Mentor và Manager mặc định `IN_PROGRESS`. Chỉ gọi danh sách và số đếm của status đang chọn; đổi chip mới tải status tương ứng. Tìm kiếm Manager chỉ tải lại danh sách của status đang chọn, không tải lại mọi số đếm. Phân trang chỉ phục vụ danh sách đang sử dụng.
2. **Không suy số liệu chưa tải:** số đếm status chưa mở để trống, không hiển thị 0. Tổng trên header là tổng của status hiện tại. Tab Đã hủy vẫn truy cập được dù chưa tải số đếm.
3. **Lịch dạy theo ngày:** mở UI lấy hôm nay theo ngày nghiệp vụ UTC+7. Query `from = YYYY-MM-DDT00:00:00+07:00`, `to = ngày kế tiếp T00:00:00+07:00`. Chọn ngày hoặc chuyển tuần chỉ tải ngày được chọn, không tự tải cả tuần. Không chuyển calendar date qua UTC midnight.
4. **Thanh tuần là bộ chọn:** dấu chấm/số buổi chỉ xuất hiện khi có dữ liệu của ngày đó; ngày chưa tải không được coi là không có lịch. Empty áp dụng cho ngày đã tải, không suy cả tuần trống. Tải đủ các trang của ngày trước khi kết luận số buổi.
5. **Tab và phần dữ liệu theo nhu cầu:** chi tiết lớp/buổi chỉ tải nội dung cần cho tab đang mở. Roster tải khi mở Học viên; tab có dữ liệu giữ nội dung theo cơ chế màn hiện hành, có thể refresh khi kích hoạt/focus. Không quy định cache một lần vĩnh viễn hoặc tắt refresh để giảm request. Tab Tài liệu buổi Mentor hiện là placeholder P1, không gọi units/tài liệu.
6. **Dữ liệu phụ của thẻ:** chỉ lấy tên lớp, phòng hoặc link khi phục vụ nội dung đang hiển thị và có quyền. Không gọi sessions từng lớp chỉ để dựng tiến độ thẻ danh sách. Theo yêu cầu người dùng ngày 01/11, bỏ hẳn phần tiến độ và nhãn thiếu dữ liệu trên thẻ Mentor.
7. **Feedback và dữ liệu cũ:** có skeleton theo bố cục nội dung đang tải; lỗi, offline, retry và phân trang theo từng phần. Đổi ngày/status/resource không hiển thị kết quả request trước thành dữ liệu của lựa chọn mới. Không dùng fixture hoặc giả số 0 để lấp dữ liệu thiếu.
8. **Quyền và phiên:** lazy loading vẫn kiểm role, assignment, scope CLASS/SESSION và capability tại service, kể cả deep link. Request/callback của tài khoản trước không được cập nhật màn tài khoản mới. Refresh khi focus/app active và retry giữ theo cơ chế hiện hành; không persist roster hoặc toàn bộ cache vào storage.

## Alternatives

- Prefetch mọi status, cả tuần và mọi tab: không chọn làm mặc định vì tải dữ liệu chưa sử dụng.
- Tải sessions cho mọi thẻ để tính tiến độ: không chọn; phần tiến độ đã được người dùng yêu cầu bỏ.
- Gán 0 cho dữ liệu chưa tải: không chọn vì nhầm chưa biết với thực sự rỗng.

## Consequences

Ít request và payload trong lần mở đầu; đổi status/ngày/tab có thể cần chờ tải. UI phải phân biệt chưa tải, đang tải, rỗng và lỗi. Có thể phát sinh request refresh khi quay lại tab/màn; số request dưới đây không phải giới hạn cứng cho toàn phiên.

Baseline hiện tại, không tính auth/retry/refresh token/focus/phân trang: mỗi danh sách lớp có hai request cùng status (pageSize 20 cho rows, pageSize 1 cho count). Lịch lấy ngày đang chọn và các thông tin phụ thực sự hiển thị; chi tiết buổi Manager chỉ lấy context trước khi mở Học viên. Đây là mô tả implementation, không buộc các phase sau phải giữ hai request nếu API sau này trả đủ dữ liệu trong một lần.

## Kiểm chứng và truy vết

- [Hồ sơ tải API theo nhu cầu](../implement/phase-001-teaching-workspace/lazy-api-loading.md): mapping request và hành vi từng màn.
- [Rà soát sau nghiệm thu P1](../implement/phase-001-teaching-workspace/review-cleanup.md): bộ kiểm tra source hiện tại có 198/198 tests pass; lần Maestro 01/11 lỗi bootstrap, không dùng làm bằng chứng native pass cho ADR này.
- `__tests__/teaching-ui.test.tsx`: mặc định IN_PROGRESS, đổi status, ngày được chọn, roster theo thao tác và placeholder Tài liệu không gọi units.
- `__tests__/teaching-api.test.ts`: kiểm scope/capability và adapter; `__tests__/teaching-query.test.tsx`: hành vi query.

Lượt ghi ADR chỉ thay tài liệu, không sửa runtime hoặc chạy lại test ứng dụng. Không dùng việc có ADR để khẳng định E2E native hoặc API production đã pass.

## BR/slice bị ảnh hưởng

P1-S1–S7 và Home trong phạm vi thời điểm tải dữ liệu. Giữ nguyên BR-TEACH-01/02, BR-TIME-01 và BR-AUTH-04; không thay nghiệp vụ điểm danh, ghi chú hay tài liệu các phase sau.
