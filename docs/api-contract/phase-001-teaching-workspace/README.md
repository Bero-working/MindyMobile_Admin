# Phase 1 — Teaching Workspace API

31/10/2026 (Asia/Bangkok). Chỉ thị “Triển khai API cho phase 1” cho phép chuyển sang tích hợp API. Không ghi nhận thay người dùng một quyết định nghiệm thu UI hoặc phase. Nguồn: [snapshot nguyên byte + SHA-256](../legacy/2026-10-31-teaching/README.md). Không sửa backend.

| Slice | Contract |
| --- | --- |
| P1-S1 | [mentor-schedule](mentor-schedule.md) |
| P1-S2 | [mentor-classes](mentor-classes.md) |
| P1-S3 | [mentor-class-detail](mentor-class-detail.md) |
| P1-S4 | [session-context](session-context.md) |
| P1-S5 | [mentor-students](mentor-students.md) |
| P1-S6 | [manager-classes](manager-classes.md) |
| P1-S7 | [manager-class-detail](manager-class-detail.md) |

## Transport, session và lỗi

API_URL từ cấu hình, đã gồm `/api/v1`. Các route trong contract là suffix sau prefix này. GET dùng `withCredentials: true`, timeout 10 giây, HttpOnly cookie do native networking quản lý. Không ghi token, roster, context hoặc query cache vào storage. Không fallback sang mock khi API lỗi. Mock chỉ dùng bằng dependency injection trong test/review rõ ràng; app khởi động dùng API thật ngay cả DEBUG_MODE=true.

401 → gọi auth restore (GET me và refresh theo P0), các request đồng thời chia sẻ một lần restore trong service; replay GET tối đa một lần. Restore signedOut hoặc replay 401 → xóa cache, rời workspace về login với notice sessionExpired. Restore lỗi mạng/server → lỗi có thể thử lại, không giả định đã đăng xuất. Renew trả account/role khác phiên hiện tại bị từ chối. Response của account cũ không được làm hết phiên account mới.

403 → denied; 404 → notFound; 429/5xx/timeout/JSON thành công sai schema → error; NetInfo báo mất mạng → offline. Chỉ requestId tối đa 200 ký tự được đưa ra UI; bỏ message/raw body. Không retry vô hạn. Roster buổi CANCELLED → unavailable. HTTP 409/422 từ backend vẫn là lỗi có thể thử lại, không giả làm roster rỗng.

## Dữ liệu và vòng đời query

Wire được validate bằng Zod tại `src/modules/teaching/services/teachingSchemas.ts`, map sang UI model bằng `teachingService.ts`. UUID, enums, timestamp có timezone và page envelope `{items,page,pageSize,total}` được kiểm. Page bắt đầu 1, pageSize 1–100. List không bọc thêm data. IDs của detail/context và classId của timetable phải khớp request.

Query lưu trong bộ nhớ theo provider của phiên `(screen,role,email)`, resource/request gồm kind, role, classId/sessionId/unitId, filter, range và page. Provider remount khi phiên đổi; query bỏ response cũ bằng sequence khi filter/resource/focus đổi. Refetch khi focus, app active, kéo refresh. Không persist. Refresh lỗi giữ dữ liệu đã đọc và warning; denied/notFound/unavailable xóa dữ liệu cũ. Pagination merge theo ID, chặn tải trang tiếp trùng lúc, retry đúng trang bị lỗi. Lịch tự tải tất cả trang và từ chối pagination không tiến triển. Bộ đếm lớp dùng total query pageSize=1 theo từng status, không đếm riêng trang đầu.

Không suy ra người dạy từ primaryMentor khi effectiveMentor=null; giữ version và actualStartedAt/actualEndedAt. Link họp chỉ đọc từ context, mở qua validator HTTP(S), không suy từ timetable. UI không có mutation điểm danh, mở khóa, phân công, thu tiền hoặc thao tác Admin trong P1.

## Khoảng trống UI so với backend

Mentor class list không trả tiến độ chương, lịch tuần cố định, phòng, buổi kế tiếp, enrollmentCounts hoặc số chương/buổi. Workspace shell có visibleUnitCount/visibleSessionCount và course, nhưng không có ngày, hình thức, sĩ số hoặc tiến độ. Adapter dùng null cho dữ liệu không có; UI ẩn progress và hiển thị “—” ở fact thiếu, không giả 0 hoặc mặc định online. Nút roster dùng nhãn “Học viên” khi chưa có số lượng. Không tính currentUnit từ số chương đã mở hoặc số buổi đã dạy.

Manager dùng `/manager/classes` cho list/detail có ngày, chỗ trống, course và enrollmentCounts; `/management/classes/:id` chỉ dùng timetable với snapshot người dạy. Không trộn DTO từ hai namespace.

[Kết quả tích hợp](../../implement/phase-001-teaching-workspace/api-integration.md) và [E2E](../../implement/phase-001-teaching-workspace/e2e.md) phân biệt test local, HTTP simulation, backend thật và native.
