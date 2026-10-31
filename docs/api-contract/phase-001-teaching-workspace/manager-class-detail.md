# P1-S7 — Manager class detail

GET `/manager/classes/:classId` trả ManagerClassDetailDto trực tiếp: base MentorClassDto, course `{id,code,title}`, roomName, unitCount, sessionCount, enrollmentCounts. Giữ ACTIVE/PENDING_PAYMENT/COMPLETED/CANCELLED riêng. Không coi CANCELLED là đã hoàn tiền.

Tab lịch: GET `/management/classes/:classId` với page/pageSize; response `{class,sessions:{items,page,pageSize,total}}`. Parse đúng nested page và snapshot TeachingSessionDto. Tab học viên: GET `/manager/classes/:classId/students` trả page ManagerRosterStudentDto, có email/phone/studentStatus. GET `/manager/classes/:classId/units` hỗ trợ read-only khi cần. Tab không tạo request roster trước lần mở đầu; context theo contract S4. Không gọi route Admin hoặc mutation vận hành. Xem [quy tắc chung](README.md).
