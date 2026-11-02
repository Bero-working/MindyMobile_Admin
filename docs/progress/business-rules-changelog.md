# Lịch sử quy tắc nghiệp vụ

[Quy tắc duy nhất](../business-rules.md). Ngày khởi tạo: 30/10/2026. ADR-001–ADR-009 được chấp nhận ngày 30/10/2026; việc này không tự phê duyệt toàn bộ baseline nghiệp vụ hoặc giải quyết các câu hỏi còn mở. Các dòng khởi tạo bên dưới giữ trạng thái tại thời điểm ghi.

| Ngày       | Mã BR                                 | Cũ → mới                                                                  | Lý do / nguồn                                                               | ADR                                                       | Phase/slice bị ảnh hưởng                                                    | Trạng thái                                              |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| 30/10/2026 | Toàn bộ BR trong business-rules.md    | Chưa có tài liệu → bản nháp có nguồn/trạng thái                           | Yêu cầu ban đầu và câu trả lời cho phép tạo draft; đối chiếu BE docs/source | ADR-001–ADR-009 Proposed, không phải quyết định Accepted  | Toàn bộ roadmap; không tính tiến độ implement                               | Khởi tạo draft                                          |
| 30/10/2026 | BR-AUTH-02                            | Phương thức đăng nhập chưa chốt → P0 email/mật khẩu, Google sau MVP       | Người dùng trả lời câu hỏi trực tiếp trước khi tạo baseline                 | Chưa đổi kiến trúc đã duyệt; ADR-005/ADR-009 còn Proposed | P0-S2                                                                       | Có căn cứ, chưa phê duyệt baseline                      |
| 30/10/2026 | BR-DATA-02, BR-OFF-02                 | Có đề xuất persist → ghi rõ chưa chốt, không tự bật                       | Người dùng chọn “Chưa chốt chính sách lưu trên thiết bị”                    | ADR-004/ADR-006 Proposed                                  | P0-S4, P2-S1                                                                | Chờ xác nhận                                            |
| 30/10/2026 | Các BR được dẫn trong ADR-001–ADR-009 | ADR Proposed → Accepted; giữ nguyên nội dung quyết định và câu hỏi còn mở | Người dùng: “Chốt tất cả adr 1->9”                                          | ADR-001–ADR-009 Accepted                                  | Toàn bộ phase P0–P8 và slice được từng ADR dẫn chiếu; đã cập nhật phase log | Đã duyệt ADR; cổng duyệt UI/nghiệm thu phase giữ nguyên |

## Bổ sung ADR-010 — 30/10/2026

Theo yêu cầu người dùng, tạo [ADR-010](../adr/ADR-010-global-design-tokens-css.md) ở trạng thái Proposed: tập trung token và CSS mẫu vào `docs/design/global.css.md`. Ảnh hưởng BR-SCOPE-01, P0-S1–P0-S4 và các slice UI. Chưa trích xuất CSS hoặc sửa mẫu; tiến độ triển khai giữ nguyên. ADR-001–ADR-009 vẫn Accepted.

## Bổ sung ADR-011 — 30/10/2026

Theo yêu cầu người dùng, tạo [ADR-011](../adr/ADR-011-phase-progress-folder.md) ở trạng thái Proposed: gom toàn bộ file tiến độ P0–P8 vào `docs/progress/phase/`, giữ tên file và cập nhật liên kết khi di chuyển. Không thay đổi nghiệp vụ hoặc tiến độ; chưa di chuyển file trong lần viết ADR.

## Duyệt ADR-010/ADR-011 và thực hiện ADR-011 — 30/10/2026

Người dùng xác nhận “Duyệt adr 10 và 11, sau đó hoàn thành adr 11 đi”: ADR-010 và ADR-011 chuyển Proposed → Accepted. Đã thực hiện ADR-011: chuyển toàn bộ 9 file tiến độ P0–P8 vào `docs/progress/phase/`, cập nhật liên kết vào/ra và nhật ký từng phase. Không thay đổi nghiệp vụ hoặc tiến độ UI/API. ADR-010 chưa thực hiện trích xuất CSS; các mục Proposed phía trên là lịch sử tại thời điểm ghi.

## Bổ sung tên file phase — 30/10/2026

Theo yêu cầu trực tiếp của người dùng, bổ sung ADR-011: đặt tên `phase-NNN-<slug>.md` theo thứ tự trong implementation-plan, P0 → 001 đến P8 → 009. Đã đổi tên 9 file và cập nhật liên kết; thay quy định giữ nguyên tên file trước đây. Mã phase/slice và tiến độ không đổi.

## Thực hiện ADR-010 — 30/10/2026

Theo yêu cầu “Đọc adr 10 và hoàn thành”, đã tạo [`docs/design/global.css.md`](../design/global.css.md) từ `Login.html`, `Mentor Mobile UI.html`, `Thiết kế Home UI.html`: token, CSS nền tảng, class dùng chung `.mdy-` và style riêng có phạm vi; mọi mã màu trong mẫu đều có trong file. 7 xung đột token ghi ở mục 6 của file, chờ người phụ trách design quyết định. Chưa sửa HTML mẫu (bundle tự giải nén) và chưa ánh xạ sang NativeWind (chờ Q-THEME-01). Không thay đổi nghiệp vụ hoặc tiến độ UI/API.

## Quy tắc ghi tiếp

Với BR đã duyệt, không sửa thầm lặng: ADR Proposed → chờ người dùng → Accepted → ghi ngày, BR, cũ/mới, lý do, ADR và phase/slice cụ thể → cập nhật phase đang chạy → implement. Bổ sung draft cũng ghi nguồn và trạng thái, không gọi là phê duyệt.

Không gán số ADR Auth trước khi có file thật và đủ legacy. Không dùng chỉ số UI mock/test pass để kết luận thay đổi nghiệp vụ đã được duyệt.

## Bổ sung cổng Maestro E2E — 30/10/2026

Nguồn: “Thêm test e2e sau mỗi phase trước khi tôi nghiệm thu”, tiếp theo “sử dụng maestro”. Bổ sung trực tiếp ADR-009 Accepted: cleanup/lint/tsc/Jest → Maestro E2E toàn phase và hồi quy liên quan pass → người dùng nghiệm thu. Áp dụng P0–P8 khi triển khai, Android trước/iOS theo Q-PLAT-01. Đã cập nhật kế hoạch, danh mục triển khai và 9 mốc/nhật ký phase. Không đổi BR nghiệp vụ, scope roadmap, tiến độ UI/API hoặc thay thế quyết định nghiệm thu; chưa triển khai/chạy flow E2E.

## Quy tắc quản lý ADR — 30/10/2026

Người dùng yêu cầu ADR sau approve không được sửa trực tiếp, thay đổi phải có ADR mới và ADR mới được ưu tiên hơn. Đã tạo [ADR-012](../adr/ADR-012-immutable-approved-adrs-and-precedence.md) Proposed; cập nhật sổ ADR. Từ chỉ thị này giữ nguyên file ADR Accepted; không sửa hồi tố ADR-001–ADR-011. Không thay đổi BR, tiến độ phase hoặc triển khai code. Văn bản ADR-012 chưa được duyệt riêng.

## Duyệt ADR-012 — 30/10/2026

Nguồn: người dùng “Duyệt adr 12”. [ADR-012](../adr/ADR-012-immutable-approved-adrs-and-precedence.md) Proposed → Accepted; đã ghi nguồn/ngày duyệt và đóng băng file. Quy tắc bất biến và ưu tiên ADR Accepted mới hơn có hiệu lực cho toàn bộ ADR/phase; phần vòng đời cũ trái quy tắc này được thay thế theo mapping trong sổ ADR. Các quyết định nghiệp vụ, tiến độ UI/API và cổng design/E2E/nghiệm thu giữ nguyên. Ghi nhận Proposed ở mục trước là lịch sử trước duyệt.

## Đề xuất animation/gesture/navigation — 30/10/2026

Nguồn: người dùng yêu cầu “Reanimated + Gesture Handler + Native Stack”, dùng cho repo và thêm ADR. Đã tạo [ADR-013](../adr/ADR-013-reanimated-gesture-handler-native-stack.md) Proposed; ghi hiện trạng Reanimated/Gesture Handler đã có, JS Stack chưa chuyển Native Stack và quy tắc migration/kiểm chứng Maestro. Chưa sửa code/dependencies hoặc các ADR Accepted; không đổi BR, phạm vi UI/API hay tiến độ phase.

## Duyệt ADR-013 — 30/10/2026

Nguồn: người dùng “Duyệt 13”. [ADR-013](../adr/ADR-013-reanimated-gesture-handler-native-stack.md) Proposed → Accepted, đóng băng file theo ADR-012. Áp dụng bộ Reanimated/Gesture Handler/Native Stack cho nền P0 và các phase có điều hướng/animation/gesture; mapping bổ sung và ưu tiên trong sổ ADR. Chưa migrate code/dependencies, không sửa BR hoặc các ADR đã duyệt khác. Tiến độ UI/API và cổng design/E2E/nghiệm thu giữ nguyên.

## Chuyển tài liệu CSS và runtime — 30/10/2026

Theo chỉ thị trực tiếp của người dùng, tạo ADR-014 Accepted, thay đường dẫn/định dạng tại ADR-010: tài liệu design chuyển thành `docs/design/global.css.md`, bảo toàn CSS mẫu trong code block; entry runtime chuyển từ root vào `src/global.css`, cập nhật Metro/import. Không tự ánh xạ token, không đổi BR hoặc tiến độ UI/API; file ADR đã duyệt giữ nguyên theo ADR-012.

## Xác nhận duyệt ADR-014 — 30/10/2026

Nguồn: người dùng “duyệt” sau báo cáo thực hiện ADR-014. Xác nhận quyết định và thay đổi đường dẫn/định dạng CSS đã báo cáo; ADR-014 giữ trạng thái Accepted. Chỉ bổ sung xác nhận ở sổ ADR/changelog, không sửa file ADR đã đóng băng. Không thay đổi BR hoặc coi là nghiệm thu phase P0.

30/10/2026 — ADR-015 Accepted theo chỉ thị người dùng: đồng bộ tên phase-000–008 với P0–P8, không đổi BR. Đã có design Claude đủ P0-S1–S4; bắt đầu UI mock, giữ cổng duyệt UI trước API.

30/10/2026 — ADR-016 Accepted theo chỉ thị người dùng: kế hoạch trong folder phase → đọc và yêu cầu implement → UI mock toàn phase → approve UI → API. Đã dừng code, bàn giao kế hoạch phase 0; không đổi BR nghiệp vụ hoặc tăng tiến độ hoàn tất.

30/10/2026 — ADR-017 Accepted: kế hoạch tổng trùng tên folder phase; chỉ tách kế hoạch chi tiết theo slice sau khi người dùng duyệt tổng. Không đổi BR hoặc triển khai code.

30/10/2026 — ADR-018 ghi yêu cầu triển khai trực tiếp: secure storage, Android network security, lazy component/router và native viewport observation. Không đổi BR nghiệp vụ hoặc auth contract; không mở cổng API. Kết quả tại [hồ sơ hạ tầng](../implement/phase-000-foundation-auth/security-lazy-loading.md).

## Đề xuất E2E tương ứng từng phase — 31/10/2026

Theo yêu cầu người dùng ghi quy tắc vào ADR, tạo [ADR-020](../adr/ADR-020-e2e-suite-per-phase.md) Proposed: mỗi phase có bộ E2E Maestro, flow tổng, lệnh npm và hồ sơ kiểm chứng riêng; pass trước nghiệm thu theo cổng ADR-009 hiện hành. ADR-020 chờ duyệt theo ADR-012; giữ nguyên các file ADR Accepted và tiến độ phase. Đã gỡ AGENTS.md vừa tạo cho yêu cầu này và chuyển liên kết README sang ADR.

## Duyệt ADR-020 — 31/10/2026

Nguồn: người dùng “Duyệt adr 20”. [ADR-020](../adr/ADR-020-e2e-suite-per-phase.md) Proposed → Accepted; ghi nguồn/ngày duyệt và đóng băng file theo ADR-012. Quy định bộ E2E Maestro, flow tổng, lệnh npm và hồ sơ bằng chứng riêng từng phase có hiệu lực; bổ sung ADR-009, giữ cổng E2E pass trước nghiệm thu. Đã đồng bộ sổ ADR và kế hoạch/progress P1; kế hoạch tổng P1 vẫn chờ duyệt riêng, UI/API giữ 0/7. Không thay đổi BR nghiệp vụ hoặc triển khai code.

31/10/2026 (Asia/Bangkok) — Người dùng “Duyệt tất cả adr”: xác nhận ADR-001–ADR-022; ADR-021 (chiều điều hướng) và ADR-022 (blur native) chuyển Accepted, ghi nguồn/ngày duyệt và đóng băng theo ADR-012. Sổ ADR đã đồng bộ; các ghi nhận Proposed trước đây là lịch sử. Không thay đổi tiến độ UI/API hoặc trạng thái nghiệm thu phase.

01/11/2026 — Bổ sung [ADR-024](../adr/ADR-024-demand-driven-status-and-schedule-loading.md) Proposed theo yêu cầu ghi ADR về lazy loading khi mở UI theo status/schedule. Ghi nhận hành vi P1 đã triển khai, bổ sung ADR-004/018; không thay BR nghiệp vụ, runtime hoặc tự duyệt ADR.

## ADR-025 — Áp dụng quy tắc chung · 01/11/2026

Người dùng yêu cầu “Viết thành adr để áp dụng đi” sau danh sách 15 quy tắc chung từ P1. [ADR-025](../adr/ADR-025-shared-ui-data-loading-and-verification-rules.md) Accepted theo chỉ thị trực tiếp; đóng băng sau khi ghi nguồn/ngày. Đồng bộ sổ ADR, danh mục triển khai và kế hoạch tổng. Thay phần chuyển màn của ADR-013/021, không sửa file Accepted cũ; ADR-023/024 giữ Proposed, quy tắc trùng phạm vi áp dụng theo ADR-025. Không đổi BR nghiệp vụ, runtime, số slice hoặc trạng thái nghiệm thu các phase.

## Duyệt ADR-023 và ADR-024 — 01/11/2026

Nguồn: người dùng “duyệt adr 23 24” (Asia/Bangkok). [ADR-023](../adr/ADR-023-button-origin-navigation.md) và [ADR-024](../adr/ADR-024-demand-driven-status-and-schedule-loading.md) chuyển Proposed → Accepted; ghi nguồn/ngày và đóng băng theo ADR-012. Xác nhận điều hướng trực tiếp không animation/gesture chuyển màn và lazy API Teaching Workspace theo status/ngày/tab. Đồng bộ sổ ADR, kế hoạch tổng, kế hoạch/progress P1 và hồ sơ lazy loading. ADR-025 giữ nguyên và ưu tiên khi xung đột; các dòng Proposed trước đây là lịch sử. Không đổi BR nghiệp vụ, runtime, trạng thái nghiệm thu hoặc ghi nhận thêm kết quả test/E2E.

## Chốt phạm vi P5 — 02/11/2026

Nguồn trực tiếp: người dùng “Triển khai phase 5”, sau đó trả lời “Giữ phạm vi này” cho phạm vi chỉ dạy thay theo buổi và tên “đơn thanh toán tiền mặt”, chưa thêm đổi mentor chính, sửa meeting URL hoặc xuất hóa đơn/biên nhận riêng. Q-CLASS-02/Q-PAY-01 được giải quyết cho P5; BR-PAY-06 sử dụng Order/PaymentTransaction hiện hữu, không thêm Invoice. Đây là chốt lựa chọn trong baseline, không thay luật thu đủ tiền/quyền hoặc sửa ADR Accepted. Đã chuẩn bị 5 checklist slice và đầu vào design; chưa có design Claude/test case nên chưa code UI/API. Tiến độ giữ 0/5. Các ghi nhận chờ quyết định P5 cũ là lịch sử.

## ADR-026 — Một command E2E mỗi phase · 01/11/2026

Nguồn: người dùng “Gộp tất cả thành 1 command test e2e như phase 0” và “Thêm quy tắc adr về mỗi phase chỉ có 1 command test e2e”. [ADR-026](../adr/ADR-026-single-e2e-command-per-phase.md) Accepted và đóng băng theo ADR-012, bổ sung/thay phần tổ chức command ADR-020. Giữ file Accepted cũ. P1 gộp kiểm API/tạo dataset và Maestro dưới `npm run test:e2e:phase-1`, bỏ hai command API/UI riêng; flow mock giữ làm lịch sử. Đồng bộ README, quy ước E2E, kế hoạch và hồ sơ P1. Không đổi BR nghiệp vụ hoặc trạng thái nghiệm thu.

## Chốt Q-MAT-01 — 02/11/2026

Người dùng chọn “Mentor: FILE, VIDEO, ARTICLE; Manager: duyệt/từ chối” khi triển khai P3. Chốt phạm vi mobile theo câu hỏi mở, không sửa ADR Accepted hoặc luật review: approve đồng thời công bố, edit/revision và file READY tiếp tục theo BR-MAT/BR-FILE. Manager authoring/publish/unpublish riêng không nằm trong phạm vi. Đã cập nhật business rules và hồ sơ P3; chưa có design Claude/test case nên UI/API chưa triển khai, tiến độ giữ 0/6. Policy dữ liệu/offline không được suy là đã chốt.

## Quyết định P4 — 02/11/2026

Nguồn: người dùng chọn triển khai đủ S1–S7 và giao “Bạn tự xử lý theo hướng tối ưu” cho quy tắc nghỉ/bù. [ADR-028](../adr/ADR-028-phase-4-leave-and-makeup-decisions.md) ghi lựa chọn Codex theo design/backend: notice/ca giữ nguồn, quá hạn không tạo đơn, 0 buổi không cần đơn, RAM/online, slot không lọc khung giờ tùy ý. Đính chính BR-LEAVE-05: còn xung đột học viên thì không duyệt, acknowledgeStudentConflicts=false, không checkbox vượt chặn. Không đổi ADR Accepted cũ; chưa duyệt UI/API/nghiệm thu P4.

## P3 triển khai trực tiếp / dừng E2E — 02/11/2026

Theo chỉ thị “Triển khai phase 3, bỏ qua UI accept, tích hợp API vào luôn”, ghi ADR-029 Accepted chỉ cho P3; không chuyển UI approved hoặc nghiệm thu. Giữ phạm vi chat Mentor FILE/VIDEO/ARTICLE, Manager approve/reject và state machine backend. Design nguồn giữ nguyên, khác biệt ghi tại ADR/hồ sơ. Đã có mã UI/API và kiểm chứng riêng. Người dùng yêu cầu test P3/P4/P5, báo lỗi CASH; đã sửa xung đột module i18n của Metro. Sau chỉ thị “Không cần test e2e, tôi sẽ yêu cầu sau”, dừng các lượt native của chat này, không ghi E2E pass.

## Hoàn thiện P5 — 02/11/2026

Người dùng chốt Q-P5-01–05, yêu cầu “Viết luôn API luôn bỏ qua bước xác nhận UI” (ADR-027) và “Bỏ qua test e2e, triển khai hoàn thiện phase 5” (ADR-030). P5 đọc CASH bằng /manager/orders có filter, không đổi mentor đã start, nhập tiền thực nhận, dời buổi không đổi tên và mở thẳng list. Đã viết UI/API 5/5, source contract có snapshot, kiểm API thật trên fixture riêng và HTTP simulation. Không đổi luật thu đủ tiền/quyền server/giữ lịch sử hoặc sửa ADR cũ, không tự nghiệm thu.

## 02/11/2026 — P6 chốt gói design và bỏ E2E lượt này

Nguồn: người dùng “triển khai phase 6”, chọn “Chốt gói theo design”, “Không cần test e2e”, “Tiếp tục”. [ADR-031](../adr/ADR-031-phase-6-design-decisions-and-e2e-waiver.md) Accepted. P6-S1–S3: điểm mặc định đề xuất 100 → 10; xóa draft ngoài baseline → có xác nhận; offline khóa/che editor → giữ form RAM, cho soạn nhưng ghi online. BR-TEACH-02 riêng quiz: không dựng lọc draft theo tác giả vì DTO thiếu createdBy, dùng scope server; giữ chặn roster/tiền và không mở scope buổi. BR-QUIZ-01–04 giữ lifecycle, một lượt, wire decimal string và không hứa results/ZIP. Q-P1-01 được chốt cho quiz, không đóng P7/P8. Miễn chạy tiếp E2E riêng lượt P6, không ghi pass; UI/API/nghiệm thu vẫn riêng.

## 02/11/2026 — Mở cổng API P6 theo chỉ thị trực tiếp

Người dùng “Tích hợp luôn api”, nhắc “Không cần test e2e”. [ADR-032](../adr/ADR-032-phase-6-api-integration.md) Accepted thay cổng UI accept riêng của ADR-009/016/017/031 chỉ cho API P6 lượt này; giữ phạm vi BR-QUIZ-01–04, quyền và policy theo ADR-031, không thêm ZIP/results. Đã nối 3/3 API và kiểm riêng service/UI/API thật/HTTP simulation; không E2E mới hoặc tự nghiệm thu.
