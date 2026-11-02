# Phase 2 — Tiện ích Manager, tabs và bố cục rút gọn

Ngày: 01/11/2026 (Asia/Bangkok). Theo các yêu cầu trực tiếp của người dùng sau bản UI mock đầu tiên:

- Filter status cuộn ngang như danh sách lớp, không xuống hàng.
- “Sửa điểm danh và Lịch sử điểm danh sẽ là 1 feature tiện ích”; “Chốt buổi thay mentor thì là 1 feature luôn”. Người dùng xác nhận **“Thêm 2 tiện ích ở Home”**.
- Hai lựa chọn Sửa/Lịch sử thành **thanh tabs gắn với header**, cùng kiểu tab Tổng quan/Buổi học/Học viên của P1.
- Thông báo “Chưa có thay đổi nào…” nằm trong card, không có card rỗng phía trên.
- Bỏ cụm đầu màn Sửa điểm danh trong ảnh người dùng: thẻ thông tin/totals, hướng dẫn, hai nút bulk và thông báo chờ thanh toán. Đi thẳng vào roster; giữ lưu theo lô các hàng được chọn và lý do bắt buộc.

## Hành vi hiện hành

| Tiện ích | Luồng |
| --- | --- |
| Quản lý điểm danh | Home Manager → `AttendanceManagement` chọn lớp → mở thẳng roster của buổi gần nhất, với hai tab Sửa/Lịch sử; chuyển tab hiển thị roster hoặc audit ngay |
| Chốt buổi thay Mentor | Home Manager → `ManagerFinalizeSessions` → chọn buổi có `canFinalize` → màn riêng `ManagerFinalize` → giờ kết thúc thực tế/lý do → chốt và quay về danh sách |

Home có bốn tile: Lớp học, Buổi chưa hoàn tất, Quản lý điểm danh, Chốt buổi thay Mentor. Các route tiện ích chỉ đăng ký trong workspace Manager của bản UI mock. Nhóm Thao tác ở chi tiết buổi không còn ba nút Sửa/Lịch sử/Chốt cũ; Khôi phục vẫn ở context, và shortcut lịch sử trên hàng điểm danh vẫn hoạt động theo quyền.

02/11/2026 — Theo chỉ thị “Vào chọn lớp trước rồi mới qua UI sửa điểm danh và lịch sử điểm danh”, màn đầu của Quản lý điểm danh chỉ có danh sách lớp. Chưa tải danh sách buổi hoặc hiện tabs trước khi chọn lớp. Sau chọn, header hiển thị tên lớp; query Sửa/Lịch sử và các status đều có `classId`, lọc trước khi phân trang. Back từ tabs về chọn lớp, Back tiếp về Home. Đổi lớp không dùng lại buổi của lớp trước. Chốt buổi thay Mentor giữ luồng riêng.

02/11/2026 — Người dùng làm rõ bằng 5 ảnh: chọn lớp xong phải thấy **nội dung roster/audit ngay bên dưới hai tabs**, bỏ UI filter status và danh sách buổi. Đây là hành vi hiện hành thay thế bước chọn buổi ở trên. `AttendanceManagementSessions` chỉ resolve buổi gần nhất của lớp (lọc classId, sắp startsAt giảm dần, pageSize 1), rồi replace sang correction có tabs. Chuyển tab replace correction/audit của cùng session, không thêm màn trung gian vào Back stack. Draft/busy/uncertain vẫn được bảo vệ bởi navigation guard khi đổi tab. Nếu lớp chưa có buổi, hiện empty trong bố cục tabs. Mặc định buổi gần nhất là lựa chọn triển khai; chưa tích hợp API.

`IncompleteSessions` dùng một `ScrollView horizontal` chứa issue và chọn lớp. Không thêm số đếm status chưa tải. Tiện ích Quản lý điểm danh mặc định tab Sửa, status IN_PROGRESS; status đổi thì tải đúng query mới. Chốt thay chỉ liệt kê buổi IN_PROGRESS có capability. Danh sách phân trang theo session, key gồm role/account/mode/status/pageSize/page; không gọi snapshot từng hàng để trang trí.

Manager finalize là màn riêng, không còn sheet ở S4. Không điền sẵn giờ kết thúc; nút dùng giờ theo lịch vẫn cần người dùng bấm. Lý do sau trim 1–1000 ký tự; kiểm actual start < end ≤ asOf. Đọc lại quyền/totals/version trước ghi; version đổi phải xem lại và bấm xác nhận lần nữa. Giữ intent khi mất response, khóa form và retry cùng body/key/version. Thành công invalidate cả hai danh sách tiện ích và backlog, rồi trở về danh sách buổi còn được chốt.

Theo ảnh và yêu cầu tiếp theo, correction dùng roster gọn: avatar chữ cái nền trung tính, tên và một chip trạng thái bên phải; bấm chip đổi trực tiếp giữa **Có mặt/Vắng**. Chỉ có hai ô tổng màu xanh/đỏ, cập nhật theo draft. Không có trạng thái “Chưa điểm danh” trong giao diện correction. Phần summary lớn, hướng dẫn, bulk và pending cũ vẫn được bỏ.

Dữ liệu mock cũ `UNMARKED` được hiển thị là Vắng trong correction; không tự ghi lại các hàng này. Payload lưu chỉ chứa những hàng người dùng đã sửa, với PRESENT hoặc ABSENT. Giữ regular/guest, giới hạn lô, draft/conflict, SaveBar và lý do bắt buộc. Mentor S1 vẫn theo design riêng. Audit empty toàn buổi hoặc đang lọc đều nằm trong `audit-results-card`.

## Quan hệ với design/kế hoạch cũ

Yêu cầu trực tiếp mới nhất được áp dụng theo ADR-025 mục 13; giữ nguyên nguồn design Claude và ADR Accepted để truy vết. Các mô tả “Home đúng hai tile”, ba action riêng ở S4, sheet finalize ở S4 và bulk Manager trong S5 là baseline trước bản cập nhật này. TC-P2-S5-19/20 về UI bulk Manager không còn là tiêu chí của UI hiện hành. Reason, quyền, version/idempotency, phạm vi dữ liệu và cổng duyệt API vẫn giữ nguyên.

Các route tiện ích tổ chức lại S3/S5/S7; mẫu số phase vẫn 7 slice. Người dùng đã duyệt UI toàn phase ngày 02/11/2026; API 0/7, chưa nghiệm thu. `managerSessions` là thao tác của mock boundary, **không phải endpoint mới**. Trước tích hợp cần đối chiếu cách lấy danh sách buổi từ API hiện hữu và ghi contract; không suy một endpoint tìm mọi buổi từ tên model này.

## Kiểm chứng

- Jest UI: hai tile Home, header tabs có role/selected, đổi mode, correction → history; không còn cụm summary/bulk/pending trong correction; empty audit nằm trong card; finalize riêng kiểm giờ/lý do và rời danh sách khi thành công.
- Test mock source: phân trang buổi và membership sau finalize.
- Maestro cập nhật đường đi hiện hành trong `ui-review.yaml`/`manager-review.yaml`; flow `utilities-review.yaml` kiểm riêng thay đổi mới. Kết quả cuối/ảnh cập nhật tại [verification](ui-verification.md) và [E2E UI](e2e-ui.md); không dùng các ảnh/lượt pass cũ làm bằng chứng giao diện mới.

## Tích hợp và hai tab chi tiết buổi — 02/11/2026

Người dùng yêu cầu “Hãy thêm thành tabs (lịch sử, khôi phục) vào chi tiết buổi học”. Manager có Tổng quan / Điểm danh / Lịch sử / Khôi phục; giữ luồng Home chọn học viên → lớp/buổi để correction và tiện ích Chốt thay riêng. Không thêm lại các nút per-session cũ. History/Recovery được tải khi mở tab, giữ đúng session và guard dirty/busy khi đổi tab. Quyền recovery lấy từ server; recovery thành công về Điểm danh của cùng buổi, audit lấy từ backend thật. Hai tab dùng header chi tiết buổi, tự cuộn để thấy tab đang chọn. API/kiểm chứng hiện tại tại [hồ sơ tích hợp](api-integration.md) và [E2E](e2e.md); các baseline mock phía trên là lịch sử.
