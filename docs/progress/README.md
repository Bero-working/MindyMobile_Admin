# Tiến độ Mindy Mobile

**P5 hiện hành — 02/11/2026:** Đã triển khai UI/API 5/5, bỏ cổng UI accept riêng theo ADR-027 và E2E theo ADR-030; chưa nghiệm thu. [Kiểm chứng/giới hạn](../implement/phase-005-manager-operations-cash/api-integration.md). Các ghi nhận P5 chờ design/code bên dưới là lịch sử.

**P3 hiện hành — 02/11/2026:** đã triển khai mã UI/API trực tiếp theo chỉ thị bỏ chờ UI accept; xem [hồ sơ và bằng chứng](../implement/phase-003-material-review/api-integration.md). E2E đã dừng theo yêu cầu người dùng, sẽ chạy lại khi được yêu cầu; chưa nghiệm thu. Các ghi nhận chờ design/Q-MAT-01 trước đó là lịch sử.

**P5 — 02/11/2026:** Đã nhận chỉ thị triển khai và chốt phạm vi, chuẩn bị [5 checklist slice](../implement/phase-005-manager-operations-cash/README.md#kế-hoạch-theo-slice); chờ design Claude/test case trước code. UI/API/slice hoàn chỉnh 0/5. Trạng thái kế hoạch chờ duyệt P5 trong bảng lập trước đó là lịch sử, không cần hỏi lại chỉ thị implement.

**P3 — cập nhật chỉ thị triển khai 02/11/2026:** Người dùng yêu cầu “Triển khai phase 3”; đã ghi nhận chỉ thị và tách 6 kế hoạch slice. Q-MAT-01 đã chốt: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối. Chưa có design Claude/test case nên UI TDD chờ theo ADR-009; UI/API 0/6. Các dòng chờ duyệt kế hoạch tổng hoặc Q-MAT-01 bên dưới là lịch sử trước chỉ thị này.

Ngày khởi tạo: **30/10/2026**. P0 đã triển khai **UI/API 4/4 và được người dùng xác nhận duyệt ngày 31/10/2026**, đã rà soát và dọn dẹp; lint/typecheck/102 tests và Maestro signed-out rerun pass. Giới hạn native expiry/iOS và bằng chứng từng nhánh vẫn được theo dõi; chưa quy đổi số slice hoàn chỉnh khi bằng chứng còn thiếu. [Kế hoạch](../implementation-plan.md), [ADR](../adr/README.md), [BR changelog](business-rules-changelog.md).

| Phase / luồng                                                                                               | Ưu tiên | Trạng thái                           |  UI | API | Slice hoàn chỉnh | % slice | Ngày cập nhật |
| ----------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------ | --: | --: | ---------------: | ------: | ------------- |
| [P0 — Nền tảng → đăng nhập → đúng workspace](phase/phase-000-foundation-auth.md)                            | P0      | Đã duyệt; đã rà soát                 | 4/4 | 4/4 |              0/4 |      0% | 31/10/2026    |
| [P1 — Mentor xem lịch/lớp → Manager theo dõi lớp](phase/phase-001-teaching-workspace.md)                    | P0      | Done — đã nghiệm thu                 | 7/7 | 7/7 |              7/7 |    100% | 01/11/2026    |
| [P2 — Mentor điểm danh/ghi chú → Manager theo dõi và correction](phase/phase-002-attendance-and-notes.md)   | P0      | API/E2E Android pass, chờ nghiệm thu | 7/7 | 7/7 |              0/7 |      0% | 02/11/2026    |
| [P3 — Mentor tải tài liệu → Manager duyệt/công bố](phase/phase-003-material-review.md)                      | P0      | UI/API đã viết; chờ QA               | 6/6 | 6/6 |              0/6 |      0% | 02/11/2026    |
| [P4 — Mentor xin nghỉ → Manager duyệt → lịch bù cập nhật](phase/phase-004-leave-and-makeup.md)              | P0      | Kế hoạch chờ duyệt                   | 0/7 | 0/7 |              0/7 |      0% | 02/11/2026    |
| [P5 — Manager phân công/xử lý lịch → xác nhận CASH](phase/phase-005-manager-operations-cash.md)             | P0      | UI/API đã nối; E2E miễn | 5/5 | 5/5 |              0/5 |      0% | 02/11/2026    |
| [P6 — Mentor tạo quiz → công bố → theo dõi trạng thái](phase/phase-006-mentor-quiz.md)                      | P1      | UI/API đã nối; chưa nghiệm thu       | 3/3 | 3/3 |              0/3 |      0% | 02/11/2026    |
| [P7 — Mentor/Manager đọc chuyên cần và progress đúng nghĩa](phase/phase-007-attendance-progress-reports.md) | P1      | Todo                                 | 0/2 | 0/2 |              0/2 |      0% | 30/10/2026    |
| [P8 — Mentor trao đổi → nhận thông báo/push đúng quyền](phase/phase-008-chat-notifications.md)              | P1      | Todo                                 | 0/3 | 0/3 |              0/3 |      0% | 30/10/2026    |

MVP P0–P5: **7/36 slice hoàn chỉnh (19,4%)** theo số đã ghi nhận; P0 giữ 0/4 slice hoàn chỉnh như hồ sơ riêng. P6–P8 là roadmap ngoài MVP. Phase P1 (Teaching Workspace) nằm trong MVP, khác với nhãn ưu tiên P1.

**Cập nhật 01/11/2026:** Người dùng nghiệm thu P1; UI/API 7/7, phase Done. [Hồ sơ rà soát P1](../implement/phase-001-teaching-workspace/review-cleanup.md). Các ghi nhận bên dưới theo ngày là lịch sử.

## Quy ước

**P3 — 02/11/2026:** đã lập [kế hoạch tổng](../implement/phase-003-material-review/phase-003-material-review.md), chờ người dùng duyệt trước tách tài liệu slice theo ADR-017. Chưa có design Claude, chưa code hoặc mở cổng API; UI/API giữ 0/6. Câu hỏi và điều kiện thực hiện theo [progress P3](phase/phase-003-material-review.md).

Slice hoàn chỉnh khi UI và API đều có bằng chứng hoàn tất; tỉ lệ không thay thế nghiệm thu. Phase chỉ Done sau người dùng nghiệm thu. Các mốc: Design (Claude) → UI toàn phase (TDD) → Người dùng duyệt UI → API toàn phase (TDD) → Cleanup + lint + test → E2E Maestro toàn phase và hồi quy liên quan pass → Nghiệm thu.

Tại lần khởi tạo 30/10/2026 chưa chạy lint/typecheck/Jest mobile. Việc đọc controller, tài liệu hoặc collection backend không làm tăng tiến độ. Kết quả test ghi trong tài liệu BE cũ không phải kết quả mobile. Tại lần khởi tạo chưa có commit/PR; hiện repo đã có Git history. Không tự tạo commit/PR trong lượt rà soát này.

## Trạng thái cổng chung khi khởi tạo (lịch sử)

- ADR-001–ADR-009 đã Accepted ngày 30/10/2026 theo phản hồi “Chốt tất cả adr 1->9”; ADR Auth chưa tạo. Các câu hỏi còn mở và cổng duyệt riêng vẫn giữ nguyên.
- Claude chưa cung cấp design; không bắt đầu UI.
- Người dùng xác nhận email/mật khẩu P0 và local URL 3003; đường tích hợp Android/Origin/cookie còn chờ Q-ENV-01.
- Người dùng trả lời chính sách persist roster/draft chưa chốt; Q-DATA-01 giữ nguyên chờ.
- Chỉ bộ tài liệu nháp đã được tạo; các phase vẫn Todo.

## Kiểm tra tài liệu khởi tạo

Ngày 30/10/2026, Codex kiểm tra 26 file Markdown: liên kết file tương đối, mã BR/UC/câu hỏi và code fence; có 69 BR, 22 UC, 13 câu hỏi mở. Định dạng bằng Prettier. Đây là kiểm tra tài liệu, không phải lint/typecheck/Jest của ứng dụng và không làm tăng tiến độ UI/API.

Thử GET Swagger local `http://localhost:3003/docs-json` bị connection refused; chưa xác minh OpenAPI runtime hoặc cookie/Origin trên thiết bị. Không tự chạy hoặc sửa backend.

## Ghi nhận duyệt ADR — 30/10/2026

Người dùng chấp nhận ADR-001–ADR-009 qua phản hồi “Chốt tất cả adr 1->9”. Đã đồng bộ sổ ADR, từng ADR, changelog và nhật ký các phase. Đây là phê duyệt quyết định kiến trúc; cổng duyệt design/UI và nghiệm thu phase giữ nguyên. Tiến độ triển khai giữ nguyên.

## Duyệt ADR-010/ADR-011 và thực hiện ADR-011 — 30/10/2026

Người dùng duyệt ADR-010 và ADR-011 qua phản hồi “Duyệt adr 10 và 11, sau đó hoàn thành adr 11 đi”. Đã chuyển 9 file tiến độ P0–P8 vào `docs/progress/phase/` và cập nhật liên kết. ADR-010 mới được duyệt, chưa trích xuất CSS. Các phase vẫn giữ nguyên trạng thái và tiến độ UI/API.

## Thực hiện ADR-010 — 30/10/2026

Theo yêu cầu “Đọc adr 10 và hoàn thành”, đã tạo [`docs/design/global.css.md`](../design/global.css.md) từ `Login.html`, `Mentor Mobile UI.html`, `Thiết kế Home UI.html`: token, CSS nền tảng, class dùng chung `.mdy-` và style riêng có phạm vi; mọi mã màu trong mẫu đều có trong file. 7 xung đột token ghi ở mục 6 của file, chờ người phụ trách design quyết định. Chưa sửa HTML mẫu (bundle tự giải nén) và chưa ánh xạ sang NativeWind (chờ Q-THEME-01). Không thay đổi nghiệp vụ hoặc tiến độ UI/API.

## Danh mục hồ sơ triển khai — 30/10/2026

Đã tạo [docs/implement/README.md](../implement/README.md) theo yêu cầu người dùng, liệt kê 9 phase và tên folder triển khai tương ứng. Mỗi file phase đã có liên kết tới mục triển khai. Khi bắt đầu phase mới tạo folder theo danh mục; tiến độ UI/API giữ nguyên.

## Cổng E2E Maestro — 30/10/2026

Theo yêu cầu trực tiếp của người dùng, bổ sung ADR-009: mọi phase P0–P8 phải có Maestro E2E pass trên emulator/thiết bị trước khi trình nghiệm thu. Đã thêm mốc Todo trong cả 9 file tiến độ; chưa có flow hoặc kết quả E2E, không tăng tiến độ UI/API. Quy ước và bằng chứng theo [E2E Maestro](../implement/e2e-maestro.md).

## Cập nhật cổng triển khai — 30/10/2026

Theo chỉ thị mới của người dùng và [ADR-016](../adr/ADR-016-plan-before-implementation.md): viết kế hoạch trong folder phase → người dùng đọc và yêu cầu implement → UI mock toàn phase → người dùng approve UI → API → kiểm chứng/E2E → nghiệm thu. Không tiếp tục code trước chỉ thị implement.

P0 đã có design/test case của Claude. [Kế hoạch phase 0](../implement/phase-000-foundation-auth/phase-000-foundation-auth.md) đang chờ người dùng đọc; working tree có bản nháp UI chưa duyệt được viết trước cổng mới, chưa hoàn tất kiểm chứng và chưa tính tăng số slice hoàn tất. Các ghi nhận “chưa có design” phía trên là lịch sử trước cập nhật này.

30/10/2026 — Kế hoạch tổng phase 0 được người dùng duyệt qua phản hồi “Duyệt”; đã tách 4 tài liệu slice với đủ 71 TC design. Chờ chỉ thị implement, UI hoàn tất 0/4 và API 0/4; chưa approve UI hoặc nghiệm thu. Xem [kế hoạch và mục lục slice](../implement/phase-000-foundation-auth/phase-000-foundation-auth.md).

## Bàn giao UI phase 0 — 30/10/2026

P0: UI mock 4/4 đã triển khai, chờ người dùng approve UI; API 0/4 và slice tích hợp hoàn chỉnh 0/4, chưa nghiệm thu. `npm run check` pass 63 tests; Android Debug emulator build/run pass; có 5 flow UI mock pass qua các lượt, 03/05 được chạy lại sau sửa bàn phím/focus. Giới hạn native/build và mapping tại [hồ sơ](../implement/phase-000-foundation-auth/ui-verification.md); [hướng dẫn review](../implement/phase-000-foundation-auth/ui-review.md). UI mock không tăng số slice tích hợp hoàn chỉnh hoặc thay cổng E2E API.

30/10/2026 — Hoàn thiện phần UI theo ADR-003/004/010/013/014: NativeWind/Reusables, token và Zod; lint/typecheck/73 tests pass, 5/5 Maestro UI mock pass cùng lượt/source cuối, production Android JS bundle pass. Xem [hồ sơ UI ADR](../implement/phase-000-foundation-auth/ui-adr-completion.md). UI chờ người dùng approve; API 0/4 và nghiệm thu phase chưa mở.

## Rà soát phase 0 — 31/10/2026

Người dùng xác nhận duyệt phase 0. Đã dọn trạng thái tài liệu và sửa assertion Maestro sai selector; lint/format/typecheck, 102 Jest tests và E2E signed-out/invalid-login/relaunch pass. [Hồ sơ rà soát](../implement/phase-000-foundation-auth/review-cleanup.md) ghi rõ các lượt harness bị dừng và giới hạn chưa kiểm chứng; không coi các nhánh native còn thiếu là pass.
