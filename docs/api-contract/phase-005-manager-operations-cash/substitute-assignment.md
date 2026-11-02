# P5-S1 — Dạy thay theo buổi

[Quy ước chung](README.md). GET /class-sessions/:id/context đọc session/primary/effective mentor, assignmentType, version, asOf; không tin version từ route params. Chỉ SCHEDULED với startsAt > asOf được sửa qua UI.

GET /management/class-sessions/:id/available-mentors: page/pageSize, search trim tối đa 100 ký tự. Response items[{id,displayName,isCurrent}], total/page/pageSize, sessionId, sessionVersion, asOf. SessionId phải khớp, version khác context thì tải lại trước gửi. Search debounce 300ms; selection giữ qua filter, isCurrent không chọn được.

PATCH /management/class-sessions/:id/mentor; header Idempotency-Key UUID; body {mentorId: UUID|null, reason: string trim 1..1000, expectedVersion: integer>0}. Null trả về mentor chính, không đổi mentor chính lớp. Response TeachingSessionDto; đọc effectiveMentor từ response, refresh context/lịch/lớp/candidates.

SESSION_VERSION_CONFLICT tải lại context/candidates; STATE_CONFLICT khác version conflict. CLASS_MENTOR_SCHEDULE_CONFLICT/CLASS_MENTOR_NOT_ELIGIBLE bỏ lựa chọn, giữ reason. CLASS_NOT_EDITABLE khóa form. Chưa rõ kết quả khóa intent; gửi lại cùng body/version/key, không tạo intent khác khi outcome chưa rõ. Không sửa teachingMentorId lịch sử hoặc buổi IN_PROGRESS qua UI.
