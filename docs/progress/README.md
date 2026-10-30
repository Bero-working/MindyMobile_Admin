# Tiến độ Mindy Mobile

Ngày khởi tạo: **30/10/2026**. Đây là baseline tài liệu, **chưa có phase được triển khai**. [Kế hoạch](../implementation-plan.md), [ADR](../adr/README.md), [BR changelog](business-rules-changelog.md).

| Phase / luồng                                                                                     | Ưu tiên | Trạng thái |  UI | API | Slice hoàn chỉnh | % slice | Ngày cập nhật |
| ------------------------------------------------------------------------------------------------- | ------- | ---------- | --: | --: | ---------------: | ------: | ------------- |
| [P0 — Nền tảng → đăng nhập → đúng workspace](phase-foundation-auth.md)                            | P0      | Todo       | 0/4 | 0/4 |              0/4 |      0% | 30/10/2026    |
| [P1 — Mentor xem lịch/lớp → Manager theo dõi lớp](phase-teaching-workspace.md)                    | P0      | Todo       | 0/7 | 0/7 |              0/7 |      0% | 30/10/2026    |
| [P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction](phase-attendance-and-notes.md)   | P0      | Todo       | 0/7 | 0/7 |              0/7 |      0% | 30/10/2026    |
| [P3 — Mentor tải tài liệu → Manager duyệt/công bố](phase-material-review.md)                      | P0      | Todo       | 0/6 | 0/6 |              0/6 |      0% | 30/10/2026    |
| [P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật](phase-leave-and-makeup.md)              | P0      | Todo       | 0/7 | 0/7 |              0/7 |      0% | 30/10/2026    |
| [P5 — Manager phân công/xử lý lịch → xác nhận CASH](phase-manager-operations-cash.md)             | P0      | Todo       | 0/5 | 0/5 |              0/5 |      0% | 30/10/2026    |
| [P6 — Mentor tạo quiz → công bố → theo dõi trạng thái](phase-mentor-quiz.md)                      | P1      | Todo       | 0/3 | 0/3 |              0/3 |      0% | 30/10/2026    |
| [P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa](phase-attendance-progress-reports.md) | P1      | Todo       | 0/2 | 0/2 |              0/2 |      0% | 30/10/2026    |
| [P8 — Mentor trao đổi → nhận thông báo/push đúng quyền](phase-chat-notifications.md)              | P1      | Todo       | 0/3 | 0/3 |              0/3 |      0% | 30/10/2026    |

MVP P0–P5: **0/36 slice hoàn chỉnh (0%)**. P1 chỉ roadmap, chưa chốt phạm vi chi tiết; không gộp vào % MVP.

## Quy ước

Slice hoàn chỉnh khi UI và API đều có bằng chứng hoàn tất; tỉ lệ không thay thế nghiệm thu. Phase chỉ Done sau người dùng nghiệm thu. Các mốc: Design (Claude) → UI toàn phase (TDD) → Người dùng duyệt UI → API toàn phase (TDD) → Cleanup + lint + test → Nghiệm thu.

Chưa chạy lint/typecheck/Jest mobile trong lần tạo tài liệu. Việc đọc controller, tài liệu hoặc collection backend không làm tăng tiến độ. Kết quả test ghi trong tài liệu BE cũ không phải kết quả mobile. Chưa có commit/PR trong workspace này; không tạo Git history tự động.

## Trạng thái cổng chung

- 9 ADR ban đầu Proposed, 0 Accepted; ADR Auth chưa tạo theo giới hạn lần đầu.
- Claude chưa cung cấp design; không bắt đầu UI.
- Người dùng xác nhận email/mật khẩu P0 và local URL 3003; đường tích hợp Android/Origin/cookie còn chờ Q-ENV-01.
- Người dùng trả lời chính sách persist roster/draft chưa chốt; Q-DATA-01 giữ nguyên chờ.
- Chỉ bộ tài liệu nháp đã được tạo; các phase vẫn Todo.

## Kiểm tra tài liệu khởi tạo

Ngày 30/10/2026, Codex kiểm tra 26 file Markdown: liên kết file tương đối, mã BR/UC/câu hỏi và code fence; có 69 BR, 22 UC, 13 câu hỏi mở. Định dạng bằng Prettier. Đây là kiểm tra tài liệu, không phải lint/typecheck/Jest của ứng dụng và không làm tăng tiến độ UI/API.

Thử GET Swagger local `http://localhost:3003/docs-json` bị connection refused; chưa xác minh OpenAPI runtime hoặc cookie/Origin trên thiết bị. Không tự chạy hoặc sửa backend.
