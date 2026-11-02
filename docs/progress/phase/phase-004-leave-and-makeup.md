**Hiện hành 02/11/2026 — đã nối API thật S1–S7 theo yêu cầu “Triển khai api cho phase 4 đi”.** API 7/7 đã tích hợp; chưa nghiệm thu phase hoặc xác nhận native E2E. Live lifecycle và placement/replay/cancel/reassign trên fixture riêng pass; HTTP simulation pass mất phản hồi sau commit. [Hồ sơ tích hợp](../../implement/phase-004-leave-and-makeup/api-integration.md). Các trạng thái 0/7/chờ duyệt API phía dưới là lịch sử trước lượt này.

# P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật

**Sửa điều hướng — 02/11/2026:** Người dùng báo bấm “Đơn xin nghỉ” không chuyển màn ở phiên dùng API thật. Nguyên nhân: tile theo source đã bật nhưng 7 route nghỉ/bù vẫn bị điều kiện leaveMock chặn. Đã bỏ điều kiện mock khỏi đăng ký route, giữ đúng phân quyền Mentor/Manager và source HTTP hiện hành. Hai test hồi quy live-mode Mentor/Manager tái hiện fail trước sửa, sau sửa pass; toàn bộ leave-ui 16/16, ESLint 0 lỗi/cảnh báo và tsc --noEmit pass. Không sửa API/nghiệp vụ hoặc tăng trạng thái nghiệm thu.

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Đã lập kế hoạch tổng, chờ duyệt — UI 0/7, API 0/7, slice hoàn chỉnh 0/7 (0%).**
[Phạm vi/kế hoạch](../../implementation-plan.md#p4-leave-and-makeup). Ưu tiên P0.
Cổng còn chờ: Q-LEAVE-01, Q-MAKEUP-01; hai slice placement chưa chốt P0.
ADR liên quan: ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Chưa có design, chưa duyệt UI, chưa tích hợp/nghiệm thu.

## Hồ sơ triển khai

Ngày 02/11/2026 đã lập [kế hoạch tổng P4](../../implement/phase-004-leave-and-makeup/phase-004-leave-and-makeup.md) và [README hồ sơ](../../implement/phase-004-leave-and-makeup/README.md) theo yêu cầu “Lập implement phase 4”. Chờ duyệt tổng trước tách tài liệu slice (ADR-017); code vẫn cần chỉ thị implement, design và câu hỏi đầu vào được giải quyết (ADR-016/009). Chưa duyệt UI/API hoặc nghiệm thu. P2 đã nối API nhưng còn chờ E2E/nghiệm thu; kiểm lại phụ thuộc khi triển khai P4. Tiến độ và nhật ký phase tiếp tục cập nhật trong file này.

## Các mốc

| Mốc                        | Trạng thái | Ngày thực hiện | Ai làm/duyệt | Test / lint / typecheck               | Commit/PR | Ghi chú / BR-ADR                         |
| -------------------------- | ---------- | -------------- | ------------ | ------------------------------------- | --------- | ---------------------------------------- |
| Kế hoạch tổng | Chờ duyệt | 02/11/2026 | Codex / Người dùng | Chỉ kiểm tài liệu; không chạy app/API | — | ADR-016/017/025/026; chưa tách slice |
| Design toàn phase (Claude) | Todo       | —              | Claude       | Chưa có test case/design để đối chiếu | —         | Chưa có file; Codex không viết/sửa       |
| UI toàn phase (TDD)        | Todo       | —              | Codex        | Chưa chạy                             | —         | Mock rõ ràng, tất cả trạng thái/quyền    |
| Người dùng duyệt UI        | Todo       | —              | Người dùng   | Chưa có kết quả để duyệt              | —         | Cổng bắt buộc trước API                  |
| API toàn phase (TDD)       | Todo       | —              | Codex        | Chưa chạy                             | —         | Chưa có contract từng UI/legacy snapshot |
| Cleanup + lint + test      | Todo       | —              | Codex        | Chưa chạy                             | —         | ESLint 0 error/0 warning, tsc, Jest      |
| E2E Maestro toàn phase | Todo | — | Codex | Chưa chạy | — | Bắt buộc pass trước nghiệm thu; gồm hồi quy liên quan (ADR-009) |
| Nghiệm thu phase           | Todo       | —              | Người dùng   | Chưa kiểm thử thiết bị/nghiệm thu     | —         | Chưa được đánh dấu Done                  |

## Slice

| Slice                           | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                                   |
| ------------------------------- | ---- | ---- | ---------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| P4-S1 — mentor-leave-list       | Todo | Todo | Chờ Claude | Chưa          | Chỉ own requests; EXPIRED không được hiện là PENDING có thể duyệt                                         |
| P4-S2 — leave-plan-editor       | Todo | Todo | Chờ Claude | Chưa          | Ngày lịch/ca/notice đúng; preview cũ bị kiểm lại; đủ sourceVersions/mapping                               |
| P4-S3 — mentor-leave-detail     | Todo | Todo | Chờ Claude | Chưa          | Withdraw có lý do/version/key; đổi trạng thái đồng thời không bị ghi đè                                   |
| P4-S4 — leave-review-queue      | Todo | Todo | Chờ Claude | Chưa          | Lọc/phân trang đúng trạng thái; không hứa SLA hoặc push P0                                                |
| P4-S5 — leave-review-detail     | Todo | Todo | Chờ Claude | Chưa          | Reason/acknowledgment/version; approve source/replacement và lịch cập nhật; conflict không báo thành công |
| P4-S6 — makeup-conflicts        | Todo | Todo | Chờ Claude | Chưa          | Phân biệt replacement/placement; không tự coi conflict là ABSENT; giữ NEEDS_REASSIGNMENT                  |
| P4-S7 — makeup-placement-editor | Todo | Todo | Chờ Claude | Chưa          | Candidate đúng chương/còn chỗ; xác nhận nội dung/lý do/version/key; guest credit một lần                  |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai | ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 → Accepted |
| 30/10/2026 | Codex | Thực hiện ADR-011 | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API | ADR-011 Accepted |
| 30/10/2026 | Codex | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ | ADR-011 bổ sung quy ước tên |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt |

## Ghi nhận khi thực hiện

**02/11/2026 — nhận chỉ thị triển khai:** Người dùng yêu cầu “Triển khai phase 4”. Đã kiểm tra hồ sơ và design: chưa có folder design Claude P4, Q-LEAVE-01/Q-MAKEUP-01 và policy dữ liệu vẫn chưa chốt. Đã hỏi đầu vào còn thiếu; chỉ thị implement đã có, không yêu cầu lại quyền viết code. Chờ đầu vào theo ADR-009 trước UI TDD; chưa viết code/contract/API hoặc chạy test ứng dụng. UI/API/slice hoàn chỉnh giữ 0/7; chưa thay scope S6/S7 hoặc suy chỉ thị triển khai thành quyết định các câu hỏi nghiệp vụ.

**02/11/2026 — Codex:** Lập kế hoạch tổng 7 slice P4, mapping controller/DTO backend hiện có, cổng Q-LEAVE-01/Q-MAKEUP-01 và policy dữ liệu P4, thứ tự UI mock → duyệt UI → API → E2E/nghiệm thu. S6/S7 giữ đề xuất chờ chốt P0. Chỉ thay tài liệu, không sửa design/code/backend hoặc chạy mutation; UI/API và số slice hoàn chỉnh giữ 0/7. Không thay BR/ADR Accepted.

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
