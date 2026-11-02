# P5-S2 — Dời buổi

[Quy ước chung](README.md). Đọc GET context và /manager/classes/:classId (startDate/endDate/status). Class lookup lỗi không chặn form; server kiểm lại thời gian lớp.

PATCH /management/class-sessions/:id/schedule, header Idempotency-Key UUID. Body {startsAt, endsAt, reason, expectedVersion}; instant ISO có offset, reason trim 1..1000, version dương. **Không gửi title hoặc mentorId**. UI chỉ SCHEDULED tương lai, start/end cùng ngày và end>start; không auto-submit khi đổi giờ.

Response TeachingSessionDto đúng sessionId, cập nhật giờ theo server. SESSION_VERSION_CONFLICT giữ giờ/lý do nhập, tải context mới rồi xác nhận lại với intent mới; uncertain retry nguyên intent. SESSION_STATE_CONFLICT/CLASS_NOT_EDITABLE khóa theo trạng thái mới; mentor clash/CLASS_SESSION_OVERLAP giữ form; SESSION_HAS_MAKEUP_PLACEMENTS báo xử lý học bù trước. 422 ngoài class period/lỗi giờ hiển thị đúng phần. Invalidate context/lịch ngày cũ-mới/lớp/incomplete khi thành công.
