# P6 — Mentor tạo quiz → công bố → theo dõi trạng thái

**Hiện hành API:** Đã tích hợp API thật 3/3 theo “Tích hợp luôn api”; [hồ sơ kiểm chứng](../../implement/phase-006-mentor-quiz/api-integration.md), ADR-032. API thật và HTTP simulation pass, không chạy E2E/Maestro. Chưa nghiệm thu; các ghi nhận chờ duyệt UI/API phía dưới là lịch sử.

**Hiện hành:** Đã nhận chỉ thị triển khai và chốt gói design; xem [review UI](../../implement/phase-006-mentor-quiz/ui-review.md). Design Claude đã có đủ 3 slice. Chưa duyệt UI hoặc nối API; E2E đã dừng theo yêu cầu, áp dụng [ADR-031](../../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md). Các dòng chờ chỉ thị/design trước đây là lịch sử.

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**Đã có mã UI/API 3/3; slice nghiệm thu 0/3 (0%).**
[Phạm vi/kế hoạch](../../implementation-plan.md#p6-mentor-quiz). Ưu tiên P1.
Cổng còn chờ: người dùng duyệt UI trước API; Q-P1-01 phần quiz đã chốt theo ADR-031, P7/P8 giữ riêng; chưa cam kết results queue hay ZIP grading.
ADR liên quan: ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Đã có design Claude toàn phase và mã UI mock để review; chưa duyệt UI, chưa tích hợp/nghiệm thu.

**Lịch sử trước triển khai — 02/11/2026:** Người dùng đã duyệt [kế hoạch tổng Phase 6](../../implement/phase-006-mentor-quiz/phase-006-mentor-quiz.md) qua phản hồi “Duyệt”; đã tách [3 kế hoạch slice](../../implement/phase-006-mentor-quiz/README.md#kế-hoạch-theo-slice), không sử dụng SpecKit. Chưa có chỉ thị implement hoặc code; giữ UI/API 0/3. Q-P1-01 cho quiz, policy và design/test case Claude còn chờ. Khảo sát backend chỉ là căn cứ tài liệu, chưa kiểm API/runtime.

## Hồ sơ triển khai

Mục triển khai: [phase-006-mentor-quiz](../../implement/README.md#phase-006-mentor-quiz). Đã tạo [hồ sơ phase](../../implement/phase-006-mentor-quiz/README.md) và [kế hoạch tổng](../../implement/phase-006-mentor-quiz/phase-006-mentor-quiz.md) ngày 02/11/2026; bằng chứng triển khai sẽ đặt cùng folder khi có. Tiến độ và nhật ký phase tiếp tục cập nhật trong file này.

## Các mốc

| Mốc                        | Trạng thái | Ngày thực hiện | Ai làm/duyệt | Test / lint / typecheck               | Commit/PR | Ghi chú / BR-ADR                         |
| -------------------------- | ---------- | -------------- | ------------ | ------------------------------------- | --------- | ---------------------------------------- |
| Duyệt kế hoạch tổng và tách slice | Đã duyệt / đã tách | 02/11/2026 | Người dùng / Codex | Kiểm tài liệu, không chạy test ứng dụng | — | Phản hồi “Duyệt”; chưa mở cổng code/UI/API |
| Design toàn phase (Claude) | Đã có | 02/11/2026 | Claude | Đã đọc design/test case 3 slice | — | Codex chỉ đọc, không sửa nguồn |
| UI toàn phase (TDD) | Mã mock để review | 02/11/2026 | Codex | P6 model/UI/mock + review host: 20 tests pass; lint/typecheck pass | — | Chưa duyệt UI/native toàn bộ; xem ui-review.md |
| Người dùng duyệt UI        | Todo       | —              | Người dùng   | Chờ người dùng review UI mock              | —         | Cổng bắt buộc trước API                  |
| API toàn phase (TDD) | Đã tích hợp 3/3 | 02/11/2026 | Codex | 35 tests P6 pass; API thật 11 nhóm và HTTP simulation pass | — | Có contract/snapshot; E2E miễn, chưa nghiệm thu |
| Cleanup + lint + test | Pass cho UI/API | 02/11/2026 | Codex | Typecheck/lint/format pass; toàn repo 39 suites / 391 tests pass, thêm 2 ca mất quyền và rerun P6 35/35 pass | — | API thật/HTTP pass; E2E miễn, xem api-integration.md |
| E2E Maestro toàn phase | Miễn lượt này / đã dừng | 02/11/2026 | Người dùng / Codex | Lần đầu fail, rerun interrupted; không pass | — | “Không cần test e2e”, ADR-031; không chạy thêm |
| Nghiệm thu phase           | Todo       | —              | Người dùng   | Chưa kiểm thử thiết bị/nghiệm thu     | —         | Chưa được đánh dấu Done                  |

## Slice

| Slice               | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                         |
| ------------------- | ---- | ---- | ---------- | ------------- | ------------------------------------------------------------------------------- |
| P6-S1 — quiz-list   | Mã UI | Đã nối | Đã có | Chưa          | Assignment thuộc session; scope dạy thay đúng; không hiện chức năng ZIP publish |
| P6-S2 — quiz-editor | Mã UI | Đã nối | Đã có | Chưa          | ABCD một đáp án, số câu hợp lệ, không sửa cấu hình đóng băng                    |
| P6-S3 — quiz-detail | Mã UI | Đã nối | Đã có | Chưa          | Đúng trạng thái/quyền; không tự dựng điểm/tổng hợp chưa có endpoint             |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai | ADR-004, ADR-005, ADR-007, ADR-008, ADR-009 → Accepted |
| 30/10/2026 | Codex | Thực hiện ADR-011 | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API | ADR-011 Accepted |
| 30/10/2026 | Codex | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ | ADR-011 bổ sung quy ước tên |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt |
| 02/11/2026 | Codex | Lập kế hoạch tổng P6 theo yêu cầu người dùng, không dùng SpecKit | Khảo sát controller/DTO/service backend; tạo README/kế hoạch tổng, cập nhật liên kết; chưa tách slice, code hoặc chạy test ứng dụng; UI/API 0/3 | Không đổi BR/ADR; Q-P1-01 cho quiz và các cổng duyệt còn chờ |
| 02/11/2026 | Người dùng / Codex | Duyệt kế hoạch tổng và tách 3 kế hoạch slice | Phản hồi “Duyệt”; tạo S1 quiz-list, S2 quiz-editor, S3 quiz-detail và đồng bộ trạng thái; chưa code/test runtime, UI/API 0/3 | Áp dụng ADR-017; không đổi BR/ADR, giữ câu hỏi/policy và cổng còn mở |

| 02/11/2026 | Người dùng / Codex | Triển khai UI mock P6 và chốt gói design | 3 màn development, model/UI/mock test, Android debug build pass; chưa API/UI accept; E2E lần đầu fail, lần hai dừng theo chỉ thị, không chạy thêm | ADR-031 Accepted, chốt Q-P1-01 phần quiz; P7/P8 giữ riêng |

| 02/11/2026 | Người dùng / Codex | Tích hợp API S1–S3 theo “Tích hợp luôn api” | Live service/schema/hooks, API thật fixture và HTTP simulation pass; tiếp tục không E2E theo lời nhắc lại | ADR-032 Accepted; không tăng nghiệm thu/Done |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.
