# P5 — Manager phân công/xử lý lịch → xác nhận CASH

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Todo — UI 0/5, API 0/5, slice hoàn chỉnh 0/5 (0%).**
[Phạm vi/kế hoạch](../../implementation-plan.md#p5-manager-operations-cash). Ưu tiên P0.
Cổng còn chờ: Q-CLASS-02, Q-PAY-01; không thêm tạo enrollment/invoice.
ADR liên quan: ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Chưa có design, chưa duyệt UI, chưa tích hợp/nghiệm thu.

## Hồ sơ triển khai

Mục triển khai: [phase-005-manager-operations-cash](../../implement/README.md#phase-005-manager-operations-cash). Khi bắt đầu, tạo folder `docs/implement/phase-005-manager-operations-cash/` theo danh mục chung; hồ sơ và bằng chứng triển khai đặt tại đó. Tiến độ và nhật ký phase tiếp tục cập nhật trong file này.

## Các mốc

| Mốc                        | Trạng thái | Ngày thực hiện | Ai làm/duyệt | Test / lint / typecheck               | Commit/PR | Ghi chú / BR-ADR                         |
| -------------------------- | ---------- | -------------- | ------------ | ------------------------------------- | --------- | ---------------------------------------- |
| Design toàn phase (Claude) | Todo       | —              | Claude       | Chưa có test case/design để đối chiếu | —         | Chưa có file; Codex không viết/sửa       |
| UI toàn phase (TDD)        | Todo       | —              | Codex        | Chưa chạy                             | —         | Mock rõ ràng, tất cả trạng thái/quyền    |
| Người dùng duyệt UI        | Todo       | —              | Người dùng   | Chưa có kết quả để duyệt              | —         | Cổng bắt buộc trước API                  |
| API toàn phase (TDD)       | Todo       | —              | Codex        | Chưa chạy                             | —         | Chưa có contract từng UI/legacy snapshot |
| Cleanup + lint + test      | Todo       | —              | Codex        | Chưa chạy                             | —         | ESLint 0 error/0 warning, tsc, Jest      |
| E2E Maestro toàn phase | Todo | — | Codex | Chưa chạy | — | Bắt buộc pass trước nghiệm thu; gồm hồi quy liên quan (ADR-009) |
| Nghiệm thu phase           | Todo       | —              | Người dùng   | Chưa kiểm thử thiết bị/nghiệm thu     | —         | Chưa được đánh dấu Done                  |

## Slice

| Slice                         | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                              |
| ----------------------------- | ---- | ---- | ---------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| P5-S1 — substitute-assignment | Todo | Todo | Chờ Claude | Chưa          | Candidates theo lịch/nghỉ; bảo toàn teachingMentorId; đổi mentor chính chưa mặc định P0              |
| P5-S2 — reschedule-session    | Todo | Todo | Chờ Claude | Chưa          | Đúng SCHEDULED tương lai, version/key/reason, conflict và refetch lịch hai vai trò                   |
| P5-S3 — replacement-session   | Todo | Todo | Chờ Claude | Chưa          | Hủy có lịch sử; replacement từ leaf; không copy attendance; phạm vi tác động được xác nhận           |
| P5-S4 — cash-orders           | Todo | Todo | Chờ Claude | Chưa          | Nguồn phân trang CASH có cả trạng thái đóng; không giả chỉ pending hoặc lọc server chưa có           |
| P5-S5 — cash-order-detail     | Todo | Todo | Chờ Claude | Chưa          | Đúng người/đơn/lớp/tổng/hạn; retry không thu đôi; sai số tiền/hold/hết hạn hiển thị đúng; chỉ online |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai | ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 → Accepted |
| 30/10/2026 | Codex | Thực hiện ADR-011 | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API | ADR-011 Accepted |
| 30/10/2026 | Codex | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ | ADR-011 bổ sung quy ước tên |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
