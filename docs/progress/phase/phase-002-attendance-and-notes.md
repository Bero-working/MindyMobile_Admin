# P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**UI đã được người dùng duyệt 7/7 ngày 02/11/2026; API đã nối 7/7, slice hoàn chỉnh 0/7 (0%).**
[Phạm vi/kế hoạch](../../implementation-plan.md#p2-attendance-and-notes). Ưu tiên P0.
Cổng UI đã được người dùng duyệt ngày 02/11/2026. E2E Android đã pass; cổng còn chờ: nghiệm thu và Q-PLAT-01. [API và giới hạn](../../implement/phase-002-attendance-and-notes/api-integration.md). Q-DATA-01/Q-OFF-01/Q-ATT-01 đã chốt cho P2 tại design chung mục 2.
ADR liên quan: ADR-004, ADR-006, ADR-007, ADR-008, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Đã có design Claude và mã UI mock cả 7 slice; UI đã được duyệt ngày 02/11/2026, đã nối API; chưa nghiệm thu. [Cách review](../../implement/phase-002-attendance-and-notes/ui-review.md) · [Kiểm chứng](../../implement/phase-002-attendance-and-notes/ui-verification.md).

## Hồ sơ triển khai

Ngày 01/11/2026 đã tách đủ 7 kế hoạch; người dùng tiếp tục yêu cầu “Triển khai đi”. Codex triển khai UI mock, nối Home/context P1, nguồn fake có state, draft/intent/conflict, note và luồng Manager. Kết quả test/Android/native và giới hạn tại [hồ sơ UI](../../implement/phase-002-attendance-and-notes/ui-verification.md). Không có HTTP/contract/mutation backend P2; ADR-009/025/026 và Q-PLAT-01 giữ nguyên.

## Các mốc

| Mốc                        | Trạng thái | Ngày thực hiện | Ai làm/duyệt | Test / lint / typecheck               | Commit/PR | Ghi chú / BR-ADR                         |
| -------------------------- | ---------- | -------------- | ------------ | ------------------------------------- | --------- | ---------------------------------------- |
| Kế hoạch tổng / tách slice | Đã cho phép tách | 01/11/2026 | Người dùng / Codex | Kiểm tài liệu | — | Đã tách đủ 7 slice theo ADR-017 |
| Design toàn phase (Claude) | Đã có | 01/11/2026 | Claude | Design/test case đã có | — | Chờ review cùng UI |
| UI toàn phase (TDD) | Có mã 7/7, đã duyệt UI | 01/11/2026 | Codex | 15 UI tests P2; toàn dự án 225 tests pass | — | Mock, chưa phải UI được duyệt |
| Người dùng duyệt UI | Đã duyệt 7/7 | 02/11/2026 | Người dùng | Theo chỉ thị “Duyệt UI phase 2”; bằng chứng UI tại hồ sơ verification | — | Đã mở cổng contract/API theo ADR-009 |
| API toàn phase (TDD) | Đã nối 7/7 | 02/11/2026 | Codex | TDD adapter, live read/mutation và simulation pass; xem hồ sơ | — | Contract 7 slice và snapshot SHA-256 |
| Cleanup + lint + test | Pass | 02/11/2026 | Codex | Lint/format/tsc; 24 suite/272 tests pass | — | Source cuối, gồm guard account/Unicode và ẩn debug overlay |
| E2E Maestro toàn phase | Pass Android | 02/11/2026 | Codex | API setup/mutations → Maestro → backend postconditions pass | — | [Report và giới hạn](../../implement/phase-002-attendance-and-notes/e2e.md); Q-PLAT-01 còn mở |
| Nghiệm thu phase           | Todo       | —              | Người dùng   | Chưa kiểm thử thiết bị/nghiệm thu     | —         | Chưa được đánh dấu Done                  |

## Slice

| Slice                         | UI   | API  | Design     | UI được duyệt | Ghi chú                                                                                                     |
| ----------------------------- | ---- | ---- | ---------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| P2-S1 — attendance-editor     | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Bulk mọi trang/guest; finalize cảnh báo UNMARKED; conflict không ghi đè; offline hàng đã tải, chỉ RAM, tự bấm Lưu        |
| P2-S2 — teaching-note-editor  | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Note version riêng; hạn sửa, nội dung/nextSteps và lỗi conflict đúng; không hứa offline note                |
| P2-S3 — incomplete-sessions   | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Mặc định toàn backlog unresolved overdue theo API; không giới hạn tuần ngầm; không coi chưa start là ABSENT |
| P2-S4 — manager-attendance    | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Hiện permission/totals server, regular/guest; phân biệt correction và recovery                              |
| P2-S5 — attendance-correction | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Reason bắt buộc, record hiện hữu, conflict và audit; không giả Mentor hay đổi hạn                           |
| P2-S6 — attendance-recovery   | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Insert-only, bằng chứng/actual times hợp lệ, body limit; không dựng snapshot lịch sử                        |
| P2-S7 — attendance-audits     | API thật, UI đã duyệt | Đã nối | Đã có | 02/11/2026          | Phân trang/filter trong scope; chỉ trình bày audit thật, không tự dựng before/after                         |

## Nhật ký thực tế

| Ngày       | Người | Sự kiện                            | Bằng chứng / giới hạn                                                                   | BR/ADR thay đổi                          |
| ---------- | ----- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| 30/10/2026 | Codex | Khởi tạo kế hoạch và khung tiến độ | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git | Khởi tạo, chưa có thay đổi luật đã duyệt |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai | ADR-004, ADR-006, ADR-007, ADR-008, ADR-009 → Accepted |
| 30/10/2026 | Codex | Thực hiện ADR-011 | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API | ADR-011 Accepted |
| 30/10/2026 | Codex | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ | ADR-011 bổ sung quy ước tên |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt |

## Ghi nhận khi thực hiện

01/11/2026 — Codex lập kế hoạch tổng P2 theo yêu cầu “Lập implement phase 2 cho tôi”: phạm vi 7 slice, cổng đầu vào, UI mock → duyệt UI → API, version/key/conflict, tải dữ liệu, offline còn chờ policy, kiểm thử và E2E tổng dự kiến `npm run test:e2e:phase-2` (chưa tạo command). Chỉ đọc source backend để đối chiếu, không chạy mutation hoặc sửa backend. Chưa duyệt tổng/UI/nghiệm thu; không tăng tiến độ hoặc thay luật nghiệp vụ.

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.

01/11/2026 — Theo chỉ thị “đã có design chia slice đi”, đã tách đủ 7 kế hoạch, liên kết design/test case Claude và đồng bộ kế hoạch/index. Ghi nhận Q-DATA/Q-OFF/Q-ATT/Q-P2-01/Q-P2-02 đã chốt tại design chung; Q-PLAT-01 còn mở. Manager finalize thuộc S5 với entry tại S4; Home total thuộc S3. Lượt tách chỉ kiểm tài liệu, UI/API chưa tăng.

01/11/2026 — Theo chỉ thị tiếp theo “Triển khai đi”, triển khai mã UI mock đủ 7 slice. Thêm review opt-in development và cập nhật Home/context/route theo role; cache/draft/intent chỉ RAM. `npm run check` pass 20 suite/225 test; Android build thành công; Maestro UI mock toàn flow pass ở lượt 2026-11-01_201508. Xem verification/e2e-ui cho ảnh, lịch sử fail và giới hạn. UI được duyệt 0/7, API 0/7, slice hoàn chỉnh 0/7; chưa nghiệm thu hoặc đổi BR/ADR/design nguồn.

01/11/2026 — Theo yêu cầu và xác nhận “Thêm 2 tiện ích ở Home”, thêm Quản lý điểm danh (Sửa/Lịch sử) và Chốt buổi thay Mentor; chuyển finalize sang màn riêng. Sau đó đưa Sửa/Lịch sử lên header tabs, đặt audit empty trong card, bỏ cụm summary/hướng dẫn/bulk/pending khỏi correction. Filter backlog cuộn ngang. Ghi đè UI baseline tại [hồ sơ cập nhật](../../implement/phase-002-attendance-and-notes/ui-utilities-update.md); giữ 7 slice, UI chưa duyệt và API 0/7.

01/11/2026 — Theo ảnh mới và chỉ thị “Chỉ có 2 status là vắng và có mặt”, đổi correction sang hàng gọn với một chip đổi hai trạng thái và hai ô tổng cập nhật theo draft. Không hiển thị Chưa điểm danh ở màn này; dữ liệu mock cũ không bị tự động ghi lại. Cổng UI/API giữ nguyên.

01/11/2026 — Kiểm bản cập nhật cuối: `npm run check` pass 20 suite/227 test, ESLint/Prettier/TypeScript pass; Maestro tiện ích pass 20:44 và correction gọn pass 21:01 trên Android emulator. Ảnh correction đã xem và hồ sơ kết quả ở verification/e2e-ui. Chưa có commit/PR, UI được duyệt 0/7 và API 0/7.

02/11/2026 — Theo chỉ thị chọn lớp trước Sửa/Lịch sử, Home Quản lý điểm danh mở danh sách lớp, sau chọn mới mở hai tabs và tải buổi theo classId; Back về chọn lớp rồi Home. Mock lọc lớp trước phân trang. `npm run check` cuối pass 20 suite/228 test và lint/format/typecheck; Maestro class-picker-review pass tại 2026-11-02_095034, ảnh đã xem ở e2e-ui. UI được duyệt 0/7, API 0/7, chưa có commit/PR.

02/11/2026 — Người dùng làm rõ: chọn lớp phải mở thẳng hai tabs có nội dung Sửa/Lịch sử, bỏ filter status/danh sách buổi. Đã resolve buổi gần nhất của lớp và replace sang roster có tabs; chuyển tab giữ session và bảo vệ draft bằng navigation guard. Back về chọn lớp. Maestro lượt 2026-11-02_100129 pass trên Android, ảnh roster/audit đã xem; không tăng cổng UI/API hoặc nghiệm thu.

02/11/2026 — Người dùng xác nhận “Duyệt UI phase 2”. Ghi nhận duyệt UI toàn phase 7/7 trên baseline hiện hành, gồm chọn lớp rồi mở trực tiếp roster Sửa/Lịch sử. Cổng duyệt UI theo ADR-009 đã đáp ứng; bước tiếp theo là contract/API TDD. Chỉ cập nhật tài liệu trong lượt này, không chạy lại test hoặc thay bằng chứng kiểm chứng trước đó. API 0/7, slice hoàn chỉnh 0/7; E2E backend thật, Q-PLAT-01 và nghiệm thu phase còn chờ. Các ghi nhận chưa duyệt phía trên là lịch sử.

02/11/2026 — Theo chỉ thị “Tích hợp api đi”, đã nhập snapshot nguyên byte (54 source files có SHA-256), tạo contract 7 slice, nối HTTP/schema/auth/version/key/Origin, chạy kiểm API thật trên fixture mới qua Admin được cung cấp và Mentor/Manager. Live mutation, HTTP simulation và `npm run check` 22 suite/267 tests pass. Lượt Maestro đầu phát hiện route còn giới hạn mock; đã sửa theo role và thêm test live navigation, đang chạy lại native.

02/11/2026 — Người dùng ban đầu chọn giữ UI rồi chỉ thị mới “Hãy thêm thành tabs (lịch sử, khôi phục) vào chi tiết buổi học”: chỉ thị mới được áp dụng. Thêm hai tab Manager, lazy load cùng session, guard dirty khi đổi tab và sau recovery về Điểm danh. Không thêm các nút per-session cũ. UI/API vẫn mẫu số 7; E2E/nghiệm thu và Q-PLAT-01 theo hồ sơ riêng.

02/11/2026 — Native lượt tiếp theo đi qua Mentor và Manager correction/finalize/history; phát hiện form Recovery so giờ nhập mới với asOf cũ. Đã sửa server-relative clock, auto-scroll tab đang chọn, thêm regression test: `npm run check` pass 23 suites/268 tests và lint/format/TypeScript. Đang rerun command E2E tổng trên dataset mới; chưa lấy các lượt fail làm bằng chứng native pass.

02/11/2026 21:11 ICT — `npm run test:e2e:phase-2` pass toàn chuỗi trên Pixel_8 Android 17/API 37: fresh setup, live mutation, Mentor/Manager native, hai tab History/Recovery và backend postconditions (note, COMPLETED, correction/recovery audits). Run `6193a60a-3986-48b4-8afc-9d57ffd35b02`, ảnh note/recovery/audit đã xem, [hồ sơ](../../implement/phase-002-attendance-and-notes/e2e.md). Source cuối `npm run check` pass 24 suites/272 tests, lint/format/TypeScript. Phase chưa nghiệm thu, Q-PLAT-01 và giới hạn native riêng còn mở; không tự chuyển Done.
