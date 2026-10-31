# P1-S5 — Mentor students

Trước GET `/mentor/classes/:classId/students`, service kiểm lại GET workspace shell. Chỉ gọi khi accessScope=CLASS và capabilities.readClassRoster=true. Deep link hoặc capability stale không bỏ qua kiểm tra. Backend tiếp tục là nơi quyết định quyền cuối cùng.

Query page/pageSize/orderStatus (PAID/PENDING/EXPIRED/CANCELLED); UI status map sang orderStatus. Response page MentorRosterStudentDto: enrollmentId, studentName, enrollmentStatus, orderStatus, paymentType, paidAt, expiresAt. Map enrollmentId thành id, giữ enrollment/payment riêng. Mentor không có contact/studentStatus nên dùng null. Mọi payment chỉ đọc; canConfirmCash từ response không mở action. Xem [quy tắc chung](README.md).
