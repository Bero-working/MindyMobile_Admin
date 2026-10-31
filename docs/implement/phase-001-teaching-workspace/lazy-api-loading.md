# Tải API theo phần đang sử dụng

Ngày: 01/11/2026 (Asia/Bangkok). Theo yêu cầu chỉ tải trạng thái Đang dạy khi mở danh sách lớp lần đầu và áp dụng tải theo nhu cầu cho các phần tương tự.

## Hành vi

- MentorClasses và ManagerClasses: hai request `GET /mentor/classes` hoặc `GET /manager/classes`, cùng `status=IN_PROGRESS`, lần lượt pageSize 20 cho danh sách và pageSize 1 cho tổng của trạng thái. Không tải số đếm các trạng thái khác. Đổi trạng thái mới tải hai request cho trạng thái vừa chọn; tìm kiếm Manager chỉ tải lại danh sách. Vẫn phân trang khi cuộn gần cuối hoặc bấm Xem thêm.
- Số đếm các tab khác để trống đến khi tab được chọn; không giả định số 0. Tab Đã hủy luôn truy cập được. Tiêu đề hiển thị số lớp của trạng thái đang chọn, không giả làm tổng tất cả trạng thái.
- MentorClasses không yêu cầu includeCardDetails: không gọi sessions theo từng lớp. API danh sách chưa có tiến độ nên thẻ không hiển thị tiến độ; tiến độ vẫn xem tại chi tiết lớp.
- MentorStudents chỉ dùng query students: service kiểm tra quyền từ class shell rồi tải roster, trả lại classInfo cho tiêu đề. Không gọi class shell lần thứ hai từ UI. Vẫn kiểm tra readClass, scope CLASS và readClassRoster, kể cả deep link.
- SessionContext Mentor: Tổng quan chỉ tải context và class; roster tải khi mở tab Học viên; units tải khi mở Tài liệu. Thông tin chương được chuyển sang tab Tài liệu. Các số liệu chưa tải dùng dấu gạch thay vì giả số 0 ở Tổng quan.
- SessionContext Manager: mở màn chỉ tải context; bấm Học viên mới tải kiểm tra context và roster. Các kiểm tra quyền/trạng thái ở service vẫn giữ nguyên.
- Lịch dạy Mentor: mặc định chỉ lấy lịch hôm nay, từ 00:00 đến 00:00 ngày kế tiếp theo UTC+7. Chọn ngày khác hoặc chuyển tuần chỉ tải ngày vừa chọn. Thanh tuần vẫn dùng để chọn ngày; dấu chấm/số buổi chỉ có cho ngày đã tải, không gán ngày chưa tải thành 0 buổi. Không suy luận cả tuần trống từ một ngày trống. Skeleton và phân trang vẫn giữ nguyên cho khoảng ngày đang chọn.
- Khi tải ngày mới, skeleton có cấu trúc thẻ lịch (giờ, trạng thái, tên lớp, phòng và hai nút), gap 20 px giữa các thẻ; ngày đang chọn vẫn hiển thị. Số buổi, tên lớp và địa điểm có skeleton riêng khi dữ liệu tương ứng còn chờ, không hiển thị dữ liệu rỗng sớm.

## Request cho lần tải đầu

Không tính auth, retry, refresh token, tải thêm trang hoặc tải lại khi focus/app active.

| Phần | Trước | Sau |
| --- | --- | --- |
| Lớp phụ trách Mentor | 6 + request sessions từng lớp | 2 |
| Danh sách lớp Manager | 6 | 2 |
| Học viên lớp Mentor | 3 | 2 |
| Chi tiết buổi Mentor | 5 nếu chưa hủy | 2 |
| Chi tiết buổi Manager | 3 nếu chưa hủy | 1; thêm 2 khi bấm Học viên |
| Chi tiết lớp Manager | 1 | 1; thêm 1 cho mỗi tab Lịch học/Học viên khi mở lần đầu |
| Chi tiết lớp Mentor | 2–3 | 2–3; context là dữ liệu đang hiển thị |
| Thẻ Hôm nay của Mentor | 1–3 | 1–3; lịch, tên lớp, phòng/link đang hiển thị |
| Lịch dạy Mentor | Lịch toàn tuần + lớp + N context | Lịch một ngày + lớp + N context; N chỉ gồm buổi đủ quyền trong ngày đang chọn |

## Kiểm chứng

Test UI đi qua adapter thật với Axios spy xác nhận mỗi danh sách đúng hai request IN_PROGRESS, không gọi sessions hay trạng thái khác; chọn OPEN mới tải hai request OPEN. Test UI xác nhận roster/units chỉ tải sau thao tác mở phần tương ứng, cùng kiểm tra lỗi độc lập. Test adapter xác nhận roster trả classInfo và chỉ gọi hai request, giữ kiểm tra quyền.

TypeScript và ESLint các file thay đổi đều qua. Full suite: 194/195 test qua, một ca chờ notFound của lịch dạy timeout; chạy riêng toàn bộ suite vị trí lịch dạy lại qua 12/12, không đổi code hay test của suite đó. Test lịch dạy dùng thời gian cố định để không phụ thuộc thời điểm chạy qua nửa đêm.

Bộ Postman simulation hiện có được chạy trên cổng 4013 với --no-history. `verify-teaching-api.cjs --simulation` thực thi adapter qua HTTP; log `build-logs/api-loading-simulation.ndjson` ghi tám GET (bảy 200, một context HTML 503 như kịch bản có sẵn). Đây là bằng chứng với dữ liệu giả lập, không phải đo traffic production hoặc kiểm chứng backend thật.
