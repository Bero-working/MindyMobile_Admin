# P1 — Mentor xem lịch/lớp → Manager theo dõi lớp

**Quy tắc command E2E — 01/11/2026:** [ADR-026](../../adr/ADR-026-single-e2e-command-per-phase.md) Accepted: mỗi phase chỉ có `npm run test:e2e:phase-<số>`. P1 tự kiểm API/tạo dataset và chạy Maestro qua `npm run test:e2e:phase-1`; các command API/UI riêng trong nhật ký cũ là lịch sử.

Ngày 01/11/2026 (Asia/Bangkok), người dùng “duyệt adr 23 24”: [ADR-023](../../adr/ADR-023-button-origin-navigation.md) và [ADR-024](../../adr/ADR-024-demand-driven-status-and-schedule-loading.md) đã Accepted và đóng băng theo ADR-012. P1 áp dụng điều hướng trực tiếp không animation/gesture chuyển màn và tải API theo status/ngày/tab; ADR-025 tiếp tục ưu tiên trong phạm vi xung đột. Lượt duyệt chỉ đồng bộ tài liệu, không thay runtime hoặc bổ sung bằng chứng test/E2E.

**Done — người dùng duyệt nghiệm thu ngày 01/11/2026 (Asia/Bangkok)** qua yêu cầu “Tôi duyệt nghiệm thu và đã sửa nhiều chỗ. Hãy kiểm tra, và đồng bộ lại, sau đó dọn dẹp”. UI **7/7**, API **7/7**, slice hoàn chỉnh **7/7 (100%)**. Home là phần khung của P1, không tăng mẫu số slice.

[Hồ sơ rà soát và dọn dẹp](../../implement/phase-001-teaching-workspace/review-cleanup.md) ghi kết quả kiểm tra source hiện tại và giới hạn kiểm chứng. [Kế hoạch](../../implement/phase-001-teaching-workspace/phase-001-teaching-workspace.md) · [API](../../implement/phase-001-teaching-workspace/api-integration.md) · [E2E](../../implement/phase-001-teaching-workspace/e2e.md).

## Các mốc hiện hành

| Mốc                              | Trạng thái         | Ngày / căn cứ                                  |
| -------------------------------- | ------------------ | ---------------------------------------------- |
| Kế hoạch tổng, 7 slice và design | Hoàn tất           | 31/10; design Manager bổ sung 01/11            |
| UI toàn phase và Home            | Hoàn tất, đã duyệt | Người dùng nghiệm thu 01/11                    |
| API toàn phase                   | Tích hợp 7/7       | 31/10; kiểm tra lại backend thật 01/11         |
| Cleanup, lint, typecheck và test | Xem hồ sơ rà soát  | Kiểm tra lại trên source hiện tại 01/11        |
| Android và Maestro               | Xem hồ sơ rà soát  | E2E API 31/10 pass; kết quả chạy lại ghi riêng |
| Nghiệm thu phase                 | **Done**           | Người dùng 01/11; không suy từ test hoặc build |

## Slice đã nghiệm thu

| Slice                        | UI       | API      | Hoàn chỉnh |
| ---------------------------- | -------- | -------- | ---------- |
| P1-S1 — mentor-schedule      | Đã duyệt | Tích hợp | Done       |
| P1-S2 — mentor-classes       | Đã duyệt | Tích hợp | Done       |
| P1-S3 — mentor-class-detail  | Đã duyệt | Tích hợp | Done       |
| P1-S4 — session-context      | Đã duyệt | Tích hợp | Done       |
| P1-S5 — mentor-students      | Đã duyệt | Tích hợp | Done       |
| P1-S6 — manager-classes      | Đã duyệt | Tích hợp | Done       |
| P1-S7 — manager-class-detail | Đã duyệt | Tích hợp | Done       |

## Phạm vi và giới hạn bàn giao

Bản hiện tại có tải API theo nhu cầu, lịch theo ngày, Home/Meet, nút lịch theo quyền/thời gian và bố cục Chi tiết buổi Manager hai tab Tổng quan/Học viên. Điểm danh, ghi chú và tài liệu có thao tác thuộc phase sau; không coi placeholder P1 là nghiệp vụ đã nối API.

iOS, TalkBack/font scale đầy đủ, native expiry/revoke và dataset Mentor dạy thay còn thiếu bằng chứng riêng. Việc nghiệm thu không biến các nhánh chưa kiểm thành pass. Không thay trạng thái P0 hoặc các phase P2–P8 trong lượt này.

Các dòng 0/7/chờ duyệt dưới đây là sự kiện tại thời điểm ghi nhận, không phải tiến độ hiện hành.

## Nhật ký lịch sử — trước nghiệm thu

| Ngày       | Người              | Sự kiện                              | Bằng chứng / giới hạn                                                                                                                | BR/ADR thay đổi                               |
| ---------- | ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| 30/10/2026 | Codex              | Khởi tạo kế hoạch và khung tiến độ   | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git                                              | Khởi tạo, chưa có thay đổi luật đã duyệt      |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan                  | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai              | ADR-004, ADR-005, ADR-008, ADR-009 → Accepted |
| 30/10/2026 | Codex              | Thực hiện ADR-011                    | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API                 | ADR-011 Accepted                              |
| 30/10/2026 | Codex              | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ                             | ADR-011 bổ sung quy ước tên                   |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro             | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt                      |

## Ghi nhận khi thực hiện

31/10/2026 — Người dùng “Duyệt và tách slice đi”: duyệt kế hoạch tổng P1, Codex tách 7 kế hoạch slice và đồng bộ mục lục. Design/test case Claude còn thiếu; chưa code, chưa approve UI/API hoặc chốt Q-CLASS-01/02. UI/API giữ 0/7; ADR Accepted giữ nguyên. Các ghi nhận chờ duyệt tổng bên dưới là lịch sử trước phản hồi này.

31/10/2026 — Người dùng “Duyệt adr 20”: ADR-020 → Accepted, áp dụng bộ E2E Maestro, flow tổng, lệnh `npm run test:e2e:phase-1` và hồ sơ bằng chứng riêng khi triển khai P1. Chưa tạo flow/lệnh rỗng; kế hoạch tổng P1 vẫn chờ duyệt riêng, UI/API giữ 0/7.

31/10/2026 — Codex lập kế hoạch tổng P1 theo yêu cầu người dùng, gồm 7 slice, dependency UI/API, cổng design/quyền và Maestro E2E/hồi quy P0. Chỉ bổ sung tài liệu; chưa duyệt kế hoạch, chưa triển khai UI/API, không đổi BR hoặc trạng thái ADR. Kiểm tra tài liệu ghi tại hồ sơ bàn giao; không dùng kết quả test P0 làm bằng chứng P1.

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.

31/10/2026 — Codex triển khai module teaching UI mock theo yêu cầu “Triển khai phase 1”, 7 route theo role, fixtures rõ nhãn, vi/en/theme, capability và snapshot người dạy. Không triển khai contract/service/query API thật trước approve UI. Kết quả kiểm chứng cuối ghi ở ui-verification/e2e-ui; không tự chuyển phase Done.

31/10/2026 — Kết quả kiểm chứng UI: `npm run check` pass (11 suite, 120 test), build Android debug x86_64 pass, Maestro UI smoke toàn 7 màn + en/dark/search/lỗi roster pass exit 0. Đã rà 12 ảnh native, hồ sơ tại `docs/implement/phase-001-teaching-workspace/e2e-ui.md`. iOS/screen reader/font scale chưa kiểm đủ; hiệu năng danh sách lớn và E2E tích hợp phải kiểm ở bước API. UI chưa approve, API 0/7, phase chưa Done.

31/10/2026 — Người dùng yêu cầu lập thêm implement hoàn thiện UI Home sau login trong phase 1. Codex bổ sung [kế hoạch Home](../../implement/phase-001-teaching-workspace/implement-home-after-login.md), liên kết từ mục lục/kế hoạch tổng; task Home chưa thực hiện. Không sửa code/design/ADR, không thêm slice hoặc tăng tiến độ, API giữ 0/7 và UI vẫn chờ duyệt.

31/10/2026 — Người dùng “Triển khai Home UI trong phase 1”: Codex triển khai Home theo design Claude mục 3/6 và H-A–H-I (HomeTile 4 cột, nhóm theo role, mascot nguyên bản, header tên dài, vi/en/theme và reduced motion). `npm run check` pass 12 suite/128 test; build Android debug x86_64 thành công. Bằng chứng Home bổ sung tại ui-verification/ui-review/e2e-ui. Home là khung P1, không thêm slice; UI vẫn chờ duyệt, API 0/7, chưa nghiệm thu.

31/10/2026 — Người dùng cập nhật `docs/design/Mentor Mobile UI.html` (lịch, lớp) và yêu cầu cập nhật UI: Claude Code làm lại 4 màn Mentor (lịch dạy, lớp phụ trách, chi tiết lớp, chi tiết buổi) trên mock; màn Manager giữ giao diện. Fixture thêm tiến độ, lịch cố định, phòng, buổi tới: chưa có trong endpoint tham chiếu, phải chốt ở bước API. Khác design có chủ đích: thẻ buổi vẫn bấm được ở mọi trạng thái; giữ chip "Dạy thay · Theo buổi" và lớp SESSION trong danh sách; giữ bộ lọc "Đã hủy" khi có lớp hủy; "Điểm danh" chỉ báo thông tin (P2), số Có mặt/Vắng là "—", tab Tài liệu chỉ có trạng thái trống. Các test case S1/S2/S3/S4 về tuần, bộ lọc Tất cả, nhóm chương và link trước giờ học theo design slice cũ đã bị thay đổi; design slice chưa sửa. UI vẫn chờ duyệt, API 0/7.

31/10/2026 — Home kiểm chứng cuối: build Android code cuối pass 11s; Maestro toàn P1 mở rộng Home pass exit 0 (`094806`), layout Manager en/dark 360dp/font130 pass (`095121`). Đã rà 4 ảnh Home; test/lint/typecheck pass 128/128 như hồ sơ. iOS/TalkBack/native tên dài còn giới hạn được ghi rõ. UI chờ duyệt toàn phase, API 0/7.

## Review spacing và feedback — 31/10/2026

Đã sửa theo ảnh/yêu cầu người dùng: content/empty trước feedback, gap/padding lớn hơn, retry/Back bớt padding dọc và tăng padding ngang, offline chỉ warning, skeleton Today không chèn ba hàng lớn, avatar/tile bên trái mở từ trái sang phải. ADR-021 Proposed ghi mapping navigation. Kiểm chứng: 13 suites/143 tests, typecheck/ESLint/Prettier pass; Maestro UI 7 màn và flow feedback error/offline/loading/success đều pass (exit 0) trên Pixel_8. [Hồ sơ sửa UI](../../implement/phase-001-teaching-workspace/ui-spacing-feedback-update.md). Vẫn chờ duyệt UI phase 1; API 0/7.

31/10/2026 (Asia/Bangkok) — Người dùng “Duyệt tất cả adr”: xác nhận ADR-001–ADR-022; ADR-021 (chiều điều hướng) và ADR-022 (blur native) chuyển Accepted, ghi nguồn/ngày duyệt và đóng băng theo ADR-012. Sổ ADR đã đồng bộ; các ghi nhận Proposed trước đây là lịch sử. Không thay đổi tiến độ UI/API hoặc trạng thái nghiệm thu phase.

## Mốc tích hợp API — 31/10/2026 (lịch sử)

| Mốc                            | Kết quả                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Người dùng cho phép API        | “Triển khai API cho phase 1” — mở bước tích hợp; không tự ghi nhận nghiệm thu UI                                 |
| API S1–S7                      | Đã nối 7/7, schema/adapter/contract theo snapshot nguyên byte SHA-256                                            |
| Cleanup/lint/typecheck/unit/UI | `npm run check` pass: 16 suites/174 tests; ESLint 0 error/0 warning, Prettier và tsc pass                        |
| Android build                  | assembleDebug x86_64 pass 29s; APK cài vào emulator-5554                                                         |
| Backend thật                   | `npm run test:api:phase-1` pass cả hai role, đọc list/detail/units/sessions/roster/context; Mentor schedule pass |
| HTTP simulation                | Postman 1.77.0, actual adapter pass; HTML 503 context → error; 8 GET đã quan sát                                 |
| Maestro P1 API                 | Pass exit 0, report `2026-10-31_202502`, 7 màn; substitute native chưa có dataset, kiểm bằng unit/UI             |
| Nghiệm thu phase               | Chờ người dùng; không đánh dấu Done                                                                              |

31/10/2026 — Codex thực hiện yêu cầu triển khai API P1, giữ design/UI có sẵn, dùng API thật mặc định, kiểm scope/capability, cookie renewal và account isolation. Trường UI thiếu nguồn giữ null/ẩn/“—”; không dựng progress hoặc người dạy legacy. Có 7 contract và hồ sơ API/E2E. Hồ sơ API là nguồn hiện hành, các bảng Todo/0/7 phía trên là lịch sử. Không sửa backend, không commit credential hoặc dữ liệu PII.

31/10/2026 — Hồi quy auth bổ sung hoàn tất: invalid login + Mentor pass (`2026-10-31_202749`); Manager riêng pass exit 0 (`2026-10-31_204004`). Lượt P0 tổng timeout khi Metro kẹt tải bundle trước login Manager; restart Metro, không sửa API, rồi chạy lại phần Manager. Không ghi nhầm lượt P0 tổng là pass. Android 17/API 37, giới hạn iOS/native revoke/substitute dataset giữ nguyên. Phase P1 API 7/7 tích hợp và E2E P1 pass; nghiệm thu vẫn chờ người dùng.

31/10/2026 — Sửa phản hồi ảnh thẻ lịch “Chưa cập nhật”: đã bổ sung context cho thẻ trong ngày để lấy roomName thực, xác nhận Python là Phòng Lab 2; online có nhãn đúng. 39 test liên quan, lint/typecheck/format và Maestro targeted pass (`2026-10-31_224741`). Chi tiết tại hồ sơ API. Không thay đổi trạng thái nghiệm thu.

31/10/2026 — Theo xác nhận UI mới nhất, giữ Meet trên Home; mọi thẻ lịch có Điểm danh/Chi tiết, Điểm danh disabled trước giờ và khi buổi đóng/không có quyền. Bỏ tên buổi khỏi schedule card, chỉ giữ tên lớp/phòng/hình thức. 42 test liên quan + lint/typecheck/Prettier pass; Maestro targeted pass `2026-10-31_230652`, đã kiểm ảnh và navigation Chi tiết. Nghiệp vụ attendance P2 chưa nối, phase chưa nghiệm thu.

01/11/2026 — Người dùng cập nhật trang "Chi tiết buổi học" của Quản lý trong `docs/design/Manager Mobile UI.html` và yêu cầu cập nhật design: Claude Code sửa `session-context/design.md` (mục 2.1, 2.2, 4, 5, 6, 7, 8, 9) và design cấp phase. Quản lý có hai tab Tổng quan/Học viên; tab Điểm danh đổi thành Học viên, ẩn tab Ghi chú, nhóm Thao tác và số điểm danh vì thuộc phase sau; giữ thêm hàng Link học. Đây là mốc chỉ sửa design; code Manager đã được cập nhật sau đó, xem hồ sơ kiểm chứng UI. API đã tích hợp 7/7 từ 31/10; nghiệm thu được ghi ở trạng thái hiện hành phía trên.

01/11/2026 — Người dùng yêu cầu bỏ phần tiến độ khỏi thẻ danh sách lớp Mentor. Đã bỏ thanh tiến độ, số buổi và dòng “Chưa có dữ liệu tiến độ”, dọn component/chuỗi dịch không còn sử dụng. Thẻ giữ tên/mã lớp, trạng thái, ngày học, chỗ còn lại và hình thức học. Không thêm request API.

01/11/2026 — Theo chỉ thị gộp lệnh, ADR-026 Accepted: package.json chỉ còn `test:e2e:phase-1` cho P1. Command tự kiểm API/tạo dataset rồi Maestro; chạy thật **pass exit 0**, Pixel_8, report `2026-11-01_084431`. Nhánh substitute skipped do thiếu dataset; không chạy lại P0/iOS. Kiểm orchestration lỗi/exit code, lint/format/syntax và liên kết tài liệu đạt; chi tiết tại [hồ sơ E2E](../../implement/phase-001-teaching-workspace/e2e.md#kiểm-chứng-command-duy-nhất--01112026). Giữ kết quả nghiệm thu P1 và giới hạn cũ.
