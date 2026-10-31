# P1-S4 — Session context

GET `/class-sessions/:sessionId/context`, role MENTOR hoặc MANAGER. Response `{session,roomName,meetingUrl,accessScope:'SESSION'}`. Kiểm sessionId đúng request; giữ version, assignment, effectiveMentor (kể cả null), actualStartedAt/actualEndedAt và makeup lineage. Không ghi meeting URL hoặc điểm danh trong P1.

Roster đọc lại context trước khi chọn endpoint: SCHEDULED → GET `/class-sessions/:id/attendance-candidates`; IN_PROGRESS/COMPLETED → GET `/class-sessions/:id/attendance`; CANCELLED → unavailable và không gọi roster. Cả hai route phân trang. Map enrollmentId + makeupPlacementId thành identity, student.displayName và entryType REGULAR/MAKEUP. Không gán payment/enrollment giả cho attendee. Trước giờ bắt đầu hiển thị provisional; không suy người học đã/chưa được đánh dấu từ dữ liệu P1. Không gọi roster CLASS để thay thế khi bị từ chối. Xem [quy tắc chung](README.md).
