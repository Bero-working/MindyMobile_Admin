# P5 — Manager phân công/xử lý lịch → xác nhận CASH

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Đã triển khai UI/API 5/5; chờ nghiệm thu. E2E bỏ qua theo chỉ thị người dùng (ADR-030); slice nghiệm thu hoàn chỉnh 0/5.** Cập nhật 02/11/2026 (Asia/Bangkok).
[Phạm vi/kế hoạch](../../implementation-plan.md#p5-manager-operations-cash). Ưu tiên P0.
Hiện hành: design Claude cấp phase + 5 slice đã có; Q-P5-01–05 được người dùng chốt. ADR-027 cho phép làm UI/API cùng lượt, không chờ UI accept riêng. ADR-030 miễn E2E cho lượt hoàn thiện này. Phạm vi dạy thay theo buổi/đơn tiền mặt, không đổi mentor chính/meeting URL hoặc xuất hóa đơn/biên nhận riêng. Q-PLAT-01 và nghiệm thu người dùng vẫn ghi riêng.
ADR liên quan: ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Đã có design và source UI/API; chưa ghi nghiệm thu hoặc Done. [Tích hợp và kiểm chứng](../../implement/phase-005-manager-operations-cash/api-integration.md) · [Giới hạn E2E](../../implement/phase-005-manager-operations-cash/e2e.md).

## Hồ sơ triển khai

**Bàn giao hiện hành 02/11/2026:** 5 slice UI/API đã triển khai trong module operations, nối Home/context Manager và bỏ SessionEdit mock cũ. Kiểm backend thật trên fixture P5 riêng và HTTP simulation pass; Android Debug build/cài APK pass. Người dùng bỏ qua E2E sau lỗi khởi tạo instrumentation; không tính native pass. Các ghi nhận chờ design/code bên dưới là lịch sử trước lượt này.

**Hiện hành:** Đã nhận “Triển khai phase 5” ngày 02/11/2026 và trả lời “Giữ phạm vi này”. Đã tách [5 checklist slice](../../implement/phase-005-manager-operations-cash/README.md#kế-hoạch-theo-slice) và [checklist bàn giao design](../../implement/phase-005-manager-operations-cash/design-handoff.md). Chỉ thị implement đã đáp ứng, không cần xin lại. Chưa có design nguồn/test case nên chưa viết UI/contract/API. Các ghi nhận chờ duyệt/chưa tách trong đoạn lập ban đầu bên dưới là lịch sử.

Đã tạo [hồ sơ P5](../../implement/phase-005-manager-operations-cash/README.md) và [kế hoạch tổng](../../implement/phase-005-manager-operations-cash/phase-005-manager-operations-cash.md) ngày 02/11/2026 theo yêu cầu “Lập implement phase 5”. Chờ người dùng đọc duyệt trước tách kế hoạch slice (ADR-017); đủ design/quyết định và có chỉ thị implement mới viết UI mock (ADR-016). Chưa tạo code/contract hoặc command E2E. Tiến độ và nhật ký phase tiếp tục cập nhật trong file này.

## Các mốc

| Mốc                        | Trạng thái | Ngày thực hiện | Ai làm/duyệt           | Test / lint / typecheck                    | Commit/PR | Ghi chú / BR-ADR                                                |
| -------------------------- | ---------- | -------------- | ---------------------- | ------------------------------------------ | --------- | --------------------------------------------------------------- |
| Kế hoạch tổng | Đã cho triển khai | 02/11/2026 | Người dùng / Codex | Theo chỉ thị implement | — | Đã tách 5 slice |
| Design toàn phase (Claude) | Đã có | 02/11/2026 | Claude | 5 slice + test case | — | Đã chốt đề xuất design |
| UI toàn phase | Đã viết 5/5 | 02/11/2026 | Codex | UI tests + model/API, xem hồ sơ | — | Chưa visual QA native đầy đủ |
| Người dùng duyệt UI | Miễn cổng riêng | 02/11/2026 | Người dùng | Không coi là UI accepted | — | ADR-027 |
| API toàn phase | Đã nối 5/5 | 02/11/2026 | Codex | Live read/mutation + HTTP simulation pass | — | Contract/snapshot có manifest |
| Cleanup + lint + test | Pass | 02/11/2026 | Codex | ESLint 0/0, format/tsc, 354 tests / 34 suites | — | Log source cuối, E2E miễn riêng |
| E2E Maestro toàn phase | Bỏ qua theo yêu cầu | 02/11/2026 | Người dùng | Trước đó lỗi khởi tạo instrumentation | — | ADR-030, không ghi pass |
| Nghiệm thu phase           | Todo       | —              | Người dùng             | Chưa kiểm thử thiết bị/nghiệm thu          | —         | Chưa được đánh dấu Done                                         |

## Slice

| Slice                         | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                              |
| ----------------------------- | ---- | ---- | ---------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| P5-S1 — substitute-assignment | Đã viết | Đã nối | Đã có | Miễn cổng riêng | Candidates theo lịch/nghỉ; bảo toàn teachingMentorId; đổi mentor chính chưa mặc định P0              |
| P5-S2 — reschedule-session    | Đã viết | Đã nối | Đã có | Miễn cổng riêng | Đúng SCHEDULED tương lai, version/key/reason, conflict và refetch lịch hai vai trò                   |
| P5-S3 — replacement-session   | Đã viết | Đã nối | Đã có | Miễn cổng riêng | Hủy có lịch sử; replacement từ leaf; không copy attendance; phạm vi tác động được xác nhận           |
| P5-S4 — cash-orders           | Đã viết | Đã nối | Đã có | Miễn cổng riêng | Nguồn phân trang CASH có cả trạng thái đóng; không giả chỉ pending hoặc lọc server chưa có           |
| P5-S5 — cash-order-detail     | Đã viết | Đã nối | Đã có | Miễn cổng riêng | Đúng người/đơn/lớp/tổng/hạn; retry không thu đôi; sai số tiền/hold/hết hạn hiển thị đúng; chỉ online |

## Nhật ký thực tế

| Ngày       | Người              | Sự kiện                              | Bằng chứng / giới hạn                                                                                                                | BR/ADR thay đổi                                        |
| ---------- | ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 30/10/2026 | Codex              | Khởi tạo kế hoạch và khung tiến độ   | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git                                              | Khởi tạo, chưa có thay đổi luật đã duyệt               |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan                  | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai              | ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 → Accepted |
| 30/10/2026 | Codex              | Thực hiện ADR-011                    | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API                 | ADR-011 Accepted                                       |
| 30/10/2026 | Codex              | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ                             | ADR-011 bổ sung quy ước tên                            |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro             | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt                               |

## Ghi nhận khi thực hiện

02/11/2026 — Nhận chỉ thị triển khai P5; người dùng chốt “Giữ phạm vi này”. Chuẩn bị 5 checklist slice từ baseline/controller/DTO và đầu vào design còn thiếu; không tự tạo design Claude. Chỉ thay tài liệu, chưa code hoặc chạy test/API/mutation; UI/API/slice giữ 0/5. Q-CLASS-02/Q-PAY-01 đóng trong phạm vi P5, không thay ADR Accepted.

02/11/2026 — Codex lập kế hoạch tổng theo yêu cầu “Lập implement phase 5”, đối chiếu baseline/BR/ADR và source controller/DTO/service backend. Chưa kiểm runtime/backend hoặc mutation; Q-CLASS-02, Q-PAY-01, design Claude và phụ thuộc P4 còn chờ. Chỉ bổ sung tài liệu/liên kết; không tăng UI/API/slice hoàn chỉnh, không đổi luật đã duyệt. Kiểm chứng tài liệu tại bàn giao, không phải lint/typecheck/Jest/E2E ứng dụng.

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.

## Hoàn thiện P5 — 02/11/2026

Người dùng yêu cầu API luôn/bỏ UI accept và sau đó bỏ qua E2E. Đã hoàn thiện UI/API 5 slice, contract, snapshot 14 source file với SHA-256, adapter/query/mutation và runner tổng để dùng lại sau này. Kiểm đọc/ghi backend thật trên dữ liệu thử P5 riêng cùng HTTP simulation pass; Android Debug x86_64/cài APK pass. Chất lượng và số test toàn repo cuối tại hồ sơ tích hợp. Không sửa backend, không ghi nghiệm thu hoặc E2E pass.
